var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __publicField = (obj, key2, value) => __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);

// src/puppy/levels.ts
var BREEDS = Object.freeze([
  Object.freeze({ id: 0, name: "Corgi", color: "#eea65d" }),
  Object.freeze({ id: 1, name: "Beagle", color: "#bd8264" }),
  Object.freeze({ id: 2, name: "Husky", color: "#8da9cd" }),
  Object.freeze({ id: 3, name: "Poodle", color: "#e8a9cb" }),
  Object.freeze({ id: 4, name: "Pug", color: "#c5b378" }),
  Object.freeze({ id: 5, name: "Dalmatian", color: "#aa9fc7" })
]);
var CHAPTERS = [
  {
    name: "Sunny Meadows",
    levels: ["Hello, Puppy!", "Best Buddies", "Happy Howls", "Paw Prints", "A Little Overgrown", "Pug Hugs", "Playdate", "Meadow Magic", "Spot the Spots", "Picnic Pals"]
  },
  {
    name: "Biscuit Bay",
    levels: ["Sandy Paws", "Beach Buddies", "Seashell Shuffle", "Corgi Cove", "Tidal Treats", "Salty Snoots", "Digging Deep", "Driftwood Dash", "Sunset Fetch", "Beach Party"]
  },
  {
    name: "Clover Woods",
    levels: ["Into the Woods", "Clover Crew", "Fern Friends", "Hidden Trail", "Mossy Mischief", "Woodland Woofs", "Acorn Adventure", "Leafy Leaps", "Forest Fetch", "Treehouse Treats"]
  },
  {
    name: "Poodle Park",
    levels: ["Park Patrol", "Fluffy Friends", "Fountain Frolic", "Top-Dog Topiary", "Garden Games", "Pretty in Pink", "Prancing Paws", "Secret Garden", "Perfect Playdate", "Poodle Parade"]
  },
  {
    name: "Maple Village",
    levels: ["Welcome Home", "Maple Mischief", "Cozy Corners", "Cobbled Paws", "Village Green", "Bakery Buddies", "Market Mayhem", "Autumn Amble", "Golden Leaves", "Harvest Howl"]
  },
  {
    name: "Snowy Snoots",
    levels: ["First Snow", "Husky Huddle", "Frosty Fetch", "Snowball Shuffle", "Icy Paws", "Cocoa Cuddles", "Winter Walkies", "Snowdrift Sprint", "Aurora Pals", "Snow Day!"]
  },
  {
    name: "Peach Blossom Hills",
    levels: ["Blossom Bound", "Petal Pals", "Peachy Paws", "Hilltop Howls", "Overgrown Orchard", "Spring Snuggles", "Breezy Buddies", "Petal Path", "Blossom Bonanza", "Peach Picnic"]
  },
  {
    name: "Moonlight Meadow",
    levels: ["After-Dark Adventure", "Starlit Snoots", "Firefly Friends", "Midnight Mischief", "Moonlit Grass", "Dreamy Dogs", "Lunar Leaps", "Twilight Trail", "Starry Shuffle", "Full-Moon Fetch"]
  },
  {
    name: "Rainbow Ridge",
    levels: ["A Splash of Color", "Rainbow Rovers", "Cloud Cuddles", "Prismatic Paws", "Colorful Clearing", "Golden Good Dogs", "Sky-High Snoots", "Brightest Buddies", "Over the Rainbow", "Pot of Puppies"]
  },
  {
    name: "Puppy Paradise",
    levels: ["Paradise Found", "Best Friends Forever", "The Big Playdate", "Pawsome Partners", "Grand Garden", "Puppy Power", "One Last Walk", "All Paws Together", "Almost Home", "Puppy Pals Forever"]
  }
];
function makeLevel(number) {
  const chapterIndex = Math.floor((number - 1) / 10);
  const stage = (number - 1) % 10;
  const chapter2 = CHAPTERS[chapterIndex];
  const breeds = number < 9 ? 5 : 6;
  const featuredBreed = number === 1 ? 0 : (number - 1) % breeds;
  const secondBreed = (featuredBreed + 2 + chapterIndex % 3) % breeds;
  const scoreTarget = 900 + chapterIndex * 220 + stage * 50;
  const singleTarget = 12 + chapterIndex * 2 + Math.floor(stage / 3) * 2;
  const dualTarget = 10 + chapterIndex + Math.floor(stage / 4);
  const hasGrass = number >= 5 && [4, 7, 9].includes(stage);
  const grassLayers = hasGrass && chapterIndex >= 5 && stage !== 4 ? 2 : hasGrass ? 1 : 0;
  const grassCount = hasGrass ? Math.min(40, 12 + chapterIndex * 3 + (stage === 9 ? 4 : stage === 7 ? 2 : 0)) : 0;
  const dualBreed = stage === 3 || stage === 6 || stage === 9;
  const objectives = [];
  if (dualBreed) {
    objectives.push({ kind: "collect", breed: featuredBreed, target: dualTarget });
    objectives.push({ kind: "collect", breed: secondBreed, target: dualTarget });
  } else if (!hasGrass || stage === 9) {
    objectives.push({ kind: "collect", breed: featuredBreed, target: singleTarget });
  }
  if (hasGrass) objectives.push({ kind: "grass", target: grassCount * grassLayers });
  if (!(hasGrass && dualBreed)) objectives.push({ kind: "score", target: scoreTarget });
  const moves = number === 1 ? 24 : Math.min(34, 24 + Math.floor(stage / 2) + Math.floor(chapterIndex / 2) + (grassLayers === 2 ? 2 : 0));
  const breedGoal = dualBreed ? `Bring ${BREEDS[featuredBreed].name} and ${BREEDS[secondBreed].name} pals together.` : `Match ${BREEDS[featuredBreed].name} faces to make new friends.`;
  const description = hasGrass ? `${grassLayers === 2 ? "Clear two layers of" : "Clear the"} grass to uncover a place for your puppy pals to play.` : number === 1 ? "Match three or more of the same puppy. Meet your first Corgi pals!" : breedGoal;
  objectives.forEach(Object.freeze);
  Object.freeze(objectives);
  return Object.freeze({
    number,
    name: chapter2.levels[stage],
    chapter: chapterIndex + 1,
    chapterName: chapter2.name,
    moves,
    description,
    objectives,
    breeds,
    grassLayers,
    grassCount
  });
}
var LEVELS = Object.freeze(Array.from({ length: 100 }, (_, index) => makeLevel(index + 1)));
function getLevel(number) {
  if (!Number.isInteger(number) || number < 1 || number > LEVELS.length) {
    throw new RangeError("Choose a Puppy Pals level between 1 and 100.");
  }
  return LEVELS[number - 1];
}

// src/puppy/engine.ts
var BOARD_SIZE = 8;
var key = ({ r, c }) => r * BOARD_SIZE + c;
var coordinate = (index) => ({ r: Math.floor(index / BOARD_SIZE), c: index % BOARD_SIZE });
var inside = ({ r, c }) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
var adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
var normalBreed = (tile) => tile && tile.breed >= 0 && tile.special !== "rainbow" ? tile.breed : -1;
function analyzeMatches(board2) {
  const runs = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; ) {
      const breed = normalBreed(board2[r]?.[c]);
      let end = c + 1;
      while (breed >= 0 && end < BOARD_SIZE && normalBreed(board2[r]?.[end]) === breed) end++;
      if (breed >= 0 && end - c >= 3) runs.push({ direction: "row", cells: Array.from({ length: end - c }, (_, i) => ({ r, c: c + i })) });
      c = end;
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r < BOARD_SIZE; ) {
      const breed = normalBreed(board2[r]?.[c]);
      let end = r + 1;
      while (breed >= 0 && end < BOARD_SIZE && normalBreed(board2[end]?.[c]) === breed) end++;
      if (breed >= 0 && end - r >= 3) runs.push({ direction: "column", cells: Array.from({ length: end - r }, (_, i) => ({ r: r + i, c })) });
      r = end;
    }
  }
  const groups = [];
  for (const run2 of runs) {
    const indexes = run2.cells.map(key);
    const overlaps = groups.filter((group) => indexes.some((index) => group.cells.has(index)));
    if (!overlaps.length) {
      groups.push({ runs: [run2], cells: new Set(indexes) });
      continue;
    }
    const merged = overlaps[0];
    merged.runs.push(run2);
    indexes.forEach((index) => merged.cells.add(index));
    for (const other of overlaps.slice(1)) {
      merged.runs.push(...other.runs);
      other.cells.forEach((index) => merged.cells.add(index));
      groups.splice(groups.indexOf(other), 1);
    }
  }
  return groups.map((group) => {
    const longest = group.runs.reduce((a, b) => a.cells.length >= b.cells.length ? a : b);
    const horizontal = group.runs.find((run2) => run2.direction === "row");
    const vertical = group.runs.find((run2) => run2.direction === "column");
    const intersection = horizontal && vertical ? horizontal.cells.find((cell) => vertical.cells.some((other) => key(cell) === key(other))) : void 0;
    const special = longest.cells.length >= 5 ? "rainbow" : horizontal && vertical ? "bomb" : longest.cells.length === 4 ? longest.direction : null;
    return { cells: [...group.cells].map(coordinate), special, ...intersection ? { intersection } : {} };
  });
}
function findLegalMove(board2) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const a = { r, c };
      for (const b of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (!inside(b) || !board2[r]?.[c] || !board2[b.r]?.[b.c]) continue;
        const first = board2[r][c];
        const second = board2[b.r][b.c];
        if (first.special === "rainbow" || second.special === "rainbow" || first.special && second.special) return { a, b };
        [board2[a.r][a.c], board2[b.r][b.c]] = [second, first];
        const matches = analyzeMatches(board2);
        [board2[a.r][a.c], board2[b.r][b.c]] = [first, second];
        if (matches.some((group) => group.cells.some((cell) => key(cell) === key(a) || key(cell) === key(b)))) return { a, b };
      }
    }
  }
  return null;
}
var PuppyGame = class {
  constructor(levelNumber, seed2) {
    __publicField(this, "level");
    __publicField(this, "board");
    __publicField(this, "grass");
    __publicField(this, "moves");
    __publicField(this, "score", 0);
    __publicField(this, "objectives");
    __publicField(this, "won", false);
    __publicField(this, "lost", false);
    __publicField(this, "randomState");
    __publicField(this, "nextTileId", 1);
    this.level = getLevel(levelNumber);
    this.randomState = (Number.isFinite(seed2) ? seed2 : Math.floor(Math.random() * 4294967296)) >>> 0;
    this.moves = this.level.moves;
    this.objectives = this.level.objectives.map((objective) => ({ ...objective, current: 0 }));
    this.board = this.newPlayableBoard();
    this.grass = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    const grassCells = this.permute(Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i));
    for (const index of grassCells.slice(0, this.level.grassCount)) {
      const { r, c } = coordinate(index);
      this.grass[r][c] = this.level.grassLayers;
    }
  }
  snapshot() {
    return {
      board: this.board.map((row) => row.map((tile) => tile ? { ...tile } : null)),
      grass: this.grass.map((row) => [...row]),
      moves: this.moves,
      score: this.score,
      objectives: this.objectives.map((objective) => ({ ...objective })),
      won: this.won,
      lost: this.lost
    };
  }
  hint() {
    return this.won || this.lost ? null : findLegalMove(this.board);
  }
  swap(a, b) {
    if (this.won || this.lost) return this.invalid("This level is finished.");
    if (!inside(a) || !inside(b) || !adjacent(a, b)) return this.invalid("Choose two neighboring puppies.");
    const first = this.board[a.r][a.c];
    const second = this.board[b.r][b.c];
    if (!first || !second) return this.invalid("Wait for the puppies to settle.");
    [this.board[a.r][a.c], this.board[b.r][b.c]] = [second, first];
    const groups = analyzeMatches(this.board);
    const rainbow = first.special === "rainbow" || second.special === "rainbow";
    const combined = !!first.special && !!second.special;
    if (!rainbow && !combined && !groups.some((group) => group.cells.some((cell) => key(cell) === key(a) || key(cell) === key(b)))) {
      [this.board[a.r][a.c], this.board[b.r][b.c]] = [first, second];
      return this.invalid("Make a line of at least three matching pups.");
    }
    this.moves--;
    let preset;
    if (rainbow) {
      preset = /* @__PURE__ */ new Set([key(a), key(b)]);
      if (first.special === "rainbow" && second.special === "rainbow") {
        this.allCells().forEach((cell) => preset.add(key(cell)));
      } else {
        const other = first.special === "rainbow" ? second : first;
        for (const cell of this.allCells()) {
          const tile = this.board[cell.r][cell.c];
          if (tile.breed === other.breed) {
            preset.add(key(cell));
            if (other.special) tile.special = other.special;
          }
        }
      }
      for (const cell of [a, b]) if (this.board[cell.r][cell.c]?.special === "rainbow") this.board[cell.r][cell.c].special = null;
    } else if (combined) {
      preset = /* @__PURE__ */ new Set([key(a), key(b)]);
      if (first.special === "bomb" && second.special === "bomb") {
        this.square(b, 2).forEach((cell) => preset.add(key(cell)));
      } else if (first.special === "bomb" || second.special === "bomb") {
        for (const cell of this.allCells()) if (Math.abs(cell.r - b.r) <= 1 || Math.abs(cell.c - b.c) <= 1) preset.add(key(cell));
      } else {
        for (const cell of this.allCells()) if (cell.r === b.r || cell.c === b.c) preset.add(key(cell));
      }
    }
    return this.resolve(preset, b, a);
  }
  useBooster(kind, target) {
    if (this.won || this.lost) return this.invalid("This level is finished.");
    if (kind === "shuffle") {
      this.shuffle();
      return { valid: true, frames: [{ snapshot: this.snapshot(), cleared: [], combo: 0 }], scoreGained: 0, combos: 0 };
    }
    if (kind !== "paw" && kind !== "rainbow") return this.invalid("Unknown booster.");
    if (!target || !inside(target) || !this.board[target.r][target.c]) return this.invalid("Choose a puppy for this booster.");
    const preset = /* @__PURE__ */ new Set([key(target)]);
    if (kind === "rainbow") {
      const breed = normalBreed(this.board[target.r][target.c]) >= 0 ? this.board[target.r][target.c].breed : this.mostCommonBreed();
      for (const cell of this.allCells()) if (this.board[cell.r][cell.c]?.breed === breed) preset.add(key(cell));
      if (this.board[target.r][target.c].special === "rainbow") this.board[target.r][target.c].special = null;
    }
    return this.resolve(preset);
  }
  random() {
    let value = this.randomState += 1831565813;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }
  permute(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  tile(breed = Math.floor(this.random() * this.level.breeds), special = null) {
    return { id: this.nextTileId++, breed, special };
  }
  newPlayableBoard() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const board2 = Array.from({ length: BOARD_SIZE }, () => []);
      for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
        const excluded = /* @__PURE__ */ new Set();
        if (c >= 2 && board2[r][c - 1].breed === board2[r][c - 2].breed) excluded.add(board2[r][c - 1].breed);
        if (r >= 2 && board2[r - 1][c].breed === board2[r - 2][c].breed) excluded.add(board2[r - 1][c].breed);
        const breeds = Array.from({ length: this.level.breeds }, (_, i) => i).filter((breed) => !excluded.has(breed));
        board2[r].push(this.tile(breeds[Math.floor(this.random() * breeds.length)]));
      }
      if (findLegalMove(board2)) return board2;
    }
    throw new Error("Could not prepare a playable Puppy Pals board.");
  }
  allCells() {
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => coordinate(index));
  }
  square(center, radius) {
    const cells = [];
    for (let r = center.r - radius; r <= center.r + radius; r++) for (let c = center.c - radius; c <= center.c + radius; c++) if (inside({ r, c })) cells.push({ r, c });
    return cells;
  }
  mostCommonBreed() {
    const counts = Array(this.level.breeds).fill(0);
    for (const row of this.board) for (const tile of row) if (tile && tile.breed >= 0) counts[tile.breed]++;
    return counts.indexOf(Math.max(...counts));
  }
  expandEffects(initial) {
    const cells = new Set(initial);
    const queue = [...initial];
    const add = (cell) => {
      if (inside(cell) && !cells.has(key(cell))) {
        cells.add(key(cell));
        queue.push(key(cell));
      }
    };
    while (queue.length) {
      const cell = coordinate(queue.pop());
      const tile = this.board[cell.r][cell.c];
      if (tile?.special === "row") for (let c = 0; c < BOARD_SIZE; c++) add({ r: cell.r, c });
      if (tile?.special === "column") for (let r = 0; r < BOARD_SIZE; r++) add({ r, c: cell.c });
      if (tile?.special === "bomb") this.square(cell, 1).forEach(add);
      if (tile?.special === "rainbow") {
        const breed = this.mostCommonBreed();
        this.allCells().filter((other) => this.board[other.r][other.c]?.breed === breed).forEach(add);
      }
    }
    return cells;
  }
  resolve(preset, destination, origin) {
    const startingScore = this.score;
    const frames = [{ snapshot: this.snapshot(), cleared: [], combo: 0 }];
    let combos = 0;
    for (let iteration = 0; iteration < 100; iteration++) {
      const groups = analyzeMatches(this.board);
      const matched = new Set(groups.flatMap((group) => group.cells.map(key)));
      preset?.forEach((index) => matched.add(index));
      preset = void 0;
      if (!matched.size) break;
      const spawns = groups.filter((group) => group.special).map((group) => {
        const selected2 = [destination, origin, group.intersection].find((candidate) => candidate && group.cells.some((cell2) => key(cell2) === key(candidate)));
        const cell = selected2 ?? group.cells[Math.floor(group.cells.length / 2)];
        const breed = group.special === "rainbow" ? -1 : this.board[cell.r][cell.c].breed;
        return { cell, tile: this.tile(breed, group.special) };
      });
      const cleared = this.expandEffects(matched);
      combos++;
      for (const index of cleared) {
        const cell = coordinate(index);
        const tile = this.board[cell.r][cell.c];
        if (!tile) continue;
        for (const objective of this.objectives) {
          if (objective.kind === "collect" && objective.breed === tile.breed) objective.current = Math.min(objective.target, objective.current + 1);
          if (objective.kind === "grass" && this.grass[cell.r][cell.c] > 0) objective.current = Math.min(objective.target, objective.current + 1);
        }
        if (this.grass[cell.r][cell.c] > 0) this.grass[cell.r][cell.c]--;
        this.board[cell.r][cell.c] = null;
      }
      this.score += cleared.size * 60 * Math.min(combos, 5);
      for (const objective of this.objectives) if (objective.kind === "score") objective.current = Math.min(objective.target, this.score);
      for (const spawn of spawns) this.board[spawn.cell.r][spawn.cell.c] = spawn.tile;
      frames.push({ snapshot: this.snapshot(), cleared: [...cleared].map(coordinate), combo: combos });
      this.collapse();
      frames.push({ snapshot: this.snapshot(), cleared: [], combo: combos });
      destination = origin = void 0;
      if (iteration === 99) {
        this.shuffle();
        frames.push({ snapshot: this.snapshot(), cleared: [], combo: combos });
      }
    }
    this.won = this.objectives.every((objective) => objective.current >= objective.target);
    this.lost = !this.won && this.moves <= 0;
    if (!this.won && !this.lost && !findLegalMove(this.board)) this.shuffle();
    frames.push({ snapshot: this.snapshot(), cleared: [], combo: combos });
    return { valid: true, frames, scoreGained: this.score - startingScore, combos };
  }
  collapse() {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const remaining = [];
      for (let r = 0; r < BOARD_SIZE; r++) if (this.board[r][c]) remaining.push(this.board[r][c]);
      const missing = BOARD_SIZE - remaining.length;
      for (let r = 0; r < missing; r++) this.board[r][c] = this.tile();
      for (let i = 0; i < remaining.length; i++) this.board[missing + i][c] = remaining[i];
    }
  }
  shuffle() {
    const tiles = this.board.flat().filter((tile) => !!tile);
    if (tiles.length === BOARD_SIZE * BOARD_SIZE) {
      for (let attempt = 0; attempt < 256; attempt++) {
        this.permute(tiles);
        const candidate = Array.from({ length: BOARD_SIZE }, (_, r) => tiles.slice(r * BOARD_SIZE, (r + 1) * BOARD_SIZE));
        if (!analyzeMatches(candidate).length && findLegalMove(candidate)) {
          this.board = candidate;
          return;
        }
      }
    }
    this.board = this.newPlayableBoard();
  }
  invalid(reason) {
    return { valid: false, reason, frames: [], scoreGained: 0, combos: 0 };
  }
};

// src/puppy/app.ts
var KEY = "puppy-pals-save-v1";
var ART = "/puppy-pals/art/";
var TILE_COLORS = ["#fff0d9", "#f4e8d9", "#e2edf7", "#f6e5f0", "#efe5d2", "#eeebf7"];
var BOOSTERS = {
  paw: { name: "Paw pop", cost: 40, description: "Clear one puppy without using a move." },
  shuffle: { name: "Mix it up", cost: 60, description: "Shuffle the board for a fresh start." },
  rainbow: { name: "Rainbow", cost: 80, description: "Turn a puppy into a rainbow paw." }
};
var paths = {
  paw: '<ellipse cx="12" cy="16.5" rx="5.5" ry="4.2"/><ellipse cx="5.4" cy="10" rx="2" ry="2.7" transform="rotate(-25 5.4 10)"/><ellipse cx="10" cy="6.3" rx="2" ry="2.7"/><ellipse cx="15.3" cy="6.7" rx="2" ry="2.7"/><ellipse cx="19.5" cy="10.8" rx="2" ry="2.7" transform="rotate(25 19.5 10.8)"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  star: '<path d="m12 2 3.1 6.3 7 1-5.1 5 1.2 7L12 18l-6.2 3.3 1.2-7-5.1-5 7-1L12 2Z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z"/><path d="M9 3v16m6-14v16"/>',
  bag: '<path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2.5m0 3h.01"/>',
  sound: '<path d="m11 4-5 4H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-5 4H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4m-4-13h4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10m3-8c-5-4-9 3-3 3s2 7-3 3"/>',
  bulb: '<path d="M8 16a7 7 0 1 1 8 0l-1 2H9l-1-2Zm1 5h6m-3-11v8m-3-8 3 2 3-2"/>',
  shuffle: '<path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.5 0 3-2 4.5-4.5M14 9c1.5-1.8 3-3 4-3h3m-4-4 4 4-4 4"/>',
  rainbow: '<path d="M2 19v-4a10 10 0 0 1 20 0v4h-4v-4a6 6 0 0 0-12 0v4H2Zm8 0v-4a2 2 0 0 1 4 0v4"/>',
  blast: '<path d="m12 2 2 6 6-3-3 6 5 2-6 2 3 6-7-4-5 4 1-7-6-2 7-2 3-8Z"/>',
  grass: '<path d="M3 20h18M6 20C6 14 3 9 2 8c7 1 9 8 10 12m0 0c0-10 2-15 4-18 1 5-1 12-1 18m1 0c1-6 3-9 6-10-2 4-2 7-2 10"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13m0-13C4 8 5 1 9 3l3 5Zm0 0c8 0 7-7 3-5l-3 5Z"/>',
  cloud: '<path d="M6 18a4 4 0 0 1-1-8 7 7 0 0 1 13-1 4.5 4.5 0 0 1 0 9H6Z"/><path d="m9 13 2 2 4-4"/>'
};
var icon = (name, cls = "") => `<svg viewBox="0 0 24 24" aria-hidden="true" class="${cls}">${paths[name] || paths.paw}</svg>`;
var esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var fmt = (n) => n.toLocaleString();
var $ = (selector) => document.querySelector(selector);
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : ms));
var isNative = () => !!window.Capacitor?.isNativePlatform?.() || ["capacitor:", "ionic:"].includes(location.protocol);
function load() {
  const base = { version: 1, unlocked: 1, stars: Array(100).fill(0), best: Array(100).fill(0), coins: 120, boosters: { paw: 2, shuffle: 2, rainbow: 1 }, sound: false, dailyAt: 0, run: null, offlineWallet: { lives: 5, nextLifeAt: null }, pendingFinishes: [], pendingPayment: null };
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!data || data.version !== 1) return base;
    const count = (v, max) => Number.isInteger(v) && Number(v) >= 0 ? Math.min(Number(v), max) : 0;
    base.unlocked = Math.max(1, count(data.unlocked, 100));
    base.coins = count(data.coins, 1e6);
    base.sound = !!data.sound;
    base.dailyAt = typeof data.dailyAt === "number" ? data.dailyAt : 0;
    base.stars = base.stars.map((_, i) => count(data.stars?.[i], 3));
    base.best = base.best.map((_, i) => count(data.best?.[i], 1e9));
    for (const kind of Object.keys(BOOSTERS)) base.boosters[kind] = count(data.boosters?.[kind], 999);
    if (data.offlineWallet) base.offlineWallet = { lives: count(data.offlineWallet.lives, 5), nextLifeAt: Number.isFinite(data.offlineWallet.nextLifeAt) ? data.offlineWallet.nextLifeAt : null };
    if (Array.isArray(data.pendingFinishes)) base.pendingFinishes = data.pendingFinishes.filter((x) => typeof x.attemptId === "string" && ["won", "lost", "abandoned"].includes(x.outcome)).slice(0, 20);
    if (typeof data.pendingPayment === "string") base.pendingPayment = data.pendingPayment;
    if (data.run && Number.isInteger(data.run.level) && data.run.level >= 1 && data.run.level <= base.unlocked && Number.isInteger(data.run.seed) && Array.isArray(data.run.actions) && data.run.actions.length <= 1e3) base.run = data.run;
  } catch {
  }
  return base;
}
var save = load();
var storageWarning = false;
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    if (!storageWarning) {
      storageWarning = true;
      toast("Your browser cannot save progress. Keep this tab open to continue.");
    }
  }
}
var seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
function freshRun(level) {
  return { level, seed: seed(), actions: [], attemptId: null, mode: null, resultHandled: false };
}
var run = save.run || freshRun(save.unlocked);
var game = new PuppyGame(run.level, run.seed);
try {
  for (const action of run.actions) {
    const result = action.kind === "swap" ? game.swap(action.a, action.b) : game.useBooster(action.kind, action.target);
    if (!result.valid) throw new Error("Invalid saved move");
  }
} catch {
  run = freshRun(save.unlocked);
  game = new PuppyGame(run.level, run.seed);
}
save.run = run;
var selected = null;
var activeBooster = null;
var busy = false;
var displayed = game.snapshot();
var chapter = game.level.chapter;
var connected = false;
var wallet = null;
var focusedCell = { r: 0, c: 0 };
var modalKind = "";
var previousFocus = null;
var deferredInstall = null;
var audio = null;
var toastTimer;
var suppressNextPointerClick = false;
function sound(kind, combo = 1) {
  if (!save.sound) return;
  try {
    audio || (audio = new AudioContext());
    if (audio.state === "suspended") void audio.resume();
    const tones = kind === "win" ? [523, 659, 784, 1046] : [kind === "invalid" ? 180 : kind === "tap" ? 440 : 500 + combo * 90];
    tones.forEach((hz, i) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.type = "sine";
      tone.frequency.value = hz;
      volume.gain.setValueAtTime(0, audio.currentTime + i * 0.11);
      volume.gain.linearRampToValueAtTime(0.055, audio.currentTime + i * 0.11 + 0.015);
      volume.gain.exponentialRampToValueAtTime(1e-3, audio.currentTime + i * 0.11 + 0.18);
      tone.connect(volume);
      volume.connect(audio.destination);
      tone.start(audio.currentTime + i * 0.11);
      tone.stop(audio.currentTime + i * 0.11 + 0.2);
    });
  } catch {
  }
}
function toast(message) {
  document.querySelector(".toast")?.remove();
  clearTimeout(toastTimer);
  const element = document.createElement("div");
  element.className = "toast";
  element.setAttribute("role", "status");
  element.textContent = message;
  document.body.append(element);
  toastTimer = setTimeout(() => element.remove(), 4200);
}
function status(message, important = false) {
  $("#game-status").innerHTML = `${icon(important ? "paw" : "bulb")}<span>${esc(message)}</span>`;
  $("#game-status").classList.toggle("important", important);
}
function shell() {
  $("#app").innerHTML = `
  <header class="topbar">
    <a class="brand" href="/" aria-label="Puppy Pals home"><img class="brand-icon" src="${ART}icon.svg" alt=""><div><div class="brand-name">Puppy Pals</div><div class="brand-tag">MATCH. PLAY. FALL IN LOVE.</div></div></a>
    <div class="top-actions"><button class="icon-button" data-action="help" aria-label="How to play">${icon("help")}</button><button class="icon-button sound-toggle" data-action="sound" aria-label="Turn sound on">${icon("mute")}</button><span class="top-divider"></span><div class="coin-pill" title="Treat coins, earned by playing">${icon("coin")}<span id="coins">${fmt(save.coins)}</span></div><button class="wallet-pill" data-action="shop" aria-label="Lives and extra attempts">${icon("heart", "heart")}<span id="lives">5</span><span class="plus">+</span></button></div>
  </header>
  <main class="layout">
    <aside class="sidebar" aria-label="Adventure navigation">
      <nav class="nav-links"><button class="nav-button active" data-action="play">${icon("paw")}<span class="nav-label">Let's play</span></button><button class="nav-button" data-action="map">${icon("map")}<span class="nav-label">My adventure</span><span class="tiny-pill">100 levels</span></button><button class="nav-button" data-action="shop">${icon("bag")}<span class="nav-label">Treat shop</span></button></nav>
      <section class="adventure-card" id="sidebar-map" aria-label="Level map"></section>
      <section class="install-card"><h3>${icon("phone")}Your happy place, anywhere.</h3><p>Add Puppy Pals to your home screen for a little joy on the go.</p><button class="text-button" data-action="install">Get the app ${icon("chevron")}</button></section>
      <div class="sidebar-footer">A little kindness. A lot of puppies.<br><a href="/privacy.html">Privacy & your progress</a></div>
    </aside>
    <section class="game-column" aria-label="Puppy Pals game">
      <div class="welcome"><div class="eyebrow">${icon("paw")}A PAWSITIVELY LOVELY ADVENTURE</div><h1>A little match. <em>A lot of love.</em></h1><p>Bring your favorite puppy pals together, three at a time.</p></div>
      <section class="game-card">
        <div class="level-header"><div class="level-heading"><span class="level-badge">${icon("paw")}</span><div><div class="level-label" id="level-label"></div><h2 id="level-title"></h2></div></div><div class="level-tools"><button class="small-icon" data-action="restart" aria-label="Restart level">${icon("reset")}</button><div class="moves-box" id="moves-box"><strong class="moves-number" id="moves">24</strong><span class="moves-label">moves<br>left</span></div></div></div>
        <div class="objectives" id="objectives" aria-label="Level goals"></div>
        <div class="board-wrap"><div id="board" class="board" role="group" aria-label="8 by 8 dog matching board"></div><div id="combo-area" aria-live="off"></div></div>
        <div id="game-status" class="game-status" role="status" aria-live="polite"></div>
        <div class="game-bottom"><div><span class="score-label">YOUR SCORE</span><strong class="score-value" id="score">0</strong></div><button class="hint-button" data-action="hint">${icon("bulb")} A little hint</button></div>
      </section>
      <div class="booster-panel" aria-label="Boosters"><div class="booster-label">A little<br>helping paw</div>${Object.entries(BOOSTERS).map(([kind, info]) => `<button class="booster" data-action="booster" data-booster="${kind}" title="${esc(info.description)}"><span class="booster-icon ${kind}">${icon(kind)}</span><span class="booster-name">${info.name}</span><span class="booster-count" id="count-${kind}">${save.boosters[kind]}</span></button>`).join("")}</div>
      <div class="game-footer">${icon("cloud")}Little wins, saved automatically.<span id="connection" class="connection-status"><span class="connection-dot"></span>Connecting</span></div>
      <nav class="mobile-bottom" aria-label="Game menu"><button data-action="map">${icon("map")}Adventure</button><button data-action="help">${icon("help")}How to play</button><button data-action="sound" class="sound-toggle">${icon("mute")}Sound</button><button data-action="restart">${icon("reset")}Restart</button></nav>
    </section>
    <aside class="rightbar" aria-label="Your puppy pack">
      <section class="pack-card"><div class="card-kicker">${icon("heart")}SIX FACES. INFINITE HAPPY.</div><h3>Meet your new best friends.</h3><p class="intro">Different pups. One lovable pack.<br>Match their faces to make their day.</p><div class="breed-grid">${BREEDS.map((breed, i) => `<div class="breed-swatch"><div class="breed-picture" style="--tile-bg:${TILE_COLORS[i]}"><img src="${ART}dog-${i}.svg" alt="${breed.name}"></div><span>${breed.name}</span></div>`).join("")}</div><div class="pack-divider"></div><div class="pack-note">${icon("paw")}Each breed has a different face and color.<br>Because every puppy is special.</div></section>
      <section class="tip-card"><div class="card-kicker">${icon("bulb")}A LITTLE PUPPY WISDOM</div><h3>Good things come in threes.</h3><p>Swap two neighbors to match 3 pals.<br>Match 4 or 5 for a special surprise!</p><div class="match-demo"><img src="${ART}dog-0.svg" alt="Corgi"><img src="${ART}dog-0.svg" alt="Corgi"><img src="${ART}dog-0.svg" alt="Corgi"><span class="demo-result">${icon("heart")}</span></div></section>
      <div class="chapter-progress" id="campaign-progress"></div>
      <button class="daily-button" data-action="daily">${icon("gift")}<div><strong id="daily-label">Your daily little treat</strong><span id="daily-detail">50 treat coins + a free shuffle</span></div></button>
    </aside>
  </main>`;
}
function mapHtml() {
  const start = (chapter - 1) * 10;
  return `<div class="chapter-cover"><div class="chapter-caption"><div class="eyebrow">YOUR NEXT HAPPY PLACE</div><h3>${esc(LEVELS[start].chapterName)}</h3></div></div><div class="chapter-switcher"><button data-action="chapter-prev" aria-label="Previous chapter" ${chapter === 1 ? "disabled" : ""}>${icon("back")}</button><span>Chapter ${chapter} of 10</span><button data-action="chapter-next" aria-label="Next chapter" ${chapter === 10 ? "disabled" : ""}>${icon("chevron")}</button></div><div class="level-trail">${LEVELS.slice(start, start + 10).map((level) => {
    const stars = save.stars[level.number - 1];
    const locked = level.number > save.unlocked;
    return `<div class="trail-item"><button class="level-node ${level.number === run.level ? "current" : stars ? "complete" : ""}" data-action="level" data-level="${level.number}" ${locked ? "disabled" : ""} aria-label="Level ${level.number}: ${esc(level.name)}${locked ? ", locked" : stars ? `, ${stars} stars` : ""}" ${level.number === run.level ? 'aria-current="step"' : ""}>${locked ? icon("lock") : level.number}</button><span aria-hidden="true" class="trail-stars ${stars ? "" : "empty"}">${"\u2605".repeat(stars)}${"\u2606".repeat(3 - stars)}</span></div>`;
  }).join("")}</div><div class="adventure-footer">${icon("lock")}A new adventure with every little win.</div>`;
}
function renderMap() {
  $("#sidebar-map").innerHTML = mapHtml();
  if (modalKind === "map") $("#modal-map").innerHTML = mapHtml();
  const completed = save.stars.filter(Boolean).length;
  $("#campaign-progress").innerHTML = `<div class="chapter-progress-top"><span>YOUR HAPPY LITTLE JOURNEY</span><strong>${completed} / 100</strong></div><div class="chapter-progress-track"><div class="chapter-progress-fill" style="width:${completed}%"></div></div><p>One match closer to a hundred<br>tail-wagging adventures.</p>`;
}
function renderWallet() {
  const offline = localWallet();
  const total = connected && wallet ? wallet.totalAttempts : offline.lives;
  $("#lives").textContent = String(total);
  $("#coins").textContent = fmt(save.coins);
  $("#connection").innerHTML = `<span class="connection-dot ${connected ? "" : "offline"}"></span>${connected ? "Progress saved" : "Offline play"}`;
  for (const kind of Object.keys(BOOSTERS)) {
    $(`#count-${kind}`).textContent = String(save.boosters[kind]);
    const button = document.querySelector(`.booster[data-booster="${kind}"]`);
    button.disabled = busy || displayed.won || displayed.lost;
    button.classList.toggle("selected", activeBooster === kind);
  }
  document.querySelectorAll(".sound-toggle").forEach((button) => {
    button.innerHTML = icon(save.sound ? "sound" : "mute") + (button.closest(".mobile-bottom") ? "Sound" : "");
    button.setAttribute("aria-label", save.sound ? "Turn sound off" : "Turn sound on");
    button.setAttribute("aria-pressed", String(save.sound));
  });
  const available = Date.now() - save.dailyAt >= 864e5;
  $(".daily-button").toggleAttribute("disabled", !available);
  $("#daily-label").textContent = available ? "Your daily little treat" : "A treat well deserved!";
  $("#daily-detail").textContent = available ? "50 treat coins + a free shuffle" : "Come back tomorrow for more";
  if (modalKind === "shop") updateShopCountdown();
}
function renderHud(snapshot) {
  $("#level-label").textContent = `LEVEL ${run.level} \xB7 ${game.level.chapterName}`;
  $("#level-title").textContent = game.level.name;
  $("#moves").textContent = String(snapshot.moves);
  $("#moves-box").classList.toggle("low", snapshot.moves <= 5);
  $("#score").textContent = fmt(snapshot.score);
  $("#objectives").innerHTML = snapshot.objectives.map((goal) => {
    const visual = goal.kind === "collect" ? `<img src="${ART}dog-${goal.breed}.svg" alt="">` : icon(goal.kind === "grass" ? "grass" : "star");
    const label = goal.kind === "collect" ? BREEDS[goal.breed].name + " pals" : goal.kind === "grass" ? "Clear grass" : "Score goal";
    return `<div class="objective ${goal.kind} ${goal.current >= goal.target ? "done" : ""}" aria-label="${label}: ${Math.min(goal.current, goal.target)} of ${goal.target}">${visual}<div class="objective-copy"><span class="label">${label}</span><div class="count">${fmt(Math.min(goal.current, goal.target))} <span>/ ${fmt(goal.target)}</span></div><div class="objective-track"><div class="objective-fill" style="width:${Math.min(100, goal.current / goal.target * 100)}%"></div></div></div>`;
  }).join("");
}
function renderBoard(snapshot) {
  const hadFocus = document.activeElement?.closest("#board");
  $("#board").setAttribute("aria-busy", String(busy));
  $("#board").innerHTML = snapshot.board.map((row, r) => row.map((tile, c) => {
    const grass = snapshot.grass[r][c];
    const special = tile?.special;
    const breed = tile && tile.breed >= 0 ? BREEDS[tile.breed].name : "Rainbow paw";
    const label = `Row ${r + 1}, column ${c + 1}: ${breed}${special ? ", " + special + " special" : ""}${grass ? ", " + grass + " grass layer" + (grass > 1 ? "s" : "") : ""}`;
    return `<button class="tile ${grass ? "grass" : ""} ${grass > 1 ? "grass-double" : ""} ${selected?.r === r && selected?.c === c ? "selected" : ""}" data-r="${r}" data-c="${c}" data-breed="${tile?.breed ?? -2}" style="--tile-bg:${tile && tile.breed >= 0 ? TILE_COLORS[tile.breed] : "#f6f1e7"}" tabindex="${focusedCell.r === r && focusedCell.c === c ? 0 : -1}" aria-label="${esc(label)}" aria-pressed="${selected?.r === r && selected?.c === c}" ${busy || !tile || snapshot.won || snapshot.lost ? "disabled" : ""}>${tile ? special === "rainbow" ? `<span class="rainbow-paw">${icon("paw")}</span>` : `<img src="${ART}dog-${tile.breed}.svg" alt="" draggable="false">${special ? `<span class="special-badge">${special === "row" ? "\u2194" : special === "column" ? "\u2195" : icon("blast")}</span>` : ""}` : ""}</button>`;
  }).join("")).join("");
  if (hadFocus && !busy) document.querySelector(`.tile[data-r="${focusedCell.r}"][data-c="${focusedCell.c}"]`)?.focus({ preventScroll: true });
}
function renderAll() {
  displayed = game.snapshot();
  renderHud(displayed);
  renderBoard(displayed);
  renderMap();
  renderWallet();
}
function localWallet() {
  const state = save.offlineWallet;
  if (state.lives < 5 && !state.nextLifeAt) state.nextLifeAt = Date.now() + 18e5;
  if (state.nextLifeAt && Date.now() >= state.nextLifeAt) {
    const count = 1 + Math.floor((Date.now() - state.nextLifeAt) / 18e5);
    state.lives = Math.min(5, state.lives + count);
    state.nextLifeAt = state.lives === 5 ? null : state.nextLifeAt + count * 18e5;
    persist();
  }
  return state;
}
var ApiError = class extends Error {
  constructor(message, code) {
    super(message);
    __publicField(this, "code", code);
  }
};
async function api(route, payload, long = false) {
  const response = await fetch("/api/puppy/" + route, {
    credentials: "same-origin",
    cache: "no-store",
    ...payload === void 0 ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) },
    signal: AbortSignal.timeout(long ? 75e3 : 8e3)
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.error || "Something went wrong. Please try again.", response.status);
  return data;
}
var walletRefreshInFlight = null;
function refreshWallet() {
  if (walletRefreshInFlight) return walletRefreshInFlight;
  walletRefreshInFlight = (async () => {
    try {
      wallet = await api("state");
      connected = true;
      for (const pending of [...save.pendingFinishes]) {
        try {
          wallet = await api("attempt/finish", pending);
          save.pendingFinishes = save.pendingFinishes.filter((item) => item.attemptId !== pending.attemptId);
          persist();
        } catch {
        }
      }
    } catch {
      connected = false;
    } finally {
      renderWallet();
      walletRefreshInFlight = null;
    }
  })();
  return walletRefreshInFlight;
}
var ready;
async function ensureAttempt() {
  await ready;
  if (run.attemptId) return true;
  if (connected && save.pendingFinishes.length) {
    await refreshWallet();
    if (connected && save.pendingFinishes.length) {
      toast("Your last result is still syncing. Please try again in a moment.");
      return false;
    }
  }
  if (connected && wallet) {
    try {
      if (wallet.activeAttemptId) run.attemptId = wallet.activeAttemptId;
      else {
        wallet = await api("attempt/start", {});
        run.attemptId = wallet.activeAttemptId || wallet.attemptId;
      }
      run.mode = "online";
    } catch (error) {
      if (error instanceof ApiError && error.code === 409) {
        await refreshWallet();
        if (wallet?.activeAttemptId) {
          run.attemptId = wallet.activeAttemptId;
          run.mode = "online";
        }
      }
      if (!run.attemptId) {
        if (error instanceof ApiError && (error.code === 402 || error.code === 409 && !wallet?.totalAttempts)) showShop();
        else {
          toast(error instanceof Error ? error.message : "Cannot start this attempt. Try again.");
          await refreshWallet();
        }
        return false;
      }
    }
  } else {
    const state = localWallet();
    if (state.lives <= 0) {
      showShop();
      return false;
    }
    state.lives--;
    state.nextLifeAt || (state.nextLifeAt = Date.now() + 18e5);
    run.attemptId = "offline-" + seed();
    run.mode = "offline";
  }
  persist();
  renderWallet();
  return true;
}
async function finishAttempt(outcome) {
  if (!run.attemptId) return;
  const attemptId = run.attemptId;
  if (run.mode === "online") {
    const pending = { attemptId, outcome };
    if (!save.pendingFinishes.some((item) => item.attemptId === attemptId)) save.pendingFinishes.push(pending);
    persist();
    try {
      wallet = await api("attempt/finish", pending);
      connected = true;
      save.pendingFinishes = save.pendingFinishes.filter((item) => item.attemptId !== attemptId);
    } catch {
      toast("Your result is saved. We\u2019ll sync your attempt when you reconnect.");
    }
  } else if (outcome === "won") {
    save.offlineWallet.lives = Math.min(5, localWallet().lives + 1);
    if (save.offlineWallet.lives === 5) save.offlineWallet.nextLifeAt = null;
  }
  run.attemptId = null;
  persist();
  renderWallet();
}
async function animate(result) {
  let lastCombo = 0;
  for (const frame of result.frames) {
    if (frame.cleared.length) {
      for (const point of frame.cleared) document.querySelector(`.tile[data-r="${point.r}"][data-c="${point.c}"]`)?.classList.add("clearing");
      sound("match", frame.combo);
      if (frame.combo > 1 && frame.combo !== lastCombo) {
        $("#combo-area").innerHTML = `<div class="board-combo">${frame.combo === 2 ? "Pawsome!" : frame.combo === 3 ? "Puppy power!" : "Un-fur-gettable!"} \xD7${frame.combo}</div>`;
        status(`${frame.combo} cascades! Those tails are wagging.`, true);
      }
      lastCombo = frame.combo;
      await sleep(140);
    }
    displayed = frame.snapshot;
    renderHud(displayed);
    renderBoard(displayed);
    await sleep(frame.combo === 0 ? 100 : 90);
  }
  $("#combo-area").innerHTML = "";
}
async function doSwap(a, b) {
  if (busy || displayed.won || displayed.lost) return;
  busy = true;
  selected = null;
  activeBooster = null;
  renderBoard(displayed);
  renderWallet();
  try {
    if (!await ensureAttempt()) return;
    const result = game.swap(a, b);
    if (!result.valid) {
      sound("invalid");
      status("Not quite! Try matching three of the same puppy.");
      await sleep(120);
      return;
    }
    run.actions.push({ kind: "swap", a, b });
    persist();
    await animate(result);
    if (result.combos <= 1) status(["Lovely little match!", "Some very happy puppies.", "That\u2019s a good bunch of pals!", "Look at those happy faces!"][Math.floor(Math.random() * 4)], true);
    await checkResult();
  } catch (error) {
    toast(error instanceof Error ? error.message : "Please try that move again.");
  } finally {
    busy = false;
    renderAll();
  }
}
async function doBooster(kind, target) {
  if (busy || !save.boosters[kind] || displayed.won || displayed.lost) return;
  busy = true;
  selected = null;
  activeBooster = null;
  renderWallet();
  try {
    if (!await ensureAttempt()) return;
    const result = game.useBooster(kind, target);
    if (!result.valid) {
      status(result.reason || "Choose a puppy for your booster.");
      return;
    }
    save.boosters[kind]--;
    run.actions.push({ kind, target });
    persist();
    await animate(result);
    status(kind === "shuffle" ? "A fresh little mix of friends." : "A little helping paw goes a long way.", true);
    await checkResult();
  } finally {
    busy = false;
    renderAll();
  }
}
function selectCell(point) {
  if (busy || displayed.won || displayed.lost) return;
  focusedCell = point;
  if (activeBooster) {
    void doBooster(activeBooster, point);
    return;
  }
  if (selected && Math.abs(selected.r - point.r) + Math.abs(selected.c - point.c) === 1) {
    void doSwap(selected, point);
    return;
  }
  selected = selected?.r === point.r && selected.c === point.c ? null : point;
  sound("tap");
  renderBoard(displayed);
  if (selected) status("Now choose a neighboring puppy to swap.");
}
async function checkResult() {
  const final = game.snapshot();
  if (!final.won && !final.lost) return;
  if (!run.resultHandled) {
    run.resultHandled = true;
    if (final.won) {
      const stars = final.moves >= game.level.moves * 0.35 ? 3 : final.moves >= game.level.moves * 0.15 ? 2 : 1;
      const firstWin = !save.stars[run.level - 1];
      save.stars[run.level - 1] = Math.max(stars, save.stars[run.level - 1]);
      save.best[run.level - 1] = Math.max(final.score, save.best[run.level - 1]);
      save.unlocked = Math.min(100, Math.max(save.unlocked, run.level + 1));
      save.coins += firstWin ? 40 + stars * 20 : 10;
    }
    persist();
    await finishAttempt(final.won ? "won" : "lost");
  }
  showResult(final.won);
}
function startLevel(level) {
  if (level < 1 || level > save.unlocked || level > 100) return;
  run = freshRun(level);
  game = new PuppyGame(level, run.seed);
  save.run = run;
  selected = null;
  activeBooster = null;
  chapter = game.level.chapter;
  persist();
  closeModal();
  renderAll();
  status(level === 1 ? "Tap two neighbors or swipe. Match three to make new pals." : game.level.description);
}
function requestLevel(level) {
  if (busy) return;
  if (run.attemptId && !displayed.won && !displayed.lost) {
    showModal("restart", `<img class="modal-hero" src="${ART}dog-1.svg" alt="Beagle"><h2>A fresh little start?</h2><p class="modal-subtitle">Leaving this level will use your current attempt. Your stars and completed levels are safe.</p><button class="primary-button" data-action="confirm-level" data-level="${level}">Start fresh ${icon("reset")}</button><button class="secondary-button" data-action="close">Keep playing</button>`);
  } else startLevel(level);
}
function hint() {
  if (busy || displayed.won || displayed.lost) return;
  activeBooster = null;
  selected = null;
  renderBoard(displayed);
  renderWallet();
  const move = game.hint();
  if (move) {
    [move.a, move.b].forEach((point) => document.querySelector(`.tile[data-r="${point.r}"][data-c="${point.c}"]`)?.classList.add("hint"));
    status("These two pals have something in common. Try swapping them!", true);
  }
}
function showModal(kind, content, wide = false) {
  closeModal(false);
  previousFocus = document.activeElement;
  modalKind = kind;
  const layer = document.createElement("div");
  layer.className = "modal-layer";
  layer.innerHTML = `<section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${kind === "shop" ? "Treat shop and extra attempts" : kind === "map" ? "100-level adventure" : "Puppy Pals"}"><button class="modal-close" data-action="close" aria-label="Close dialog">${icon("close")}</button>${content}</section>`;
  layer.addEventListener("click", (event) => {
    if (event.target === layer) closeModal();
  });
  document.body.append(layer);
  document.body.style.overflow = "hidden";
  layer.querySelector("button")?.focus();
}
function closeModal(restore = true) {
  document.querySelector(".modal-layer")?.remove();
  modalKind = "";
  document.body.style.overflow = "";
  if (restore && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
}
function showResult(won) {
  const snap = game.snapshot();
  if (won) {
    sound("win");
    confetti();
  }
  const stars = won ? snap.moves >= game.level.moves * 0.35 ? 3 : snap.moves >= game.level.moves * 0.15 ? 2 : 1 : 0;
  showModal("result", `<img class="modal-hero" src="${ART}dog-${won ? 0 : 4}.svg" alt="${won ? "Happy Corgi" : "Hopeful Pug"}"><h2>${won ? run.level === 100 ? "A hundred happy adventures!" : "Pawsitively brilliant!" : "So close, little pal."}</h2><p class="modal-subtitle">${won ? run.level === 100 ? "You\u2019ve completed every level. Your puppy pack couldn\u2019t be prouder!" : `Level ${run.level} complete. A whole pack of happy tails!` : "You\u2019re out of moves, but the puppies believe in you. Give it another go."}</p>${won ? `<div class="result-stars" aria-label="${stars} stars">${[1, 2, 3].map((n) => icon("star", n > stars ? "empty" : "")).join("")}</div>` : ""}<div class="result-stats"><div><strong>${fmt(snap.score)}</strong><span>YOUR SCORE</span></div><div><strong>${won ? snap.moves : wallet?.totalAttempts ?? localWallet().lives}</strong><span>${won ? "MOVES LEFT" : "ATTEMPTS LEFT"}</span></div></div><button class="primary-button" data-action="${won && run.level < 100 ? "next" : "retry"}">${won ? run.level < 100 ? "Meet the next adventure" : "Play this level again" : "Try again"} ${icon("chevron")}</button><button class="secondary-button" data-action="${won ? "map" : "shop"}">${icon(won ? "map" : "heart")}${won ? "Explore your adventure" : "More attempts"}</button><p class="modal-note">${won ? "You keep your attempt when you win. Good dog!" : "Free lives refill every 30 minutes. Take a little break anytime."}</p>`);
}
function showHelp() {
  showModal("help", `<img class="modal-hero" src="${ART}dog-2.svg" alt="Husky"><h2>Small matches. Big smiles.</h2><p class="modal-subtitle">Welcome to your happy little corner of the world.</p><div class="help-list"><div class="help-step"><span class="step-num">1</span><div><strong>Bring the pack together</strong><p>Tap two neighboring puppies, or swipe, to swap them. Match 3 or more of the same breed. On a keyboard, use arrows and Enter to choose.</p></div></div><div class="help-step"><span class="step-num">2</span><div><strong>Every level has a little mission</strong><p>Collect the puppies shown above the board, reach your score goal, or match over green grass to clear it. Finish every goal before your moves run out.</p></div></div><div class="help-step"><span class="step-num">3</span><div><strong>Make something pawsome</strong><p>Match 4 for a line blast, an L or T for a puppy burst, or 5 for a rainbow paw. Swap two specials for a bigger surprise!</p></div></div></div><div class="special-guide"><div>${icon("shuffle")}<strong>Match 4</strong><span>Clear a whole line</span></div><div>${icon("blast")}<strong>Match L or T</strong><span>A big puppy burst</span></div><div>${icon("rainbow")}<strong>Match 5</strong><span>Rainbow magic</span></div></div><p class="modal-note">Start with 5 free lives. One returns every 30 minutes. Wins keep your attempt; leaving a level or running out of moves uses it. Progress stays in this browser.</p><button class="primary-button" data-action="close" style="margin-top:19px">Let\u2019s make some pals ${icon("paw")}</button>`);
}
function showShop() {
  const native = isNative();
  const available = connected && !!wallet?.paymentsAvailable && !native;
  showModal("shop", `<h2>A little extra love.</h2><p class="modal-subtitle">Another chance to bring the pack together.</p><div class="life-row" aria-label="${connected ? wallet?.lives : localWallet().lives} free lives">${[0, 1, 2, 3, 4].map((i) => icon("heart", i >= (connected ? wallet?.lives ?? 0 : localWallet().lives) ? "empty" : "")).join("")}</div><p class="refill-time" id="refill-time"></p><div class="purchase-card"><div class="purchase-icon">${icon("heart")}</div><div class="purchase-detail"><strong>5 extra attempts</strong><span>Yours to use, whenever you like.</span></div><strong class="purchase-price">$0.99</strong></div><button class="primary-button paypal-button" data-action="purchase" ${available ? "" : "disabled"}>Get 5 attempts with <span class="paypal-mark">PayPal</span></button><div class="shop-note">${native ? "Purchases will be available through your app store in a future update. You can always play with free refilling lives." : available ? "A one-time purchase of $0.99 USD. No subscription. Attempts are added after PayPal confirms payment." : "Paid checkout is not available yet. Your free lives still refill every 30 minutes, and winning keeps your attempt."}</div>${!native ? '<p class="merchant-line">PayPal merchant: jasonwilliams1204@gmail.com</p>' : ""}${save.pendingPayment && connected && !native ? '<button class="secondary-button" data-action="check-payment">Check a previous payment</button>' : ""}<h3 class="shop-heading">A helping paw \xB7 ${fmt(save.coins)} treat coins</h3><div class="shop-boosters">${Object.entries(BOOSTERS).map(([kind, info]) => `<button class="shop-booster" data-action="buy-booster" data-booster="${kind}" ${save.coins < info.cost ? "disabled" : ""} aria-label="Buy ${info.name} for ${info.cost} treat coins"><span class="booster-icon ${kind}">${icon(kind)}</span><strong>${info.name}</strong><span class="cost">${icon("coin")}${info.cost}</span></button>`).join("")}</div><p class="modal-note">Earn treat coins by completing levels. Boosters never use a move.<br>Attempts and purchases are linked to this browser\u2019s session. Keep its cookies to keep your balance.</p>`);
  updateShopCountdown();
}
function updateShopCountdown() {
  const el = document.querySelector("#refill-time");
  if (!el) return;
  const lives = connected && wallet ? wallet.lives : localWallet().lives;
  const next = connected && wallet ? wallet.nextLifeAt : localWallet().nextLifeAt;
  const paid = connected && wallet?.paidAttempts ? ` \xB7 ${wallet.paidAttempts} extra attempts saved` : "";
  if (lives === 5) el.textContent = "Your free lives are full. Happy matching!" + paid;
  else if (next) {
    const seconds = Math.max(0, Math.ceil((next - Date.now()) / 1e3));
    el.textContent = `Next free life in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` + paid;
  }
}
function showMap() {
  showModal("map", '<h2>Your happy little journey.</h2><p class="modal-subtitle">100 levels. Six best friends. A whole lot of love.</p><div class="map-modal" id="modal-map"></div>', true);
  renderMap();
}
async function purchase() {
  if (isNative() || !wallet?.paymentsAvailable || busy) return;
  const button = document.querySelector('[data-action="purchase"]');
  if (button) {
    button.disabled = true;
    button.textContent = "Opening secure checkout\u2026";
  }
  try {
    const order = await api("paypal/orders", {}, true);
    const approval = new URL(order.approvalUrl);
    if (approval.protocol !== "https:" || !["www.paypal.com", "www.sandbox.paypal.com", "paypal.com", "sandbox.paypal.com"].includes(approval.hostname)) throw new Error("Checkout could not be verified. Please try again.");
    save.pendingPayment = order.orderId;
    persist();
    location.assign(approval.href);
  } catch (error) {
    toast(error instanceof Error ? error.message : "Checkout is unavailable. Please try later.");
    if (modalKind === "shop") showShop();
  }
}
async function capture(orderId) {
  if (!orderId || isNative()) return;
  showModal("payment", `<img class="modal-hero" src="${ART}dog-3.svg" alt="Poodle"><h2>Checking with PayPal\u2026</h2><p class="modal-subtitle">We\u2019ll add your five attempts once your payment is confirmed. Please keep this window open.</p>`);
  try {
    wallet = await api("paypal/capture", { orderId }, true);
    connected = true;
    save.pendingPayment = null;
    persist();
    renderWallet();
    closeModal();
    toast("Payment confirmed! Five extra attempts are ready for you.");
  } catch (error) {
    showModal("payment-error", `<img class="modal-hero" src="${ART}dog-4.svg" alt="Pug"><h2>Let\u2019s check that again.</h2><p class="modal-subtitle">${esc(error instanceof Error ? error.message : "We couldn\u2019t confirm this payment yet.")}</p><button class="primary-button" data-action="check-payment">Check payment status</button><button class="secondary-button" data-action="close">Back to the puppies</button><p class="modal-note">Don\u2019t pay again while a payment is being confirmed. Retrying the check will not buy another pack.</p>`);
  }
}
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 45; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.cssText = `left:${Math.random() * 100}%;background:${["#c2a4e7", "#f4ce88", "#b4d5b3", "#eeadc5", "#a6cee4"][i % 5]};--duration:${2 + Math.random() * 2}s;--delay:${Math.random() * 0.6}s;transform:rotate(${Math.random() * 180}deg)`;
    document.body.append(piece);
    setTimeout(() => piece.remove(), 5e3);
  }
}
async function install() {
  if (deferredInstall) {
    await deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
  } else showModal("install", `<img class="modal-hero" src="${ART}icon.svg" alt="Puppy Pals"><h2>Your pocketful of happy.</h2><p class="modal-subtitle">On iPhone or iPad, open this game in Safari, tap Share, then \u201CAdd to Home Screen.\u201D On Android or desktop, open your browser menu and choose \u201CInstall app\u201D or \u201CAdd to Home screen.\u201D</p><p class="modal-note">Open the game online once to save it for offline play. Purchases need an internet connection.</p><button class="primary-button" style="margin-top:20px" data-action="close">Got it ${icon("heart")}</button>`);
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.hasAttribute("disabled")) return;
  const action = button.dataset.action;
  if (action === "close") closeModal();
  else if (action === "help") showHelp();
  else if (action === "shop") showShop();
  else if (action === "map") showMap();
  else if (action === "play") {
    if (displayed.won || displayed.lost) showResult(displayed.won);
    else $("#board").scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else if (action === "sound") {
    save.sound = !save.sound;
    persist();
    renderWallet();
    sound("tap");
  } else if (action === "hint") hint();
  else if (action === "restart" || action === "retry") requestLevel(run.level);
  else if (action === "next") startLevel(Math.min(100, run.level + 1));
  else if (action === "level") requestLevel(Number(button.dataset.level));
  else if (action === "confirm-level") {
    if (!busy) {
      busy = true;
      void finishAttempt("abandoned").then(() => {
        busy = false;
        startLevel(Number(button.dataset.level));
      });
    }
  } else if (action === "chapter-prev" || action === "chapter-next") {
    chapter = Math.max(1, Math.min(10, chapter + (action === "chapter-next" ? 1 : -1)));
    renderMap();
  } else if (action === "booster") {
    if (busy || displayed.won || displayed.lost) return;
    const kind = button.dataset.booster;
    if (!save.boosters[kind]) {
      showShop();
      return;
    }
    if (kind === "shuffle") void doBooster(kind);
    else {
      activeBooster = activeBooster === kind ? null : kind;
      selected = null;
      renderBoard(displayed);
      renderWallet();
      status(activeBooster ? `Choose a puppy. ${BOOSTERS[kind].description}` : "Tap two neighboring puppies to swap.", !!activeBooster);
    }
  } else if (action === "buy-booster") {
    const kind = button.dataset.booster;
    if (save.coins >= BOOSTERS[kind].cost) {
      save.coins -= BOOSTERS[kind].cost;
      save.boosters[kind]++;
      persist();
      renderWallet();
      showShop();
      toast(`${BOOSTERS[kind].name} added to your helping paws.`);
    }
  } else if (action === "daily") {
    if (Date.now() - save.dailyAt >= 864e5) {
      save.coins += 50;
      save.boosters.shuffle++;
      save.dailyAt = Date.now();
      persist();
      renderWallet();
      toast("A treat for a good pal: 50 coins and one shuffle. Come back in 24 hours!");
    }
  } else if (action === "purchase") void purchase();
  else if (action === "check-payment" && save.pendingPayment) void capture(save.pendingPayment);
  else if (action === "install") void install();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    selected = null;
    activeBooster = null;
    renderBoard(displayed);
    renderWallet();
  }
  const modal = document.querySelector(".modal");
  if (modal && event.key === "Tab") {
    const focusable = Array.from(modal.querySelectorAll("button:not(:disabled),a[href]"));
    if (event.shiftKey && document.activeElement === focusable[0]) {
      event.preventDefault();
      focusable.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
      event.preventDefault();
      focusable[0]?.focus();
    }
  }
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstall = event;
});
window.addEventListener("online", () => {
  void refreshWallet();
});
window.addEventListener("offline", () => {
  connected = false;
  renderWallet();
});
shell();
renderAll();
status("Tap two neighbors or swipe. Match three to make new pals.");
var board = $("#board");
board.addEventListener("click", (event) => {
  if (suppressNextPointerClick) {
    suppressNextPointerClick = false;
    if (event.detail > 0) return;
  }
  const tile = event.target.closest(".tile");
  if (tile) selectCell({ r: Number(tile.dataset.r), c: Number(tile.dataset.c) });
});
var pointer = null;
board.addEventListener("pointerdown", (event) => {
  suppressNextPointerClick = false;
  const tile = event.target.closest(".tile");
  if (!tile || busy || event.button !== 0) return;
  pointer = { point: { r: Number(tile.dataset.r), c: Number(tile.dataset.c) }, x: event.clientX, y: event.clientY, id: event.pointerId };
  try {
    tile.setPointerCapture(event.pointerId);
  } catch {
  }
});
board.addEventListener("pointerup", (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const start = pointer;
  pointer = null;
  const dx = event.clientX - start.x, dy = event.clientY - start.y;
  if (Math.hypot(dx, dy) > 18 && !busy && !activeBooster) {
    suppressNextPointerClick = true;
    const target = Math.abs(dx) > Math.abs(dy) ? { r: start.point.r, c: start.point.c + Math.sign(dx) } : { r: start.point.r + Math.sign(dy), c: start.point.c };
    if (target.r >= 0 && target.r < 8 && target.c >= 0 && target.c < 8) void doSwap(start.point, target);
  }
});
board.addEventListener("pointercancel", () => {
  pointer = null;
  suppressNextPointerClick = false;
});
board.addEventListener("keydown", (event) => {
  if (busy) return;
  const tile = event.target.closest(".tile");
  if (!tile) return;
  const current = { r: Number(tile.dataset.r), c: Number(tile.dataset.c) };
  const directions = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (directions[event.key]) {
    event.preventDefault();
    const [dr, dc] = directions[event.key];
    focusedCell = { r: Math.max(0, Math.min(7, current.r + dr)), c: Math.max(0, Math.min(7, current.c + dc)) };
    document.querySelectorAll(".tile").forEach((el) => el.setAttribute("tabindex", "-1"));
    const next = document.querySelector(`.tile[data-r="${focusedCell.r}"][data-c="${focusedCell.c}"]`);
    next.tabIndex = 0;
    next.focus();
  }
});
ready = refreshWallet();
void ready.then(async () => {
  const query = new URLSearchParams(location.search);
  if (query.get("payment") === "return" && query.get("token")) {
    const order = query.get("token");
    if (save.pendingPayment && save.pendingPayment !== order) toast("This payment link doesn\u2019t match your pending checkout. Check your previous payment in the shop.");
    else {
      save.pendingPayment = order;
      persist();
      await capture(order);
    }
    history.replaceState(null, "", location.pathname);
  } else if (query.get("payment") === "cancelled") {
    toast("Checkout cancelled. No extra attempts were added.");
    history.replaceState(null, "", location.pathname);
  } else if (displayed.won || displayed.lost) await checkResult();
});
setInterval(() => {
  updateShopCountdown();
  if (connected && wallet?.nextLifeAt && Date.now() >= wallet.nextLifeAt) void refreshWallet();
  else if (!connected) {
    localWallet();
    renderWallet();
  }
}, 1e3);
if ("serviceWorker" in navigator && !isNative()) window.addEventListener("load", () => {
  void navigator.serviceWorker.register("/sw.js").catch(() => {
  });
});
persist();
