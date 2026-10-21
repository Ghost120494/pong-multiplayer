import { BREEDS, LEVELS, getLevel, type CampaignRules, type LevelConfig } from './levels';

export { BREEDS, LEVELS } from './levels';
export const BOARD_SIZE = 8;

export type Coord = { r: number; c: number };
export type Special = null | 'row' | 'column' | 'bomb' | 'rainbow';
export type Tile = { id: number; breed: number; special: Special };
export type Board = (Tile | null)[][];
export type Objective = { kind: 'collect' | 'grass' | 'score' | 'special' | 'cascade'; breed?: number; target: number; current: number };
export type Snapshot = {
  board: Board;
  grass: number[][];
  moves: number;
  score: number;
  objectives: Objective[];
  won: boolean;
  lost: boolean;
};
export type TurnResult = {
  valid: boolean;
  reason?: string;
  frames: { snapshot: Snapshot; cleared: Coord[]; combo: number }[];
  scoreGained: number;
  combos: number;
};

type Run = { direction: 'row' | 'column'; cells: Coord[] };
export type MatchGroup = { cells: Coord[]; special: Special; intersection?: Coord };
const key = ({ r, c }: Coord) => r * BOARD_SIZE + c;
const coordinate = (index: number): Coord => ({ r: Math.floor(index / BOARD_SIZE), c: index % BOARD_SIZE });
const inside = ({ r, c }: Coord) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
const adjacent = (a: Coord, b: Coord) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
const normalBreed = (tile: Tile | null | undefined) => tile && tile.breed >= 0 && tile.special !== 'rainbow' ? tile.breed : -1;

/** Detect all runs, merging intersecting runs so an L/T produces one special. */
export function analyzeMatches(board: Board): MatchGroup[] {
  const runs: Run[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE;) {
      const breed = normalBreed(board[r]?.[c]);
      let end = c + 1;
      while (breed >= 0 && end < BOARD_SIZE && normalBreed(board[r]?.[end]) === breed) end++;
      if (breed >= 0 && end - c >= 3) runs.push({ direction: 'row', cells: Array.from({ length: end - c }, (_, i) => ({ r, c: c + i })) });
      c = end;
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r < BOARD_SIZE;) {
      const breed = normalBreed(board[r]?.[c]);
      let end = r + 1;
      while (breed >= 0 && end < BOARD_SIZE && normalBreed(board[end]?.[c]) === breed) end++;
      if (breed >= 0 && end - r >= 3) runs.push({ direction: 'column', cells: Array.from({ length: end - r }, (_, i) => ({ r: r + i, c })) });
      r = end;
    }
  }
  const groups: { runs: Run[]; cells: Set<number> }[] = [];
  for (const run of runs) {
    const indexes = run.cells.map(key);
    const overlaps = groups.filter(group => indexes.some(index => group.cells.has(index)));
    if (!overlaps.length) {
      groups.push({ runs: [run], cells: new Set(indexes) });
      continue;
    }
    const merged = overlaps[0];
    merged.runs.push(run);
    indexes.forEach(index => merged.cells.add(index));
    for (const other of overlaps.slice(1)) {
      merged.runs.push(...other.runs);
      other.cells.forEach(index => merged.cells.add(index));
      groups.splice(groups.indexOf(other), 1);
    }
  }
  return groups.map(group => {
    const longest = group.runs.reduce((a, b) => a.cells.length >= b.cells.length ? a : b);
    const horizontal = group.runs.find(run => run.direction === 'row');
    const vertical = group.runs.find(run => run.direction === 'column');
    const intersection = horizontal && vertical
      ? horizontal.cells.find(cell => vertical.cells.some(other => key(cell) === key(other)))
      : undefined;
    const special: Special = longest.cells.length >= 5 ? 'rainbow'
      : horizontal && vertical ? 'bomb'
      : longest.cells.length === 4 ? longest.direction : null;
    return { cells: [...group.cells].map(coordinate), special, ...(intersection ? { intersection } : {}) };
  });
}

/** Returns a playable adjacent swap; it never changes the supplied board. */
export function findLegalMove(board: Board): { a: Coord; b: Coord } | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const a = { r, c };
      for (const b of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (!inside(b) || !board[r]?.[c] || !board[b.r]?.[b.c]) continue;
        const first = board[r][c]!;
        const second = board[b.r][b.c]!;
        if (first.special === 'rainbow' || second.special === 'rainbow' || (first.special && second.special)) return { a, b };
        [board[a.r][a.c], board[b.r][b.c]] = [second, first];
        const matches = analyzeMatches(board);
        [board[a.r][a.c], board[b.r][b.c]] = [first, second];
        if (matches.some(group => group.cells.some(cell => key(cell) === key(a) || key(cell) === key(b)))) return { a, b };
      }
    }
  }
  return null;
}

/** Pure game rules with a private seeded random stream, separate from DOM/UI. */
export class PuppyGame {
  readonly level: LevelConfig;
  private readonly breedPool: readonly number[];
  private board: Board;
  private grass: number[][];
  private moves: number;
  private score = 0;
  private objectives: Objective[];
  private won = false;
  private lost = false;
  private randomState: number;
  private nextTileId = 1;

  constructor(levelNumber: number, seed?: number, readonly ruleset: CampaignRules = 2) {
    this.level = getLevel(levelNumber, ruleset);
    this.breedPool = this.level.breedPool ?? Array.from({ length: this.level.breeds }, (_, i) => i);
    this.randomState = (Number.isFinite(seed) ? seed! : Math.floor(Math.random() * 0x100000000)) >>> 0;
    this.moves = this.level.moves + (this.level.bonusMoves ?? 0);
    this.objectives = this.level.objectives.map(objective => ({ ...objective, current: 0 }));
    this.board = this.newPlayableBoard();
    this.grass = Array.from({ length: BOARD_SIZE }, () => Array<number>(BOARD_SIZE).fill(0));
    const grassCells = this.permute(Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i));
    for (const index of grassCells.slice(0, this.level.grassCount)) {
      const { r, c } = coordinate(index);
      this.grass[r][c] = this.level.grassLayers;
    }
    if (this.level.startingSpecial) this.board[3][3]!.special = this.level.startingSpecial;
  }

  snapshot(): Snapshot {
    return {
      board: this.board.map(row => row.map(tile => tile ? { ...tile } : null)),
      grass: this.grass.map(row => [...row]),
      moves: this.moves,
      score: this.score,
      objectives: this.objectives.map(objective => ({ ...objective })),
      won: this.won,
      lost: this.lost,
    };
  }

  hint(): { a: Coord; b: Coord } | null {
    return this.won || this.lost ? null : findLegalMove(this.board);
  }

  swap(a: Coord, b: Coord): TurnResult {
    if (this.won || this.lost) return this.invalid('This level is finished.');
    if (!inside(a) || !inside(b) || !adjacent(a, b)) return this.invalid('Choose two neighboring puppies.');
    const first = this.board[a.r][a.c];
    const second = this.board[b.r][b.c];
    if (!first || !second) return this.invalid('Wait for the puppies to settle.');
    [this.board[a.r][a.c], this.board[b.r][b.c]] = [second, first];
    const groups = analyzeMatches(this.board);
    const rainbow = first.special === 'rainbow' || second.special === 'rainbow';
    const combined = !!first.special && !!second.special;
    if (!rainbow && !combined && !groups.some(group => group.cells.some(cell => key(cell) === key(a) || key(cell) === key(b)))) {
      [this.board[a.r][a.c], this.board[b.r][b.c]] = [first, second];
      return this.invalid('Make a line of at least three matching pups.');
    }
    this.moves--;
    let preset: Set<number> | undefined;
    if (rainbow) {
      preset = new Set([key(a), key(b)]);
      if (first.special === 'rainbow' && second.special === 'rainbow') {
        this.allCells().forEach(cell => preset!.add(key(cell)));
      } else {
        const other = first.special === 'rainbow' ? second : first;
        for (const cell of this.allCells()) {
          const tile = this.board[cell.r][cell.c]!;
          if (tile.breed === other.breed) {
            preset.add(key(cell));
            if (other.special) tile.special = other.special;
          }
        }
      }
      // The rainbow's explicitly chosen effect must not trigger a second color.
      for (const cell of [a, b]) if (this.board[cell.r][cell.c]?.special === 'rainbow') this.board[cell.r][cell.c]!.special = null;
    } else if (combined) {
      preset = new Set([key(a), key(b)]);
      if (first.special === 'bomb' && second.special === 'bomb') {
        this.square(b, 2).forEach(cell => preset!.add(key(cell)));
      } else if (first.special === 'bomb' || second.special === 'bomb') {
        for (const cell of this.allCells()) if (Math.abs(cell.r - b.r) <= 1 || Math.abs(cell.c - b.c) <= 1) preset.add(key(cell));
      } else {
        for (const cell of this.allCells()) if (cell.r === b.r || cell.c === b.c) preset.add(key(cell));
      }
    }
    return this.resolve(preset, b, a);
  }

  useBooster(kind: 'paw' | 'shuffle' | 'rainbow', target?: Coord): TurnResult {
    if (this.won || this.lost) return this.invalid('This level is finished.');
    if (kind === 'shuffle') {
      this.shuffle();
      return { valid: true, frames: [{ snapshot: this.snapshot(), cleared: [], combo: 0 }], scoreGained: 0, combos: 0 };
    }
    if (kind !== 'paw' && kind !== 'rainbow') return this.invalid('Unknown booster.');
    if (!target || !inside(target) || !this.board[target.r][target.c]) return this.invalid('Choose a puppy for this booster.');
    const preset = new Set([key(target)]);
    if (kind === 'rainbow') {
      const breed = normalBreed(this.board[target.r][target.c]) >= 0 ? this.board[target.r][target.c]!.breed : this.mostCommonBreed();
      for (const cell of this.allCells()) if (this.board[cell.r][cell.c]?.breed === breed) preset.add(key(cell));
      if (this.board[target.r][target.c]!.special === 'rainbow') this.board[target.r][target.c]!.special = null;
    }
    return this.resolve(preset);
  }

  private random(): number {
    // Mulberry32, deterministic even for a zero seed.
    let value = this.randomState += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 0x100000000;
  }

  private permute<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  private tile(breed = this.breedPool[Math.floor(this.random() * this.breedPool.length)], special: Special = null): Tile {
    return { id: this.nextTileId++, breed, special };
  }

  private newPlayableBoard(): Board {
    for (let attempt = 0; attempt < 100; attempt++) {
      const board: Board = Array.from({ length: BOARD_SIZE }, () => []);
      for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
        const excluded = new Set<number>();
        if (c >= 2 && board[r][c - 1]!.breed === board[r][c - 2]!.breed) excluded.add(board[r][c - 1]!.breed);
        if (r >= 2 && board[r - 1][c]!.breed === board[r - 2][c]!.breed) excluded.add(board[r - 1][c]!.breed);
        const breeds = this.breedPool.filter(breed => !excluded.has(breed));
        board[r].push(this.tile(breeds[Math.floor(this.random() * breeds.length)]));
      }
      if (findLegalMove(board)) return board;
    }
    throw new Error('Could not prepare a playable Puppy Pals board.');
  }

  private allCells(): Coord[] {
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => coordinate(index));
  }

  private square(center: Coord, radius: number): Coord[] {
    const cells: Coord[] = [];
    for (let r = center.r - radius; r <= center.r + radius; r++) for (let c = center.c - radius; c <= center.c + radius; c++) if (inside({ r, c })) cells.push({ r, c });
    return cells;
  }

  private mostCommonBreed(): number {
    if (this.ruleset === 1) {
      // Keep the original tie-breaking and random replay behavior for old runs.
      const counts = Array<number>(this.level.breeds).fill(0);
      for (const row of this.board) for (const tile of row) if (tile && tile.breed >= 0) counts[tile.breed]++;
      return counts.indexOf(Math.max(...counts));
    }
    const counts = new Map(this.breedPool.map(breed => [breed, 0]));
    for (const row of this.board) for (const tile of row) if (tile && tile.breed >= 0) counts.set(tile.breed, (counts.get(tile.breed) ?? 0) + 1);
    let mostCommon = this.breedPool[0];
    for (const [breed, count] of counts) if (count > (counts.get(mostCommon) ?? 0)) mostCommon = breed;
    return mostCommon;
  }

  private expandEffects(initial: Set<number>): Set<number> {
    const cells = new Set(initial);
    const queue = [...initial];
    const add = (cell: Coord) => {
      if (inside(cell) && !cells.has(key(cell))) { cells.add(key(cell)); queue.push(key(cell)); }
    };
    while (queue.length) {
      const cell = coordinate(queue.pop()!);
      const tile = this.board[cell.r][cell.c];
      if (tile?.special === 'row') for (let c = 0; c < BOARD_SIZE; c++) add({ r: cell.r, c });
      if (tile?.special === 'column') for (let r = 0; r < BOARD_SIZE; r++) add({ r, c: cell.c });
      if (tile?.special === 'bomb') this.square(cell, 1).forEach(add);
      if (tile?.special === 'rainbow') {
        const breed = this.mostCommonBreed();
        this.allCells().filter(other => this.board[other.r][other.c]?.breed === breed).forEach(add);
      }
    }
    return cells;
  }

  private resolve(preset?: Set<number>, destination?: Coord, origin?: Coord): TurnResult {
    const startingScore = this.score;
    const frames: TurnResult['frames'] = [{ snapshot: this.snapshot(), cleared: [], combo: 0 }];
    let combos = 0;
    for (let iteration = 0; iteration < 100; iteration++) {
      const groups = analyzeMatches(this.board);
      const matched = new Set<number>(groups.flatMap(group => group.cells.map(key)));
      preset?.forEach(index => matched.add(index));
      preset = undefined;
      if (!matched.size) break;
      const spawns = groups.filter(group => group.special).map(group => {
        const selected = [destination, origin, group.intersection].find(candidate => candidate && group.cells.some(cell => key(cell) === key(candidate)));
        const cell = selected ?? group.cells[Math.floor(group.cells.length / 2)];
        const breed = group.special === 'rainbow' ? -1 : this.board[cell.r][cell.c]!.breed;
        return { cell, tile: this.tile(breed, group.special) };
      });
      const cleared = this.expandEffects(matched);
      combos++;
      for (const objective of this.objectives) {
        if (objective.kind === 'special') objective.current = Math.min(objective.target, objective.current + spawns.length);
        if (objective.kind === 'cascade' && combos > 1) objective.current = Math.min(objective.target, objective.current + 1);
      }
      for (const index of cleared) {
        const cell = coordinate(index);
        const tile = this.board[cell.r][cell.c];
        if (!tile) continue;
        for (const objective of this.objectives) {
          if (objective.kind === 'collect' && objective.breed === tile.breed) objective.current = Math.min(objective.target, objective.current + 1);
          if (objective.kind === 'grass' && this.grass[cell.r][cell.c] > 0) objective.current = Math.min(objective.target, objective.current + 1);
        }
        if (this.grass[cell.r][cell.c] > 0) this.grass[cell.r][cell.c]--;
        this.board[cell.r][cell.c] = null;
      }
      this.score += cleared.size * 60 * Math.min(combos, 5);
      for (const objective of this.objectives) if (objective.kind === 'score') objective.current = Math.min(objective.target, this.score);
      for (const spawn of spawns) this.board[spawn.cell.r][spawn.cell.c] = spawn.tile;
      frames.push({ snapshot: this.snapshot(), cleared: [...cleared].map(coordinate), combo: combos });
      this.collapse();
      frames.push({ snapshot: this.snapshot(), cleared: [], combo: combos });
      destination = origin = undefined;
      if (iteration === 99) {
        // A defensive bound avoids an animation getting stuck in an extreme chain.
        this.shuffle();
        frames.push({ snapshot: this.snapshot(), cleared: [], combo: combos });
      }
    }
    this.won = this.objectives.every(objective => objective.current >= objective.target);
    this.lost = !this.won && this.moves <= 0;
    if (!this.won && !this.lost && !findLegalMove(this.board)) this.shuffle();
    frames.push({ snapshot: this.snapshot(), cleared: [], combo: combos });
    return { valid: true, frames, scoreGained: this.score - startingScore, combos };
  }

  private collapse(): void {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const remaining: Tile[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) if (this.board[r][c]) remaining.push(this.board[r][c]!);
      const missing = BOARD_SIZE - remaining.length;
      for (let r = 0; r < missing; r++) this.board[r][c] = this.tile();
      for (let i = 0; i < remaining.length; i++) this.board[missing + i][c] = remaining[i];
    }
  }

  private shuffle(): void {
    const tiles = this.board.flat().filter((tile): tile is Tile => !!tile);
    if (tiles.length === BOARD_SIZE * BOARD_SIZE) {
      for (let attempt = 0; attempt < 256; attempt++) {
        this.permute(tiles);
        const candidate = Array.from({ length: BOARD_SIZE }, (_, r) => tiles.slice(r * BOARD_SIZE, (r + 1) * BOARD_SIZE));
        if (!analyzeMatches(candidate).length && findLegalMove(candidate)) { this.board = candidate; return; }
      }
    }
    this.board = this.newPlayableBoard();
  }

  private invalid(reason: string): TurnResult {
    return { valid: false, reason, frames: [], scoreGained: 0, combos: 0 };
  }
}
