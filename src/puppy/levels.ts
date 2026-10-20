/** Campaign data shared by the browser, engine, and gameplay checks. */
export type ObjectiveConfig = {
  kind: "collect" | "grass" | "score";
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
};

export const BREEDS = Object.freeze([
  Object.freeze({ id: 0, name: "Corgi", color: "#eea65d" }),
  Object.freeze({ id: 1, name: "Beagle", color: "#bd8264" }),
  Object.freeze({ id: 2, name: "Husky", color: "#8da9cd" }),
  Object.freeze({ id: 3, name: "Poodle", color: "#e8a9cb" }),
  Object.freeze({ id: 4, name: "Pug", color: "#c5b378" }),
  Object.freeze({ id: 5, name: "Dalmatian", color: "#aa9fc7" }),
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

function makeLevel(number: number): LevelConfig {
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

/** All 100 levels have stable, version-independent goals and names. */
export const LEVELS = Object.freeze(Array.from({ length: 100 }, (_, index) => makeLevel(index + 1)));

export function getLevel(number: number): LevelConfig {
  if (!Number.isInteger(number) || number < 1 || number > LEVELS.length) {
    throw new RangeError("Choose a Puppy Pals level between 1 and 100.");
  }
  return LEVELS[number - 1];
}
