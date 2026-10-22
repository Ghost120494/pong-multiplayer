import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';

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
    version: 1, unlocked: level, stars: Array(500).fill(0), best: Array(500).fill(0),
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
async function boardFingerprint(page) {
  const state = await page.evaluate(() => ({
    tiles: [...document.querySelectorAll('#board .tile')].map(tile => ({
      id: Number(tile.dataset.tileId), breed: Number(tile.dataset.breed),
      grass: tile.classList.contains('grass-double') ? 2 : tile.classList.contains('grass') ? 1 : 0,
    })),
    moves: Number(document.querySelector('#moves').textContent),
    score: Number(document.querySelector('#score').textContent.replaceAll(',', '')),
  }));
  return createHash('sha256').update(JSON.stringify(state)).digest('hex');
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
  assert.equal(LEVELS.length, 500);
  assert.equal(BREEDS.length, 16);
  {
    const f = await fixture();
    const first = await saved(f.page);
    assert.equal(first.run.ruleset, 2, 'new players use the discovery campaign');
    assert.equal(first.stars.length, 500);
    assert.deepEqual(first.boosters, { paw: 0, shuffle: 0, rainbow: 0 });
    for (const breed of [12, 13, 14, 15]) assert.equal(await f.page.locator(`#breed-collection [data-breed="${breed}"] img`).count(), 0, 'later puppies are not revealed to a new player');
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
    assert.equal(migrated.stars.length, 500);
    assert.equal(migrated.best.length, 500);
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
    // This history and fingerprint were captured from the shipped 180-level app
    // before adding the extended campaign, rather than derived from new data.
    const actions = [
      { kind: 'swap', a: { r: 2, c: 1 }, b: { r: 3, c: 1 } },
      { kind: 'swap', a: { r: 1, c: 3 }, b: { r: 1, c: 4 } },
    ];
    const stars = Array(180).fill(0); stars[178] = 2;
    const best = Array(180).fill(0); best[178] = 4560;
    const data = profile(180, { stars, best, coins: 789, boosters: { paw: 3, shuffle: 2, rainbow: 1 }, run: { level: 180, seed: 12345, ruleset: 2, actions, attemptId: null, mode: null, resultHandled: false } });
    delete data.discoveries;
    const f = await fixture(data);
    const migrated = await saved(f.page);
    assert.equal(migrated.unlocked, 180, 'an unfinished old finale is not skipped');
    assert.equal(migrated.stars.length, 500); assert.equal(migrated.best.length, 500);
    assert.equal(migrated.stars[178], 2); assert.equal(migrated.best[178], 4560);
    assert.equal(migrated.coins, 789); assert.deepEqual(migrated.boosters, data.boosters);
    assert.equal(migrated.run.ruleset, 2);
    assert.equal(await boardFingerprint(f.page), 'f8d2768d39074ffd6c94a11fe570d39791d5e951c53f923f4bbbdc70371ec93b', 'the shipped180 board survives expansion exactly');
    await f.page.reload(); await ready(f.page);
    assert.equal(await boardFingerprint(f.page), 'f8d2768d39074ffd6c94a11fe570d39791d5e951c53f923f4bbbdc70371ec93b', 'the migrated board remains exact after reopening');
    await f.context.close();
    console.log('180-level migration OK: shipped ruleset2 board, score, moves, stars and inventory survive500 expansion');
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
  {
    const { game, actions } = completedRun(180, 2);
    const stars = Array(180).fill(0); stars[179] = 3;
    const best = Array(180).fill(0); best[179] = game.snapshot().score;
    const f = await fixture(profile(180, { stars, best, coins: 5678, run: { level: 180, seed: 0, ruleset: 2, actions, attemptId: null, mode: null, resultHandled: true } }));
    assert.equal((await saved(f.page)).unlocked, 181, 'the old180-level finisher can continue');
    assert.equal((await saved(f.page)).coins, 5678, 'the old finale is not paid again');
    await f.page.locator('[data-action="next"]').click(); await ready(f.page);
    assert.equal((await saved(f.page)).run.level, 181);
    assert.equal((await saved(f.page)).run.ruleset, 2);
    await assertBoard(f.page, new PuppyGame(181, (await saved(f.page)).run.seed, 2).snapshot(), 'first expansion board');
    await f.page.reload(); await ready(f.page);
    assert.equal((await saved(f.page)).run.level, 181);
    assert.equal((await saved(f.page)).coins, 5678);
    await f.context.close();
    console.log('500-level access OK: a legally finished old180 save opens181 without repeating rewards');
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
  for (const [level, breed] of [[194, 12], [266, 13], [338, 14], [410, 15]]) {
    const f = await fixture(profile(level), { width: 390 });
    const expected = new PuppyGame(level, 0, 2).snapshot();
    await assertBoard(f.page, expected, `extended puppy welcome${level}`);
    assert((await f.page.locator(`#board img[src$="dog-${breed}.svg"]`).count()) > 0, `new breed${breed} appears in its welcome board`);
    assert.equal(await f.page.locator(`#breed-collection [data-breed="${breed}"] img`).count(), 1, 'the new friend is revealed in the collection');
    for (let later = breed + 1; later < 16; later++) assert.equal(await f.page.locator(`#breed-collection [data-breed="${later}"] img`).count(), 0, 'later puppy welcomes remain undiscovered');
    assert.equal(Number(await f.page.locator('#moves').innerText()), LEVELS[level - 1].moves + 2, 'new welcomes keep the earned extra opening moves');
    assert((await f.page.locator('.special-badge:not([hidden])').count()) > 0, 'new welcomes keep the opening stripe');
    assert(await f.page.locator('#board img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'welcome sprites finish loading');
    for (const width of [320, 390, 430]) {
      await f.page.setViewportSize({ width, height: 1000 });
      await assertGoalsFit(f.page, `puppy welcome${level} width${width}`);
    }
    if (breed === 15) {
      await f.page.setViewportSize({ width: 390, height: 1000 });
      await f.page.screenshot({ path: '/tmp/puppy-expanded-welcome-410.png', fullPage: true });
    }
    await f.page.locator('#discovery-banner button').click();
    assert.match(await f.page.locator('.discovery-list').innerText(), new RegExp(`Level ${level}`, 'i'), 'late journal starts near the current discoveries');
    if (breed === 15) {
      const recentCount = await f.page.locator('.discovery-card').count();
      assert(recentCount <= 14, 'the late journal opens a compact recent/upcoming window');
      assert.equal(await f.page.locator('[data-discovery="paw-pop"]').count(), 0, 'the late journal does not start at the early tutorials');
      await f.page.screenshot({ path: '/tmp/puppy-expanded-journal-recent-410.png' });
      await f.page.locator('[data-action="all-discoveries"]').click();
      assert((await f.page.locator('.discovery-card').count()) > recentCount, 'the complete trail remains available on request');
      assert.equal(await f.page.locator('[data-discovery="paw-pop"]').count(), 1);
      await f.page.screenshot({ path: '/tmp/puppy-expanded-journal-full-410.png' });
      await f.page.locator('.modal-close').click();
      await f.page.locator('#discovery-banner button').click();
      assert.equal(await f.page.locator('.discovery-card').count(), recentCount, 'reopening returns to the useful recent discovery window');
    }
    await f.context.close();
  }
  console.log('Extended puppy content OK: all four new welcomes retain familiar picnic perks and fit narrow phones');
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
    const f = await fixture(profile(500), { width: 390, serviceWorkers: 'allow' });
    await f.page.locator('[data-action="map"]:visible').first().click();
    assert.match(await f.page.locator('#modal-map').innerText(), /Chapter 50 of 50/);
    assert.equal(await f.page.locator('#chapter-jump').inputValue(), '50');
    assert.equal(await f.page.locator('#chapter-jump option').count(), 50);
    assert(await f.page.locator('#modal-map [data-action="chapter-next"]').isDisabled(), 'the final region has no next page');
    assert(!(await f.page.locator('#modal-map [data-level="500"]').isDisabled()));
    await f.page.locator('#chapter-jump').selectOption('1');
    assert.match(await f.page.locator('#modal-map').innerText(), /Chapter 1 of 50/);
    assert(await f.page.locator('#modal-map [data-action="chapter-prev"]').isDisabled(), 'the first region has no previous page');
    await f.page.locator('#modal-map [data-action="chapter-next"]').click();
    assert.equal(await f.page.locator('#chapter-jump').inputValue(), '2');
    await f.page.locator('#chapter-jump').selectOption('50');
    assert.equal(await f.page.locator('#modal-map .level-node').count(), 10, 'only the selected ten-level region is mounted');
    await f.page.screenshot({ path: '/tmp/puppy-expanded-map-500.png' });
    await f.page.locator('.modal-close').click();
    for (const width of [320, 390, 430]) {
      await f.page.setViewportSize({ width, height: 1000 });
      await assertGoalsFit(f.page, `final level500 width${width}`);
    }
    await f.page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await f.page.reload(); await ready(f.page);
    assert(await f.page.evaluate(() => !!navigator.serviceWorker.controller));
    await f.context.setOffline(true);
    await f.page.reload(); await ready(f.page);
    assert.match(await f.page.locator('#level-label').innerText(), /LEVEL 500/);
    await assertGoalsFit(f.page, 'final500-level board');
    assert(await f.page.locator('#board img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
    const cached = await f.page.evaluate(async () => Promise.all(Array.from({ length: 16 }, async (_, i) => {
      const response = await fetch(`/puppy-pals/art/dog-${i}.svg`);
      return response.ok && (await response.text()).includes('<svg');
    })));
    assert(cached.every(Boolean), 'all sixteen puppy sprites remain available offline');
    await f.context.close();
    console.log('Expanded PWA OK: level500 and50chapters with direct navigation, offline reopen, and all sixteen sprites cached');
  }
  assert.deepEqual(runtimeErrors, [], 'no browser runtime errors');
  console.log('Puppy Pals progression browser QA passed');
} finally { await browser.close(); }
