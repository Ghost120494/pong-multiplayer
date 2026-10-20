# Puppy Pals payments

The web edition offers **five extra attempts for $0.99 USD** through PayPal. The purchase recipient is fixed in server code to **jasonwilliams1204@gmail.com**. An email address by itself does not enable checkout. No live payment has been made or tested by this implementation.

## Merchant setup

Create a PayPal REST application for the merchant account in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). Configure the server privately with these variables; never put the secret in frontend files, a Git commit, or chat:

| Variable | Purpose |
| --- | --- |
| `PAYPAL_CLIENT_ID` | PayPal REST application client ID. |
| `PAYPAL_CLIENT_SECRET` | PayPal REST application secret. |
| `PAYPAL_ENV` | `sandbox` while testing; `live` only when ready for real charges. Defaults to sandbox. |
| `PAYPAL_SANDBOX_MERCHANT_EMAIL` | Optional sandbox business-account email. Ignored in live mode, which always uses `jasonwilliams1204@gmail.com`. |
| `PUPPY_PUBLIC_URL` | Exact origin of the game, e.g. `https://puppypals.example.com`, with no path/query. Live checkout requires HTTPS. Sandbox accepts local `http://localhost:8080`. |
| `PUPPY_DATA_DIR` | Writable directory on a **persistent volume** for wallet balances, sessions, order ownership, and capture receipts. Required to enable checkout in production. |

The PayPal application must be authorized to receive payment for the specified recipient. Sandbox needs merchant/recipient configuration that PayPal's sandbox recognizes; a live email address is not automatically a sandbox business account. If sandbox uses a different business-account email, set `PAYPAL_SANDBOX_MERCHANT_EMAIL`; this override is ignored in live mode. Before enabling live mode, use the sandbox to verify the real merchant setup, approval, cancellation, returning after payment, capture retries, and wallet credit. Real PayPal authorization/settlement cannot be verified without merchant credentials.

The browser creates an order on the server and redirects to PayPal. After approval, it submits the returned order ID to the server. Only PayPal's authenticated order/capture responses can award attempts. The server verifies ownership, a completed capture, exact $0.99 USD amount, recipient email, order reference, and a previously unused capture ID. Repeating a capture after a network interruption does not award another pack. A cancellation or a forged return URL grants nothing.

Five free lives replenish at one per 30 minutes. Starting a level reserves one free life, then uses a paid attempt if free lives are depleted. Finishing a won level refunds that reservation; a loss or abandoned level uses it. The server returns an active attempt ID so a browser can resume or close an interrupted attempt. Progress and anonymous wallet identity are associated with this browser's HttpOnly cookie. Production uses a Secure `__Host-` cookie. Clearing cookies loses access to that wallet; account-based recovery and cross-device sync are future work. Gameplay and win/loss reports run in the browser, so this anonymous design is not a strong anti-cheat system; payment capture and pack credit remain server-verified.

## Operating the server

Use **one server process/replica** with the configured persistent volume. The JSON store serializes requests and writes atomic, fsynced replacements; failed commits restore the last committed in-memory state. It is not a distributed database and must not be shared concurrently by multiple processes. Back up the data directory. Production deployments must use HTTPS, retain the volume and cookies across restarts, and set the public origin accurately. For multiple replicas, migrate wallet/order/capture storage to a transactional database with unique capture constraints before accepting payments. The current queue remains held during PayPal verification; ingress limits and a bounded queue prevent unbounded waiting work, but slow PayPal responses can temporarily delay other player APIs.

The browser never receives the PayPal client secret or access token. No PayPal SDK script is required. Outbound HTTPS must permit `api-m.sandbox.paypal.com` for sandbox or `api-m.paypal.com` for live. Redirect destinations are `www.sandbox.paypal.com` or `www.paypal.com`. Game servers need the API domains; a user's browser needs access to checkout.

Automated tests use a local HTTP server and a mocked PayPal API; they make no payment requests. They cover attempt consumption/refunds/refills, restart persistence, order ownership, capture idempotency, bad recipient/amount/currency/reference/status, capture recovery, unavailable credentials, and cross-origin/invalid request rejection.

## Android and iPhone

PayPal checkout is intended for the web edition. Extra attempts are digital game goods. A version distributed through Apple App Store or Google Play may need the platform's in-app purchase system, subject to its current regional/program rules. Keep PayPal out of a store-distributed app unless its distribution terms explicitly allow it; implement native billing and server receipt verification before submitting that edition. Packaging a web app alone does not establish store approval.
