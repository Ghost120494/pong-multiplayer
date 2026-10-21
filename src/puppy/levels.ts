/** Campaign data shared by the browser, engine, and gameplay checks. */
import { discoveryForLevel, getUnlockedBreeds, isPicnicLevel } from './progression';

export type CampaignRules = 1 | 2;
export const LEVEL_COUNT = 180;
export const CHAPTER_COUNT = 18;
export type ObjectiveConfig = {
  kind: "collect" | "grass" | "score" | "special" | "cascade";
  breed?: number;
  target: number;
};

export type LevelConfig = {
  number: number;
  name: string;
  chapter: number;
  chapterName: string;
  moves: number;
  description: string;
  objectives: ObjectiveConfig[];
  /** Number of dog breeds in the refill pool, starting with BREEDS[0]. */
  breeds: number;
  /** Each patch may need one or two matches to clear. */
  grassLayers: number;
  /** Number of distinct cells initially covered by grass. */
  grassCount: number;
  /** V2 keeps a small board palette while rotating newly discovered breed IDs. */
  breedPool?: readonly number[];
  bonusMoves?: number;
  startingSpecial?: 'row' | 'column';
};

export const BREEDS = Object.freeze([
  Object.freeze({ id: 0, name: "Corgi", color: "#eea65d" }),
  Object.freeze({ id: 1, name: "Beagle", color: "#bd8264" }),
  Object.freeze({ id: 2, name: "Husky", color: "#8da9cd" }),
  Object.freeze({ id: 3, name: "Poodle", color: "#e8a9cb" }),
  Object.freeze({ id: 4, name: "Pug", color: "#c5b378" }),
  Object.freeze({ id: 5, name: "Dalmatian", color: "#aa9fc7" }),
  Object.freeze({ id: 6, name: "Golden Retriever", color: "#e7bb63" }),
  Object.freeze({ id: 7, name: "Boston Terrier", color: "#8e9daf" }),
  Object.freeze({ id: 8, name: "Shiba Inu", color: "#e79464" }),
  Object.freeze({ id: 9, name: "Dachshund", color: "#a77d63" }),
  Object.freeze({ id: 10, name: "Samoyed", color: "#bad5da" }),
  Object.freeze({ id: 11, name: "Border Collie", color: "#90a69a" }),
]);

const CHAPTERS = [
  {
    name: "Sunny Meadows",
    levels: ["Hello, Puppy!", "Best Buddies", "Happy Howls", "Paw Prints", "A Little Overgrown", "Pug Hugs", "Playdate", "Meadow Magic", "Spot the Spots", "Picnic Pals"],
  },
  {
    name: "Biscuit Bay",
    levels: ["Sandy Paws", "Beach Buddies", "Seashell Shuffle", "Corgi Cove", "Tidal Treats", "Salty Snoots", "Digging Deep", "Driftwood Dash", "Sunset Fetch", "Beach Party"],
  },
  {
    name: "Clover Woods",
    levels: ["Into the Woods", "Clover Crew", "Fern Friends", "Hidden Trail", "Mossy Mischief", "Woodland Woofs", "Acorn Adventure", "Leafy Leaps", "Forest Fetch", "Treehouse Treats"],
  },
  {
    name: "Poodle Park",
    levels: ["Park Patrol", "Fluffy Friends", "Fountain Frolic", "Top-Dog Topiary", "Garden Games", "Pretty in Pink", "Prancing Paws", "Secret Garden", "Perfect Playdate", "Poodle Parade"],
  },
  {
    name: "Maple Village",
    levels: ["Welcome Home", "Maple Mischief", "Cozy Corners", "Cobbled Paws", "Village Green", "Bakery Buddies", "Market Mayhem", "Autumn Amble", "Golden Leaves", "Harvest Howl"],
  },
  {
    name: "Snowy Snoots",
    levels: ["First Snow", "Husky Huddle", "Frosty Fetch", "Snowball Shuffle", "Icy Paws", "Cocoa Cuddles", "Winter Walkies", "Snowdrift Sprint", "Aurora Pals", "Snow Day!"],
  },
  {
    name: "Peach Blossom Hills",
    levels: ["Blossom Bound", "Petal Pals", "Peachy Paws", "Hilltop Howls", "Overgrown Orchard", "Spring Snuggles", "Breezy Buddies", "Petal Path", "Blossom Bonanza", "Peach Picnic"],
  },
  {
    name: "Moonlight Meadow",
    levels: ["After-Dark Adventure", "Starlit Snoots", "Firefly Friends", "Midnight Mischief", "Moonlit Grass", "Dreamy Dogs", "Lunar Leaps", "Twilight Trail", "Starry Shuffle", "Full-Moon Fetch"],
  },
  {
    name: "Rainbow Ridge",
    levels: ["A Splash of Color", "Rainbow Rovers", "Cloud Cuddles", "Prismatic Paws", "Colorful Clearing", "Golden Good Dogs", "Sky-High Snoots", "Brightest Buddies", "Over the Rainbow", "Pot of Puppies"],
  },
  {
    name: "Puppy Paradise",
    levels: ["Paradise Found", "Best Friends Forever", "The Big Playdate", "Pawsome Partners", "Grand Garden", "Puppy Power", "One Last Walk", "All Paws Together", "Almost Home", "Puppy Pals Forever"],
  },
] as const;

function makeLegacyLevel(number: number): LevelConfig {
  const chapterIndex = Math.floor((number - 1) / 10);
  const stage = (number - 1) % 10;
  const chapter = CHAPTERS[chapterIndex];
  const breeds = number < 9 ? 5 : 6;
  const featuredBreed = number === 1 ? 0 : (number - 1) % breeds;
  const secondBreed = (featuredBreed + 2 + (chapterIndex % 3)) % breeds;
  const scoreTarget = 900 + chapterIndex * 220 + stage * 50;
  const singleTarget = 12 + chapterIndex * 2 + Math.floor(stage / 3) * 2;
  const dualTarget = 10 + chapterIndex + Math.floor(stage / 4);
  const hasGrass = number >= 5 && [4, 7, 9].includes(stage);
  const grassLayers = hasGrass && chapterIndex >= 5 && stage !== 4 ? 2 : hasGrass ? 1 : 0;
  const grassCount = hasGrass ? Math.min(40, 12 + chapterIndex * 3 + (stage === 9 ? 4 : stage === 7 ? 2 : 0)) : 0;
  const dualBreed = stage === 3 || stage === 6 || stage === 9;
  const objectives: ObjectiveConfig[] = [];

  if (dualBreed) {
    objectives.push({ kind: "collect", breed: featuredBreed, target: dualTarget });
    objectives.push({ kind: "collect", breed: secondBreed, target: dualTarget });
  } else if (!hasGrass || stage === 9) {
    objectives.push({ kind: "collect", breed: featuredBreed, target: singleTarget });
  }
  if (hasGrass) objectives.push({ kind: "grass", target: grassCount * grassLayers });
  // Every level has a clear scoring goal, except two-breed garden finales where
  // three collection goals are already enough to communicate at a glance.
  if (!(hasGrass && dualBreed)) objectives.push({ kind: "score", target: scoreTarget });

  const moves = number === 1 ? 24 : Math.min(34, 24 + Math.floor(stage / 2) + Math.floor(chapterIndex / 2) + (grassLayers === 2 ? 2 : 0));
  const breedGoal = dualBreed
    ? `Bring ${BREEDS[featuredBreed].name} and ${BREEDS[secondBreed].name} pals together.`
    : `Match ${BREEDS[featuredBreed].name} faces to make new friends.`;
  const description = hasGrass
    ? `${grassLayers === 2 ? "Clear two layers of" : "Clear the"} grass to uncover a place for your puppy pals to play.`
    : number === 1
      ? "Match three or more of the same puppy. Meet your first Corgi pals!"
      : breedGoal;

  objectives.forEach(Object.freeze);
  Object.freeze(objectives);
  return Object.freeze({
    number,
    name: chapter.levels[stage],
    chapter: chapterIndex + 1,
    chapterName: chapter.name,
    moves,
    description,
    objectives,
    breeds,
    grassLayers,
    grassCount,
  });
}

/** Original definitions are frozen for exact replay of existing version-1 runs. */
export const LEGACY_LEVELS = Object.freeze(Array.from({ length: 100 }, (_, index) => makeLegacyLevel(index + 1)));

const NEW_CHAPTERS = [
  { name: "Golden Grove", levels: ["A Golden Hello", "Grove Greetings", "Sunbeam Snoots", "Golden Garden", "Biscuit Branches", "Leaf-Pile Pals", "Treetop Treats", "Honeycomb Howls", "Grove Together", "Sunny Grove Picnic"] },
  { name: "Terrier Terrace", levels: ["Terrace Welcome", "Tuxedo Tails", "Cobblestone Crew", "Flowerpot Friends", "Terrier Trot", "Tumbling Terrace", "Rooftop Rovers", "Balcony Buddies", "Terrace Twinkles", "The Great Little Terrace"] },
  { name: "Marshmallow Mountain", levels: ["Mountain Welcome", "A Fluffy New Friend", "Marshmallow Mittens", "Cloud-Soft Climb", "Snowy Snuggles", "Pillow Peak", "Flurry of Friends", "Snowflakes and Specials", "The Cozy Summit", "Mountain of Smiles"] },
  { name: "Ribbon River", levels: ["Riverbank Welcome", "Ribbon Rovers", "Skipping-Stone Snoots", "Riverside Rest", "Lilypad Pals", "Bubbling Brook", "Otterly Happy Pups", "A Bridge of Friends", "Drifting Daisies", "Ribbon River Garden"] },
  { name: "Collie Coast", levels: ["Coastal Welcome", "Sandy Smiles", "Pebble Pals", "Lighthouse Lookout", "Saltwater Snuggles", "A Clever New Friend", "Coastal Collection", "Tidepool Together", "Sailboat Snoots", "Collie Coast Celebration"] },
  { name: "Starflower Vale", levels: ["Vale of Welcome", "Coastal Cascade Capers", "Starflower Stroll", "Petal-Patch Pups", "Wishing-Well Woofs", "Dewdrop Darlings", "Twinkling Trail", "Starflower Picnic", "Sweetest Stargazers", "A Vale Full of Love"] },
  { name: "Festival Fields", levels: ["Festival Welcome", "Ribbon-Race Rovers", "Confetti Corgis", "Festival of Specials", "Bunting Buddies", "Lantern-Light Pals", "Puppy Parade Practice", "Field of Friendly Faces", "The Treat-Stand Trail", "Homecoming Picnic"] },
  { name: "Homecoming Hollow", levels: ["Welcome to the Hollow", "Favorite Little Faces", "A Path of Pawprints", "The Friendship Bridge", "Homeward Howls", "The Homeward Garden", "One More Happy Match", "Every Puppy Together", "A Very Good Adventure", "Home Is Where the Pups Are"] },
] as const;
const CAMPAIGN_CHAPTERS = [...CHAPTERS, ...NEW_CHAPTERS];

const INTRO_NAMES: Readonly<Record<number, string>> = Object.freeze({
  2: 'A Little Helping Paw', 8: 'The First Little Garden', 14: 'A Fresh Mix of Friends',
  20: 'Better Together', 26: 'A Golden Lucky Start', 32: 'Into the Tall Grass',
  38: 'A Rainbow Kind of Day', 44: 'Make Something Pawsome', 50: 'The Treat Trail',
  56: 'Cascade Capers', 62: 'Your Lucky Trail Charm', 68: 'All Paws Together',
  74: 'A Fox-Red Friend', 80: 'Moonlight Garden Party', 86: 'Picnic Above the Clouds',
  92: 'Ridge of Little Wonders', 98: 'A Long-Eared Welcome',
});

function boardPalette(number: number): readonly number[] {
  const unlocked = getUnlockedBreeds(number);
  if (unlocked.length <= 6) return Object.freeze(unlocked);
  const newest = unlocked[unlocked.length - 1];
  const familiar = unlocked.slice(0, -1);
  const start = Math.floor((number - 1) / 10) % familiar.length;
  // The newest friend is always present, with five familiar breeds rotating by chapter.
  return Object.freeze([...Array.from({ length: 5 }, (_, offset) => familiar[(start + offset) % familiar.length]), newest]);
}

function makeLevel(number: number): LevelConfig {
  const chapterIndex = Math.floor((number - 1) / 10);
  const stage = (number - 1) % 10;
  const chapter = CAMPAIGN_CHAPTERS[chapterIndex];
  const breedPool = boardPalette(number);
  const discovery = discoveryForLevel(number);
  const welcome = !!discovery && discovery.kind !== 'challenge';
  const picnic = isPicnicLevel(number);
  const featuredBreed = welcome ? breedPool[breedPool.length - 1] : breedPool[(number - 1) % breedPool.length];
  const secondBreed = breedPool[(breedPool.indexOf(featuredBreed) + 2) % breedPool.length];
  const scoreTarget = Math.min(3200, 900 + chapterIndex * 120 + stage * 40);
  const singleTarget = 12 + Math.floor(chapterIndex / 3) * 2;
  const dualTarget = 10 + Math.floor(chapterIndex / 4);
  let grassLayers = number >= 8 && [4, 7, 9].includes(stage) ? number >= 32 && stage !== 4 ? 2 : 1 : 0;
  let grassCount = grassLayers ? Math.min(26, 8 + Math.floor(chapterIndex * 1.1) + (stage === 9 ? 4 : 0)) : 0;
  const dual = number >= 20 && [3, 6, 9].includes(stage);
  const specialGoal = number >= 44 && [2, 6].includes(stage);
  const cascadeGoal = number >= 56 && [1, 8].includes(stage);
  let objectives: ObjectiveConfig[];
  let description: string;

  if (welcome || picnic) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: 'collect', breed: featuredBreed, target: 12 }, { kind: 'score', target: Math.max(800, scoreTarget - 300) }];
    description = welcome ? discovery!.description : 'A gentle picnic for the pack. Enjoy a familiar match and your earned picnic perks.';
  } else if (number === 8) {
    grassLayers = 1; grassCount = 8;
    objectives = [{ kind: 'grass', target: 8 }, { kind: 'score', target: 800 }];
    description = discovery!.description;
  } else if (number === 20) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: 'collect', breed: featuredBreed, target: 8 }, { kind: 'collect', breed: secondBreed, target: 8 }, { kind: 'score', target: 1200 }];
    description = discovery!.description;
  } else if (number === 32) {
    grassLayers = 2; grassCount = 8;
    objectives = [{ kind: 'grass', target: 16 }, { kind: 'score', target: 1100 }];
    description = discovery!.description;
  } else if (number === 44 || specialGoal || [92, 128, 164].includes(number)) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: 'special', target: number === 44 ? 1 : Math.min(3, 1 + Math.floor((number - 44) / 60)) }, { kind: 'collect', breed: featuredBreed, target: singleTarget }];
    description = 'Make specials with matches of four, five, or an L or T shape. Newly created specials count; clearing existing ones does not.';
  } else if (number === 56 || cascadeGoal || [116, 152].includes(number)) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: 'cascade', target: number === 56 ? 1 : Math.min(4, 1 + Math.floor((number - 56) / 40)) }, { kind: 'score', target: scoreTarget }];
    description = 'Set off happy chain reactions. Each clearing stage after the first in a chain adds one cascade to the goal.';
  } else if (number === 68 || [104, 140, 176].includes(number)) {
    grassLayers = number >= 104 ? 2 : 1; grassCount = number === 68 ? 12 : 16;
    objectives = [{ kind: 'collect', breed: featuredBreed, target: 14 }, { kind: 'grass', target: grassCount * grassLayers }, { kind: 'score', target: scoreTarget }];
    description = 'Bring the pack together, clear the garden, and reach the score goal. Every familiar skill has a place here.';
  } else {
    objectives = [];
    if (dual) {
      objectives.push({ kind: 'collect', breed: featuredBreed, target: dualTarget }, { kind: 'collect', breed: secondBreed, target: dualTarget });
    } else if (!grassLayers) objectives.push({ kind: 'collect', breed: featuredBreed, target: singleTarget });
    if (grassLayers) objectives.push({ kind: 'grass', target: grassCount * grassLayers });
    if (objectives.length < 3) objectives.push({ kind: 'score', target: scoreTarget });
    description = grassLayers
      ? `${grassLayers === 2 ? 'Clear two layers of' : 'Clear the'} grass to make room for the puppy picnic.`
      : dual ? `Bring ${BREEDS[featuredBreed].name} and ${BREEDS[secondBreed].name} pals together.`
      : `Match ${BREEDS[featuredBreed].name} faces to make new friends.`;
  }
  if (number === 1) description = 'Tap two neighboring puppies to swap. Match three of the same face and bring your first pals together.';
  objectives.forEach(Object.freeze);
  const bonusMoves = number >= 26 && picnic ? 2 : 0;
  const startingSpecial = number >= 62 && picnic ? chapterIndex % 2 === 0 ? 'row' : 'column' : undefined;
  return Object.freeze({
    number, name: INTRO_NAMES[number] || chapter.levels[stage], chapter: chapterIndex + 1, chapterName: chapter.name,
    moves: Math.min(32, 24 + Math.floor(chapterIndex / 3) + Math.floor(stage / 3)),
    description, objectives: Object.freeze(objectives) as unknown as ObjectiveConfig[], breeds: breedPool.length,
    breedPool, grassLayers, grassCount, ...(bonusMoves ? { bonusMoves } : {}), ...(startingSpecial ? { startingSpecial } : {}),
  });
}

export const LEVELS = Object.freeze(Array.from({ length: LEVEL_COUNT }, (_, index) => makeLevel(index + 1)));

export function getLevel(number: number, ruleset: CampaignRules = 2): LevelConfig {
  if (ruleset !== 1 && ruleset !== 2) throw new RangeError('Choose a supported Puppy Pals campaign.');
  const campaign = ruleset === 1 ? LEGACY_LEVELS : LEVELS;
  if (!Number.isInteger(number) || number < 1 || number > campaign.length) {
    throw new RangeError(`Choose a Puppy Pals level between 1 and ${campaign.length}.`);
  }
  return campaign[number - 1];
}
