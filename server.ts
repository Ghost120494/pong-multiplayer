// Pong server: static files, accounts, sessions, matchmaking, authoritative game loop.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { WebSocketServer, WebSocket } from "ws";
import { initState, step, H, State, Input } from "./src/core";

const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC = process.env.PUBLIC_DIR ?? path.resolve(__dirname, "public");
const DB = process.env.USERS_FILE ?? path.resolve(__dirname, "users.json");
const SECURE = process.env.NODE_ENV === "production"; // Secure cookies behind HTTPS
const ORIGIN = process.env.ORIGIN; // e.g. https://pong.example.com; checked on WS upgrade
const TICK = 1 / 60;

// ---- accounts (JSON file; swap for SQLite later) ----
type User = { hash: string };
let users: Record<string, User> = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : {};
const saveUsers = () => fs.writeFileSync(DB + ".tmp", JSON.stringify(users)) || fs.renameSync(DB + ".tmp", DB);
const NAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// ---- sessions: random token -> user, 7 day expiry ----
const sessions = new Map<string, { user: string; exp: number }>();
const SESSION_MS = 7 * 864e5;
function sessionUser(cookie = ""): string | null {
  const tok = /(?:^|;\s*)sid=([a-f0-9]{64})/.exec(cookie)?.[1];
  const s = tok && sessions.get(tok);
  if (!s || s.exp < Date.now()) return null;
  return s.user;
}

// ---- rate limit: 10 auth attempts / 10 min per IP ----
const attempts = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), a = (attempts.get(ip) ?? []).filter(t => now - t < 6e5);
  a.push(now); attempts.set(ip, a);
  return a.length > 10;
}

function json(res: http.ServerResponse, code: number, body: object, headers: Record<string, string> = {}) {
  res.writeHead(code, { "content-type": "application/json", ...headers }); res.end(JSON.stringify(body));
}
function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((ok, bad) => {
    let d = ""; req.on("data", c => { d += c; if (d.length > 2048) { bad(new Error("too big")); req.destroy(); } });
    req.on("end", () => { try { ok(JSON.parse(d)); } catch { bad(new Error("bad json")); } });
  });
}

const MIME: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const SEC_HEADERS = {
  "content-security-policy": "default-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'",
  "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "x-frame-options": "DENY",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const ip = req.socket.remoteAddress ?? "?";
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  // static
  if (url.pathname === "/pong" || url.pathname === "/snake" || url.pathname === "/incremental" || url.pathname === "/match3") { res.writeHead(301, { location: url.pathname + "/" + url.search }); return res.end(); }
  let p = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
  const file = path.join(PUBLIC, path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream", ...SEC_HEADERS });
  fs.createReadStream(file).pipe(res);
});

// ---- matches ----
type Player = { ws: WebSocket; user: string; input: Input; msgs: number };
type Match = { players: [Player, Player]; state: State; timer: NodeJS.Timeout };
let waiting: Player | null = null;

function startMatch(a: Player, b: Player) {
  const m: Match = { players: [a, b], state: initState(), timer: null as any };
  [a, b].forEach((p, i) => p.ws.send(JSON.stringify({ type: "welcome", side: i })));
  m.timer = setInterval(() => {
    m.state = step(m.state, [a.input, b.input], TICK);
    const msg = JSON.stringify({ type: "state", ball: { x: m.state.ball.x, y: m.state.ball.y }, paddles: m.state.paddles, score: m.state.score });
    for (const p of m.players) { p.msgs = 0; if (p.ws.readyState === WebSocket.OPEN) p.ws.send(msg); }
  }, TICK * 1000);
  const end = () => { clearInterval(m.timer); for (const p of m.players) if (p.ws.readyState === WebSocket.OPEN) p.ws.close(1000, "opponent left"); };
  a.ws.on("close", end); b.ws.on("close", end);
}

const wss = new WebSocketServer({ noServer: true, maxPayload: 256 });
// ---- lobbies: crypto-random 6-digit code, 2 players, expire after 10 min idle ----
const lobbies = new Map<string, { host: Player; at: number }>();
setInterval(() => { for (const [c, l] of lobbies) if (Date.now() - l.at > 6e5) { lobbies.delete(c); l.host.ws.close(1000, "lobby expired"); } }, 3e4);
const joinFails = new Map<string, number[]>();
function joinLimited(ip: string) { const now = Date.now(); const a = (joinFails.get(ip) ?? []).filter(t => now - t < 6e4); joinFails.set(ip, a); return a.length >= 5; }
function newCode() { let c; do c = String(crypto.randomInt(0, 1e6)).padStart(6, "0"); while (lobbies.has(c)); return c; }

server.on("upgrade", (req, sock, head) => {
  const url = new URL(req.url ?? "/", "http://x");
  const originOk = !ORIGIN || req.headers.origin === ORIGIN;
  if (url.pathname !== "/ws" || !originOk) { sock.write("HTTP/1.1 403 Forbidden\r\n\r\n"); return sock.destroy(); }
  const ip = String(req.headers["fly-client-ip"] ?? req.socket.remoteAddress ?? "?");
  wss.handleUpgrade(req, sock, head, ws => {
    const p: Player = { ws, user: crypto.randomBytes(16).toString("hex"), input: {}, msgs: 0 };
    ws.on("error", () => ws.terminate());
    const fail = (message: string) => { ws.send(JSON.stringify({ type: "error", message })); ws.close(1000); };
    ws.on("message", raw => {
      if (++p.msgs > 5) return;
      let m: any; try { m = JSON.parse(String(raw)); } catch { return; }
      if (m?.type !== "input") return;
      const t = Number(m.targetY);
      if (!Number.isFinite(t)) return;
      p.input = { targetY: Math.min(1, Math.max(0, t)) * H };
    });
    if (url.searchParams.get("create") === "1") {
      if (lobbies.size > 5000) return fail("server full, try later");
      const code = newCode(); lobbies.set(code, { host: p, at: Date.now() });
      ws.on("close", () => { if (lobbies.get(code)?.host === p) lobbies.delete(code); });
      ws.send(JSON.stringify({ type: "lobby", code, side: 0, token: p.user }));
      return;
    }
    const code = url.searchParams.get("code") ?? "";
    if (joinLimited(ip)) return fail("too many tries, wait a minute");
    const l = /^\d{6}$/.test(code) ? lobbies.get(code) : undefined;
    if (!l || l.host.ws.readyState !== WebSocket.OPEN) { joinFails.get(ip)!.push(Date.now()); return fail("wrong or expired code"); }
    lobbies.delete(code); // single use: third player can't join
    ws.send(JSON.stringify({ type: "lobby", code, side: 1, token: p.user }));
    startMatch(l.host, p);
  });
});

process.on("uncaughtException", e => console.error("uncaught", e));
wss.on("error", e => console.error("wss", e));
server.listen(PORT, () => console.log(`pong on :${PORT}`));
