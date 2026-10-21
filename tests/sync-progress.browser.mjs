import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

// Real-browser checks for interrupted sessions and durable on-device progress.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.PUPPY_BASE_URL || 'http://127.0.0.1:8080';
const KEY = 'puppy-pals-save-v1';
await mkdir('.test-build', { recursive: true });
await build({ entryPoints: ['src/puppy/engine.ts'], outfile: '.test-build/sync-engine.cjs', bundle: true, platform: 'node', target: 'node20', format: 'cjs' });
const { PuppyGame } = require('../.test-build/sync-engine.cjs');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
const runtimeErrors = [];
let exportedBackup;
let exportedCheckpoint;
let interruptedWinningBackup;

function freshSave(overrides = {}) {
  return {
    version: 1, unlocked: 1, stars: Array(100).fill(0), best: Array(100).fill(0), coins: 120,
    boosters: { paw: 2, shuffle: 2, rainbow: 1 }, sound: false, dailyAt: 0,
    run: { level: 1, seed: 0, actions: [], attemptId: null, mode: null, resultHandled: false },
    offlineWallet: { lives: 5, nextLifeAt: null }, pendingFinishes: [], pendingPayment: null,
    ...overrides,
  };
}
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const cell = (page, point) => page.locator(`.tile[data-r="${point.r}"][data-c="${point.c}"]`);
const boardState = page => page.locator('.tile').evaluateAll(tiles => tiles.map(tile => ({
  breed: tile.dataset.breed, tileId: tile.dataset.tileId, label: tile.getAttribute('aria-label'),
})));
async function idle(page) {
  await page.waitForSelector('.board-wrap[data-loading="false"]', { timeout: 15000 });
  await page.waitForSelector('#board[aria-busy="false"]', { timeout: 15000 });
}
async function ready(page) {
  await idle(page);
  await page.waitForFunction(() => /Online|Offline play|Reconnecting/.test(document.querySelector('#connection')?.textContent || ''));
  assert.equal(await page.locator('.tile').count(), 64);
}
async function savedIndicator(page) {
  await page.waitForFunction(() => /saved/i.test(document.querySelector('#save-status')?.textContent || ''), undefined, { timeout: 10000 });
}
async function hintedMove(page) {
  await page.locator('[data-action="hint"]').click();
  const points = await page.locator('.tile.hint').evaluateAll(tiles => tiles.map(tile => ({ r: Number(tile.dataset.r), c: Number(tile.dataset.c) })));
  assert.equal(points.length, 2);
  return { a: points[0], b: points[1] };
}
async function playMove(page, move) {
  const before = Number(await page.locator('#moves').innerText());
  await cell(page, move.a).click();
  assert.equal(await cell(page, move.a).getAttribute('aria-pressed'), 'true');
  await cell(page, move.b).click();
  await page.waitForFunction(previous => Number(document.querySelector('#moves')?.textContent) === previous - 1, before);
  await idle(page);
}
function replay(run) {
  const game = new PuppyGame(run.level, run.seed, run.ruleset ?? 1);
  for (const action of run.actions) {
    const result = action.kind === 'swap' ? game.swap(action.a, action.b) : game.useBooster(action.kind, action.target);
    assert(result.valid, 'saved history consists of real valid moves');
  }
  return game;
}
function bestMove(run) {
  let best;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) for (const b of [{ r, c: c + 1 }, { r: r + 1, c }]) {
    if (b.r > 7 || b.c > 7) continue;
    const candidate = replay(run), a = { r, c };
    if (!candidate.swap(a, b).valid) continue;
    const state = candidate.snapshot();
    const value = (state.won ? 1e6 : 0) + state.objectives.reduce((sum, goal) => sum + Math.min(1, goal.current / goal.target) * 10000, 0) + state.score / 10000;
    if (!best || value > best.value) best = { a, b, value };
  }
  assert(best, 'an ordinary valid match remains available');
  return best;
}
async function indexedSave(page) {
  return page.evaluate(key => new Promise((resolve, reject) => {
    const opening = indexedDB.open('puppy-pals-progress', 1);
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const db = opening.result;
      if (!db.objectStoreNames.contains('saves')) { db.close(); resolve(null); return; }
      const tx = db.transaction('saves', 'readonly');
      const request = tx.objectStore('saves').get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    };
  }), KEY);
}
async function waitIndexed(page, predicate, label) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const data = await indexedSave(page);
    if (data && predicate(data)) return data;
    await page.waitForTimeout(30);
  }
  throw new Error(`IndexedDB did not persist ${label}`);
}
async function checkpoint(page) {
  return { board: await boardState(page), moves: await page.locator('#moves').innerText(), score: await page.locator('#score').innerText() };
}
async function assertCheckpoint(page, expected, label) {
  assert.deepEqual(await boardState(page), expected.board, `${label}: exact puppy layout and specials`);
  assert.equal(await page.locator('#moves').innerText(), expected.moves, `${label}: moves`);
  assert.equal(await page.locator('#score').innerText(), expected.score, `${label}: score`);
}

async function fixture(profile = freshSave(), initialActive = null) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(({ key, profile }) => {
    if (!sessionStorage.getItem('puppy-sync-fixture-seeded')) {
      localStorage.setItem(key, JSON.stringify(profile));
      sessionStorage.setItem('puppy-sync-fixture-seeded', 'yes');
    }
    if (sessionStorage.getItem('puppy-deny-local-writes') === 'yes') {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === window.localStorage) throw new DOMException('Simulated local storage quota failure', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    }
  }, { key: KEY, profile });
  const wallet = {
    lives: initialActive ? 4 : 5, maxLives: 5, nextLifeAt: initialActive ? Date.now() + 1800000 : null,
    paidAttempts: 0, totalAttempts: initialActive ? 4 : 5, paymentsAvailable: false,
    pack: { attempts: 5, price: '0.99', currency: 'USD' }, activeAttempt: !!initialActive,
    activeAttemptId: initialActive, activeAttemptStartedAt: initialActive ? Date.now() : null,
    activeAttemptRequestId: null,
  };
  const state = {
    wallet, unavailable: false, dropStartResponseOnce: false, nextId: 0, starts: 0, finishRequests: [], settled: new Map(), refunds: 0,
  };
  const view = () => ({ ...wallet, totalAttempts: wallet.lives + wallet.paidAttempts, activeAttempt: !!wallet.activeAttemptId });
  await context.route('**/api/puppy/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/puppy/', '');
    if (state.unavailable) { await route.abort('failed'); return; }
    const input = request.method() === 'POST' ? request.postDataJSON() : {};
    const send = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === 'state') return send(view());
    if (path === 'attempt/start') {
      if (wallet.activeAttemptId && input.requestId && input.requestId === wallet.activeAttemptRequestId) return send({ ...view(), attemptId: wallet.activeAttemptId });
      if (wallet.activeAttemptId) return send({ error: 'A level is already in progress.', code: 'ATTEMPT_ACTIVE', wallet: view() }, 409);
      if (!wallet.lives) return send({ error: 'You are out of attempts.', code: 'NO_ATTEMPTS', wallet: view() }, 409);
      state.starts++; wallet.lives--; wallet.nextLifeAt ||= Date.now() + 1800000;
      wallet.activeAttemptId = `test-attempt-${++state.nextId}`; wallet.activeAttemptStartedAt = Date.now();
      wallet.activeAttemptRequestId = input.requestId || null;
      if (state.dropStartResponseOnce) { state.dropStartResponseOnce = false; await route.abort('failed'); return; }
      return send({ ...view(), attemptId: wallet.activeAttemptId });
    }
    if (path === 'attempt/finish') {
      state.finishRequests.push(input.attemptId);
      if (state.settled.has(input.attemptId)) return send(view());
      if (!wallet.activeAttemptId) return send({ error: 'This attempt is no longer active.', code: 'ATTEMPT_NOT_FOUND', wallet: view() }, 409);
      if (input.attemptId !== wallet.activeAttemptId) return send({ error: 'This attempt belongs to another level.', code: 'ATTEMPT_MISMATCH', wallet: view() }, 409);
      if (input.outcome === 'won') { wallet.lives = Math.min(5, wallet.lives + 1); state.refunds++; }
      state.settled.set(input.attemptId, input.outcome);
      wallet.activeAttemptId = null; wallet.activeAttemptStartedAt = null; wallet.activeAttemptRequestId = null;
      if (wallet.lives === 5) wallet.nextLifeAt = null;
      return send(view());
    }
    throw new Error(`Unexpected API call in sync test: ${path}`);
  });
  const page = await context.newPage();
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto(BASE); await ready(page);
  return { page, context, state };
}

try {
  {
    const f = await fixture(freshSave({ pendingFinishes: [{ attemptId: 'expired-before-deploy', outcome: 'won' }] }));
    await f.page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).pendingFinishes.length === 0, KEY);
    await playMove(f.page, await hintedMove(f.page));
    assert.equal((await saved(f.page)).run.actions.length, 1, 'a stale finish never blocks a new free game');
    assert.equal(f.state.wallet.lives, 4, 'new play reserves exactly one free attempt');
    assert.equal(f.state.refunds, 0, 'an expired result never invents a refund');
    assert.equal(f.state.wallet.paidAttempts, 0);
    await savedIndicator(f.page);
    await f.context.close();
    console.log('Sync recovery OK: old deployment/session results retire without blocking gameplay or awarding credits');
  }
  {
    const profile = freshSave({
      pendingFinishes: [{ attemptId: 'older-result', outcome: 'won' }],
      run: { level: 1, seed: 0, actions: [], attemptId: 'current-active', mode: 'online', resultHandled: false },
    });
    const f = await fixture(profile, 'current-active');
    await f.page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).pendingFinishes.length === 0, KEY);
    await playMove(f.page, await hintedMove(f.page));
    assert.equal(f.state.wallet.activeAttemptId, 'current-active', 'retiring an old result leaves the current attempt alone');
    assert.equal(f.state.starts, 0, 'resuming never charges a duplicate attempt');
    assert.equal(f.state.wallet.lives, 4);
    assert.equal(f.state.refunds, 0);
    await f.context.close();
    console.log('Active attempt OK: stale results cannot cancel, refund, or duplicate a different ongoing level');
  }
  {
    const f = await fixture();
    f.state.dropStartResponseOnce = true;
    await playMove(f.page, await hintedMove(f.page));
    const resumed = await saved(f.page);
    assert.equal(resumed.run.mode, 'online');
    assert.equal(resumed.run.attemptId, f.state.wallet.activeAttemptId);
    assert.equal(resumed.run.reservationId, f.state.wallet.activeAttemptRequestId);
    assert.equal(f.state.starts, 1, 'recovering a lost start response does not reserve another attempt');
    assert.equal(f.state.wallet.lives, 4);
    assert.equal(resumed.run.actions.length, 1, 'the intended move still completes after reservation recovery');
    await f.context.close();
    console.log('Reservation recovery OK: a lost start response resumes its existing attempt without duplicate life charges');
  }
  {
    const f = await fixture();
    await playMove(f.page, await hintedMove(f.page));
    const active = (await saved(f.page)).run.attemptId;
    f.state.unavailable = true;
    for (let turns = 0; turns < 23 && !(await saved(f.page)).stars[0]; turns++) {
      await playMove(f.page, bestMove((await saved(f.page)).run));
    }
    await f.page.waitForSelector('[data-action="next"]');
    const completed = await saved(f.page);
    assert(completed.stars[0] > 0 && completed.unlocked === 2, 'connection loss never discards the completed level');
    assert(completed.pendingFinishes.some(item => item.attemptId === active));
    // Reuse this real played winning history to model a backup downloaded during
    // its final cascade, before the normal result handler awarded the level.
    const duringCascade = structuredClone(completed);
    duringCascade.stars[0] = 0; duringCascade.best[0] = 0; duringCascade.unlocked = 1; duringCascade.coins = 120;
    duringCascade.run.resultHandled = false; duringCascade.run.attemptId = null; duringCascade.run.mode = null;
    delete duringCascade.run.reservationId;
    duringCascade.pendingFinishes = []; duringCascade.pendingPayment = null;
    assert(replay(duringCascade.run).snapshot().won, 'interrupted backup retains a legitimate completed winning board');
    interruptedWinningBackup = { format: 'puppy-pals-save', version: 1, progress: duringCascade };
    await f.page.locator('[data-action="next"]').click();
    await playMove(f.page, await hintedMove(f.page));
    const next = await saved(f.page);
    assert.equal(next.run.mode, 'offline', 'a pending online result still allows free offline play');
    assert.match(next.run.attemptId, /^offline-/);
    assert.equal(next.offlineWallet.lives, 4);
    const board = await checkpoint(f.page);
    await f.page.reload(); await ready(f.page);
    await assertCheckpoint(f.page, board, 'offline reload');
    assert.equal((await saved(f.page)).unlocked, 2);
    assert.equal(f.state.wallet.paidAttempts, 0, 'offline gameplay never invents paid credits');
    f.state.unavailable = false;
    await f.page.evaluate(() => window.dispatchEvent(new Event('online')));
    await f.page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).pendingFinishes.length === 0, KEY);
    assert.equal(f.state.settled.get(active), 'won');
    assert.equal(f.state.refunds, 1, 'reconnection refunds a completed reservation exactly once');
    assert.equal(f.state.wallet.lives, 5);
    await f.page.evaluate(() => window.dispatchEvent(new Event('online')));
    await f.page.waitForTimeout(100);
    assert.equal(f.state.refunds, 1);
    assert.equal((await saved(f.page)).run.mode, 'offline', 'online recovery does not replace the current offline board');
    await assertCheckpoint(f.page, board, 'reconnection');
    await f.page.locator('#save-status').click();
    const downloadEvent = f.page.waitForEvent('download');
    await f.page.locator('[data-action="download-progress"]').click();
    const stream = await (await downloadEvent).createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    exportedBackup = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    exportedCheckpoint = board;
    assert.equal(exportedBackup.format, 'puppy-pals-save');
    assert.equal(exportedBackup.version, 1);
    assert(exportedBackup.progress.stars[0] > 0 && exportedBackup.progress.unlocked === 2);
    assert.equal(exportedBackup.progress.run.attemptId, null, 'export never transfers a server attempt identity');
    assert.equal(exportedBackup.progress.run.mode, null);
    assert.deepEqual(exportedBackup.progress.pendingFinishes, []);
    assert.equal(exportedBackup.progress.pendingPayment, null, 'export never transfers payment-reconciliation claims');
    await f.context.close();
    console.log('Connection-loss OK: won levels and next-level play survive offline/reload, then reconcile once on reconnect');
  }
  {
    const f = await fixture();
    await playMove(f.page, await hintedMove(f.page)); await savedIndicator(f.page);
    await waitIndexed(f.page, data => data.run?.actions.length === 1, 'the backup checkpoint');
    assert.equal(await f.page.evaluate(key => JSON.parse(localStorage.getItem(key + ':backup')).run.actions.length, KEY), 1, 'the automatic backup contains the latest real move');
    const board = await checkpoint(f.page);
    const completedRun = (await saved(f.page)).run;
    await f.page.evaluate(key => new Promise((resolve, reject) => {
      const opening = indexedDB.open('puppy-pals-progress', 1);
      opening.onerror = () => reject(opening.error);
      opening.onsuccess = () => {
        const db = opening.result, tx = db.transaction('saves', 'readwrite');
        tx.objectStore('saves').delete(key);
        tx.oncomplete = () => { db.close(); localStorage.setItem(key, '{broken json'); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    }), KEY);
    await f.page.reload(); await ready(f.page);
    await assertCheckpoint(f.page, board, 'backup restoration');
    assert.deepEqual((await saved(f.page)).run, completedRun, 'the automatic backup restores the same attempt/history');
    await f.context.close();
    console.log('Backup OK: a damaged main save restores the existing board, score, moves and attempt from its backup');
  }
  {
    const f = await fixture();
    await playMove(f.page, await hintedMove(f.page));
    await waitIndexed(f.page, data => data.run?.actions.length === 1, 'the first move');
    await f.page.evaluate(() => {
      sessionStorage.setItem('puppy-deny-local-writes', 'yes');
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === window.localStorage) throw new DOMException('Simulated local storage quota failure', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    });
    await playMove(f.page, await hintedMove(f.page));
    await waitIndexed(f.page, data => data.run?.actions.length === 2, 'a move after localStorage writes fail');
    await savedIndicator(f.page);
    assert.equal((await saved(f.page)).run.actions.length, 1, 'the primary save is deliberately stale during the quota failure');
    const board = await checkpoint(f.page);
    await f.page.reload(); await ready(f.page);
    await assertCheckpoint(f.page, board, 'IndexedDB fallback restoration');
    await savedIndicator(f.page);
    for (let turns = 0; turns < 22; turns++) {
      const current = await indexedSave(f.page);
      if (current.stars[0]) break;
      if (replay(current.run).snapshot().won) {
        await waitIndexed(f.page, data => data.stars[0] > 0, 'the completed level reward');
        break;
      }
      const oldCount = current.run.actions.length;
      await playMove(f.page, bestMove(current.run));
      await waitIndexed(f.page, data => data.run?.actions.length > oldCount, 'another fallback move');
    }
    await f.page.waitForSelector('[data-action="next"]');
    const completed = await waitIndexed(f.page, data => data.unlocked === 2 && data.stars[0] > 0, 'stars and the next unlocked level');
    assert(completed.best[0] > 0);
    await f.page.locator('[data-action="next"]').click();
    await waitIndexed(f.page, data => data.run?.level === 2, 'a new level');
    await f.page.reload(); await ready(f.page);
    assert.match(await f.page.locator('#level-label').innerText(), /LEVEL 2/);
    const restored = await indexedSave(f.page);
    assert.equal(restored.unlocked, 2);
    assert(restored.stars[0] > 0 && restored.best[0] === completed.best[0], 'earned stars and high score survive storage fallback and reopening');
    await savedIndicator(f.page);
    await f.context.close();
    console.log('IndexedDB fallback OK: exact moves, stars, high score and unlocked levels persist when localStorage cannot write');
  }
  {
    assert(exportedBackup && exportedCheckpoint, 'download a real played save before testing import');
    const f = await fixture();
    const imported = structuredClone(exportedBackup);
    // A save file is untrusted game data, never a wallet or payment receipt.
    imported.progress.offlineWallet = { lives: 9999, nextLifeAt: null };
    imported.progress.paidAttempts = 9999;
    imported.progress.pendingPayment = 'FORGEDPAIDORDER';
    imported.progress.pendingFinishes = [{ attemptId: 'foreign-reservation', outcome: 'won' }];
    imported.progress.run.attemptId = 'foreign-reservation';
    imported.progress.run.mode = 'online';
    await f.page.locator('#save-status').click();
    await f.page.locator('#progress-file').setInputFiles({ name: 'puppy-pals-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    await f.page.locator('[data-action="confirm-import"]').click();
    await idle(f.page); await savedIndicator(f.page);
    await assertCheckpoint(f.page, exportedCheckpoint, 'imported backup');
    const restored = await saved(f.page);
    assert.deepEqual(restored.stars, exportedBackup.progress.stars);
    assert.equal(restored.unlocked, exportedBackup.progress.unlocked);
    assert.equal(restored.run.attemptId, null);
    assert.equal(restored.run.mode, null);
    assert.equal(restored.offlineWallet.lives, 5, 'import retains this device’s existing free-life wallet');
    assert.deepEqual(restored.pendingFinishes, []);
    assert.equal(restored.pendingPayment, null);
    assert.equal(f.state.wallet.paidAttempts, 0, 'a backup cannot grant paid attempts');
    assert.equal(f.state.starts, 0, 'importing does not reserve an extra online attempt');
    assert(!f.state.finishRequests.includes('foreign-reservation'), 'import never settles another session’s attempt');
    await f.page.reload(); await ready(f.page);
    await assertCheckpoint(f.page, exportedCheckpoint, 'imported backup after reload');
    assert.deepEqual((await saved(f.page)).stars, exportedBackup.progress.stars);
    await f.context.close();
    console.log('Portable backup OK: real download/import restores progress while rejecting wallet and payment claims');
  }
  {
    assert(interruptedWinningBackup, 'reuse a real winning move history for the interrupted-result regression');
    const f = await fixture();
    await f.page.locator('#save-status').click();
    await f.page.locator('#progress-file').setInputFiles({ name: 'puppy-pals-mid-cascade.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(interruptedWinningBackup)) });
    await f.page.locator('[data-action="confirm-import"]').click();
    await f.page.waitForSelector('[data-action="next"]');
    assert.match(await f.page.locator('.modal h2').innerText(), /Pawsitively brilliant/, 'import immediately finishes a won board without requiring reload');
    const finished = await saved(f.page);
    assert(finished.stars[0] > 0 && finished.unlocked === 2, 'an interrupted win immediately earns its stars and unlocks level2');
    assert(finished.best[0] > 0 && finished.run.resultHandled, 'the result is durably marked handled');
    assert.equal(f.state.refunds, 0, 'importing a won board never invents a server refund');
    assert.equal(f.state.starts, 0);
    assert.equal(f.state.finishRequests.length, 0);
    assert.equal(f.state.wallet.lives, 5);
    assert.equal(f.state.wallet.paidAttempts, 0);
    await f.page.reload(); await ready(f.page);
    const reopened = await saved(f.page);
    assert.deepEqual(reopened.stars, finished.stars);
    assert.equal(reopened.coins, finished.coins, 'reopening does not award the interrupted result twice');
    await f.context.close();
    console.log('Interrupted win OK: importing a real mid-cascade backup immediately awards progression once, without server credits');
  }
  assert.deepEqual(runtimeErrors, [], 'no browser runtime errors');
  console.log('Puppy Pals sync/progress browser regression passed');
} finally {
  await browser.close();
}
