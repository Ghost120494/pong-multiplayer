/** Device-only checkpoints. Wallets and payment receipts remain server-owned. */
export type ProgressStatus = { saved: boolean; savedAt: number | null; source: 'local' | 'indexeddb' | null };
export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type ProgressMirror = {
  read(key: string): Promise<unknown | null>;
  write(key: string, data: unknown): Promise<void>;
};
export type ProgressStoreOptions = {
  storage?: ProgressStorage | null;
  mirror?: ProgressMirror | null;
  now?: () => number;
  timeoutMs?: number;
  onStatus?: (status: ProgressStatus) => void;
  onRecovery?: (data: unknown) => void;
};

type Checkpoint = { savedAt?: number };
type RecoveryRecord<T> = { format: 'puppy-pals-recovery'; id: string; progress: T; archivedAt: number };
type RecoveryMarker = { pending: true; id: string };
const timestamp = (data: Checkpoint | null) => data && Number.isFinite(data.savedAt) && data.savedAt! >= 0 ? Math.floor(data.savedAt!) : 0;
const copy = <T>(data: T): T => JSON.parse(JSON.stringify(data));

function bounded<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Device storage did not respond')), timeoutMs); }),
  ]).finally(() => clearTimeout(timer));
}

function browserStorage(): ProgressStorage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

/** IndexedDB commits resolve only after the complete transaction is durable. */
export function createIndexedDbMirror(timeoutMs = 2000): ProgressMirror | null {
  let factory: IDBFactory;
  try { factory = globalThis.indexedDB; if (!factory) return null; } catch { return null; }
  let connection: Promise<IDBDatabase> | undefined;
  function open(): Promise<IDBDatabase> {
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
      let settled = false;
      const request = factory.open('puppy-pals-progress', 1);
      const finish = (error?: Error, database?: IDBDatabase) => {
        if (settled) { database?.close(); return; }
        settled = true; clearTimeout(timer);
        if (error) reject(error); else resolve(database!);
      };
      const timer = setTimeout(() => finish(new Error('Device storage is busy')), timeoutMs);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves');
      };
      request.onerror = () => finish(request.error ?? new Error('Device storage is unavailable'));
      request.onblocked = () => finish(new Error('Another tab is updating device storage'));
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); connection = undefined; };
        finish(undefined, database);
      };
    });
    // A later save may retry storage that was temporarily blocked.
    connection.catch(() => { connection = undefined; });
    return connection;
  }
  async function transact(key: string, value?: unknown): Promise<unknown | null> {
    const database = await open();
    return new Promise((resolve, reject) => {
      const writing = value !== undefined;
      const transaction = database.transaction('saves', writing ? 'readwrite' : 'readonly');
      const store = transaction.objectStore('saves');
      let result: unknown | null = null;
      const timer = setTimeout(() => {
        try { transaction.abort(); } catch { /* Already completed. */ }
        reject(new Error('Device storage did not finish saving'));
      }, timeoutMs);
      transaction.oncomplete = () => { clearTimeout(timer); resolve(result); };
      transaction.onerror = transaction.onabort = () => { clearTimeout(timer); reject(transaction.error ?? new Error('Device storage could not save')); };
      const request = writing ? store.put(value, key) : store.get(key);
      if (!writing) request.onsuccess = () => { result = request.result ?? null; };
    });
  }
  return { read: key => transact(key), write: async (key, data) => { await transact(key, data); } };
}

/**
 * The primary key stays raw JSON for compatibility with existing version-1 saves.
 * A second raw checkpoint and an ordered IndexedDB mirror protect recent moves.
 */
export class ProgressStore<T extends Checkpoint> {
  readonly backupKey: string;
  readonly recoveryKey: string;
  readonly recoveryPendingKey: string;
  private readonly storage: ProgressStorage | null;
  private readonly mirror: ProgressMirror | null;
  private readonly clock: () => number;
  private readonly timeoutMs: number;
  private current: T | null = null;
  private revision = 0;
  private localSavedAt = -1;
  private mirrorSavedAt = -1;
  private mirrorTail: Promise<void> = Promise.resolve();
  private restoring: Promise<T | null> | null = null;
  private mirrorReadConfirmed = false;
  private pendingRecovery: RecoveryMarker | null = null;

  constructor(readonly key: string, private readonly validate: (value: unknown) => T | null, private readonly options: ProgressStoreOptions = {}) {
    this.backupKey = `${key}:backup`;
    this.recoveryKey = `${key}:recovery`;
    this.recoveryPendingKey = `${key}:mirror-recovery-pending`;
    this.timeoutMs = Math.max(20, options.timeoutMs ?? 2000);
    this.storage = options.storage === undefined ? browserStorage() : options.storage;
    this.mirror = options.mirror === undefined ? createIndexedDbMirror(this.timeoutMs) : options.mirror;
    this.clock = options.now ?? Date.now;
    try {
      const marker = JSON.parse(this.storage?.getItem(this.recoveryPendingKey) ?? 'null');
      if (marker?.pending === true && typeof marker.id === 'string') this.pendingRecovery = marker;
    } catch { /* Unavailable local storage does not stop read-before-write protection. */ }
  }

  get status(): ProgressStatus {
    if (!this.current) return { saved: false, savedAt: null, source: null };
    const at = timestamp(this.current);
    if (this.localSavedAt === at) return { saved: true, savedAt: at, source: 'local' };
    if (this.mirrorSavedAt === at) return { saved: true, savedAt: at, source: 'indexeddb' };
    return { saved: false, savedAt: at, source: null };
  }

  private report() {
    // A display callback must not interrupt checkpoint writes.
    try { this.options.onStatus?.(this.status); } catch { /* Saving is independent of UI rendering. */ }
  }

  private candidate(value: unknown): T | null {
    try {
      if (value === null || value === undefined) return null;
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      const valid = this.validate(copy(parsed));
      if (!valid) return null;
      // Retain timestamps even when a validator rebuilds a sanitized object.
      valid.savedAt = timestamp(parsed as Checkpoint);
      return copy(valid);
    } catch { return null; }
  }

  private recoveryRecord(value: unknown): RecoveryRecord<T> | null {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (parsed?.format !== 'puppy-pals-recovery' || typeof parsed.id !== 'string') return null;
      const progress = this.candidate(parsed.progress);
      if (!progress) return null;
      return { format: 'puppy-pals-recovery', id: parsed.id, progress, archivedAt: Number.isFinite(parsed.archivedAt) ? parsed.archivedAt : 0 };
    } catch { return null; }
  }

  private localRecovery(): RecoveryRecord<T> | null {
    try { return this.recoveryRecord(this.storage?.getItem(this.recoveryKey)); } catch { return null; }
  }

  private markUncertain() {
    this.pendingRecovery ||= { pending: true, id: `${this.clock()}-${Math.random().toString(36).slice(2)}` };
    // Retrying this small write after normal local saves helps quota/transient failures.
    try { this.storage?.setItem(this.recoveryPendingKey, JSON.stringify(this.pendingRecovery)); } catch { /* Best effort; the in-memory guard remains active. */ }
  }

  private clearUncertainty() {
    this.pendingRecovery = null;
    try { this.storage?.setItem(this.recoveryPendingKey, 'null'); } catch { /* Archive ID makes a stale marker safe on the next load. */ }
  }

  /** An earlier valid checkpoint, kept separate from the current adventure. */
  async recovery(): Promise<T | null> {
    let newest = this.localRecovery();
    if (this.mirror) {
      try {
        const archived = this.recoveryRecord(await bounded(this.mirror.read(this.recoveryKey), this.timeoutMs));
        if (archived && (!newest || timestamp(archived.progress) > timestamp(newest.progress))) newest = archived;
      } catch { /* A local recovery copy can still be offered without IndexedDB. */ }
    }
    return newest ? copy(newest.progress) : null;
  }

  read(): T | null {
    let newest: T | null = null;
    for (const key of [this.key, this.backupKey]) {
      let candidate: T | null = null;
      try { candidate = this.candidate(this.storage?.getItem(key)); } catch { /* Try the other checkpoint. */ }
      if (candidate && (!newest || timestamp(candidate) > timestamp(newest))) newest = candidate;
    }
    if (newest) this.localSavedAt = timestamp(newest);
    if (this.current && (!newest || timestamp(this.current) > timestamp(newest))) newest = this.current;
    if (newest) this.current = copy(newest);
    this.report();
    return newest ? copy(newest) : null;
  }

  restore(): Promise<T | null> {
    if (this.restoring) return this.restoring;
    this.restoring = this.restoreNewest().finally(() => { this.restoring = null; });
    return this.restoring;
  }

  private async restoreNewest(): Promise<T | null> {
    const revision = this.revision;
    const local = this.read();
    let mirrored: T | null = null;
    let mirrorReadSucceeded = false;
    if (this.mirror) {
      try {
        mirrored = this.candidate(await bounded(this.mirror.read(this.key), this.timeoutMs));
        mirrorReadSucceeded = true;
        this.mirrorReadConfirmed = true;
      } catch { this.markUncertain(); /* Preserve an unread older adventure before any future write. */ }
    }
    // Do not replace moves made while an asynchronous restore was pending.
    if (this.revision !== revision) { this.report(); return this.current ? copy(this.current) : null; }
    if (mirrored) this.mirrorSavedAt = timestamp(mirrored);
    const newest = mirrored && (!local || timestamp(mirrored) > timestamp(local)) ? mirrored : local;
    if (!newest) return null;
    this.current = copy(newest);
    if (this.writeLocal(newest)) this.localSavedAt = timestamp(newest);
    // Never overwrite an unreadable mirror merely because a restore timed out.
    if (mirrorReadSucceeded && (!mirrored || timestamp(newest) > timestamp(mirrored))) this.queueMirror(newest);
    this.report();
    return copy(newest);
  }

  private writeLocal(data: T): boolean {
    if (!this.storage) return false;
    const serialized = JSON.stringify(data);
    let saved = false;
    for (const key of [this.backupKey, this.key]) {
      try { this.storage.setItem(key, serialized); saved = true; } catch { /* The other local copy or IndexedDB can still save. */ }
    }
    return saved;
  }

  private queueMirror(data: T) {
    if (!this.mirror) return;
    const snapshot = copy(data);
    this.mirrorTail = this.mirrorTail.then(async () => {
      try {
        if (!await this.prepareMirrorWrite()) { this.report(); return; }
        await this.mirror!.write(this.key, snapshot);
        this.mirrorSavedAt = timestamp(snapshot);
      } catch { /* Keep the valid local copy and report current durability accurately. */ }
      this.report();
    });
  }

  private async prepareMirrorWrite(): Promise<boolean> {
    if (!this.mirror || (this.mirrorReadConfirmed && !this.pendingRecovery)) return !!this.mirror;
    let existing: T | null;
    try {
      existing = this.candidate(await bounded(this.mirror.read(this.key), this.timeoutMs));
      this.mirrorReadConfirmed = true;
    } catch { this.markUncertain(); return false; }
    if (!this.pendingRecovery) {
      // A caller may save before explicitly restoring. Its unread prior save also
      // needs protection; a confirmed empty mirror can accept a fresh checkpoint.
      if (!existing) return true;
      this.markUncertain();
    }
    if (existing) {
      const marker = this.pendingRecovery!;
      let archived: RecoveryRecord<T> | null;
      try { archived = this.recoveryRecord(await bounded(this.mirror.read(this.recoveryKey), this.timeoutMs)); }
      catch { return false; }
      // If clearing the marker failed after a commit, never replace its original
      // archived adventure with the fresh game now stored under the main key.
      if (!archived || archived.id !== marker.id) {
        const local = this.localRecovery();
        let progress = existing;
        for (const prior of [local, archived]) if (prior && timestamp(prior.progress) > timestamp(progress)) progress = prior.progress;
        archived = { format: 'puppy-pals-recovery', id: marker.id, progress: copy(progress), archivedAt: this.clock() };
        try { await bounded(this.mirror.write(this.recoveryKey, archived), this.timeoutMs); }
        catch { return false; } // No main-key write until an archive transaction commits.
      }
      try { this.storage?.setItem(this.recoveryKey, JSON.stringify(archived)); } catch { /* The committed IndexedDB archive remains available. */ }
      try { this.options.onRecovery?.(copy(archived.progress)); } catch { /* Recovery availability does not depend on UI rendering. */ }
    }
    this.clearUncertainty();
    return true;
  }

  /** Returns true only when a current checkpoint was synchronously saved locally. */
  save(data: T): boolean {
    let snapshot: T;
    try {
      const at = Math.max(1, Math.floor(this.clock()), timestamp(this.current) + 1);
      snapshot = copy({ ...data, savedAt: at });
      data.savedAt = at;
    } catch { this.report(); return false; }
    this.revision++;
    this.current = snapshot;
    const saved = this.writeLocal(snapshot);
    if (saved) this.localSavedAt = timestamp(snapshot);
    if (this.pendingRecovery) this.markUncertain();
    this.queueMirror(snapshot);
    this.report();
    return saved;
  }

  /** Wait for queued IndexedDB commits, with a bound for blocked/private storage. */
  async flush(): Promise<boolean> {
    try { await bounded(this.mirrorTail, this.timeoutMs); } catch { /* Do not freeze navigation while storage is blocked. */ }
    return this.status.saved;
  }
}
