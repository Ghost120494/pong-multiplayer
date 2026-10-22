import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createPuppyApi } from "../src/puppy/payments";

const TEST_MERCHANT_EMAIL = "merchant@merchant.test";

function fakePayPal(merchantEmail = TEST_MERCHANT_EMAIL) {
  const orders = new Map<string, any>();
  const requests: string[] = [];
  let captures = 0;
  let mode = "normal";
  let failAfterCapture = false;
  const fetch = (async (url: string | URL | Request, options?: RequestInit) => {
    requests.push(String(url));
    const requestUrl = new URL(String(url));
    assert(["api-m.sandbox.paypal.com", "api-m.paypal.com"].includes(requestUrl.hostname));
    const route = requestUrl.pathname;
    if (route === "/v1/oauth2/token") return Response.json({ access_token: "test-token", expires_in: 300 });
    assert.equal((options?.headers as any).authorization, "Bearer test-token");
    if (route === "/v2/checkout/orders") {
      const request = JSON.parse(String(options?.body));
      assert.equal(request.purchase_units[0].amount.value, "0.99");
      assert.equal(request.purchase_units[0].payee.email_address, merchantEmail);
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
  return { fetch, orders, requests, get captures() { return captures; }, set mode(value: string) { mode = value; }, set failAfterCapture(value: boolean) { failAfterCapture = value; } };
}

async function fixture(t: any, enabled = true, production = false, envOverrides: NodeJS.ProcessEnv = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "puppy-payments-test-"));
  let clock = 1_000_000;
  const env: NodeJS.ProcessEnv = { ...(enabled ? {
    PAYPAL_CLIENT_ID: "test-client", PAYPAL_CLIENT_SECRET: "test-secret", PAYPAL_ENV: "sandbox",
    PAYPAL_MERCHANT_EMAIL: TEST_MERCHANT_EMAIL,
    PUPPY_PUBLIC_URL: "http://localhost:9999", NODE_ENV: production ? "production" : "test",
  } : { NODE_ENV: production ? "production" : "test" }), ...envOverrides };
  const paypal = fakePayPal(env.PAYPAL_ENV === "live" ? env.PAYPAL_MERCHANT_EMAIL : env.PAYPAL_SANDBOX_MERCHANT_EMAIL?.trim() || env.PAYPAL_MERCHANT_EMAIL);
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

test("a missing old attempt returns a terminal code and a durable current wallet", async t => {
  const f = await fixture(t);
  const player = f.client();
  const missing = await player.request("attempt/finish", { attemptId: "old-attempt-before-redeploy", outcome: "won" });
  assert.equal(missing.status, 409);
  assert.equal(missing.body.code, "ATTEMPT_NOT_FOUND");
  assert.equal(missing.body.wallet.lives, 5);
  assert.equal(missing.body.wallet.paidAttempts, 0);
  assert.equal(missing.body.wallet.activeAttemptId, null);
  const following = await player.request("state");
  assert.equal(following.headers.get("set-cookie"), null, "the conflict must not discard its newly created session");
  assert.equal(following.body.lives, 5);
});

test("attempt conflicts identify the current reservation without granting a refund", async t => {
  const f = await fixture(t);
  const player = f.client();
  const started = await player.request("attempt/start", {});
  const duplicateStart = await player.request("attempt/start", {});
  assert.equal(duplicateStart.status, 409);
  assert.equal(duplicateStart.body.code, "ATTEMPT_ACTIVE");
  assert.equal(duplicateStart.body.wallet.activeAttemptId, started.body.attemptId);
  const mismatch = await player.request("attempt/finish", { attemptId: "another-attempt", outcome: "won" });
  assert.equal(mismatch.status, 409);
  assert.equal(mismatch.body.code, "ATTEMPT_MISMATCH");
  assert.equal(mismatch.body.wallet.activeAttemptId, started.body.attemptId);
  assert.equal(mismatch.body.wallet.lives, 4);
  assert.equal(mismatch.body.wallet.paidAttempts, 0);
  assert.equal((await player.request("state")).body.activeAttemptId, started.body.attemptId);
});

test("a reservation request retries the same active attempt once, including after restart", async t => {
  const f = await fixture(t);
  const player = f.client();
  const requestId = "fe5c5b1d-4aa9-4a63-93bc-d46af6a94d10";
  assert.equal((await player.request("state")).body.activeAttemptRequestId, null);
  const first = await player.request("attempt/start", { requestId });
  assert.equal(first.status, 200);
  assert.equal(first.body.lives, 4);
  assert.equal(first.body.activeAttemptRequestId, requestId);
  const retry = await player.request("attempt/start", { requestId });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.attemptId, first.body.attemptId);
  assert.equal(retry.body.lives, 4);
  f.reopen();
  const restored = await player.request("state");
  assert.equal(restored.body.activeAttemptRequestId, requestId);
  const afterRestart = await player.request("attempt/start", { requestId });
  assert.equal(afterRestart.status, 200);
  assert.equal(afterRestart.body.attemptId, first.body.attemptId);
  assert.equal(afterRestart.body.lives, 4);
  const other = await player.request("attempt/start", { requestId: "4f7650b4-3749-4082-a631-904de15b9c94" });
  assert.equal(other.status, 409);
  assert.equal(other.body.code, "ATTEMPT_ACTIVE");
  assert.equal(other.body.wallet.activeAttemptRequestId, requestId);
  assert.equal(other.body.wallet.lives, 4);
  assert.equal((await player.request("attempt/start", {})).status, 409, "legacy duplicate requests still conflict");
  await player.request("attempt/finish", { attemptId: first.body.attemptId, outcome: "lost" });
  assert.equal((await player.request("state")).body.activeAttemptRequestId, null);
});

test("invalid reservation request IDs cannot consume an attempt", async t => {
  const f = await fixture(t);
  const player = f.client();
  await player.request("state");
  for (const requestId of [null, 7, "", "arbitrary", "x".repeat(400)]) {
    const response = await player.request("attempt/start", { requestId });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "INVALID_REQUEST_ID");
  }
  const state = await player.request("state");
  assert.equal(state.body.lives, 5);
  assert.equal(state.body.activeAttemptId, null);
});

test("older finished results can retry after later levels without touching the active attempt", async t => {
  const f = await fixture(t);
  const player = f.client();
  const first = await player.request("attempt/start", {});
  await player.request("attempt/finish", { attemptId: first.body.attemptId, outcome: "lost" });
  const second = await player.request("attempt/start", {});
  await player.request("attempt/finish", { attemptId: second.body.attemptId, outcome: "abandoned" });
  const third = await player.request("attempt/start", {});
  assert.equal(third.body.lives, 2);
  f.reopen();
  for (const attemptId of [first.body.attemptId, second.body.attemptId]) {
    const retry = await player.request("attempt/finish", { attemptId, outcome: "won" });
    assert.equal(retry.status, 200);
    assert.equal(retry.body.activeAttemptId, third.body.attemptId);
    assert.equal(retry.body.lives, 2, "a changed result cannot refund an old lost attempt");
    assert.equal(retry.body.paidAttempts, 0);
  }
  await player.request("attempt/finish", { attemptId: third.body.attemptId, outcome: "lost" });
  const after = await player.request("attempt/finish", { attemptId: first.body.attemptId, outcome: "won" });
  assert.equal(after.status, 200);
  assert.equal(after.body.activeAttemptId, null);
  assert.equal(after.body.lives, 2);
});

test("legacy lastFinished wallets migrate without losing duplicate-finish protection", async t => {
  const f = await fixture(t);
  const player = f.client();
  const first = await player.request("attempt/start", {});
  await player.request("attempt/finish", { attemptId: first.body.attemptId, outcome: "lost" });
  const file = path.join(f.directory, "wallets.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const wallet of Object.values(data.wallets) as any[]) delete wallet.finishedAttempts;
  fs.writeFileSync(file, JSON.stringify(data));
  f.reopen();
  const next = await player.request("attempt/start", {});
  const retried = await player.request("attempt/finish", { attemptId: first.body.attemptId, outcome: "won" });
  assert.equal(retried.status, 200);
  assert.equal(retried.body.activeAttemptId, next.body.attemptId);
  assert.equal(retried.body.lives, 3);
});

test("finished attempt history stays bounded and evicted results never grant credit", async t => {
  const f = await fixture(t);
  const player = f.client();
  let firstId = "", latestId = "";
  for (let i = 0; i < 101; i++) {
    f.advance(30 * 60 * 1000);
    const start = await player.request("attempt/start", {});
    assert.equal(start.status, 200);
    firstId ||= start.body.attemptId;
    latestId = start.body.attemptId;
    assert.equal((await player.request("attempt/finish", { attemptId: latestId, outcome: "lost" })).status, 200);
  }
  const old = await player.request("attempt/finish", { attemptId: firstId, outcome: "won" });
  assert.equal(old.status, 409);
  assert.equal(old.body.code, "ATTEMPT_NOT_FOUND");
  assert.equal(old.body.wallet.lives, 4);
  const recent = await player.request("attempt/finish", { attemptId: latestId, outcome: "won" });
  assert.equal(recent.status, 200);
  assert.equal(recent.body.lives, 4);
  assert.equal(recent.body.paidAttempts, 0);
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

test("missing and placeholder recipients keep both payment endpoints disabled without contacting PayPal", async t => {
  for (const merchant of [undefined, "", "   ", "merchant@example.invalid", "merchant@example.com", "merchant@example.net", "merchant@example.org", "merchant@sub.example.com", "merchant@example.com.", "merchant@https://example.com", "not-configured"]) {
    const f = await fixture(t, true, false, { PAYPAL_MERCHANT_EMAIL: merchant });
    const player = f.client();
    const initial = await player.request("state");
    assert.equal(initial.body.paymentsAvailable, false, `recipient ${String(merchant)} is not a configured merchant`);
    assert.equal((await player.request("paypal/orders", {})).status, 503);
    assert.equal((await player.request("paypal/capture", { orderId: "ORDERPLACEHOLDER" })).status, 503);
    assert.deepEqual(f.paypal.requests, [], "disabled checkout makes no remote request");
    assert.equal((await player.request("state")).body.paidAttempts, 0);
    assert.equal((await player.request("attempt/start", {})).status, 200, "free gameplay remains available");
  }
});

test("sandbox checkout uses its explicit recipient override and verifies that recipient", async t => {
  const sandboxMerchant = "sandbox@merchant.test";
  const f = await fixture(t, true, false, { PAYPAL_MERCHANT_EMAIL: "live@merchant.test", PAYPAL_SANDBOX_MERCHANT_EMAIL: sandboxMerchant });
  const player = f.client();
  assert.equal((await player.request("state")).body.paymentsAvailable, true);
  const created = await player.request("paypal/orders", {});
  assert.equal(created.status, 200);
  assert.equal(f.paypal.orders.get(created.body.orderId).purchase_units[0].payee.email_address, sandboxMerchant);
  assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).body.paidAttempts, 5);
  assert(f.paypal.requests.every(url => new URL(url).hostname === "api-m.sandbox.paypal.com"));
});

test("live checkout never uses a sandbox override and cannot credit its recipient", async t => {
  const liveMerchant = "live@merchant.test", sandboxMerchant = "sandbox@merchant.test";
  const f = await fixture(t, true, false, {
    PAYPAL_ENV: "live", PUPPY_PUBLIC_URL: "https://game.merchant.test",
    PAYPAL_MERCHANT_EMAIL: liveMerchant, PAYPAL_SANDBOX_MERCHANT_EMAIL: sandboxMerchant,
  });
  const player = f.client();
  assert.equal((await player.request("state")).body.paymentsAvailable, true);
  const created = await player.request("paypal/orders", {});
  assert.equal(created.status, 200);
  const order = f.paypal.orders.get(created.body.orderId);
  assert.equal(order.purchase_units[0].payee.email_address, liveMerchant);
  order.purchase_units[0].payee.email_address = sandboxMerchant;
  assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).status, 409);
  assert.equal(f.paypal.captures, 0, "a recipient mismatch is rejected before capturing");
  assert.equal((await player.request("state")).body.paidAttempts, 0);
  order.purchase_units[0].payee.email_address = liveMerchant;
  assert.equal((await player.request("paypal/capture", { orderId: created.body.orderId })).body.paidAttempts, 5);
  assert(f.paypal.requests.every(url => new URL(url).hostname === "api-m.paypal.com"));
});

test("a live merchant must be configured independently of sandbox settings", async t => {
  const f = await fixture(t, true, false, {
    PAYPAL_ENV: "live", PUPPY_PUBLIC_URL: "https://game.merchant.test",
    PAYPAL_MERCHANT_EMAIL: undefined, PAYPAL_SANDBOX_MERCHANT_EMAIL: "sandbox@merchant.test",
  });
  const player = f.client();
  assert.equal((await player.request("state")).body.paymentsAvailable, false);
  assert.equal((await player.request("paypal/orders", {})).status, 503);
  assert.equal((await player.request("paypal/capture", { orderId: "ORDERPLACEHOLDER" })).status, 503);
  assert.deepEqual(f.paypal.requests, []);
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
