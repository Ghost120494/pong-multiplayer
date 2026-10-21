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

test('legacy progress, inventory, preferences and pending requests survive 100-to-180 padding', () => {
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

test('expanded profiles round-trip new-region runs and known unique discovery claims', () => {
  const profile = emptySave();
  profile.unlocked = 146;
  profile.run = playedRun(146, 2);
  profile.coins = 730;
  profile.boosters = { paw: 4, shuffle: 2, rainbow: 1 };
  profile.discoveries = DISCOVERIES.filter(discovery => discovery.level <= 146).map(discovery => discovery.id);
  const restored = validateSave(JSON.parse(JSON.stringify(profile)))!;
  assert(restored);
  assert.deepEqual(restored, profile);
  assert.deepEqual(replay(restored.run!), replay(profile.run));
  assert(replay(restored.run!).board.flat().some(tile => tile && tile.breed >= 6), 'new-region history includes the expanded puppy roster');
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
