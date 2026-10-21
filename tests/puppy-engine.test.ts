import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PuppyGame, LEVELS, BREEDS, analyzeMatches, findLegalMove, type Board, type Coord, type Snapshot, type TurnResult } from '../src/puppy/engine';
import { getLevel, LEGACY_LEVELS } from '../src/puppy/levels';

function emptyFixture(seed = 42): PuppyGame {
  const game = new PuppyGame(1, seed, 1);
  const state = game as any;
  state.board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => ({ id: r * 8 + c + 1, breed: (r * 2 + c) % 6, special: null })));
  state.grass = Array.from({ length: 8 }, () => Array(8).fill(0));
  state.objectives = [{ kind: 'score', target: 999999, current: 0 }];
  state.score = 0;
  return game;
}

function setBreed(game: PuppyGame, r: number, c: number, breed: number): void {
  (game as any).board[r][c].breed = breed;
}

function firstClear(result: TurnResult) {
  const frame = result.frames.find(frame => frame.cleared.length > 0);
  assert(frame, 'a successful clear has a clear animation frame');
  return frame;
}

function validateSettled(snapshot: Snapshot): void {
  assert.equal(snapshot.board.length, 8);
  for (const row of snapshot.board) {
    assert.equal(row.length, 8);
    assert(row.every(tile => tile && Number.isInteger(tile.id)));
  }
  assert.equal(new Set(snapshot.board.flat().map(tile => tile!.id)).size, 64);
  assert.equal(analyzeMatches(snapshot.board).length, 0, 'all cascades settle');
}

test('campaign defines 180 distinct levels and keeps the original 100 definitions available', () => {
  assert.equal(LEVELS.length, 180);
  assert.equal(BREEDS.length, 12);
  assert.equal(new Set(LEVELS.map(level => level.name)).size, 180);
  assert.equal(new Set(LEVELS.map(level => level.chapter)).size, 18);
  assert.equal(LEGACY_LEVELS.length, 100);
  assert.equal(LEGACY_LEVELS[0].moves, 24);
  assert.deepEqual(LEGACY_LEVELS[0].objectives, [{ kind: 'collect', breed: 0, target: 12 }, { kind: 'score', target: 900 }]);
  for (const level of [...LEVELS, ...LEGACY_LEVELS]) {
    assert(Number.isInteger(level.moves) && level.moves > 0);
    assert(level.objectives.length >= 2);
    assert(level.objectives.every(goal => goal.target > 0));
    const grass = level.objectives.find(goal => goal.kind === 'grass');
    assert.equal(grass?.target ?? 0, level.grassCount * level.grassLayers);
  }
  for (const invalid of [0, 181, 1.5, NaN]) assert.throws(() => getLevel(invalid), RangeError);
  assert.throws(() => getLevel(101, 1), RangeError);
});

test('all 180 levels open without matches and permit a real scoring move', () => {
  for (const level of LEVELS) {
    const game = new PuppyGame(level.number, level.number * 7919);
    const before = game.snapshot();
    validateSettled(before);
    assert.equal(before.grass.flat().reduce((sum, layers) => sum + layers, 0), level.grassCount * level.grassLayers);
    const hint = game.hint();
    assert(hint, `level ${level.number} has a playable move`);
    const result = game.swap(hint.a, hint.b);
    assert(result.valid, `level ${level.number}'s hint is a valid swap`);
    assert(result.scoreGained >= 180);
    assert.equal(game.snapshot().moves, level.moves + (level.bonusMoves ?? 0) - 1);
    validateSettled(game.snapshot());
  }
});

test('every campaign level can play all the way to a win or exhausted attempts without a dead end', () => {
  let totalTurns = 0;
  for (const level of LEVELS) {
    const game = new PuppyGame(level.number, level.number * 601);
    let turns = 0;
    while (!game.snapshot().won && !game.snapshot().lost) {
      const hint = game.hint();
      assert(hint, `level ${level.number} never leaves a stuck live board`);
      const result = game.swap(hint.a, hint.b);
      assert(result.valid);
      assert(result.combos > 0);
      validateSettled(game.snapshot());
      turns++;
      assert(turns <= level.moves + (level.bonusMoves ?? 0), 'each successful swap spends exactly one move');
    }
    assert.notEqual(game.snapshot().won, game.snapshot().lost);
    totalTurns += turns;
  }
  assert(totalTurns > 1000, 'the campaign exercises substantial real play, not zero-turn checks');
});

test('legacy saves replay their original boards, moves and booster histories exactly', () => {
  // Captured from the shipped engine before the expanded campaign was added.
  const originals = [
    [1, '4eceec92487ad2dea581c75b7a30e64bdab5a76181c8dfe1bb967a9454f85fe8'],
    [4, '76fad756dd30f0b070219d0b87d2325e2afe3969ba006f83cd9a51102ffa352d'],
    [37, 'ad9b54b5a682adb41b0ce5e78132ee3355b78a58b558381b7b549c36a64b7be9'],
    [60, 'be9f27585076f7eba7c33b7d5ac9d71b8f99e7d2dffd85118ff7afbb3afed6fc'],
    [100, 'ae649737b883d920685fd0e41a792af85643675c5b681579c8a91fab35025b71'],
  ] as const;
  for (const [level, expected] of originals) {
    const game = new PuppyGame(level, level * 7919, 1);
    const snapshots = [game.snapshot()];
    for (let i = 0; i < 8 && !game.snapshot().won && !game.snapshot().lost; i++) {
      let result: TurnResult;
      if (i === 1) result = game.useBooster('paw', { r: 0, c: 0 });
      else if (i === 3) result = game.useBooster('shuffle');
      else if (i === 5) result = game.useBooster('rainbow', { r: 4, c: 4 });
      else { const move = game.hint()!; result = game.swap(move.a, move.b); }
      assert(result.valid);
      snapshots.push(game.snapshot());
    }
    const actual = createHash('sha256').update(JSON.stringify(snapshots)).digest('hex');
    assert.equal(actual, expected, `level ${level}'s existing save stays unchanged`);
  }
});

test('rotating puppy pools stay bounded through refills, specials and shuffle', () => {
  for (const level of LEVELS.filter(level => level.breedPool?.some(breed => breed >= 6))) {
    const pool = level.breedPool!;
    assert(pool.length >= 5 && pool.length <= 6);
    const game = new PuppyGame(level.number, level.number * 97);
    for (let turn = 0; turn < 5 && !game.snapshot().won && !game.snapshot().lost; turn++) {
      assert(game.snapshot().board.flat().every(tile => tile && (tile.special === 'rainbow' ? tile.breed === -1 : pool.includes(tile.breed))));
      const move = game.hint()!;
      assert(game.swap(move.a, move.b).valid);
    }
    if (!game.snapshot().won && !game.snapshot().lost) assert(game.useBooster('shuffle').valid);
    assert(game.snapshot().board.flat().every(tile => tile && (tile.special === 'rainbow' ? tile.breed === -1 : pool.includes(tile.breed))));
  }
});

test('rainbow effects find the most common actual breed ID in a rotated pool', () => {
  const level = LEVELS.find(level => level.breedPool?.includes(11))!;
  assert(level, 'the final new puppy appears in a real level');
  const game = new PuppyGame(level.number, 11);
  const alphabet = [11, ...level.breedPool!.filter(breed => breed !== 11)];
  const state = game as any;
  state.board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => ({ id: r * 8 + c + 1, breed: alphabet[(r * 2 + c) % alphabet.length], special: null })));
  state.objectives = [{ kind: 'score', target: 1e9, current: 0 }];
  // Add separated Collies without creating pre-existing matches.
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const tile = state.board[r][c]; const before = tile.breed; tile.breed = 11;
    if (analyzeMatches(state.board).length) tile.breed = before;
  }
  state.board[0][0].breed = -1; state.board[0][0].special = 'rainbow';
  const collies = state.board.flatMap((row: any[], r: number) => row.flatMap((tile, c) => tile.breed === 11 ? [{ r, c }] : []));
  assert(collies.length > 20, 'Collies are the clear majority');
  const removed = firstClear(game.useBooster('rainbow', { r: 0, c: 0 })).cleared;
  assert(collies.every((wanted: Coord) => removed.some(cell => cell.r === wanted.r && cell.c === wanted.c)));
});

test('opening bonuses apply once and old rules never receive them', () => {
  const lucky = LEVELS.find(level => level.bonusMoves)!;
  const game = new PuppyGame(lucky.number, 321);
  assert.equal(game.snapshot().moves, lucky.moves + lucky.bonusMoves!);
  const move = game.hint()!;
  game.swap(move.a, move.b);
  const replayed = new PuppyGame(lucky.number, 321);
  replayed.swap(move.a, move.b);
  assert.deepEqual(replayed.snapshot(), game.snapshot(), 'reloading a saved action does not add moves again');
  const moves = game.snapshot().moves;
  if (!game.snapshot().won) { game.useBooster('shuffle'); assert.equal(game.snapshot().moves, moves); }

  const welcome = LEVELS.find(level => level.startingSpecial)!;
  const opening = new PuppyGame(welcome.number, 789);
  assert.equal(opening.snapshot().board[3][3]!.special, welcome.startingSpecial);
  assert.equal(opening.snapshot().board.flat().filter(tile => tile!.special).length, 1);
  assert.deepEqual(opening.snapshot(), new PuppyGame(welcome.number, 789).snapshot());
  assert.equal(new PuppyGame(welcome.number, 789, 1).snapshot().board.flat().filter(tile => tile!.special).length, 0);
});

test('special goals count newly made specials and not the use of an existing stripe', () => {
  const game = emptyFixture();
  (game as any).objectives = [{ kind: 'special', target: 1, current: 0 }];
  [0, 0, 1, 0, 2, 3, 4, 5].forEach((breed, c) => setBreed(game, 3, c, breed));
  setBreed(game, 2, 2, 0);
  const created = game.swap({ r: 2, c: 2 }, { r: 3, c: 2 });
  assert.equal(firstClear(created).snapshot.objectives[0].current, 1);
  assert.equal(game.snapshot().won, true, 'the new goal participates in win detection');

  const existing = emptyFixture();
  (existing as any).objectives = [{ kind: 'special', target: 99, current: 0 }];
  (existing as any).board[7][7].special = 'row';
  assert.equal(firstClear(existing.useBooster('paw', { r: 7, c: 7 })).snapshot.objectives[0].current, 0);
});

test('cascade goals count extra clear stages across turns, without shuffle or invalid-move progress', () => {
  let game: PuppyGame | undefined;
  let first: TurnResult | undefined;
  for (let seed = 0; seed < 100; seed++) {
    const candidate = new PuppyGame(56, seed);
    (candidate as any).objectives = [{ kind: 'cascade', target: 999, current: 0 }];
    const move = candidate.hint()!;
    const result = candidate.swap(move.a, move.b);
    if (result.combos > 1) { game = candidate; first = result; break; }
  }
  assert(game && first, 'a deterministic ordinary swap produces a real cascade');
  assert.equal(firstClear(first).snapshot.objectives[0].current, 0, 'the player-created first clear is not a cascade');
  assert.equal(game.snapshot().objectives[0].current, first.combos - 1);
  const before = game.snapshot().objectives[0].current;
  game.useBooster('shuffle');
  assert.equal(game.snapshot().objectives[0].current, before);
  assert.equal(game.swap({ r: -1, c: 0 }, { r: 0, c: 0 }).valid, false);
  assert.equal(game.snapshot().objectives[0].current, before);
  const move = game.hint()!;
  const second = game.swap(move.a, move.b);
  assert.equal(game.snapshot().objectives[0].current, before + Math.max(0, second.combos - 1));
});

test('seeded play is deterministic and snapshots cannot mutate game state', () => {
  const a = new PuppyGame(37, 12345);
  const b = new PuppyGame(37, 12345);
  for (let i = 0; i < 12 && !a.snapshot().won && !a.snapshot().lost; i++) {
    assert.deepEqual(a.snapshot(), b.snapshot());
    const hint = a.hint()!;
    assert.deepEqual(a.swap(hint.a, hint.b), b.swap(hint.a, hint.b));
  }
  const snapshot = a.snapshot();
  const old = a.snapshot();
  snapshot.board[0][0]!.breed = 100;
  snapshot.grass[0][0] = 100;
  snapshot.objectives[0].current = 100;
  assert.deepEqual(a.snapshot(), old);
});

test('invalid adjacency and no-match swaps roll back without using moves', () => {
  const game = new PuppyGame(1, 999);
  const before = game.snapshot();
  assert.equal(game.swap({ r: -1, c: 0 }, { r: 0, c: 0 }).valid, false);
  assert.equal(game.swap({ r: 0, c: 0 }, { r: 7, c: 7 }).valid, false);
  let rejected = false;
  for (let r = 0; r < 8 && !rejected; r++) for (let c = 0; c < 7 && !rejected; c++) {
    const trial = new PuppyGame(1, 999);
    if (!trial.swap({ r, c }, { r, c: c + 1 }).valid) {
      assert.deepEqual(trial.snapshot(), before);
      rejected = true;
    }
  }
  assert(rejected, 'fixture includes an invalid adjacent swap');
});

test('horizontal four creates a row special at the moved puppy', () => {
  const game = emptyFixture();
  [0, 0, 1, 0, 2, 3, 4, 5].forEach((breed, c) => setBreed(game, 3, c, breed));
  setBreed(game, 2, 2, 0);
  const result = game.swap({ r: 2, c: 2 }, { r: 3, c: 2 });
  assert(result.valid);
  assert.equal(firstClear(result).snapshot.board[3][2]?.special, 'row');
  validateSettled(game.snapshot());
});

test('vertical four creates a column special', () => {
  const game = emptyFixture();
  [0, 0, 1, 0, 2, 3, 4, 5].forEach((breed, r) => setBreed(game, r, 3, breed));
  setBreed(game, 2, 2, 0);
  const result = game.swap({ r: 2, c: 2 }, { r: 2, c: 3 });
  assert(result.valid);
  assert.equal(firstClear(result).snapshot.board[2][3]?.special, 'column');
});

test('a five-puppy line creates a rainbow and L shape creates a bomb', () => {
  const rainbow = emptyFixture();
  [0, 0, 1, 0, 0, 3, 4, 5].forEach((breed, c) => setBreed(rainbow, 3, c, breed));
  setBreed(rainbow, 2, 2, 0);
  const rainbowResult = rainbow.swap({ r: 2, c: 2 }, { r: 3, c: 2 });
  const tile = firstClear(rainbowResult).snapshot.board[3][2];
  assert.equal(tile?.special, 'rainbow');
  assert.equal(tile?.breed, -1);

  const bomb = emptyFixture();
  setBreed(bomb, 3, 0, 0);
  setBreed(bomb, 3, 1, 0);
  setBreed(bomb, 3, 2, 1);
  setBreed(bomb, 4, 2, 0);
  setBreed(bomb, 5, 2, 0);
  setBreed(bomb, 2, 2, 0);
  const bombResult = bomb.swap({ r: 2, c: 2 }, { r: 3, c: 2 });
  assert.equal(firstClear(bombResult).snapshot.board[3][2]?.special, 'bomb');
});

test('rainbow swap clears every puppy of its partner breed', () => {
  const game = emptyFixture();
  const board = (game as any).board as Board;
  board[0][0]!.special = 'rainbow';
  board[0][0]!.breed = -1;
  const partner = board[0][1]!.breed;
  const wanted = new Set(board.flatMap((row, r) => row.flatMap((tile, c) => tile?.breed === partner ? [r * 8 + c] : [])));
  const result = game.swap({ r: 0, c: 0 }, { r: 0, c: 1 });
  assert(result.valid);
  const removed = new Set(firstClear(result).cleared.map(({ r, c }) => r * 8 + c));
  // The partner moves to 0,0; the rainbow moves to 0,1. Both must be cleared.
  wanted.add(0);
  for (const index of wanted) assert(removed.has(index));
  validateSettled(game.snapshot());
});

test('two rainbows clear all 64 cells and stripes combine into a cross', () => {
  const rainbow = emptyFixture();
  for (const c of [0, 1]) Object.assign((rainbow as any).board[0][c], { special: 'rainbow', breed: -1 });
  assert.equal(firstClear(rainbow.swap({ r: 0, c: 0 }, { r: 0, c: 1 })).cleared.length, 64);

  const stripe = emptyFixture();
  (stripe as any).board[3][3].special = 'row';
  (stripe as any).board[3][4].special = 'column';
  const cleared = firstClear(stripe.swap({ r: 3, c: 3 }, { r: 3, c: 4 })).cleared;
  for (let i = 0; i < 8; i++) {
    assert(cleared.some(cell => cell.r === 3 && cell.c === i));
    assert(cleared.some(cell => cell.r === i && cell.c === 4));
  }
});

test('bomb combinations expand to a 5x5 area or three crossing lines', () => {
  const bombs = emptyFixture();
  (bombs as any).board[3][3].special = 'bomb';
  (bombs as any).board[3][4].special = 'bomb';
  const bombCells = firstClear(bombs.swap({ r: 3, c: 3 }, { r: 3, c: 4 })).cleared;
  assert(bombCells.length >= 25);
  for (let r = 1; r <= 5; r++) for (let c = 2; c <= 6; c++) assert(bombCells.some(cell => cell.r === r && cell.c === c));

  const mixed = emptyFixture();
  (mixed as any).board[3][3].special = 'bomb';
  (mixed as any).board[3][4].special = 'row';
  const mixedCells = firstClear(mixed.swap({ r: 3, c: 3 }, { r: 3, c: 4 })).cleared;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (Math.abs(r - 3) <= 1 || Math.abs(c - 4) <= 1) assert(mixedCells.some(cell => cell.r === r && cell.c === c));
  }
});

test('grass is fixed to cells and double layers require two clears', () => {
  const game = emptyFixture();
  const state = game as any;
  state.grass[7][7] = 2;
  state.objectives = [{ kind: 'grass', target: 2, current: 0 }];
  const moves = game.snapshot().moves;
  assert(game.useBooster('paw', { r: 7, c: 7 }).valid);
  assert.equal(game.snapshot().grass[7][7], 1);
  assert.equal(game.snapshot().objectives[0].current, 1);
  assert.equal(game.snapshot().moves, moves);
  assert(game.useBooster('paw', { r: 7, c: 7 }).valid);
  assert.equal(game.snapshot().grass[7][7], 0);
  assert.equal(game.snapshot().won, true);
});

test('shuffle retains score, objectives, grass and moves while yielding a playable board', () => {
  const game = new PuppyGame(58, 910);
  const before = game.snapshot();
  const result = game.useBooster('shuffle');
  assert(result.valid);
  const after = game.snapshot();
  assert.equal(after.moves, before.moves);
  assert.equal(after.score, before.score);
  assert.deepEqual(after.objectives, before.objectives);
  assert.deepEqual(after.grass, before.grass);
  assert.deepEqual(new Set(after.board.flat().map(tile => tile!.id)), new Set(before.board.flat().map(tile => tile!.id)));
  assert(game.hint());
  validateSettled(after);
});

test('paw and rainbow boosters consume no moves; missing targets have no effect', () => {
  const game = new PuppyGame(1, 456);
  const before = game.snapshot();
  assert.equal(game.useBooster('paw').valid, false);
  assert.deepEqual(game.snapshot(), before);
  assert(game.useBooster('paw', { r: 0, c: 0 }).valid);
  assert.equal(game.snapshot().moves, before.moves);
  assert(game.useBooster('rainbow', { r: 1, c: 1 }).valid);
  assert.equal(game.snapshot().moves, before.moves);
  validateSettled(game.snapshot());
});

test('last move can win; otherwise exhaustion loses and finished games cannot change', () => {
  const winning = new PuppyGame(1, 404);
  (winning as any).moves = 1;
  (winning as any).objectives = [{ kind: 'score', target: 180, current: 0 }];
  const hint = winning.hint()!;
  winning.swap(hint.a, hint.b);
  assert.equal(winning.snapshot().won, true);
  assert.equal(winning.snapshot().lost, false);
  const won = winning.snapshot();
  assert.equal(winning.swap(hint.a, hint.b).valid, false);
  assert.equal(winning.useBooster('shuffle').valid, false);
  assert.equal(winning.hint(), null);
  assert.deepEqual(winning.snapshot(), won);

  const losing = new PuppyGame(1, 404);
  (losing as any).moves = 1;
  (losing as any).objectives = [{ kind: 'score', target: 999999, current: 0 }];
  const last = losing.hint()!;
  losing.swap(last.a, last.b);
  assert.equal(losing.snapshot().lost, true);
  assert.equal(losing.snapshot().won, false);
  assert.equal(losing.hint(), null);
});

test('hint inspection never mutates the board', () => {
  const game = new PuppyGame(71, 33);
  const snapshot = game.snapshot();
  const board = snapshot.board;
  const before = structuredClone(board);
  assert(findLegalMove(board));
  assert.deepEqual(board, before);
});
