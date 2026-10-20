import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createPuppyApi, PAYPAL_MERCHANT_EMAIL } from "../src/puppy/payments";

function fakePayPal() {
  const orders = new Map<string, any>();
  let captures = 0;
  let mode = "normal";
  let failAfterCapture = false;
  const fetch = (async (url: string | URL | Request, options?: RequestInit) => {
    const route = String(url).replace("https://api-m.sandbox.paypal.com", "");
    if (route === "/v1/oauth2/token") return Response.json({ access_token: "test-token", expires_in: 300 });
    assert.equal((options?.headers as any).authorization, "Bearer test-token");
    if (route === "/v2/checkout/orders") {
      const request = JSON.parse(String(options?.body));
      assert.equal(request.purchase_units[0].amount.value, "0.99");
      assert.equal(request.purchase_units[0].payee.email_address, PAYPAL_MERCHANT_EMAIL);
      const id = `ORDER${orders.size + 1}TEST`;
      const order = { id, status: "APPROVED", purchase_units: request.purchase_units };
      orders.set(id, order);
      return Response.json({ ...order, links: [{ rel: "payer-action", href: `https://www.sandbox.paypal.com/checkoutnow?token=${id}` }] });
    }
    const match = /^\/v2\/checkout\/orders\/([A-Z0-9]+)(\/capture)?$/.exec(route);
    assert(match, `Unexpected PayPal request: ${route}`);
    const order = orders.get(match[1]);
    assert(order);
    if (match[2]) {
      assert(options?.headers && (options.headers as any)["PayPal-Request-Id"]);
      order.status = "COMPLETED";
      const unit = order.purchase_units[0];
      unit.payments = { captures: [{ id: `CAPTURE${++captures}`, status: "COMPLETED", final_capture: true,
        amount: { currency_code: mode === "currency" ? "EUR" : "USD", value: mode === "amount" ? "0.01" : "0.99" } }] };
      if (mode === "merchant") unit.payee.email_address = "other@example.com";
      if (mode === "reference") unit.custom_id = "forged";
      if (mode === "pending") unit.payments.captures[0].status = "PENDING";
      if (failAfterCapture) { failAfterCapture = false; throw new Error("Simulated lost network response"); }
    }
    return Response.json(order);
  }) as typeof globalThis.fetch;
  return { fetch, orders, get captures() { return captures; }, set mode(value: string) { mode = value; }, set failAfterCapture(value: boolean) { failAfterCapture = value; } };
}

async function fixture(t: any, enabled = true, production = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "puppy-payments-test-"));
  let clock = 1_000_000;
  const paypal = fakePayPal();
  const env = enabled ? {
    PAYPAL_CLIENT_ID: "test-client", PAYPAL_CLIENT_SECRET: "test-secret", PAYPAL_ENV: "sandbox",
    PUPPY_PUBLIC_URL: "http://localhost:9999", NODE_ENV: production ? "production" : "test",
  } : { NODE_ENV: production ? "production" : "test" };
  const options = { env, dataDir: directory, now: () => clock, fetch: paypal.fetch };
  let handler = createPuppyApi(options);
  const server = http.createServer(async (req, res) => {
    if (!await handler(req, res)) { res.writeHead(404); res.end(); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as any;
  const base = `http://127.0.0.1:${address.port}`;
  t.after(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  function client() {
    let cookie = "";
    return {
      async request(route: string, payload?: unknown, extraHeaders: Record<string, string> = {}) {
        const response = await fetch(base + "/api/puppy/" + route, {
          method: payload === undefined ? "GET" : "POST", headers: {
            ...(cookie ? { cookie } : {}), ...(payload === undefined ? {} : { "content-type": "application/json" }), ...extraHeaders,
          }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
        });
        if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0];
        return { status: response.status, body: await response.json() as any, headers: response.headers };
      },
    };
  }
  return { client, paypal, directory, advance: (ms: number) => { clock += ms; }, reopen: () => { handler = createPuppyApi(options); }, base };
}

test("free attempts are consumed, active attempts cannot duplicate, and winning refunds only once", async t => {
  const f = await fixture(t);
  const player = f.client();
  const initial = await player.request("state");
  assert.equal(initial.body.lives, 5);
  assert.match(initial.headers.get("set-cookie")!, /HttpOnly; SameSite=Lax/);
  const started = await player.request("attempt/start", {});
  assert.equal(started.body.lives, 4);
  assert.equal(started.body.activeAttempt, true);
  assert.equal((await player.request("attempt/start", {})).status, 409);
  assert.equal((await player.request("attempt/finish", { attemptId: "wrong", outcome: "won" })).status, 409);
  const won = await player.request("attempt/finish", { attemptId: started.body.attemptId, outcome: "won" });
  assert.equal(won.body.lives, 5);
  assert.equal(won.body.nextLifeAt, null);
  assert.equal((await player.request("attempt/finish", { attemptId: started.body.attemptId, outcome: "won" })).body.lives, 5);
});

test("failed lives refill every 30 minutes without exceeding five", async t => {
  const f = await fixture(t);
  const player = f.client();
  for (let i = 0; i < 5; i++) {
    const start = await player.request("attempt/start", {});
    assert.equal(start.status, 200);
    await player.request("attempt/finish", { attemptId: start.body.attemptId, outcome: "lost" });
  }
  assert.equal((await player.request("attempt/start", {})).status, 409);
  f.advance(30 * 60 * 1000);
  const one = await player.request("state");
  assert.equal(one.body.lives, 1);
  assert(one.body.nextLifeAt > 0);
  f.advance(10 * 30 * 60 * 1000);
  assert.equal((await player.request("state")).body.lives, 5);
  assert.equal((await player.request("state")).body.nextLifeAt, null);
});

test("winning after a natural refill still cannot exceed the free-life cap", async t => {
  const f = await fixture(t);
  const player = f.client();
  const start = await player.request("attempt/start", {});
  f.advance(30 * 60 * 1000);
  const won = await player.request("attempt/finish", { attemptId: start.body.attemptId, outcome: "won" });
  assert.equal(won.body.lives, 5);
  assert.equal(won.body.nextLifeAt, null);
});

test("production sessions use host-only secure cookies that sibling domains cannot plant", async t => {
  const f = await fixture(t, true, true);
  const player = f.client();
  const current = await player.request("state");
  const cookie = current.headers.get("set-cookie")!;
  assert.match(cookie, /^__Host-puppy_session=[a-f0-9]{64}; Path=\//);
  assert.match(cookie, /; Secure$/);
  assert.doesNotMatch(cookie, /Domain=/i);
  const start = await player.request("attempt/start", {});
  assert.equal(start.body.lives, 4);
  assert.equal((await player.request("state")).body.lives, 4);
});

test("wallets and active attempt identities survive a server restart", async t => {
  const f = await fixture(t);
  const player = f.client();
  const start = await player.request("attempt/start", {});
  f.reopen();
  const restored = await player.request("state");
  assert.equal(restored.body.lives, 4);
  assert.equal(restored.body.activeAttemptId, start.body.attemptId);
  assert.equal((await player.request("attempt/finish", { attemptId: start.body.attemptId, outcome: "abandoned" })).status, 200);
});

test("PayPal capture verifies the recipient and amount and credits exactly five once", async t => {
  const f = await fixture(t);
  const player = f.client();
  assert.equal((await player.request("state")).body.paymentsAvailable, true);
  const created = await player.request("paypal/orders", {});
  assert.equal(created.status, 200);
  const captured = await player.request("paypal/capture", { orderId: created.body.orderId });
  assert.equal(captured.status, 200);
  assert.equal(captured.body.paidAttempts, 5);
  const again = await player.request("paypal/capture", { orderId: created.body.orderId });
  assert.equal(again.body.paidAttempts, 5);
  assert.equal(again.body.alreadyCredited, true);
  assert.equal(f.paypal.captures, 1);
  f.reopen();
  assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).body.paidAttempts, 5);
});

test("another session cannot redeem an order and return query strings never grant credit", async t => {
  const f = await fixture(t);
  const buyer = f.client();
  const created = await buyer.request("paypal/orders", {});
  const stranger = f.client();
  assert.equal((await stranger.request("paypal/capture", { orderId: created.body.orderId })).status, 404);
  assert.equal((await stranger.request("state?payment=return&token=" + created.body.orderId)).body.paidAttempts, 0);
  assert.equal(f.paypal.captures, 0);
});

test("an altered approved order is rejected before PayPal captures money", async t => {
  const f = await fixture(t);
  const player = f.client();
  const created = await player.request("paypal/orders", {});
  f.paypal.orders.get(created.body.orderId).purchase_units[0].amount.value = "9.99";
  assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).status, 409);
  assert.equal(f.paypal.captures, 0);
  assert.equal((await player.request("state")).body.paidAttempts, 0);
});

test("a capture receipt cannot credit a second order", async t => {
  const f = await fixture(t);
  const player = f.client();
  const first = await player.request("paypal/orders", {});
  await player.request("paypal/capture", { orderId: first.body.orderId });
  const second = await player.request("paypal/orders", {});
  const forged = f.paypal.orders.get(second.body.orderId);
  forged.status = "COMPLETED";
  forged.purchase_units[0].payments = f.paypal.orders.get(first.body.orderId).purchase_units[0].payments;
  assert.equal((await player.request("paypal/capture", { orderId: second.body.orderId })).status, 409);
  assert.equal((await player.request("state")).body.paidAttempts, 5);
});

test("paid attempts are used after free lives and a win refunds the paid reservation", async t => {
  const f = await fixture(t);
  const player = f.client();
  const created = await player.request("paypal/orders", {});
  await player.request("paypal/capture", { orderId: created.body.orderId });
  for (let i = 0; i < 5; i++) {
    const started = await player.request("attempt/start", {});
    await player.request("attempt/finish", { attemptId: started.body.attemptId, outcome: "lost" });
  }
  const paid = await player.request("attempt/start", {});
  assert.equal(paid.body.lives, 0);
  assert.equal(paid.body.paidAttempts, 4);
  const won = await player.request("attempt/finish", { attemptId: paid.body.attemptId, outcome: "won" });
  assert.equal(won.body.lives, 0);
  assert.equal(won.body.paidAttempts, 5);
});

for (const mismatch of ["merchant", "amount", "currency", "reference", "pending"]) {
  test(`unverified ${mismatch} cannot grant paid attempts`, async t => {
    const f = await fixture(t);
    const player = f.client();
    const created = await player.request("paypal/orders", {});
    f.paypal.mode = mismatch;
    assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).status, 409);
    assert.equal((await player.request("state")).body.paidAttempts, 0);
  });
}

test("a lost capture response can safely recover the completed PayPal order", async t => {
  const f = await fixture(t);
  const player = f.client();
  const created = await player.request("paypal/orders", {});
  f.paypal.failAfterCapture = true;
  assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).status, 502);
  const retry = await player.request("paypal/capture", { orderId: created.body.orderId });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.paidAttempts, 5);
  assert.equal(f.paypal.captures, 1);
});

test("a failed wallet commit rolls back memory and can recover the paid order durably", async t => {
  const f = await fixture(t);
  const player = f.client();
  const created = await player.request("paypal/orders", {});
  const rename = fs.renameSync;
  let fail = true;
  const mock = t.mock.method(fs, "renameSync", (from: fs.PathLike, to: fs.PathLike) => {
    if (fail && String(to) === path.join(f.directory, "wallets.json")) {
      fail = false;
      throw new Error("Simulated disk write failure");
    }
    return rename(from, to);
  });
  assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).status, 500);
  assert.equal((await player.request("state")).body.paidAttempts, 0);
  const retry = await player.request("paypal/capture", { orderId: created.body.orderId });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.paidAttempts, 5);
  assert.equal(retry.body.alreadyCredited, false);
  assert.equal(f.paypal.captures, 1);
  mock.mock.restore();
  f.reopen();
  assert.equal((await player.request("state")).body.paidAttempts, 5);
});

test("concurrent capture retries credit the pack only once", async t => {
  const f = await fixture(t);
  const player = f.client();
  const created = await player.request("paypal/orders", {});
  const results = await Promise.all(Array.from({ length: 6 }, () => player.request("paypal/capture", { orderId: created.body.orderId })));
  assert(results.every(result => result.status === 200 && result.body.paidAttempts === 5));
  assert.equal(results.filter(result => !result.body.alreadyCredited).length, 1);
  assert.equal(f.paypal.captures, 1);
});

test("missing merchant credentials disable checkout while leaving free gameplay available", async t => {
  const f = await fixture(t, false);
  const player = f.client();
  const current = await player.request("state");
  assert.equal(current.body.paymentsAvailable, false);
  assert.equal(current.body.lives, 5);
  assert.equal((await player.request("paypal/orders", {})).status, 503);
});

test("cross-origin mutations and malformed JSON are rejected", async t => {
  const f = await fixture(t);
  const player = f.client();
  assert.equal((await player.request("attempt/start", {}, { origin: "https://evil.example" })).status, 403);
  const malformed = await fetch(f.base + "/api/puppy/attempt/start", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{broken",
  });
  assert.equal(malformed.status, 400);
  const primitive = await player.request("attempt/start", "not an object");
  assert.equal(primitive.status, 400);
  const oversized = await player.request("attempt/start", { padding: "x".repeat(5000) });
  assert.equal(oversized.status, 413);
});
