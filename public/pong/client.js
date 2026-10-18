// src/core.ts
var W = 800;
var H = 500;
var PADDLE_H = 80;
var PADDLE_W = 10;
var BALL = 10;

// src/client.ts
var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
var portrait = false;
function fit() {
  portrait = innerHeight > innerWidth;
  const fw = portrait ? H : W, fh = portrait ? W : H;
  const scale = Math.min(innerWidth / fw, innerHeight / fh);
  const dpr = devicePixelRatio || 1;
  canvas.style.width = fw * scale + "px";
  canvas.style.height = fh * scale + "px";
  canvas.width = fw * scale * dpr;
  canvas.height = fh * scale * dpr;
  canvas.style.marginTop = (innerHeight - fh * scale) / 2 + "px";
}
addEventListener("resize", fit);
fit();
var proto = location.protocol === "https:" ? "wss" : "ws";
var ws = { readyState: 0, send() {
} };
var $ = (id) => document.getElementById(id);
function connect(q) {
  ws = new WebSocket(`${proto}://${location.host}/ws?${q}`);
  ws.onmessage = onMsg;
  ws.onclose = () => {
    $("msg").textContent = "Disconnected";
    $("lobby").hidden = false;
    canvas.hidden = true;
  };
}
$("create").onclick = () => connect("create=1");
$("join").onclick = () => {
  const c = $("code").value;
  if (/^\d{6}$/.test(c)) connect("code=" + c);
  else $("msg").textContent = "Enter 6 digits";
};
var urlCode = new URLSearchParams(location.search).get("code");
if (urlCode && /^\d{6}$/.test(urlCode)) connect("code=" + urlCode);
var side = 0;
var prev = null;
var curr = null;
var currAt = 0;
var interval = 1e3 / 60;
function onMsg(e) {
  const m = JSON.parse(e.data);
  if (m.type === "lobby") {
    side = m.side;
    const link = location.origin + location.pathname + "?code=" + m.code;
    $("msg").innerHTML = "";
    const t = document.createElement("div");
    t.textContent = "Code: " + m.code + " (waiting for friend)";
    const b = document.createElement("button");
    b.textContent = "Share link";
    b.onclick = async () => {
      try {
        if (navigator.share) await navigator.share({ title: "Pong", url: link });
        else {
          await navigator.clipboard.writeText(link);
          b.textContent = "Copied!";
        }
      } catch {
      }
    };
    $("msg").append(t, b);
    return;
  }
  if (m.type === "welcome") {
    side = m.side;
    $("msg").textContent = "Matched" + (m.opponent ? " vs " + m.opponent : "");
    return;
  }
  if (m.type === "waiting") {
    $("msg").textContent = "Waiting for opponent...";
    return;
  }
  if (m.type === "error") {
    $("msg").textContent = m.message;
    return;
  }
  if (m.type !== "state") return;
  if (canvas.hidden) {
    $("lobby").hidden = true;
    canvas.hidden = false;
    fit();
  }
  const now = performance.now();
  if (curr) interval = interval * 0.9 + (now - currAt) * 0.1;
  prev = curr;
  curr = m;
  currAt = now;
}
var target = null;
var lastSent = -1;
var lastSendAt = 0;
function send(t) {
  t = Math.min(1, Math.max(0, t));
  const now = performance.now();
  if (ws.readyState !== 1 || now - lastSendAt < 8 || t === lastSent) return;
  ws.send(JSON.stringify({ type: "input", targetY: t }));
  lastSent = t;
  lastSendAt = now;
}
function pointerToTarget(e) {
  const r = canvas.getBoundingClientRect();
  return portrait ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
}
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  target = pointerToTarget(e);
  send(target);
});
canvas.addEventListener("pointerrawupdate", (e) => {
  if (e.pointerType === "mouse" || e.buttons) {
    target = pointerToTarget(e);
    send(target);
  }
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "mouse" || e.buttons) {
    target = pointerToTarget(e);
    send(target);
  }
});
var keys = /* @__PURE__ */ new Set();
addEventListener("keydown", (e) => keys.add(e.key));
addEventListener("keyup", (e) => keys.delete(e.key));
var myIndex = () => side;
var lerp = (a, b, t) => a + (b - a) * t;
function frame() {
  requestAnimationFrame(frame);
  if (curr && (keys.has("ArrowUp") || keys.has("w") || keys.has("ArrowDown") || keys.has("s"))) {
    const up = keys.has("ArrowUp") || keys.has("w");
    const base = target ?? (curr.paddles[myIndex()] + PADDLE_H / 2) / H;
    target = Math.min(1, Math.max(0, base + (up ? -0.015 : 0.015)));
    send(target);
  }
  const s = canvas.width / (portrait ? H : W);
  ctx.setTransform(s, 0, 0, s, 0, 0);
  if (portrait) {
    ctx.translate(H, 0);
    ctx.rotate(Math.PI / 2);
  }
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#333";
  for (let y = 0; y < H; y += 20) ctx.fillRect(W / 2 - 1, y, 2, 10);
  if (!curr) return;
  const t = prev ? Math.min(1, (performance.now() - currAt) / interval) : 1;
  const p = prev ?? curr;
  const reset = Math.abs(curr.ball.x - p.ball.x) > W / 3;
  const bx = reset ? curr.ball.x : lerp(p.ball.x, curr.ball.x, t);
  const by = reset ? curr.ball.y : lerp(p.ball.y, curr.ball.y, t);
  ctx.fillStyle = "#fff";
  const py = [lerp(p.paddles[0], curr.paddles[0], t), lerp(p.paddles[1], curr.paddles[1], t)];
  if (target !== null) py[side] = Math.min(H - PADDLE_H, Math.max(0, target * H - PADDLE_H / 2));
  ctx.fillRect(0, py[0], PADDLE_W, PADDLE_H);
  ctx.fillRect(W - PADDLE_W, py[1], PADDLE_W, PADDLE_H);
  ctx.fillRect(bx, by, BALL, BALL);
  ctx.font = "48px monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(curr.score[0]), W / 4, 60);
  ctx.fillText(String(curr.score[1]), 3 * W / 4, 60);
}
frame();
