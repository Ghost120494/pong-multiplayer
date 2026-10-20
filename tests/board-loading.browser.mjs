import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

// Run with the game server active. Playwright is supplied by the cloud QA image.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.PUPPY_BASE_URL || 'http://127.0.0.1:8080';
const KEY = 'puppy-pals-save-v1';
await mkdir('.test-build', { recursive: true });
await build({ entryPoints: ['src/puppy/engine.ts'], outfile: '.test-build/loading-engine.cjs', bundle: true, platform: 'node', target: 'node20', format: 'cjs' });
const { PuppyGame } = require('../.test-build/loading-engine.cjs');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
const errors = [];

const cell = (page, point) => page.locator(`.tile[data-r="${point.r}"][data-c="${point.c}"]`);
const readSave = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const readBoard = page => page.locator('.tile').evaluateAll(tiles => tiles.map(tile => ({
  label: tile.getAttribute('aria-label'), tileId: tile.dataset.tileId, breed: tile.dataset.breed,
})));
async function idle(page) {
  await page.waitForSelector('.board-wrap[data-loading="false"]', { timeout: 15000 });
  await page.waitForSelector('#board[aria-busy="false"]', { timeout: 15000 });
}
async function checkStableReferences(page, label, unchangedOnly = false) {
  const result = await page.evaluate(onlyUnchanged => {
    const previous = window.__boardReferences;
    const current = Array.from(document.querySelectorAll('#board .tile'));
    return {
      cells: current.length === 64 && current.every((tile, index) => tile === previous.cells[index]),
      images: current.every((tile, index) => {
        if (onlyUnchanged && tile.dataset.tileId !== previous.ids[index]) return true;
        return tile.querySelector('img') === previous.images[index];
      }),
      removedCells: window.__boardMutations.removedCells,
      minimumVisible: window.__boardMutations.minimumVisible,
      clearFrames: window.__boardMutations.clearFrames,
    };
  }, unchangedOnly);
  assert(result.cells, `${label}: keep all 64 existing board buttons`);
  assert(result.images, `${label}: retain ${unchangedOnly ? 'unchanged ' : ''}puppy image nodes`);
  assert.equal(result.removedCells, 0, `${label}: never remove board cells during rendering`);
  return result;
}
async function captureReferences(page) {
  await page.evaluate(() => {
    window.__boardObserver?.disconnect();
    const board = document.querySelector('#board');
    const cells = Array.from(board.querySelectorAll('.tile'));
    window.__boardReferences = {
      cells, images: cells.map(tile => tile.querySelector('img')),
      ids: cells.map(tile => tile.dataset.tileId),
    };
    window.__boardMutations = { removedCells: 0, minimumVisible: 64, clearFrames: 0 };
    window.__boardObserver = new MutationObserver(records => {
      for (const record of records) for (const removed of record.removedNodes) {
        if (removed.nodeType === Node.ELEMENT_NODE && removed.matches('.tile')) window.__boardMutations.removedCells++;
      }
      const current = Array.from(board.querySelectorAll('.tile'));
      const visible = current.filter(tile => {
        const image = tile.querySelector('img:not([hidden])');
        const rainbow = tile.querySelector('.rainbow-paw:not([hidden])');
        return (image && getComputedStyle(image).visibility !== 'hidden' && Number(getComputedStyle(image).opacity) > 0)
          || (rainbow && getComputedStyle(rainbow).display !== 'none');
      }).length;
      window.__boardMutations.minimumVisible = Math.min(window.__boardMutations.minimumVisible, visible);
      if (current.some(tile => tile.classList.contains('clearing'))) window.__boardMutations.clearFrames++;
    });
    window.__boardObserver.observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-tile-id', 'style'] });
  });
}

try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: { width: 1100, height: 1000 }, reducedMotion, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    let releaseSprites;
    const spritesAllowed = new Promise(resolve => { releaseSprites = resolve; });
    let allRequested;
    const sixSpritesRequested = new Promise(resolve => { allRequested = resolve; });
    const requests = new Set();
    await page.route('**/puppy-pals/art/dog-*.svg', async route => {
      requests.add(new URL(route.request().url()).pathname);
      if (requests.size === 6) allRequested();
      await spritesAllowed;
      await route.continue();
    });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.board-wrap[data-loading="true"]');
    await Promise.race([sixSpritesRequested, new Promise((_, reject) => setTimeout(() => reject(new Error('All six dog sprites must be requested before revealing the board')), 10000))]);
    assert.equal(await page.locator('#board').getAttribute('aria-busy'), 'true', 'cold board reports loading');
    assert.equal(await page.locator('#board').evaluate(board => getComputedStyle(board).visibility), 'hidden', 'do not reveal partially decoded artwork');
    assert(await page.locator('.board-loading').isVisible(), 'show the small loading overlay while preparing the full board');
    assert.equal((await readSave(page)).run.actions.length, 0, 'asset loading never makes a game move');
    releaseSprites();
    await idle(page);
    assert.equal(await page.locator('.tile').count(), 64);
    assert(await page.locator('#board img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'reveal the board only after puppy sprites are decoded');
    assert(!(await page.locator('.board-loading').isVisible()), 'loading overlay leaves the complete board in place');
    assert.equal((await readSave(page)).run.actions.length, 0);
    assert.equal(Number(await page.locator('#moves').innerText()), 24);
    assert.equal(Number(await page.locator('#score').innerText()), 0);
    await page.unroute('**/puppy-pals/art/dog-*.svg');

    // A fixed untouched seed avoids a rare opening cascade ending the level early.
    await page.evaluate(key => {
      const data = JSON.parse(localStorage.getItem(key));
      data.run.seed = 0;
      localStorage.setItem(key, JSON.stringify(data));
    }, KEY);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await idle(page);
    await captureReferences(page);
    await cell(page, { r: 0, c: 0 }).click();
    assert.equal(await cell(page, { r: 0, c: 0 }).getAttribute('aria-pressed'), 'true');
    await checkStableReferences(page, 'selecting a puppy');
    await page.locator('[data-action="hint"]').click();
    assert.equal(await page.locator('.tile.hint').count(), 2);
    await checkStableReferences(page, 'showing a hint');

    const state = await readSave(page);
    let invalid;
    for (let r = 0; r < 8 && !invalid; r++) for (let c = 0; c < 8 && !invalid; c++) {
      for (const b of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (b.r > 7 || b.c > 7) continue;
        const candidate = new PuppyGame(1, state.run.seed);
        if (!candidate.swap({ r, c }, b).valid) { invalid = { a: { r, c }, b }; break; }
      }
    }
    assert(invalid, 'opening board includes a normal invalid match to test');
    const beforeInvalid = await readBoard(page);
    await cell(page, invalid.a).click();
    await cell(page, invalid.b).click();
    await idle(page);
    assert.deepEqual(await readBoard(page), beforeInvalid, 'invalid moves keep the entire board intact');
    assert.equal((await readSave(page)).run.actions.length, 0);
    await checkStableReferences(page, 'rejecting an invalid swap');

    await page.locator('[data-action="hint"]').click();
    const points = await page.locator('.tile.hint').evaluateAll(tiles => tiles.map(tile => ({ r: Number(tile.dataset.r), c: Number(tile.dataset.c) })));
    assert.equal(points.length, 2);
    const simulation = new PuppyGame(1, state.run.seed);
    const expected = simulation.swap(points[0], points[1]);
    assert(expected.valid && !simulation.snapshot().won, 'fixture exercises ordinary refills without a result dialog');
    assert(expected.frames.every(frame => frame.snapshot.board.flat().filter(Boolean).length > 0), 'fixture never intentionally clears the full board');
    await captureReferences(page);
    await cell(page, points[0]).click();
    await cell(page, points[1]).click();
    await page.waitForFunction(() => Number(document.querySelector('#moves').textContent) === 23);
    await idle(page);
    const observations = await checkStableReferences(page, 'matching and refilling puppies', true);
    assert(observations.minimumVisible > 0, 'ordinary refill never makes the whole board disappear');
    assert(observations.clearFrames > 0, 'only actual matches use the clearing animation');
    assert.equal(await page.locator('.tile.clearing').count(), 0, 'finished matches do not leave hidden puppies');
    assert.equal(await page.locator('.tile.hint').count(), 0, 'hints do not linger after the move');
    const checkpoint = { board: await readBoard(page), moves: await page.locator('#moves').innerText(), score: await page.locator('#score').innerText(), run: (await readSave(page)).run };
    assert.equal(checkpoint.run.actions.length, 1);

    await page.addInitScript(() => {
      window.__startupClears = 0;
      new MutationObserver(() => { if (document.querySelector('#board .tile.clearing')) window.__startupClears++; }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await idle(page);
    assert.deepEqual(await readBoard(page), checkpoint.board, 'reload restores the exact puppy layout');
    assert.equal(await page.locator('#moves').innerText(), checkpoint.moves, 'reload preserves moves');
    assert.equal(await page.locator('#score').innerText(), checkpoint.score, 'reload preserves score');
    assert.deepEqual((await readSave(page)).run, checkpoint.run, 'reload retains the same attempt and move history');
    assert.equal(await page.evaluate(() => window.__startupClears), 0, 'restoration never replays clearing animations');
    assert.equal(await page.locator('.tile.clearing').count(), 0);
    console.log(`Board loading OK (${reducedMotion}): atomic artwork reveal, stable cells and unchanged sprites, preserved normal refills, exact reload restore`);
    await context.close();
  }
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log('Puppy Pals board-loading regression passed');
} finally {
  await browser.close();
}
