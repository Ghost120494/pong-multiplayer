import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

// Playwright is a QA tool, not shipped in the game. Set NODE_PATH if installed globally.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.PUPPY_BASE_URL || 'http://127.0.0.1:4173';
const KEY = 'puppy-pals-save-v1';
await mkdir('.test-build', { recursive: true });
await build({ entryPoints: ['src/puppy/engine.ts'], outfile: '.test-build/browser-engine.cjs', bundle: true, platform: 'node', target: 'node20', format: 'cjs' });
const { PuppyGame } = require('../.test-build/browser-engine.cjs');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
const failures = [];
let intentionallyOffline = false;

function monitor(page) {
  page.on('pageerror', error => failures.push(`Runtime: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    if (intentionallyOffline && /ERR_INTERNET_DISCONNECTED|ERR_FAILED|Failed to fetch/i.test(message.text())) return;
    failures.push(`Console: ${message.text()}`);
  });
}
async function saved(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); }
const cell = (page, point) => page.locator(`.tile[data-r="${point.r}"][data-c="${point.c}"]`);
const boardState = page => page.locator('.tile').evaluateAll(tiles => tiles.map(tile => tile.getAttribute('aria-label')));
async function idle(page) { await page.waitForSelector('#board[aria-busy="false"]', { timeout: 15000 }); }
async function ready(page) {
  await page.waitForSelector('.tile');
  await page.waitForFunction(() => document.querySelector('#connection')?.textContent.includes('Progress saved') || document.querySelector('#connection')?.textContent.includes('Offline play'));
  await idle(page);
  assert.equal(await page.locator('.tile').count(), 64);
  assert(await page.locator('#board img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'all board sprites load');
}
async function noOverflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${label}: no horizontal overflow`);
}
async function boostersClearNavigation(page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  assert(await page.evaluate(() => {
    const navigation = document.querySelector('.mobile-bottom').getBoundingClientRect();
    return Array.from(document.querySelectorAll('.booster')).every(button => button.getBoundingClientRect().bottom <= navigation.top + 1);
  }), 'all boosters can scroll clear of the fixed mobile navigation');
  await page.evaluate(() => window.scrollTo(0, 0));
}
async function closeModal(page) { await page.locator('.modal-close').click(); }
async function playMove(page, move, gesture = 'click') {
  const before = Number(await page.locator('#moves').innerText());
  await cell(page, move.a).scrollIntoViewIfNeeded();
  if (gesture === 'swipe') {
    const start = await cell(page, move.a).boundingBox();
    const end = await cell(page, move.b).boundingBox();
    assert(start && end);
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 6 });
    await page.mouse.up();
  } else {
    await cell(page, move.a).click();
    assert.equal(await cell(page, move.a).getAttribute('aria-pressed'), 'true', 'first tap selects puppy');
    await cell(page, move.b).click();
  }
  await page.waitForFunction(oldMoves => Number(document.querySelector('#moves')?.textContent) === oldMoves - 1, before);
  await idle(page);
  await page.waitForTimeout(20);
}
async function hintedMove(page) {
  await page.locator('[data-action="hint"]').click();
  const points = await page.locator('.tile.hint').evaluateAll(tiles => tiles.map(tile => ({ r: Number(tile.dataset.r), c: Number(tile.dataset.c) })));
  assert.equal(points.length, 2, 'hint identifies two real adjacent puppies');
  return { a: points[0], b: points[1] };
}
function replay(run) {
  const game = new PuppyGame(run.level, run.seed);
  for (const action of run.actions) {
    const result = action.kind === 'swap' ? game.swap(action.a, action.b) : game.useBooster(action.kind, action.target);
    assert(result.valid);
  }
  return game;
}
function bestRealMove(run) {
  let best;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) for (const b of [{ r, c: c + 1 }, { r: r + 1, c }]) {
    if (b.r >= 8 || b.c >= 8) continue;
    const game = replay(run);
    const a = { r, c };
    if (!game.swap(a, b).valid) continue;
    const state = game.snapshot();
    const value = (state.won ? 1e6 : 0) + state.objectives.reduce((sum, objective) => sum + Math.min(1, objective.current / objective.target) * 10000, 0) + state.board.flat().filter(tile => tile?.special).length * 10 + state.score / 10000;
    if (!best || value > best.value) best = { a, b, value };
  }
  assert(best, 'solver finds an actual legal gameplay move');
  return best;
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); monitor(page);
  await page.goto(BASE); await ready(page); await noOverflow(page, 'desktop');
  // Keep the opening board reproducible: a random early win can end the level
  // before the shop/booster checks. Change only a fresh run's random seed.
  assert.deepEqual((await saved(page)).run.actions, [], 'seed only an untouched fresh game');
  await page.evaluate(key => {
    const fresh = JSON.parse(localStorage.getItem(key));
    fresh.run.seed = 0;
    localStorage.setItem(key, JSON.stringify(fresh));
  }, KEY);
  await page.reload(); await ready(page);
  await page.screenshot({ path: '/tmp/puppy-desktop.png', fullPage: true });

  await playMove(page, await hintedMove(page));
  const afterClick = await saved(page);
  assert.equal(afterClick.run.actions.length, 1);
  const movedBoard = await boardState(page);
  await page.reload(); await ready(page);
  assert.equal((await saved(page)).run.actions.length, 1, 'saved moves survive reload');
  assert.deepEqual(await boardState(page), movedBoard, 'seeded board restores exactly');
  await playMove(page, await hintedMove(page), 'swipe');
  assert.equal((await saved(page)).run.actions.length, 2, 'real pointer swipe makes exactly one move');
  // A new tap must work immediately after a swipe, without a timed lockout.
  const immediateTap = { r: 0, c: 0 };
  await cell(page, immediateTap).click();
  assert.equal(await cell(page, immediateTap).getAttribute('aria-pressed'), 'true', 'a genuine tap immediately after a swipe selects its puppy');
  await cell(page, immediateTap).click();
  assert.equal(await cell(page, immediateTap).getAttribute('aria-pressed'), 'false', 'tapping the same puppy deselects without making another move');
  assert.equal((await saved(page)).run.actions.length, 2, 'selection taps do not spend moves');

  const beforeDaily = await saved(page);
  await page.locator('[data-action="daily"]').click();
  const afterDaily = await saved(page);
  assert.equal(afterDaily.coins, beforeDaily.coins + 50);
  assert.equal(afterDaily.boosters.shuffle, beforeDaily.boosters.shuffle + 1);
  assert(await page.locator('[data-action="daily"]').isDisabled(), 'daily reward cannot be repeatedly claimed');
  await page.locator('.nav-links [data-action="shop"]').click();
  assert.equal(await page.locator('.purchase-price').innerText(), '$0.99');
  assert.equal(await page.locator('.purchase-detail strong').innerText(), '5 extra attempts');
  assert(await page.locator('[data-action="purchase"]').isDisabled(), 'unconfigured PayPal cannot create pretend purchases');
  await page.locator('[data-action="buy-booster"][data-booster="paw"]').click();
  assert.equal((await saved(page)).coins, afterDaily.coins - 40);
  assert.equal((await saved(page)).boosters.paw, afterDaily.boosters.paw + 1);
  await closeModal(page);
  const beforePaw = Number(await page.locator('#moves').innerText());
  const paws = (await saved(page)).boosters.paw;
  await page.locator('.booster[data-booster="paw"]').click();
  await cell(page, { r: 0, c: 0 }).click();
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).run.actions.at(-1)?.kind === 'paw', KEY);
  await idle(page);
  assert.equal(Number(await page.locator('#moves').innerText()), beforePaw, 'booster spends no move');
  assert.equal((await saved(page)).boosters.paw, paws - 1);

  // Complete the real level using only ordinary UI moves, never mutating game state.
  let played = 0;
  while (!(await saved(page)).stars[0] && played < 22) {
    const current = await saved(page);
    assert(!replay(current.run).snapshot().lost, 'first level remains winnable during normal play');
    await playMove(page, bestRealMove(current.run));
    played++;
  }
  const won = await saved(page);
  assert(won.stars[0] > 0 && won.unlocked === 2, 'actual level completion earns stars and unlocks next level');
  await page.waitForSelector('[data-action="next"]');
  assert.match(await page.locator('.modal h2').innerText(), /Pawsitively brilliant/);
  await page.locator('[data-action="next"]').click();
  await page.reload(); await ready(page);
  assert.equal((await saved(page)).unlocked, 2, 'earned progression survives reload');
  assert.match(await page.locator('#level-label').innerText(), /LEVEL 2/);

  await page.locator('.top-actions [data-action="help"]').click();
  assert.match(await page.locator('.modal').innerText(), /Match 4/);
  await closeModal(page);
  await page.locator('.nav-links [data-action="map"]').click();
  for (let i = 1; i < 10; i++) await page.locator('#modal-map [data-action="chapter-next"]').click();
  assert.match(await page.locator('#modal-map').innerText(), /Chapter 10 of 10/);
  assert(await page.locator('#modal-map [data-level="100"]').isDisabled(), 'level100 exists and respects progression lock');
  await closeModal(page);

  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); await ready(page);
  assert(await page.evaluate(() => !!navigator.serviceWorker.controller), 'PWA controls the page');
  const balanceBeforeOffline = await page.evaluate(async () => (await fetch('/api/puppy/state')).json());
  intentionallyOffline = true; await context.setOffline(true);
  await page.reload(); await ready(page);
  assert.match(await page.locator('#connection').innerText(), /Offline play/);
  await playMove(page, await hintedMove(page));
  const offlineSave = await saved(page);
  assert.equal(offlineSave.run.mode, 'offline');
  assert.match(offlineSave.run.attemptId, /^offline-/);
  assert.equal(offlineSave.offlineWallet.lives, 4, 'offline move uses a free local life');
  await context.setOffline(false); intentionallyOffline = false;
  const balanceAfterOffline = await page.evaluate(async () => (await fetch('/api/puppy/state')).json());
  assert.equal(balanceAfterOffline.paidAttempts, balanceBeforeOffline.paidAttempts, 'offline play never fabricates paid credits');
  console.log(`Desktop/PWA OK: sprite loading, click/swipe, save replay, daily reward, coin boosters, real level win in ${played + 2} swaps, locked level100, disabled PayPal, offline refresh/play`);
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const mobile = await mobileContext.newPage(); monitor(mobile);
  await mobile.goto(BASE); await ready(mobile); await noOverflow(mobile, '390px mobile');
  await boostersClearNavigation(mobile);
  await mobile.screenshot({ path: '/tmp/puppy-mobile.png', fullPage: true });
  const first = await cell(mobile, { r: 0, c: 0 }).boundingBox();
  assert(first);
  await mobile.touchscreen.tap(first.x + first.width / 2, first.y + first.height / 2);
  assert.equal(await cell(mobile, { r: 0, c: 0 }).getAttribute('aria-pressed'), 'true', 'real touchscreen tap selects tile');
  await mobile.setViewportSize({ width: 320, height: 740 });
  await noOverflow(mobile, '320px mobile');
  await boostersClearNavigation(mobile);
  assert.equal(await mobile.locator('.tile').count(), 64);
  await mobile.locator('.mobile-bottom [data-action="shop"]').count().then(async count => {
    if (count) await mobile.locator('.mobile-bottom [data-action="shop"]').click();
    else await mobile.locator('.wallet-pill').click();
  });
  await noOverflow(mobile, '320px shop');
  assert(await mobile.locator('[data-action="purchase"]').isDisabled());
  console.log('Mobile OK: 390px and320px layouts, real touch selection, sprites, shop, no horizontal overflow');
  await mobileContext.close();

  const nativeContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await nativeContext.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true }; });
  const native = await nativeContext.newPage(); monitor(native);
  let checkoutRequests = 0;
  native.on('request', request => { if (request.url().includes('/api/puppy/paypal/')) checkoutRequests++; });
  await native.route('**/api/puppy/state', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ lives: 5, maxLives: 5, nextLifeAt: null, paidAttempts: 0, totalAttempts: 5, paymentsAvailable: true, activeAttempt: false, activeAttemptId: null, pack: { attempts: 5, price: '0.99', currency: 'USD' } }) }));
  await native.goto(BASE); await ready(native);
  await native.locator('.wallet-pill').click();
  assert(await native.locator('[data-action="purchase"]').isDisabled(), 'native guard disables PayPal even when backend availability is true');
  assert.match(await native.locator('.shop-note').innerText(), /app store/);
  assert.equal(await native.locator('.merchant-line').count(), 0, 'native shop does not show an external PayPal merchant prompt');
  assert.equal(checkoutRequests, 0, 'native UI never starts external checkout');
  await nativeContext.close();
  console.log('Native guard OK: PayPal disabled and merchant prompt hidden even with a payment-enabled backend');
  assert.deepEqual(failures, [], 'no unexpected browser console/runtime errors');
  console.log('Puppy Pals browser smoke passed. Screenshots: /tmp/puppy-desktop.png /tmp/puppy-mobile.png');
} finally { await browser.close(); }
