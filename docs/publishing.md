# Publishing Puppy Pals

Puppy Pals is a TypeScript web game, with an installable progressive web app and a Capacitor configuration for later Android/iOS packaging. The included native configuration is a starting point; no signed Android or iOS binary has been built or submitted.

## Web deployment

Use Node 20 or newer supported by the locked dependencies:

```sh
npm ci
npm test
npm run build
npm start
```

The HTTP server defaults to port 8080. Deploy behind HTTPS and configure `PUPPY_PUBLIC_URL` to the public HTTPS origin. The main game is `/`; the existing Pong, Snake and Incremental games remain available at their original paths. `/match3/` now redirects to Puppy Pals.

The Dockerfile builds the source and starts the bundled server as the unprivileged `node` user. Mount a persistent writable volume at `/data`; `PUPPY_DATA_DIR=/data` is supplied by the image. On a platform such as Render, attach a persistent disk and ensure it is writable by the runtime user. Without persistence, paid wallets and receipts can disappear on redeployment. Use a single server instance with this JSON-backed wallet storage; a shared transactional database is needed before horizontally scaling it.

Payment details currently use a non-payable placeholder. Payments are disabled until a real merchant recipient, valid PayPal credentials and a public return origin are configured. See [PayPal configuration](paypal.md). Browser payment returns must reach this same server and retain the original session cookie. Do not put credentials into client JavaScript, Capacitor assets, or Git.

The PWA installs from supporting browsers after the game has been served over HTTPS (localhost is allowed for development). It caches the game and artwork for offline play, never API requests or PayPal return URLs. Offline play cannot verify or credit purchases.

## Android and iPhone later

Review `capacitor.config.ts` and change `appId` to an identifier you control before creating store listings. Prepare the web bundle:

```sh
npm run build:mobile
```

On a machine with Android Studio, the Android SDK and an appropriate JDK:

```sh
npm install @capacitor/android@7
npx cap add android
npx cap sync android
npx cap open android
```

For iPhone, use macOS with a compatible Xcode installation and Apple developer account:

```sh
npm install @capacitor/ios@7
npx cap add ios
npx cap sync ios
npx cap open ios
```

Rebuild and sync whenever web assets change. Native source projects are ignored here until the publisher chooses to manage them in source control. Prepare app-store screenshots, required icon sizes, age rating, privacy disclosures, a support URL and signing certificates. Test on real devices before submission.

Extra attempts are digital goods. Apple and Google store-distributed versions generally require their platform in-app purchasing, subject to current regional/program rules. The web version uses PayPal; native payment UI must remain disabled until a store-compliant billing integration and server-side purchase verification exist. The scaffold is not a completed native billing integration.

The current game stores progression on-device and paid wallets in an essential browser session. Cross-device account recovery and purchase restoration need account infrastructure before promising those capabilities to store customers. Retain and publish the included privacy notice after reviewing it against the actual deployment and any services you add.
