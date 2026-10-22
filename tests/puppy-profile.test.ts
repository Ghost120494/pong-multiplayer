import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PuppyGame } from '../src/puppy/engine';
import { LEVEL_COUNT } from '../src/puppy/levels';
import { DISCOVERIES } from '../src/puppy/progression';
import { emptySave, validateSave, type Action, type Run } from '../src/puppy/profile';

function legacy(overrides: Record<string, unknown> = {}): any {
  const profile: any = emptySave();
  profile.stars = profile.stars.slice(0, 100);
  profile.best = profile.best.slice(0, 100);
  profile.boosters = { paw: 2, shuffle: 2, rainbow: 1 };
  delete profile.discoveries;
  return { ...profile, ...overrides };
}

function discoveryCampaign(overrides: Record<string, unknown> = {}): any {
  return { ...emptySave(), stars: Array(180).fill(0), best: Array(180).fill(0), ...overrides };
}

function playedRun(level: number, ruleset: 1 | 2): Run {
  const game = new PuppyGame(level, 12345, ruleset);
  const actions: Action[] = [];
  for (let i = 0; i < 3 && !game.snapshot().won && !game.snapshot().lost; i++) {
    const move = game.hint()!;
    assert(game.swap(move.a, move.b).valid);
    actions.push({ kind: 'swap', a: move.a, b: move.b });
  }
  return { level, seed: 12345, actions, ruleset, attemptId: null, mode: null, resultHandled: false };
}

function replay(run: Run) {
  const game = new PuppyGame(run.level, run.seed, run.ruleset ?? 1);
  for (const item of run.actions) assert((item.kind === 'swap' ? game.swap(item.a, item.b) : game.useBooster(item.kind, item.target)).valid);
  return game.snapshot();
}

test('new profiles start with the expanded campaign and earn boosters through discovery', () => {
  const profile = emptySave();
  assert.equal(profile.stars.length, LEVEL_COUNT);
  assert.equal(profile.best.length, LEVEL_COUNT);
  assert(profile.stars.every(stars => stars === 0));
  assert.deepEqual(profile.boosters, { paw: 0, shuffle: 0, rainbow: 0 });
  assert.deepEqual(profile.discoveries, []);
  profile.stars[0] = 3;
  assert.equal(emptySave().stars[0], 0, 'new games do not share mutable progress arrays');
  const reached = { ...emptySave(), unlocked: 14 };
  assert.deepEqual(validateSave(reached)!.boosters, { paw: 0, shuffle: 0, rainbow: 0 }, 'validation never grants or duplicates discovery inventory');
  assert.deepEqual(validateSave(reached)!.discoveries, [], 'the application can claim explicitly unclaimed discoveries');
});

test('a legacy action history replays the original shipped board after campaign migration', () => {
  // Captured from the shipped engine before the expanded campaign was applied.
  const actions: Action[] = [
    { kind: 'paw', target: { r: 0, c: 0 } },
    { kind: 'shuffle' },
    { kind: 'rainbow', target: { r: 2, c: 2 } },
    { kind: 'swap', a: { r: 0, c: 1 }, b: { r: 0, c: 2 } },
    { kind: 'swap', a: { r: 0, c: 3 }, b: { r: 0, c: 4 } },
    { kind: 'swap', a: { r: 0, c: 3 }, b: { r: 1, c: 3 } },
    { kind: 'swap', a: { r: 1, c: 1 }, b: { r: 1, c: 2 } },
    { kind: 'swap', a: { r: 0, c: 0 }, b: { r: 1, c: 0 } },
  ];
  const source = legacy({ unlocked: 37, run: { level: 37, seed: 12345, actions, attemptId: 'reserved-legacy', mode: 'online', resultHandled: false, reservationId: 'reservation-legacy' } });
  const original = JSON.stringify(source);
  const migrated = validateSave(source)!;
  assert(migrated);
  assert.equal(migrated.run!.ruleset, 1);
  assert.deepEqual(migrated.run!.actions, actions);
  assert.equal(migrated.run!.attemptId, 'reserved-legacy');
  assert.equal(migrated.run!.reservationId, 'reservation-legacy');
  const snapshot = replay(migrated.run!);
  assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), '0e115d48735ff84281768eb628bfe0e5e47d41e9803fdd8db667078474f35dce');
  assert.equal(snapshot.moves, 23);
  assert.equal(snapshot.score, 3360);
  assert.equal(JSON.stringify(source), original, 'migration does not mutate the stored checkpoint');
  migrated.run!.actions[3] = { kind: 'shuffle' };
  assert.equal(JSON.stringify(source), original, 'the sanitized history shares no mutable actions with its input');
});

test('legacy progress, inventory, preferences and pending requests survive 100-to-500 padding', () => {
  const source = legacy({
    unlocked: 60, coins: 456, sound: true, dailyAt: 1234, savedAt: 4321,
    boosters: { paw: 7, shuffle: 4, rainbow: 3 },
    offlineWallet: { lives: 2, nextLifeAt: 9876 },
    pendingFinishes: [{ attemptId: 'waiting', outcome: 'won' }], pendingPayment: 'pending-order',
  });
  source.stars[3] = 3; source.stars[58] = 2;
  source.best[3] = 4200; source.best[58] = 16400;
  const migrated = validateSave(source)!;
  assert(migrated);
  assert.equal(migrated.stars.length, LEVEL_COUNT);
  assert.deepEqual(migrated.stars.slice(0, 100), source.stars);
  assert.deepEqual(migrated.best.slice(0, 100), source.best);
  assert(migrated.stars.slice(100).every(stars => stars === 0));
  assert(migrated.best.slice(100).every(score => score === 0));
  for (const key of ['unlocked', 'coins', 'sound', 'dailyAt', 'savedAt', 'boosters', 'offlineWallet', 'pendingFinishes', 'pendingPayment'] as const) assert.deepEqual(migrated[key], source[key]);
  assert.deepEqual(migrated.discoveries, DISCOVERIES.filter(discovery => discovery.level <= 60).map(discovery => discovery.id), 'returning players do not receive duplicate starter gifts or catch-up introductions');
});

test('a completed legacy finale unlocks level101 while an unfinished finale remains level100', () => {
  const unfinished = legacy({ unlocked: 100 });
  assert.equal(validateSave(unfinished)!.unlocked, 100);
  unfinished.stars[99] = 1;
  unfinished.best[99] = 8000;
  const complete = validateSave(unfinished)!;
  assert.equal(complete.unlocked, 101);
  assert.equal(complete.stars[99], 1);
  assert.equal(complete.best[99], 8000);
  assert.equal(complete.stars[100], 0);
  assert.equal(validateSave(legacy({ unlocked: 101 })), null, 'an old-length save cannot claim levels beyond its original range');
});

test('a shipped 180-level save preserves its exact active board and all earned state while expanding to 500', () => {
  // Captured independently from the shipped 180-level engine before expansion.
  const actions: Action[] = [
    { kind: 'paw', target: { r: 0, c: 0 } },
    { kind: 'shuffle' },
    { kind: 'rainbow', target: { r: 2, c: 2 } },
    { kind: 'swap', a: { r: 0, c: 1 }, b: { r: 0, c: 2 } },
    { kind: 'swap', a: { r: 0, c: 3 }, b: { r: 0, c: 4 } },
    { kind: 'swap', a: { r: 0, c: 3 }, b: { r: 1, c: 3 } },
    { kind: 'swap', a: { r: 1, c: 1 }, b: { r: 1, c: 2 } },
    { kind: 'swap', a: { r: 0, c: 0 }, b: { r: 1, c: 0 } },
  ];
  const source = discoveryCampaign({
    unlocked: 180, coins: 7654, sound: true, dailyAt: 1234, savedAt: 4321,
    boosters: { paw: 7, shuffle: 4, rainbow: 3 },
    discoveries: DISCOVERIES.filter(discovery => discovery.level <= 180).map(discovery => discovery.id),
    offlineWallet: { lives: 2, nextLifeAt: 9876 },
    pendingFinishes: [{ attemptId: 'waiting-old-result', outcome: 'won' }], pendingPayment: 'pending-order',
    run: { level: 180, seed: 12345, actions, ruleset: 2, attemptId: 'active-180', mode: 'online', resultHandled: false, reservationId: 'active-reservation' },
  });
  source.stars[0] = 3; source.stars[178] = 2;
  source.best[0] = 4200; source.best[178] = 16400;
  const original = JSON.stringify(source);
  const migrated = validateSave(source)!;
  assert(migrated);
  assert.equal(migrated.stars.length, 500);
  assert.equal(migrated.best.length, 500);
  assert.deepEqual(migrated.stars.slice(0, 180), source.stars);
  assert.deepEqual(migrated.best.slice(0, 180), source.best);
  assert(migrated.stars.slice(180).every(stars => stars === 0));
  assert(migrated.best.slice(180).every(score => score === 0));
  for (const key of ['unlocked', 'coins', 'sound', 'dailyAt', 'savedAt', 'boosters', 'discoveries', 'offlineWallet', 'pendingFinishes', 'pendingPayment', 'run'] as const) assert.deepEqual(migrated[key], source[key]);
  const snapshot = replay(migrated.run!);
  assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), '444340cda522b5836d6685ac10aa3df0f27045d1e7b26bad5d6436761998ba18');
  assert.equal(snapshot.moves, 27);
  assert.equal(snapshot.score, 3360);
  assert.equal(snapshot.won, false);
  assert.equal(snapshot.lost, false);
  assert.equal(JSON.stringify(source), original, 'migration leaves the old stored checkpoint untouched');
  const copy = validateSave(JSON.parse(JSON.stringify(migrated)))!;
  assert.deepEqual(copy, migrated, 'an already migrated save is idempotent');
});

test('a completed shipped level180 opens level181 without replaying rewards or losing its finished board', () => {
  const coordinates = [
    [0, 3], [0, 3], [0, 6], [0, 6], [1, 2], [1, 2], [1, 5], [1, 5],
    [2, 0], [2, 0], [2, 1], [2, 1], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
    [3, 0], [3, 0], [3, 1], [3, 1], [3, 3], [3, 3], [3, 4], [3, 6], [3, 6],
    [4, 1], [4, 1], [4, 2], [4, 3], [5, 0], [5, 0], [5, 5], [5, 5],
    [6, 0], [6, 0], [6, 2], [6, 2], [6, 5], [6, 5], [7, 2], [7, 2], [7, 3], [7, 3], [7, 5], [7, 5], [7, 6], [1, 2],
  ];
  const actions: Action[] = coordinates.map(([r, c]) => ({ kind: 'paw', target: { r, c } }));
  const source = discoveryCampaign({
    unlocked: 180, coins: 4321, boosters: { paw: 4, shuffle: 2, rainbow: 1 },
    discoveries: DISCOVERIES.filter(discovery => discovery.level <= 180).map(discovery => discovery.id),
    run: { level: 180, seed: 0, actions, ruleset: 2, attemptId: null, mode: null, resultHandled: true },
  });
  assert.equal(validateSave(discoveryCampaign({ unlocked: 180 }))!.unlocked, 180, 'an unfinished finale is still the current level');
  source.stars[179] = 3; source.best[179] = 12480;
  const migrated = validateSave(source)!;
  assert(migrated);
  assert.equal(migrated.unlocked, 181);
  assert.equal(migrated.stars[179], 3);
  assert.equal(migrated.best[179], 12480);
  assert.equal(migrated.stars[180], 0);
  assert.equal(migrated.coins, 4321);
  assert.deepEqual(migrated.boosters, source.boosters);
  assert.deepEqual(migrated.discoveries, source.discoveries);
  assert.equal(migrated.run!.resultHandled, true);
  const snapshot = replay(migrated.run!);
  assert(snapshot.won);
  assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), 'f8ebc53b19dd1041078b31ce82f848cde56a865867d1366ead2b734469abd7fb');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(migrated))), migrated, 'reload does not advance or reward the old finale again');
  assert.equal(validateSave(discoveryCampaign({ unlocked: 181 })), null, 'a 180-entry checkpoint cannot claim unlocked progress past its shipped limit');
});

test('500-level profiles round-trip new-region runs and known unique discovery claims', () => {
  const profile = emptySave();
  profile.unlocked = 410;
  profile.run = playedRun(410, 2);
  profile.coins = 730;
  profile.boosters = { paw: 4, shuffle: 2, rainbow: 1 };
  profile.discoveries = DISCOVERIES.filter(discovery => discovery.level <= 410).map(discovery => discovery.id);
  const restored = validateSave(JSON.parse(JSON.stringify(profile)))!;
  assert(restored);
  assert.deepEqual(restored, profile);
  assert.deepEqual(replay(restored.run!), replay(profile.run));
  assert(replay(restored.run!).board.flat().some(tile => tile && tile.breed >= 12), 'new-region history includes a newly introduced puppy');
  profile.unlocked = 500;
  profile.run = playedRun(500, 2);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(profile))), profile, 'the final campaign level also round-trips with its history');
  const one = DISCOVERIES[0].id;
  profile.discoveries = [one, one, 'unknown-future-claim'];
  assert.deepEqual(validateSave(profile)!.discoveries, [one]);
});

test('unrecognized rules and invalid recorded moves reject the checkpoint for backup recovery', () => {
  const profile = emptySave();
  profile.unlocked = 180;
  profile.run = playedRun(37, 2);
  for (const ruleset of [0, 3, '2', null]) assert.equal(validateSave({ ...profile, run: { ...profile.run, ruleset } }), null);
  assert.equal(validateSave({ ...profile, run: { ...profile.run, level: 101, ruleset: 1, actions: [] } }), null, 'legacy rules cannot address a new campaign level');
  assert.equal(validateSave({ ...profile, run: { ...profile.run, actions: [{ kind: 'swap', a: { r: 0, c: 0 }, b: { r: 0, c: 0 } }] } }), null);
  assert.equal(validateSave({ ...profile, run: { ...profile.run, actions: [{ kind: 'paw', target: { r: 8, c: 0 } }] } }), null);
  assert.equal(validateSave({ ...profile, run: { ...profile.run, actions: [{ kind: 'unlimited-lives' }] } }), null);
  assert.equal(validateSave({ ...profile, run: { ...profile.run, actions: Array(1001).fill({ kind: 'shuffle' }) } }), null);
});

test('malformed campaign arrays and non-finite timestamps cannot become durable progress metadata', () => {
  const profile = emptySave();
  assert.equal(validateSave({ ...profile, stars: Array(101).fill(0), best: Array(101).fill(0) }), null);
  assert.equal(validateSave({ ...profile, stars: Array(181).fill(0), best: Array(181).fill(0) }), null);
  assert.equal(validateSave({ ...profile, stars: Array(499).fill(0), best: Array(499).fill(0) }), null);
  assert.equal(validateSave({ ...profile, stars: Array(100).fill(0) }), null);
  assert.equal(validateSave({ ...profile, unlocked: LEVEL_COUNT + 1 }), null);
  assert.equal(validateSave({ ...profile, discoveries: 'all' }), null);
  const restored = validateSave({ ...profile, savedAt: Infinity, dailyAt: NaN, offlineWallet: { lives: 4, nextLifeAt: Infinity } })!;
  assert.equal(restored.savedAt, undefined);
  assert.equal(restored.dailyAt, 0);
  assert.equal(restored.offlineWallet.nextLifeAt, null);
});

test('unknown wallet, credential and action properties are excluded from sanitized profiles', () => {
  const profile: any = emptySave();
  profile.run = { ...playedRun(1, 2), paidAttempts: 999, credential: 'private', actions: [{ kind: 'shuffle', paidAttempts: 999 }] };
  profile.paidAttempts = 999;
  profile.wallet = { secret: 'private' };
  profile.pendingFinishes = [{ attemptId: 'current', outcome: 'won', private: 'extra' }, null, { attemptId: 'bad', outcome: 'invented' }];
  const restored: any = validateSave(profile);
  assert(restored);
  assert.equal(restored.paidAttempts, undefined);
  assert.equal(restored.wallet, undefined);
  assert.equal(restored.run.paidAttempts, undefined);
  assert.equal(restored.run.credential, undefined);
  assert.deepEqual(restored.run.actions, [{ kind: 'shuffle' }]);
  assert.deepEqual(restored.pendingFinishes, [{ attemptId: 'current', outcome: 'won' }]);
});
