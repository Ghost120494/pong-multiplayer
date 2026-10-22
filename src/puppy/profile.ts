import { PuppyGame, type Coord } from './engine';
import { LEVEL_COUNT, type CampaignRules } from './levels';
import { DISCOVERIES } from './progression';

export type Booster = 'paw' | 'shuffle' | 'rainbow';
export type Action = { kind: 'swap'; a: Coord; b: Coord } | { kind: Booster; target?: Coord };
export type Run = {
  level: number;
  seed: number;
  actions: Action[];
  attemptId: string | null;
  mode: 'online' | 'offline' | null;
  resultHandled: boolean;
  /** Missing in original saves; those runs always replay the original rules. */
  ruleset?: CampaignRules;
  reservationId?: string;
};
export type OfflineWallet = { lives: number; nextLifeAt: number | null };
export type Save = {
  version: 1;
  savedAt?: number;
  unlocked: number;
  stars: number[];
  best: number[];
  coins: number;
  boosters: Record<Booster, number>;
  discoveries: string[];
  sound: boolean;
  dailyAt: number;
  run: Run | null;
  offlineWallet: OfflineWallet;
  pendingFinishes: { attemptId: string; outcome: string }[];
  pendingPayment: string | null;
};

const BOOSTERS: Booster[] = ['paw', 'shuffle', 'rainbow'];
const LEGACY_LEVEL_COUNT = 100;
const PREVIOUS_CAMPAIGN_LENGTHS = [LEGACY_LEVEL_COUNT, 180];

export function emptySave(): Save {
  return {
    version: 1, unlocked: 1,
    stars: Array(LEVEL_COUNT).fill(0), best: Array(LEVEL_COUNT).fill(0),
    coins: 120, boosters: { paw: 0, shuffle: 0, rainbow: 0 }, discoveries: [],
    sound: false, dailyAt: 0, run: null,
    offlineWallet: { lives: 5, nextLifeAt: null }, pendingFinishes: [], pendingPayment: null,
  };
}

function record(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function coordinate(value: unknown): Coord | null {
  if (!record(value) || !Number.isInteger(value.r) || !Number.isInteger(value.c) || value.r < 0 || value.r >= 8 || value.c < 0 || value.c >= 8) return null;
  return { r: value.r, c: value.c };
}
function action(value: unknown): Action | null {
  if (!record(value)) return null;
  if (value.kind === 'swap') {
    const a = coordinate(value.a), b = coordinate(value.b);
    return a && b ? { kind: 'swap', a, b } : null;
  }
  if (value.kind === 'shuffle') return { kind: 'shuffle' };
  if (value.kind === 'paw' || value.kind === 'rainbow') {
    const target = coordinate(value.target);
    return target ? { kind: value.kind, target } : null;
  }
  return null;
}

/** Validate and copy a checkpoint, preserving legacy run rules before padding it. */
export function validateSave(value: unknown): Save | null {
  try {
    if (!record(value) || value.version !== 1) return null;
    if (!Array.isArray(value.stars) || !Array.isArray(value.best) || value.stars.length !== value.best.length || ![...PREVIOUS_CAMPAIGN_LENGTHS, LEVEL_COUNT].includes(value.stars.length)) return null;
    if (!Number.isInteger(value.unlocked) || value.unlocked < 1 || value.unlocked > value.stars.length) return null;

    const base = emptySave();
    const count = (input: unknown, max: number) => Number.isInteger(input) && Number(input) >= 0 ? Math.min(Number(input), max) : 0;
    const time = (input: unknown) => typeof input === 'number' && Number.isFinite(input) && input >= 0 ? input : 0;
    base.unlocked = value.unlocked;
    base.coins = count(value.coins, 1e6);
    base.sound = !!value.sound;
    base.dailyAt = time(value.dailyAt);
    if (typeof value.savedAt === 'number' && Number.isFinite(value.savedAt) && value.savedAt >= 0) base.savedAt = value.savedAt;
    base.stars = base.stars.map((_, i) => count(value.stars[i], 3));
    base.best = base.best.map((_, i) => count(value.best[i], 1e9));
    for (const kind of BOOSTERS) base.boosters[kind] = count(record(value.boosters) ? value.boosters[kind] : undefined, 999);

    // Shipped campaigns capped unlocked at their finale even after a final win.
    if (PREVIOUS_CAMPAIGN_LENGTHS.includes(base.unlocked) && base.stars[base.unlocked - 1] > 0) base.unlocked = Math.min(LEVEL_COUNT, base.unlocked + 1);

    if (value.discoveries === undefined) {
      // Returning players keep their inventory and avoid duplicate starter gifts.
      base.discoveries = DISCOVERIES.filter(discovery => discovery.level <= base.unlocked).map(discovery => discovery.id);
    } else {
      if (!Array.isArray(value.discoveries)) return null;
      const known = new Set(DISCOVERIES.map(discovery => discovery.id));
      base.discoveries = [...new Set(value.discoveries.filter((id): id is string => typeof id === 'string' && known.has(id)))];
    }

    if (record(value.offlineWallet)) base.offlineWallet = { lives: count(value.offlineWallet.lives, 5), nextLifeAt: typeof value.offlineWallet.nextLifeAt === 'number' && Number.isFinite(value.offlineWallet.nextLifeAt) && value.offlineWallet.nextLifeAt >= 0 ? value.offlineWallet.nextLifeAt : null };
    if (Array.isArray(value.pendingFinishes)) base.pendingFinishes = value.pendingFinishes.filter(item => record(item) && typeof item.attemptId === 'string' && ['won', 'lost', 'abandoned'].includes(item.outcome)).slice(0, 20).map(item => ({ attemptId: item.attemptId, outcome: item.outcome }));
    if (typeof value.pendingPayment === 'string') base.pendingPayment = value.pendingPayment;

    if (value.run != null) {
      const input = value.run;
      if (!record(input) || !Number.isInteger(input.level) || input.level < 1 || input.level > base.unlocked || !Number.isInteger(input.seed) || !Array.isArray(input.actions) || input.actions.length > 1000) return null;
      const ruleset = input.ruleset === undefined ? 1 : input.ruleset;
      if ((ruleset !== 1 && ruleset !== 2) || (ruleset === 1 && input.level > LEGACY_LEVEL_COUNT)) return null;
      const actions: Action[] = [];
      for (const item of input.actions) {
        const parsed = action(item);
        if (!parsed) return null;
        actions.push(parsed);
      }
      base.run = {
        level: input.level, seed: input.seed, actions, ruleset,
        attemptId: typeof input.attemptId === 'string' ? input.attemptId : null,
        mode: input.mode === 'online' || input.mode === 'offline' ? input.mode : null,
        resultHandled: !!input.resultHandled,
        ...(typeof input.reservationId === 'string' ? { reservationId: input.reservationId } : {}),
      };
      const replay = new PuppyGame(base.run.level, base.run.seed, ruleset);
      for (const item of actions) {
        if (!(item.kind === 'swap' ? replay.swap(item.a, item.b) : replay.useBooster(item.kind, item.target)).valid) return null;
      }
    }
    return base;
  } catch { return null; }
}
