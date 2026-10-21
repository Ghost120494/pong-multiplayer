import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

// Campaign QA uses the real app, real save migration, and legal engine histories.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.PUPPY_BASE_URL || 'http://127.0.0.1:8080';
const KEY = 'puppy-pals-save-v1';
await mkdir('.test-build', { recursive: true });
await build({ entryPoints: ['src/puppy/engine.ts'], outfile: '.test-build/progression-engine.cjs', bundle: true, platform: 'node', target: 'node20', format: 'cjs' });
const { PuppyGame, LEVELS, BREEDS } = require('../.test-build/progression-engine.cjs');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
const runtimeErrors = [];

function profile(level, overrides = {}) {
  return {
    version: 1, unlocked: level, stars: Array(180).fill(0), best: Array(180).fill(0),
    coins: 120, boosters: { paw: 0, shuffle: 0, rainbow: 0 }, sound: false, dailyAt: 0,
    discoveries: [], run: { level, seed: 0, ruleset: 2, actions: [], attemptId: null, mode: null, resultHandled: false },
    offlineWallet: { lives: 5, nextLifeAt: null }, pendingFinishes: [], pendingPayment: null,
    ...overrides,
  };
}
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
async function ready(page) {
  await page.waitForSelector('#board[aria-busy="false"]', { timeout: 20000 });
  await page.waitForFunction(() => /Online|Offline play/.test(document.querySelector('#connection')?.textContent || ''));
  await page.waitForSelector('#save-status[data-saved="true"]');
  assert.equal(await page.locator('#board .tile').count(), 64);
}
async function fixture(data, { width = 1200, serviceWorkers = 'block' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers });
  if (data) await context.addInitScript(({ key, data }) => {
    if (sessionStorage.getItem('puppy-progression-seeded')) return;
    localStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem('puppy-progression-seeded', 'yes');
  }, { key: KEY, data });
  const page = await context.newPage();
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto(BASE); await ready(page);
  return { context, page };
}
async function assertBoosts(page, expected) {
  for (const [kind, available] of Object.entries(expected)) {
    const button = page.locator(`.booster[data-booster="${kind}"]`);
    assert.equal(await button.isVisible(), available, `${kind} visibility follows its discovery`);
    if (!available) assert(await button.isDisabled(), `${kind} cannot be used before its discovery`);
  }
}
async function assertBoard(page, snapshot, label) {
  const actual = await page.locator('#board .tile').evaluateAll(tiles => tiles.map(tile => ({
    id: Number(tile.dataset.tileId), breed: Number(tile.dataset.breed),
    grass: tile.classList.contains('grass-double') ? 2 : tile.classList.contains('grass') ? 1 : 0,
  })));
  const expected = snapshot.board.flatMap((row, r) => row.map((tile, c) => ({ id: tile.id, breed: tile.breed, grass: snapshot.grass[r][c] })));
  assert.deepEqual(actual, expected, `${label}: preserve exact puppies, IDs, and grass`);
  assert.equal(Number(await page.locator('#moves').innerText()), snapshot.moves, `${label}: moves`);
  assert.equal(Number((await page.locator('#score').innerText()).replaceAll(',', '')), snapshot.score, `${label}: score`);
}
async function assertGoalsFit(page, label) {
  const result = await page.evaluate(() => {
    const parent = document.querySelector('#objectives');
    const cards = [...parent.querySelectorAll('.objective')];
    const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    return {
      siblings: cards.every(card => card.parentElement === parent),
      contained: cards.every(card => inside(card.getBoundingClientRect(), parent.getBoundingClientRect()) && [...card.querySelectorAll('.label,.count,img,svg,.objective-track')].every(child => inside(child.getBoundingClientRect(), card.getBoundingClientRect()))),
      textFits: cards.every(card => [...card.querySelectorAll('.label,.count')].every(copy => copy.scrollWidth <= copy.clientWidth + 1)),
      pageFits: document.documentElement.scrollWidth <= innerWidth + 1,
    };
  });
  assert(Object.values(result).every(Boolean), `${label}: ${JSON.stringify(result)}`);
}
function completedRun(level, ruleset) {
  const game = new PuppyGame(level, 0, ruleset);
  const actions = [];
  // Model a legitimate save after using earned Paw pops. Every action passes
  // the engine; no board cells, score, or objectives are overwritten.
  while (!game.snapshot().won && actions.length < 500) {
    const snap = game.snapshot();
    let target;
    for (let r = 0; r < 8 && !target; r++) for (let c = 0; c < 8; c++) {
      if (snap.grass[r][c]) { target = { r, c }; break; }
    }
    if (!target) {
      const goal = snap.objectives.find(goal => goal.kind === 'collect' && goal.current < goal.target);
      if (goal) for (let r = 0; r < 8 && !target; r++) for (let c = 0; c < 8; c++) {
        if (snap.board[r][c]?.breed === goal.breed) { target = { r, c }; break; }
      }
    }
    if (target) {
      assert(game.useBooster('paw', target).valid);
      actions.push({ kind: 'paw', target });
    } else {
      const hint = game.hint(); assert(hint);
      assert(game.swap(hint.a, hint.b).valid);
      actions.push({ kind: 'swap', ...hint });
    }
  }
  assert(game.snapshot().won, 'completed fixture finishes through valid gameplay');
  return { game, actions };
}

try {
  assert.equal(LEVELS.length, 180);
  assert.equal(BREEDS.length, 12);
  {
    const f = await fixture();
    const first = await saved(f.page);
    assert.equal(first.run.ruleset, 2, 'new players use the discovery campaign');
    assert.equal(first.stars.length, 180);
    assert.deepEqual(first.boosters, { paw: 0, shuffle: 0, rainbow: 0 });
    await assertBoosts(f.page, { paw: false, shuffle: false, rainbow: false });
    assert(await f.page.locator('#discovery-banner').isVisible(), 'the next discovery is visible without a blocking modal');
    assert.equal(await f.page.locator('.modal').count(), 0);
    await f.page.locator('[data-action="daily"]').click();
    assert.equal((await saved(f.page)).coins, first.coins + 50);
    assert.equal((await saved(f.page)).boosters.shuffle, 0, 'daily gifts respect locked boosters');
    await f.page.locator('[data-action="discoveries"]:visible').first().click();
    assert(await f.page.locator('.discovery-list').isVisible());
    assert((await f.page.locator('.discovery-card').count()) >= 12, 'journal exposes the paced journey');
    await f.context.close();
    console.log('New-player discovery OK: no early boosters, nonblocking next discovery, journal, and safe daily gift');
  }
  for (const [level, boosts, visible] of [
    [2, { paw: 2, shuffle: 0, rainbow: 0 }, { paw: true, shuffle: false, rainbow: false }],
    [14, { paw: 2, shuffle: 2, rainbow: 0 }, { paw: true, shuffle: true, rainbow: false }],
    [38, { paw: 2, shuffle: 2, rainbow: 1 }, { paw: true, shuffle: true, rainbow: true }],
  ]) {
    const f = await fixture(profile(level));
    await assertBoosts(f.page, visible);
    const awarded = await saved(f.page);
    assert.deepEqual(awarded.boosters, boosts, `level${level} gifts only reached boosters`);
    assert.equal(new Set(awarded.discoveries).size, awarded.discoveries.length);
    await f.page.reload(); await ready(f.page);
    assert.deepEqual((await saved(f.page)).boosters, boosts, 'reload cannot claim discovery gifts again');
    assert.deepEqual((await saved(f.page)).discoveries, awarded.discoveries);
    await f.context.close();
  }
  console.log('Booster pacing OK: Paw2, Shuffle14, Rainbow38; starter gifts commit once across reload');
  {
    const game = new PuppyGame(37, 12345, 1);
    const actions = [];
    for (let move = 0; move < 2; move++) {
      const hint = game.hint(); assert(hint); assert(game.swap(hint.a, hint.b).valid);
      actions.push({ kind: 'swap', ...hint });
    }
    const stars = Array(100).fill(0); stars[35] = 2;
    const best = Array(100).fill(0); best[35] = 2460;
    const data = profile(37, { stars, best, coins: 420, boosters: { paw: 4, shuffle: 3, rainbow: 2 }, run: { level: 37, seed: 12345, actions, attemptId: null, mode: null, resultHandled: false } });
    delete data.discoveries;
    const f = await fixture(data);
    const migrated = await saved(f.page);
    assert.equal(migrated.run.ruleset, 1);
    assert.equal(migrated.stars.length, 180);
    assert.equal(migrated.best.length, 180);
    assert.equal(migrated.stars[35], 2); assert.equal(migrated.best[35], 2460);
    assert.equal(migrated.coins, 420);
    assert.deepEqual(migrated.boosters, data.boosters, 'legacy migration does not duplicate prior introduction gifts');
    await assertBoard(f.page, game.snapshot(), 'legacy mid-level migration');
    await f.page.reload(); await ready(f.page);
    await assertBoard(f.page, game.snapshot(), 'migrated run after reload');
    await f.context.close();
    console.log('Legacy migration OK: old100-entry saves retain stars, coins, inventory, and exact ruleset1 board');
  }
  {
    const { game, actions } = completedRun(100, 1);
    const stars = Array(100).fill(0); stars[99] = 3;
    const best = Array(100).fill(0); best[99] = game.snapshot().score;
    const data = profile(100, { stars, best, coins: 4321, run: { level: 100, seed: 0, actions, attemptId: null, mode: null, resultHandled: true } });
    delete data.discoveries;
    const f = await fixture(data);
    assert.equal((await saved(f.page)).unlocked, 101, 'an old campaign finisher can access the expansion');
    assert.equal((await saved(f.page)).coins, 4321, 'completed legacy results are not rewarded twice');
    await f.page.locator('[data-action="next"]').click(); await ready(f.page);
    const next = await saved(f.page);
    assert.equal(next.run.level, 101); assert.equal(next.run.ruleset, 2);
    assert.match(await f.page.locator('#level-label').innerText(), /LEVEL 101/);
    await f.context.close();
    console.log('Expansion access OK: completed legacy level100 advances directly into ruleset2 level101');
  }
  for (const level of [26, 32, 44, 56, 62, 68]) {
    const f = await fixture(profile(level), { width: 390 });
    const expected = new PuppyGame(level, 0, 2).snapshot();
    await assertBoard(f.page, expected, `discovery level${level}`);
    if (level === 26) assert((await f.page.locator('#board img[src$="dog-6.svg"]').count()) > 0, 'Golden Retriever appears in its unlocked pool');
    if (level === 32) assert((await f.page.locator('.tile.grass-double').count()) > 0, 'double grass has a distinct board presentation');
    if (level === 44) assert((await f.page.locator('#objectives .objective.special').count()) > 0, 'new special-match objective renders');
    if (level === 56) assert((await f.page.locator('#objectives .objective.cascade').count()) > 0, 'new cascade objective renders');
    if (level === 62) assert((await f.page.locator('.special-badge:not([hidden])').count()) > 0, 'Trail Charm starts with a real line special');
    for (const width of [320, 390, 430]) {
      await f.page.setViewportSize({ width, height: 1000 });
      await assertGoalsFit(f.page, `level${level} width${width}`);
    }
    await f.context.close();
  }
  console.log('New mechanics/mobile OK: bonus moves, new puppy, double grass, special/cascade goals, opening charm, and contained goals');
  {
    const { game, actions } = completedRun(50, 2);
    const f = await fixture(profile(50, { run: { level: 50, seed: 0, ruleset: 2, actions, attemptId: null, mode: null, resultHandled: false } }));
    await f.page.waitForSelector('[data-action="next"]');
    const awarded = await saved(f.page);
    const stars = awarded.stars[49];
    assert(stars > 0 && awarded.unlocked === 51);
    assert.equal(awarded.best[49], game.snapshot().score);
    assert.equal(awarded.coins, 120 + 40 + stars * 20 + 25, 'first picnic win includes the extra25TreatTrail coins');
    await f.page.reload(); await ready(f.page);
    assert.equal((await saved(f.page)).coins, awarded.coins, 'reopening cannot award picnic coins twice');
    await f.context.close();
    console.log('Picnic reward OK: first win grants the extra25coins once, including after reopening');
  }
  {
    const f = await fixture(profile(180), { serviceWorkers: 'allow' });
    await f.page.locator('[data-action="map"]:visible').first().click();
    assert.match(await f.page.locator('#modal-map').innerText(), /Chapter 18 of 18/);
    assert(!(await f.page.locator('#modal-map [data-level="180"]').isDisabled()));
    await f.page.locator('.modal-close').click();
    await f.page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await f.page.reload(); await ready(f.page);
    assert(await f.page.evaluate(() => !!navigator.serviceWorker.controller));
    await f.context.setOffline(true);
    await f.page.reload(); await ready(f.page);
    assert.match(await f.page.locator('#level-label').innerText(), /LEVEL 180/);
    assert(await f.page.locator('#board img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
    const cached = await f.page.evaluate(async () => Promise.all(Array.from({ length: 6 }, async (_, i) => {
      const response = await fetch(`/puppy-pals/art/dog-${i + 6}.svg`);
      return response.ok && (await response.text()).includes('<svg');
    })));
    assert(cached.every(Boolean), 'all six new puppy sprites remain available offline');
    await f.context.close();
    console.log('Expanded PWA OK: level180 and18chapters, offline reopen, and all six new sprite assets cached');
  }
  assert.deepEqual(runtimeErrors, [], 'no browser runtime errors');
  console.log('Puppy Pals progression browser QA passed');
} finally { await browser.close(); }
