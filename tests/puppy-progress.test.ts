import test from 'node:test';
import assert from 'node:assert/strict';
import { ProgressStore, type ProgressMirror, type ProgressStorage, type ProgressStatus } from '../src/puppy/progress-storage';

type Progress = { version: 1; level: number; moves: number; actions: string[]; savedAt?: number };
const initial = (): Progress => ({ version: 1, level: 3, moves: 24, actions: [] });
const validate = (value: unknown): Progress | null => {
  const data = value as Progress | null;
  if (!data || data.version !== 1 || !Number.isInteger(data.level) || !Number.isInteger(data.moves) || !Array.isArray(data.actions)) return null;
  return { version: 1, level: data.level, moves: data.moves, actions: [...data.actions] };
};
class Local implements ProgressStorage {
  values = new Map<string, string>();
  fail = new Set<string>();
  blocked = false;
  getItem(key: string) { if (this.blocked) throw new Error('Storage blocked'); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.blocked || this.fail.has(key)) throw new Error('Quota exceeded'); this.values.set(key, value); }
}
class Mirror implements ProgressMirror {
  data: unknown | null = null;
  archived: unknown | null = null;
  writes: unknown[] = [];
  fail = false;
  async read(key: string) { if (this.fail) throw new Error('IndexedDB unavailable'); return structuredClone(key.endsWith(':recovery') ? this.archived : this.data); }
  async write(key: string, data: unknown) {
    if (this.fail) throw new Error('Transaction aborted');
    this.writes.push(structuredClone(data));
    if (key.endsWith(':recovery')) this.archived = structuredClone(data); else this.data = structuredClone(data);
  }
}

test('legacy raw checkpoints load without resetting board history and keep the primary key compatible', async () => {
  const local = new Local();
  local.values.set('game', JSON.stringify({ ...initial(), actions: ['swap-a'], moves: 23 }));
  const store = new ProgressStore('game', validate, { storage: local, mirror: null, now: () => 100 });
  const restored = await store.restore();
  assert.deepEqual(restored, { ...initial(), actions: ['swap-a'], moves: 23, savedAt: 0 });
  assert(store.save(restored!));
  const raw = JSON.parse(local.values.get('game')!);
  assert.equal(raw.version, 1);
  assert.deepEqual(raw.actions, ['swap-a']);
  assert.equal(raw.savedAt, 100);
  assert.deepEqual(JSON.parse(local.values.get('game:backup')!), raw);
});

test('a corrupted primary recovers the newest valid backup and repairs it after validation', async () => {
  const local = new Local();
  local.values.set('game', '{broken');
  local.values.set('game:backup', JSON.stringify({ ...initial(), level: 12, moves: 7, savedAt: 500 }));
  const store = new ProgressStore('game', validate, { storage: local, mirror: null });
  assert.equal(store.read()!.level, 12);
  assert.equal(local.values.get('game'), '{broken', 'a read does not overwrite evidence before recovery');
  const recovered = await store.restore();
  assert.equal(recovered!.moves, 7);
  assert.equal(JSON.parse(local.values.get('game')!).level, 12);
});

test('an invalid save is not accepted just because its timestamp is newer', async () => {
  const local = new Local(); const mirror = new Mirror();
  local.values.set('game', JSON.stringify({ ...initial(), savedAt: 100 }));
  local.values.set('game:backup', JSON.stringify({ version: 99, savedAt: 900 }));
  mirror.data = { version: 1, level: 'broken', moves: 2, actions: [], savedAt: 1000 };
  const store = new ProgressStore('game', validate, { storage: local, mirror });
  assert.equal((await store.restore())!.level, 3);
  assert.equal((await store.restore())!.savedAt, 100);
});

test('equal timestamps prefer the primary checkpoint over backup and IndexedDB', async () => {
  const local = new Local(); const mirror = new Mirror();
  local.values.set('game', JSON.stringify({ ...initial(), moves: 21, savedAt: 100 }));
  local.values.set('game:backup', JSON.stringify({ ...initial(), moves: 20, savedAt: 100 }));
  mirror.data = { ...initial(), moves: 19, savedAt: 100 };
  const store = new ProgressStore('game', validate, { storage: local, mirror });
  assert.equal((await store.restore())!.moves, 21);
});

test('newer IndexedDB progress wins over stale primary and backup after local writes fail', async () => {
  const local = new Local(); const mirror = new Mirror();
  const store = new ProgressStore('game', validate, { storage: local, mirror, now: () => 100 });
  const progress = initial();
  assert(store.save(progress)); await store.flush();
  local.blocked = true;
  progress.moves = 23; progress.actions.push('real-swap');
  assert.equal(store.save(progress), false, 'a pending asynchronous mirror is not reported as a synchronous local save');
  assert.equal(store.status.saved, false);
  assert.equal(await store.flush(), true);
  assert.equal(store.status.source, 'indexeddb');
  local.blocked = false;
  const reloaded = new ProgressStore('game', validate, { storage: local, mirror });
  const restored = await reloaded.restore();
  assert.deepEqual(restored!.actions, ['real-swap']);
  assert.equal(restored!.moves, 23);
  assert.equal(JSON.parse(local.values.get('game')!).moves, 23);
});

test('the backup still saves a current move when only the primary key cannot be written', async () => {
  const local = new Local(); local.fail.add('game');
  const store = new ProgressStore('game', validate, { storage: local, mirror: null, now: () => 500 });
  const progress = { ...initial(), moves: 11, actions: ['last-move'] };
  assert(store.save(progress));
  assert.equal(store.status.saved, true);
  assert.equal(new ProgressStore('game', validate, { storage: local, mirror: null }).read()!.moves, 11);
});

test('queued mirrors capture immutable moves in order, without older saves claiming the latest move is durable', async () => {
  const local = new Local(); local.blocked = true;
  const writes: { data: Progress; complete: () => void }[] = [];
  const mirror: ProgressMirror = {
    read: async () => null,
    write: async (_key, data) => new Promise<void>(resolve => { writes.push({ data: structuredClone(data) as Progress, complete: resolve }); }),
  };
  const statuses: ProgressStatus[] = [];
  const store = new ProgressStore('game', validate, { storage: local, mirror, now: () => 1, onStatus: value => statuses.push(value) });
  const progress = initial();
  store.save(progress);
  progress.moves = 23; progress.actions.push('swap'); store.save(progress);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 1, 'second transaction waits for the first');
  assert.equal(writes[0].data.moves, 24, 'queued data is a snapshot, not the live mutable profile');
  writes[0].complete(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 2);
  assert.equal(store.status.saved, false, 'committing move zero cannot claim move one is saved');
  assert.equal(writes[1].data.moves, 23);
  writes[1].complete();
  assert.equal(await store.flush(), true);
  assert(statuses.some(status => !status.saved));
  assert.equal(store.status.savedAt, 2, 'timestamps remain monotonic even within one clock tick');
});

test('restore and flush are bounded when IndexedDB is blocked', async () => {
  const local = new Local();
  local.values.set('game', JSON.stringify({ ...initial(), moves: 12, savedAt: 50 }));
  let writes = 0;
  const mirror: ProgressMirror = {
    read: () => new Promise(() => {}),
    write: () => { writes++; return new Promise(() => {}); },
  };
  const store = new ProgressStore('game', validate, { storage: local, mirror, timeoutMs: 25, now: () => 100 });
  assert.equal((await store.restore())!.moves, 12);
  assert.equal(writes, 0, 'a timed-out mirror read must not replace potentially newer data');
  local.blocked = true;
  store.save(initial());
  assert.equal(await store.flush(), false);
});

test('a delayed restore never replaces new moves made while it was waiting', async () => {
  const local = new Local();
  let release: (value: unknown) => void;
  let reads = 0;
  const mirror: ProgressMirror = { read: () => ++reads === 1 ? new Promise(resolve => { release = resolve; }) : Promise.resolve(null), write: async () => {} };
  const store = new ProgressStore('game', validate, { storage: local, mirror, now: () => 100 });
  const restoration = store.restore();
  const progress = { ...initial(), moves: 22, actions: ['new-move'] };
  store.save(progress);
  release!({ ...initial(), level: 50, savedAt: 9999 });
  assert.deepEqual((await restoration)!.actions, ['new-move']);
  assert.equal(store.read()!.moves, 22);
});

test('all storage failures remain honest and do not discard the in-memory game', async () => {
  const local = new Local(); local.blocked = true;
  const mirror = new Mirror(); mirror.fail = true;
  const store = new ProgressStore('game', validate, { storage: local, mirror, now: () => 100 });
  const progress = { ...initial(), moves: 8, actions: ['important-move'] };
  assert.equal(store.save(progress), false);
  assert.equal(await store.flush(), false);
  assert.deepEqual(store.read()!.actions, ['important-move']);
  assert.deepEqual(store.status, { saved: false, savedAt: 100, source: null });
});

test('a failed initial read preserves an unread earlier adventure before saving a fresh game', async () => {
  const local = new Local(); const mirror = new Mirror();
  const earlier = { ...initial(), level: 42, moves: 8, savedAt: 100 };
  mirror.data = earlier;
  const read = mirror.read.bind(mirror);
  let first = true;
  mirror.read = async key => { if (first) { first = false; throw new Error('Temporary lock'); } return read(key); };
  const offered: unknown[] = [];
  const store = new ProgressStore('game', validate, { storage: local, mirror, now: () => 200, onRecovery: data => offered.push(data) });
  assert.equal(await store.restore(), null);
  assert.equal(JSON.parse(local.values.get('game:mirror-recovery-pending')!).pending, true);
  store.save({ ...initial(), level: 1 }); await store.flush();
  assert.equal((mirror.data as Progress).level, 1);
  assert.deepEqual(await store.recovery(), earlier);
  assert.deepEqual(offered, [earlier]);
  assert.equal(JSON.parse(local.values.get('game:recovery')!).progress.level, 42);
  assert.equal(local.values.get('game:mirror-recovery-pending'), 'null');
});

test('an archive write failure leaves the original mirror untouched and recovery marker survives reload', async () => {
  const local = new Local(); const mirror = new Mirror();
  const earlier = { ...initial(), level: 42, savedAt: 100 };
  mirror.data = earlier;
  let failRead = true, failArchive = true;
  const read = mirror.read.bind(mirror); const write = mirror.write.bind(mirror);
  mirror.read = async key => { if (failRead) { failRead = false; throw new Error('Temporary lock'); } return read(key); };
  mirror.write = async (key, data) => { if (key.endsWith(':recovery') && failArchive) throw new Error('Archive transaction failed'); await write(key, data); };
  const store = new ProgressStore('game', validate, { storage: local, mirror, now: () => 200 });
  assert.equal(await store.restore(), null);
  store.save({ ...initial(), level: 1 });
  assert.equal(await store.flush(), true, 'fresh free play still saves locally');
  assert.deepEqual(mirror.data, earlier, 'never overwrite an unread adventure without a committed archive');
  assert.equal(JSON.parse(local.values.get('game:mirror-recovery-pending')!).pending, true);
  assert.equal(await store.recovery(), null);
  failArchive = false;
  const next = new ProgressStore('game', validate, { storage: local, mirror });
  assert.equal((await next.restore())!.level, 1, 'continue the new local adventure');
  await next.flush();
  assert.deepEqual(await next.recovery(), earlier, 'the preserved old adventure is available for explicit review');
  assert.equal((mirror.data as Progress).level, 1);
});

test('a marker-clear failure cannot overwrite the already archived earlier adventure on reload', async () => {
  const local = new Local(); const mirror = new Mirror();
  const earlier = { ...initial(), level: 42, savedAt: 100 };
  mirror.data = earlier;
  const read = mirror.read.bind(mirror); const setItem = local.setItem.bind(local);
  let first = true;
  mirror.read = async key => { if (first) { first = false; throw new Error('Temporary lock'); } return read(key); };
  local.setItem = (key, value) => { if (key.endsWith(':mirror-recovery-pending') && value === 'null') throw new Error('Marker cannot clear'); setItem(key, value); };
  const store = new ProgressStore('game', validate, { storage: local, mirror, now: () => 200 });
  await store.restore(); store.save({ ...initial(), level: 1 }); await store.flush();
  const next = new ProgressStore('game', validate, { storage: local, mirror, now: () => 300 });
  const current = (await next.restore())!;
  current.moves = 23; current.actions.push('new-adventure-move'); next.save(current); await next.flush();
  assert.equal((mirror.data as Progress).moves, 23);
  assert.deepEqual(await next.recovery(), earlier, 'stale uncertainty marker recognizes the original archive by ID');
});

test('recovery chooses the newest valid committed local or IndexedDB archive and is bounded', async () => {
  const local = new Local(); const mirror = new Mirror();
  local.values.set('game:recovery', JSON.stringify({ format: 'puppy-pals-recovery', id: 'local', progress: { ...initial(), level: 9, savedAt: 500 }, archivedAt: 900 }));
  mirror.archived = { format: 'puppy-pals-recovery', id: 'indexeddb', progress: { ...initial(), level: 42, savedAt: 600 }, archivedAt: 800 };
  const store = new ProgressStore('game', validate, { storage: local, mirror, timeoutMs: 25 });
  assert.equal((await store.recovery())!.level, 42);
  mirror.archived = { format: 'puppy-pals-recovery', id: 'invalid', progress: { version: 2, savedAt: 1000 }, archivedAt: 1000 };
  assert.equal((await store.recovery())!.level, 9);
  mirror.read = () => new Promise(() => {});
  assert.equal((await store.recovery())!.level, 9, 'blocked IndexedDB still allows a local recovery copy');
});
