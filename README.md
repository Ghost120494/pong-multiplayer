# Puppy Pals

A dog-themed match-3 adventure with 180 levels, twelve puppy sprites, special matches, gradually unlocked boosters, saved progress and optional PayPal attempt packs. The responsive TypeScript web app can be installed as a PWA; a Capacitor scaffold prepares for future Android and iPhone releases.

The discovery campaign alternates helpful bonuses with new challenges: Paw pop at level 2 before grass at 8, Shuffle at 14 before dual-breed goals at 20, then opening move bonuses, double grass, Rainbow, special-making and cascade goals, extra picnic coins and an opening line blast. New puppies join the rotating board palettes as the journey grows. The first 72 levels form three roughly hour-long walks, targeting a discovery about every 15 minutes of active play at an assumed 2½ minutes per level. These are pacing estimates, not measured retention results or time gates. See [campaign pacing and unlocks](docs/progression.md).

Existing 100-level saves expand without losing stars, inventory or the current board. An unfinished original run keeps its original rules; starting another level uses the discovery campaign. Players who already completed level 100 can continue at level 101. Discovery gifts are recorded once and included in progress backups.

```sh
npm ci
npm run build
npm test
npm start
```

The server uses port 8080 by default. `npm run dev` watches the TypeScript client and server; refresh the page after client changes. Production builds update the checked-in `dist/server.js` and `public/puppy-pals/app.js` bundles.

For optional browser QA, with Playwright and Chromium available, start the server and run `PUPPY_BASE_URL=http://127.0.0.1:8080 npm run test:browser`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Chromium is not installed at `/usr/bin/chromium`. The smoke covers real clicks, swipes, a level win, saved progress, mobile layouts, offline play and disabled native PayPal checkout; it writes screenshots to `/tmp/puppy-desktop.png` and `/tmp/puppy-mobile.png`.

`npm run test:loading` checks slow artwork loading, stable board cells during matches/refills, and exact saved-board restoration with normal and reduced motion. It uses the same browser prerequisites and `PUPPY_BASE_URL` override (default port 8080).

`npm run test:sync` checks interrupted requests, stale server sessions, safe retries, offline level completion, storage failure recovery and downloadable backup restoration.

`npm run test:progression` checks gradual booster gifts, old-save migration and exact boards, the expanded map, new challenges, mobile goal containment and offline puppy sprites.

Puppy Pals is the home page. Existing Pong, Snake and Incremental games remain available at `/pong/`, `/snake/` and `/incremental/`. The original match-3 route redirects to Puppy Pals.

PayPal packs cost **$0.99 USD for five attempts**, payable to `jasonwilliams1204@gmail.com`. Checkout remains unavailable until the merchant's PayPal app credentials, public return origin and persistent wallet storage are configured. Payments are verified on the server before attempts are credited; no card information is stored by the game.

See [PayPal setup](docs/paypal.md) and [web/native publishing](docs/publishing.md). Native apps are not signed or submitted, and native in-app billing still requires platform-specific work.

For local sandbox configuration, copy `.env.example` to the ignored `.env` file, supply your own merchant app credentials privately, and run `node --env-file=.env dist/server.js` with Node 20.20 or newer. `npm start` reads variables already supplied by the hosting environment; it does not load `.env` automatically. Free gameplay works without any PayPal credentials.

Progress saves automatically after every move, including completed levels, stars, coins, boosters and the current board. It uses a primary device save, a backup copy and an IndexedDB mirror. The footer reports actual device-save status separately from the server connection. Open **Save & restore** to download a JSON backup or restore one on another device. If storage was temporarily unavailable, an earlier recovered checkpoint can also be reviewed there before replacing your current game. Backup files do not transfer purchased attempts or server-session identities.

Interrupted result requests retry in the background. Retired reservations are discarded without awarding credit, so an old session from a server restart cannot permanently block gameplay. New attempt reservations use an idempotency ID to avoid charging another life when a response is lost. Free offline play remains available while the server is unavailable; payments always require server verification.

Online attempts and purchases use a persistent, anonymous browser wallet; keep its cookies to keep access to paid attempts. The current version does not offer accounts or automatic cloud sync across devices. Clearing all browser data removes device saves unless you have downloaded a backup.
