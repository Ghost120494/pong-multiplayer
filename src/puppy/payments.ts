import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const MAX_LIVES = 5;
const REFILL_MS = 30 * 60 * 1000;
export const ATTEMPT_PACK = Object.freeze({ attempts: 5, price: "0.99", currency: "USD" });
export const PAYPAL_MERCHANT_EMAIL = "jasonwilliams1204@gmail.com";
type Attempt = { id: string; source: "life" | "paid"; startedAt: number };
type Wallet = { lives: number; refillAt: number | null; paidAttempts: number; active: Attempt | null; lastFinished?: string };
type Purchase = { owner: string; reference: string; requestId: string; credited: boolean; captureId?: string };
type Database = { version: 1; wallets: Record<string, Wallet>; orders: Record<string, Purchase>; captures: Record<string, string> };
export type PuppyApiOptions = {
  env?: NodeJS.ProcessEnv;
  dataDir?: string;
  now?: () => number;
  fetch?: typeof globalThis.fetch;
};

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Single-process store. In production put this directory on a persistent volume. */
class Store {
  readonly file: string;
  data: Database;
  private tail: Promise<unknown> = Promise.resolve();
  private committed: Database;
  private queued = 0;
  constructor(directory: string) {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.file = path.join(directory, "wallets.json");
    this.data = fs.existsSync(this.file)
      ? JSON.parse(fs.readFileSync(this.file, "utf8"))
      : { version: 1, wallets: {}, orders: {}, captures: {} };
    if (this.data.version !== 1 || !this.data.wallets || !this.data.orders || !this.data.captures) {
      throw new Error("Unsupported Puppy Pals wallet store. Preserve the data and restore a valid backup.");
    }
    this.committed = structuredClone(this.data);
  }
  save() {
    const temporary = `${this.file}.${process.pid}.tmp`;
    const descriptor = fs.openSync(temporary, "w", 0o600);
    try { fs.writeFileSync(descriptor, JSON.stringify(this.data)); fs.fsyncSync(descriptor); }
    finally { fs.closeSync(descriptor); }
    fs.renameSync(temporary, this.file);
    this.committed = structuredClone(this.data);
  }
  serial<T>(operation: () => Promise<T>): Promise<T> {
    if (this.queued >= 64) return Promise.reject(new ApiError(503, "Puppy Pals is busy. Please retry in a moment."));
    this.queued++;
    const task = this.tail.then(async () => {
      try { return await operation(); }
      catch (error) {
        // A failed disk write must not leave an apparently credited, non-durable balance.
        this.data = structuredClone(this.committed);
        throw error;
      }
    }).finally(() => { this.queued--; });
    this.tail = task.catch(() => {});
    return task;
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
    "x-content-type-options": "nosniff", "referrer-policy": "no-referrer",
  });
  res.end(JSON.stringify(body));
}
async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] ?? "")) throw new ApiError(415, "Use a JSON request.");
  let bytes = 0, text = "";
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 4096) throw new ApiError(413, "The request is too large.");
    text += chunk.toString();
  }
  try {
    const value = JSON.parse(text || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new ApiError(400, "The request contains invalid JSON."); }
}

function refill(wallet: Wallet, at: number) {
  if (wallet.lives >= MAX_LIVES) { wallet.refillAt = null; return; }
  if (wallet.refillAt === null) wallet.refillAt = at + REFILL_MS;
  if (at < wallet.refillAt) return;
  const count = 1 + Math.floor((at - wallet.refillAt) / REFILL_MS);
  wallet.lives = Math.min(MAX_LIVES, wallet.lives + count);
  wallet.refillAt = wallet.lives === MAX_LIVES ? null : wallet.refillAt + count * REFILL_MS;
}

export function createPuppyApi(options: PuppyApiOptions = {}) {
  const env = options.env ?? process.env;
  const now = options.now ?? Date.now;
  const httpFetch = options.fetch ?? globalThis.fetch;
  const production = env.NODE_ENV === "production";
  const cookieName = production ? "__Host-puppy_session" : "puppy_session";
  const live = env.PAYPAL_ENV === "live";
  const merchantEmail = !live && env.PAYPAL_SANDBOX_MERCHANT_EMAIL
    ? env.PAYPAL_SANDBOX_MERCHANT_EMAIL : PAYPAL_MERCHANT_EMAIL;
  const paypalBase = live ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  let publicUrl: URL | undefined;
  try {
    if (env.PUPPY_PUBLIC_URL) {
      const parsed = new URL(env.PUPPY_PUBLIC_URL);
      if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") throw new Error();
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
      if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && local && !live)) throw new Error();
      publicUrl = parsed;
    }
  } catch { /* Invalid configuration keeps paid checkout unavailable. */ }
  const paymentsAvailable = !!(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET && publicUrl &&
    (!production || env.PUPPY_DATA_DIR || options.dataDir));
  const store = new Store(options.dataDir ?? env.PUPPY_DATA_DIR ?? path.join(os.tmpdir(), "puppy-pals-data"));
  let token = { value: "", expiresAt: 0 };
  const rates = new Map<string, { at: number; count: number }>();

  function state(wallet: Wallet) {
    return {
      lives: wallet.lives, maxLives: MAX_LIVES, nextLifeAt: wallet.refillAt,
      paidAttempts: wallet.paidAttempts, totalAttempts: wallet.lives + wallet.paidAttempts,
      paymentsAvailable, pack: ATTEMPT_PACK, activeAttempt: !!wallet.active,
      activeAttemptId: wallet.active?.id ?? null, activeAttemptStartedAt: wallet.active?.startedAt ?? null,
    };
  }
  function session(req: IncomingMessage, res: ServerResponse) {
    const supplied = new RegExp(`(?:^|;\\s*)${cookieName}=([a-f0-9]{64})(?:;|$)`).exec(req.headers.cookie ?? "")?.[1];
    let id = supplied && Object.hasOwn(store.data.wallets, supplied) ? supplied : undefined;
    if (!id) {
      id = crypto.randomBytes(32).toString("hex");
      store.data.wallets[id] = { lives: MAX_LIVES, refillAt: null, paidAttempts: 0, active: null };
      res.setHeader("set-cookie", `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${production ? "; Secure" : ""}`);
    }
    const wallet = store.data.wallets[id];
    refill(wallet, now());
    return { id, wallet };
  }
  function sameOrigin(req: IncomingMessage) {
    if (req.headers["sec-fetch-site"] === "cross-site") throw new ApiError(403, "Open Puppy Pals directly to continue.");
    const origin = req.headers.origin;
    if (!origin) return;
    const expected = publicUrl?.origin;
    if (expected) {
      if (origin !== expected) throw new ApiError(403, "This request came from another website.");
    } else if (origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) {
      throw new ApiError(403, "This request came from another website.");
    }
  }
  function limit(key: string, maximum: number) {
    const at = now();
    const old = rates.get(key);
    const value = !old || at - old.at > 60_000 ? { at, count: 0 } : old;
    if (++value.count > maximum) throw new ApiError(429, "Please wait a minute before trying again.");
    rates.set(key, value);
    if (rates.size > 10_000) for (const [id, entry] of rates) if (at - entry.at > 60_000) rates.delete(id);
  }
  async function paypal(route: string, method = "GET", payload?: unknown, requestId?: string) {
    if (!paymentsAvailable) throw new ApiError(503, "Purchases are not available yet. Free lives refill every 30 minutes.");
    try {
      if (token.expiresAt <= now()) {
        const response = await httpFetch(`${paypalBase}/v1/oauth2/token`, {
          method: "POST", headers: {
            authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
            "content-type": "application/x-www-form-urlencoded",
          }, body: "grant_type=client_credentials", signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new ApiError(502, "PayPal is temporarily unavailable. No attempts were charged.");
        const value = await response.json() as any;
        if (typeof value.access_token !== "string" || !value.access_token) throw new ApiError(502, "PayPal authentication could not be confirmed.");
        token = { value: value.access_token, expiresAt: now() + Math.max(0, Number(value.expires_in ?? 300) - 30) * 1000 };
      }
      const response = await httpFetch(`${paypalBase}${route}`, {
        method, headers: { authorization: `Bearer ${token.value}`, "content-type": "application/json",
          ...(requestId ? { "PayPal-Request-Id": requestId } : {}), Prefer: "return=representation" },
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 401) token.expiresAt = 0;
      if (!response.ok) throw new ApiError(502, "PayPal could not confirm this purchase. Retry to check its status.");
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(502, "PayPal has not confirmed the result yet. If you approved payment, retry to check its status before buying again.");
    }
  }
  function verifyOrder(order: any, purchase: Purchase) {
    if (order?.purchase_units?.length !== 1) throw new ApiError(409, "The payment order could not be verified.");
    const unit = order.purchase_units[0];
    if (unit.reference_id !== purchase.reference || unit.custom_id !== purchase.reference ||
        String(unit.payee?.email_address ?? "").toLowerCase() !== merchantEmail.toLowerCase()) {
      throw new ApiError(409, "The payment recipient could not be verified. Contact support before retrying.");
    }
    if (unit.amount?.currency_code !== "USD" || unit.amount?.value !== "0.99") {
      throw new ApiError(409, "The payment amount could not be verified.");
    }
    return unit;
  }
  function confirmedCapture(order: any, purchase: Purchase): string {
    if (order?.status !== "COMPLETED") throw new ApiError(409, "PayPal has not completed this payment.");
    const unit = verifyOrder(order, purchase);
    const captures = unit.payments?.captures;
    if (!Array.isArray(captures) || captures.length !== 1) throw new ApiError(409, "The payment capture could not be verified.");
    const capture = captures[0];
    if (capture.status !== "COMPLETED" || capture.amount?.currency_code !== "USD" || capture.amount?.value !== "0.99" ||
        typeof capture.id !== "string" || !capture.id || capture.final_capture === false) {
      throw new ApiError(409, "PayPal has not confirmed the full payment.");
    }
    return capture.id;
  }

  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const route = new URL(req.url ?? "/", "http://local").pathname;
    if (!route.startsWith("/api/puppy/")) return false;
    try {
      // Before creating sessions or entering the persistent queue, bound anonymous traffic.
      const remoteAddress = req.socket.remoteAddress ?? "unknown";
      limit(`ingress:${remoteAddress}`, 600);
      if (route === "/api/puppy/paypal/orders") limit(`checkout:${remoteAddress}`, 10);
      if (req.method !== "GET" && req.method !== "POST") throw new ApiError(405, "This request method is not supported.");
      if (req.method === "POST") sameOrigin(req);
      const input = req.method === "POST" ? await body(req) : {};
      await store.serial(async () => {
        const { id, wallet } = session(req, res);
        limit(`all:${id}`, 120);
        if (route === "/api/puppy/state" && req.method === "GET") {
          store.save(); send(res, 200, state(wallet)); return;
        }
        if (route === "/api/puppy/attempt/start" && req.method === "POST") {
          if (wallet.active) throw new ApiError(409, "A level is already in progress. Finish it before starting another.");
          if (wallet.lives + wallet.paidAttempts <= 0) throw new ApiError(409, "You are out of attempts. Your next free life will refill soon.");
          const source = wallet.lives > 0 ? "life" : "paid";
          if (source === "life") { wallet.lives--; if (wallet.refillAt === null) wallet.refillAt = now() + REFILL_MS; }
          else wallet.paidAttempts--;
          const attemptId = crypto.randomUUID();
          wallet.active = { id: attemptId, source, startedAt: now() };
          store.save(); send(res, 200, { ...state(wallet), attemptId }); return;
        }
        if (route === "/api/puppy/attempt/finish" && req.method === "POST") {
          const attemptId = input.attemptId;
          if (typeof attemptId !== "string" || !["won", "lost", "abandoned"].includes(String(input.outcome))) throw new ApiError(400, "A valid level result is required.");
          if (!wallet.active) {
            if (wallet.lastFinished === attemptId) { store.save(); send(res, 200, state(wallet)); return; }
            throw new ApiError(409, "This attempt is no longer active.");
          }
          if (wallet.active.id !== attemptId) throw new ApiError(409, "This attempt belongs to another level.");
          if (input.outcome === "won") {
            if (wallet.active.source === "paid") wallet.paidAttempts++;
            else { wallet.lives = Math.min(MAX_LIVES, wallet.lives + 1); if (wallet.lives === MAX_LIVES) wallet.refillAt = null; }
          }
          wallet.lastFinished = wallet.active.id;
          wallet.active = null;
          store.save(); send(res, 200, state(wallet)); return;
        }
        if (route === "/api/puppy/paypal/orders" && req.method === "POST") {
          if (!paymentsAvailable) throw new ApiError(503, "Purchases are not available yet. Free lives refill every 30 minutes.");
          limit(`orders:${id}`, 5);
          const reference = crypto.randomUUID();
          const order = await paypal("/v2/checkout/orders", "POST", {
            intent: "CAPTURE", purchase_units: [{ reference_id: reference, custom_id: reference,
              description: "Puppy Pals — 5 extra attempts", amount: { currency_code: "USD", value: "0.99" },
              payee: { email_address: merchantEmail } }],
            payment_source: { paypal: { experience_context: { brand_name: "Puppy Pals", user_action: "PAY_NOW",
              shipping_preference: "NO_SHIPPING", return_url: `${publicUrl!.origin}/?payment=return`, cancel_url: `${publicUrl!.origin}/?payment=cancelled` } } },
          }, reference);
          const approvalUrl = order.links?.find((link: any) => link.rel === "payer-action" || link.rel === "approve")?.href;
          let safeApproval = false;
          try { const url = new URL(approvalUrl); safeApproval = url.protocol === "https:" && (url.hostname === "www.paypal.com" || url.hostname === "www.sandbox.paypal.com"); } catch {}
          if (!/^[A-Z0-9]{5,64}$/.test(order.id ?? "") || !safeApproval) throw new ApiError(502, "PayPal did not return a valid checkout link.");
          store.data.orders[order.id] = { owner: id, reference, requestId: crypto.randomUUID(), credited: false };
          store.save(); send(res, 200, { orderId: order.id, approvalUrl }); return;
        }
        if (route === "/api/puppy/paypal/capture" && req.method === "POST") {
          if (typeof input.orderId !== "string" || !/^[A-Z0-9]{5,64}$/.test(input.orderId)) throw new ApiError(400, "A valid PayPal order is required.");
          const orderId = input.orderId;
          const purchase = Object.hasOwn(store.data.orders, orderId) ? store.data.orders[orderId] : undefined;
          if (!purchase || purchase.owner !== id) throw new ApiError(404, "This purchase was not found for your player.");
          if (purchase.credited) { store.save(); send(res, 200, { ...state(wallet), credited: true, alreadyCredited: true }); return; }
          let order = await paypal(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
          if (order.id !== orderId) throw new ApiError(409, "PayPal returned a different order.");
          verifyOrder(order, purchase);
          if (order.status !== "COMPLETED") {
            if (order.status !== "APPROVED") throw new ApiError(409, "Approve the payment with PayPal before continuing.");
            await paypal(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, "POST", {}, purchase.requestId);
            order = await paypal(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
          }
          if (order.id !== orderId) throw new ApiError(409, "PayPal returned a different order.");
          const captureId = confirmedCapture(order, purchase);
          if (Object.hasOwn(store.data.captures, captureId)) throw new ApiError(409, "This payment has already been used.");
          wallet.paidAttempts += ATTEMPT_PACK.attempts;
          purchase.credited = true; purchase.captureId = captureId;
          store.data.captures[captureId] = orderId;
          store.save(); send(res, 200, { ...state(wallet), credited: true, alreadyCredited: false }); return;
        }
        throw new ApiError(404, "This Puppy Pals endpoint was not found.");
      });
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      // Do not log remote response bodies or credential-bearing requests.
      send(res, status, { error: error instanceof ApiError ? error.message : "Puppy Pals could not save your request. Please retry." });
    }
    return true;
  };
}

let defaultHandler: ReturnType<typeof createPuppyApi> | undefined;
export async function handlePuppyApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!new URL(req.url ?? "/", "http://local").pathname.startsWith("/api/puppy/")) return false;
  try { return await (defaultHandler ??= createPuppyApi())(req, res); }
  catch {
    send(res, 503, { error: "Player data is temporarily unavailable. No purchase can be made until it is restored." });
    return true;
  }
}
