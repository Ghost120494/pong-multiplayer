# Puppy Pals

A dog-themed match-3 adventure with 100 levels, six puppy sprites, special matches, boosters, saved progress and optional PayPal attempt packs. The responsive TypeScript web app can be installed as a PWA; a Capacitor scaffold prepares for future Android and iPhone releases.

```sh
npm ci
npm run build
npm test
npm start
```

The server uses port 8080 by default. `npm run dev` watches the TypeScript client and server; refresh the page after client changes. Production builds update the checked-in `dist/server.js` and `public/puppy-pals/app.js` bundles.

For optional browser QA, with Playwright and Chromium available, start the server and run `PUPPY_BASE_URL=http://127.0.0.1:8080 npm run test:browser`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Chromium is not installed at `/usr/bin/chromium`. The smoke covers real clicks, swipes, a level win, saved progress, mobile layouts, offline play and disabled native PayPal checkout; it writes screenshots to `/tmp/puppy-desktop.png` and `/tmp/puppy-mobile.png`.

Puppy Pals is the home page. Existing Pong, Snake and Incremental games remain available at `/pong/`, `/snake/` and `/incremental/`. The original match-3 route redirects to Puppy Pals.

PayPal packs cost **$0.99 USD for five attempts**, payable to `jasonwilliams1204@gmail.com`. Checkout remains unavailable until the merchant's PayPal app credentials, public return origin and persistent wallet storage are configured. Payments are verified on the server before attempts are credited; no card information is stored by the game.

See [PayPal setup](docs/paypal.md) and [web/native publishing](docs/publishing.md). Native apps are not signed or submitted, and native in-app billing still requires platform-specific work.

For local sandbox configuration, copy `.env.example` to the ignored `.env` file, supply your own merchant app credentials privately, and run `node --env-file=.env dist/server.js` with Node 20.20 or newer. `npm start` reads variables already supplied by the hosting environment; it does not load `.env` automatically. Free gameplay works without any PayPal credentials.

Progress is stored on your device. Online attempts and purchases use a persistent, anonymous browser wallet; keep its cookies to keep access to paid attempts. The current version does not offer accounts or cross-device purchase recovery.
