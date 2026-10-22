var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __publicField = (obj, key2, value) => __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);

// src/puppy/progression.ts
var BOOSTER_UNLOCKS = Object.freeze({ paw: 2, shuffle: 14, rainbow: 38 });
var BREED_UNLOCKS = Object.freeze([1, 1, 1, 1, 1, 14, 26, 50, 74, 98, 122, 146, 194, 266, 338, 410]);
var NEW_PUPPY_WELCOMES = Object.freeze({
  194: { id: "german-shepherd", breed: 12, title: "Meet the German Shepherd", description: "A bright-eyed shepherd joins the orchard trail. Meet your new pal in a gentle welcome with your earned picnic perks." },
  266: { id: "schnauzer", breed: 13, title: "Meet the Schnauzer", description: "Meet a cheerful little pup with silver eyebrows and a wonderful whiskery smile. Enjoy an easy welcome together." },
  338: { id: "cocker-spaniel", breed: 14, title: "Meet the Cocker Spaniel", description: "A soft-eared new friend is ready for a picnic. Match those honey-colored ears and enjoy your familiar picnic bonuses." },
  410: { id: "bernese", breed: 15, title: "Meet the Bernese", description: "A gentle mountain pup with warm brown cheeks joins your pack. Celebrate with a welcoming picnic and familiar matches." }
});
var LATER_CHALLENGES = [
  { challenge: "grass", title: "A garden worth sharing", description: "Revisit the garden: match over grass squares to clear their layers, then reach the score goal." },
  { challenge: "dual", title: "Two pals, one happy trail", description: "Bring two familiar puppy breeds together. Watch both collection goals as you make your matches." },
  { challenge: "special", title: "A few special little matches", description: "Create specials with matches of four, five, or an L or T shape. Newly made specials count toward the goal." },
  { challenge: "cascade", title: "Let the good matches tumble", description: "Set off extra matches as the puppies fall. Every clearing stage after the first in a chain adds to your cascade goal." },
  { challenge: "mixed", title: "A little of everything you know", description: "Bring one favorite breed together, clear a small garden, and reach the score goal using your familiar skills." }
];
var LATER_PICNICS = ["A shady little picnic", "A sunny welcome break", "A trail full of treats", "A picnic with old friends", "A cozy pause for the pack", "A happy little reunion"];
var LATER_DISCOVERIES = Array.from({ length: 54 }, (_, index) => {
  const level = 182 + index * 6;
  const puppy = NEW_PUPPY_WELCOMES[level];
  if (puppy) return { ...puppy, level, kind: "puppy" };
  if (index % 2 === 0) return {
    id: `picnic-${level}`,
    level,
    kind: "bonus",
    title: LATER_PICNICS[Math.floor(index / 2) % LATER_PICNICS.length],
    description: "Enjoy a gentler picnic with two extra opening moves, a striped puppy, and 25 extra coins for your first win. All the little helps you already know."
  };
  const challenge = LATER_CHALLENGES[Math.floor(index / 2) % LATER_CHALLENGES.length];
  return { ...challenge, id: `trail-${challenge.challenge}-${level}`, level, kind: "challenge" };
});
var DISCOVERIES = Object.freeze([
  { id: "paw-pop", level: 2, kind: "bonus", title: "A little helping paw", description: "Meet Paw pop! Try your two free pops to clear a puppy without spending a move.", booster: "paw", amount: 2 },
  { id: "first-grass", level: 8, kind: "challenge", title: "A little overgrown", description: "Match over green grass to clear it. Paw pop can reach a stubborn patch, too." },
  { id: "shuffle", level: 14, kind: "bonus", title: "A fresh mix of friends", description: "Two free shuffles and a spotted new friend! Mix it up rearranges the pups without using a move.", booster: "shuffle", amount: 2 },
  { id: "dalmatian", level: 14, kind: "puppy", title: "Meet the Dalmatian", description: "A spotted sweetheart joins the pack. Look for the white face with black spots.", breed: 5 },
  { id: "dual-goals", level: 20, kind: "challenge", title: "Better together", description: "Collect two different puppy breeds in one level. A fresh shuffle can help you find both." },
  { id: "lucky-start", level: 26, kind: "bonus", title: "Lucky Start", description: "Picnic and welcome levels now begin with two extra moves. A Golden Retriever is here to celebrate." },
  { id: "golden-retriever", level: 26, kind: "puppy", title: "Meet the Golden Retriever", description: "A floppy-eared golden friend joins your sunny adventures.", breed: 6 },
  { id: "double-grass", level: 32, kind: "challenge", title: "Into the tall grass", description: "Darker grass has two layers. Clear the same square twice to let the flowers through." },
  { id: "rainbow", level: 38, kind: "bonus", title: "A rainbow kind of day", description: "Your free Rainbow clears every puppy of a chosen breed without spending a move.", booster: "rainbow", amount: 1 },
  { id: "special-makers", level: 44, kind: "challenge", title: "Make something pawsome", description: "Create a special puppy with a match of four, five, or an L or T shape. Clearing an existing special does not count." },
  { id: "treat-trail", level: 50, kind: "bonus", title: "The Treat Trail", description: "First wins on picnic and welcome levels now earn 25 extra coins. Meet your Boston Terrier along the way." },
  { id: "boston-terrier", level: 50, kind: "puppy", title: "Meet the Boston Terrier", description: "This little tuxedo pup brings big ears and a bigger smile.", breed: 7 },
  { id: "cascade-capers", level: 56, kind: "challenge", title: "One happy match leads to another", description: "Let falling puppies make extra matches. Each clear after the first in a chain adds one cascade to your goal." },
  { id: "trail-charm", level: 62, kind: "bonus", title: "Your lucky Trail Charm", description: "Picnic and welcome levels now start with a striped puppy. Match it to clear a whole line." },
  { id: "mixed-finale", level: 68, kind: "challenge", title: "All paws together", description: "Bring your new skills together: collect a favorite breed, clear the garden, and reach the score goal." },
  { id: "shiba-inu", level: 74, kind: "puppy", title: "Meet the Shiba Inu", description: "A fox-red friend joins the moonlit trail. Enjoy a gentle welcome level with your picnic perks.", breed: 8 },
  { id: "moon-garden", level: 80, kind: "challenge", title: "Moonlight garden party", description: "Bring two breeds together while clearing a moonlit garden." },
  { id: "rainbow-picnic", level: 86, kind: "bonus", title: "A picnic above the clouds", description: "Take a gentler welcome break with extra moves and a striped puppy. Your first win adds picnic coins." },
  { id: "ridge-makers", level: 92, kind: "challenge", title: "Ridge of little wonders", description: "Practice making specials among the colors of Rainbow Ridge." },
  { id: "dachshund", level: 98, kind: "puppy", title: "Meet the Dachshund", description: "Long ears, a warm chocolate face, and a very happy little welcome party.", breed: 9 },
  { id: "golden-garden", level: 104, kind: "challenge", title: "The golden garden", description: "Plan a patient path through a new garden challenge." },
  { id: "grove-picnic", level: 110, kind: "bonus", title: "A sunny grove picnic", description: "Enjoy your opening stripe, extra moves, and first-win picnic coins in a gentler level." },
  { id: "terrace-cascades", level: 116, kind: "challenge", title: "Tumbling terrier terrace", description: "Let one clear lead into another as the terrace fills with playful pups." },
  { id: "samoyed", level: 122, kind: "puppy", title: "Meet the Samoyed", description: "A fluffy white cloud of a pup is waiting on Marshmallow Mountain.", breed: 10 },
  { id: "snowy-makers", level: 128, kind: "challenge", title: "Snowflakes and specials", description: "Make special puppies on your way through the snowy trail." },
  { id: "river-picnic", level: 134, kind: "bonus", title: "A little riverside rest", description: "A gentle picnic level gives your growing pack room to play with all three picnic perks." },
  { id: "ribbon-garden", level: 140, kind: "challenge", title: "Ribbon River garden", description: "Match carefully through a garden full of familiar friends." },
  { id: "border-collie", level: 146, kind: "puppy", title: "Meet the Border Collie", description: "A clever black-and-white friend joins the coast for the next stretch of your journey.", breed: 11 },
  { id: "coastal-cascades", level: 152, kind: "challenge", title: "Coastal cascade capers", description: "Find the little matches that start a bigger chain along the coast." },
  { id: "starflower-picnic", level: 158, kind: "bonus", title: "A starflower picnic", description: "Celebrate your full puppy pack in a gentle level with your earned picnic perks." },
  { id: "festival-makers", level: 164, kind: "challenge", title: "Festival of specials", description: "Put your match-making practice to work and create a few happy surprises." },
  { id: "homecoming-picnic", level: 170, kind: "bonus", title: "The homecoming picnic", description: "Gather your friends for one more gentle picnic before the final chapter." },
  { id: "homeward-garden", level: 176, kind: "challenge", title: "The homeward garden", description: "A final garden challenge brings your collection and clearing skills together." },
  ...LATER_DISCOVERIES
].map((discovery) => Object.freeze(discovery)));
function getUnlockedBreeds(level) {
  return BREED_UNLOCKS.flatMap((unlock, breed) => unlock <= level ? [breed] : []);
}
function nextDiscovery(level) {
  return DISCOVERIES.find((discovery) => discovery.level > level);
}
function discoveryForLevel(level) {
  return DISCOVERIES.find((discovery) => discovery.level === level);
}
function isPicnicLevel(level) {
  return level >= 1 && ((level - 1) % 10 === 0 || DISCOVERIES.some((discovery) => discovery.level === level && discovery.kind !== "challenge"));
}
function firstWinBonus(level) {
  return level >= 50 && isPicnicLevel(level) ? 25 : 0;
}

// src/puppy/levels.ts
var LEVEL_COUNT = 500;
var CHAPTER_COUNT = 50;
var BREEDS = Object.freeze([
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
  Object.freeze({ id: 12, name: "German Shepherd", color: "#bc9366" }),
  Object.freeze({ id: 13, name: "Schnauzer", color: "#a1a6b4" }),
  Object.freeze({ id: 14, name: "Cocker Spaniel", color: "#d4a278" }),
  Object.freeze({ id: 15, name: "Bernese", color: "#9a8c86" })
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
function makeLegacyLevel(number) {
  const chapterIndex = Math.floor((number - 1) / 10);
  const stage = (number - 1) % 10;
  const chapter = CHAPTERS[chapterIndex];
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
    name: chapter.levels[stage],
    chapter: chapterIndex + 1,
    chapterName: chapter.name,
    moves,
    description,
    objectives,
    breeds,
    grassLayers,
    grassCount
  });
}
var LEGACY_LEVELS = Object.freeze(Array.from({ length: 100 }, (_, index) => makeLegacyLevel(index + 1)));
var NEW_CHAPTERS = [
  { name: "Golden Grove", levels: ["A Golden Hello", "Grove Greetings", "Sunbeam Snoots", "Golden Garden", "Biscuit Branches", "Leaf-Pile Pals", "Treetop Treats", "Honeycomb Howls", "Grove Together", "Sunny Grove Picnic"] },
  { name: "Terrier Terrace", levels: ["Terrace Welcome", "Tuxedo Tails", "Cobblestone Crew", "Flowerpot Friends", "Terrier Trot", "Tumbling Terrace", "Rooftop Rovers", "Balcony Buddies", "Terrace Twinkles", "The Great Little Terrace"] },
  { name: "Marshmallow Mountain", levels: ["Mountain Welcome", "A Fluffy New Friend", "Marshmallow Mittens", "Cloud-Soft Climb", "Snowy Snuggles", "Pillow Peak", "Flurry of Friends", "Snowflakes and Specials", "The Cozy Summit", "Mountain of Smiles"] },
  { name: "Ribbon River", levels: ["Riverbank Welcome", "Ribbon Rovers", "Skipping-Stone Snoots", "Riverside Rest", "Lilypad Pals", "Bubbling Brook", "Otterly Happy Pups", "A Bridge of Friends", "Drifting Daisies", "Ribbon River Garden"] },
  { name: "Collie Coast", levels: ["Coastal Welcome", "Sandy Smiles", "Pebble Pals", "Lighthouse Lookout", "Saltwater Snuggles", "A Clever New Friend", "Coastal Collection", "Tidepool Together", "Sailboat Snoots", "Collie Coast Celebration"] },
  { name: "Starflower Vale", levels: ["Vale of Welcome", "Coastal Cascade Capers", "Starflower Stroll", "Petal-Patch Pups", "Wishing-Well Woofs", "Dewdrop Darlings", "Twinkling Trail", "Starflower Picnic", "Sweetest Stargazers", "A Vale Full of Love"] },
  { name: "Festival Fields", levels: ["Festival Welcome", "Ribbon-Race Rovers", "Confetti Corgis", "Festival of Specials", "Bunting Buddies", "Lantern-Light Pals", "Puppy Parade Practice", "Field of Friendly Faces", "The Treat-Stand Trail", "Homecoming Picnic"] },
  { name: "Homecoming Hollow", levels: ["Welcome to the Hollow", "Favorite Little Faces", "A Path of Pawprints", "The Friendship Bridge", "Homeward Howls", "The Homeward Garden", "One More Happy Match", "Every Puppy Together", "A Very Good Adventure", "Home Is Where the Pups Are"] }
];
var FURTHER_CHAPTERS = [
  ["Applewood Orchard", "Applewood"],
  ["Shepherd Gardens", "Shepherd"],
  ["Lavender Lane", "Lavender"],
  ["Cinnamon Cove", "Cinnamon"],
  ["Buttercup Bend", "Buttercup"],
  ["Pebblebrook Path", "Pebblebrook"],
  ["Honeybee Hollow", "Honeybee"],
  ["Willow Whiskers", "Willow"],
  ["Silver Birch Woods", "Silver Birch"],
  ["Schnauzer Square", "Whisker"],
  ["Dandelion Downs", "Dandelion"],
  ["Bluebell Crossing", "Bluebell"],
  ["Sunflower Station", "Sunflower"],
  ["Seashell Shores", "Seashell"],
  ["Juniper Junction", "Juniper"],
  ["Rosehip Ramble", "Rosehip"],
  ["Spaniel Springs", "Spaniel"],
  ["Cloverleaf Corner", "Cloverleaf"],
  ["Chestnut Courtyard", "Chestnut"],
  ["Firefly Falls", "Firefly"],
  ["Lemon Blossom Bay", "Lemon Blossom"],
  ["Acorn Avenue", "Acorn"],
  ["Heather Highlands", "Heather"],
  ["Mountain Paw Meadow", "Mountain Paw"],
  ["Bernese Brook", "Bernese"],
  ["Pinecone Promenade", "Pinecone"],
  ["Foxglove Fields", "Foxglove"],
  ["Daisychain Dunes", "Daisychain"],
  ["Starlight Steps", "Starlight"],
  ["Amberleaf Arcade", "Amberleaf"],
  ["Friendship Forest", "Friendship"],
  ["Forever Pals Park", "Forever Pals"]
].map(([name, theme]) => ({
  name,
  levels: ["Welcome", "Wander", "Wonders", "Buddies", "Garden", "Gathering", "Matchmakers", "Footprints", "Together", "Celebration"].map((suffix) => `${theme} ${suffix}`)
}));
var CAMPAIGN_CHAPTERS = [...CHAPTERS, ...NEW_CHAPTERS, ...FURTHER_CHAPTERS];
var INTRO_NAMES = Object.freeze({
  2: "A Little Helping Paw",
  8: "The First Little Garden",
  14: "A Fresh Mix of Friends",
  20: "Better Together",
  26: "A Golden Lucky Start",
  32: "Into the Tall Grass",
  38: "A Rainbow Kind of Day",
  44: "Make Something Pawsome",
  50: "The Treat Trail",
  56: "Cascade Capers",
  62: "Your Lucky Trail Charm",
  68: "All Paws Together",
  74: "A Fox-Red Friend",
  80: "Moonlight Garden Party",
  86: "Picnic Above the Clouds",
  92: "Ridge of Little Wonders",
  98: "A Long-Eared Welcome"
});
function boardPalette(number) {
  const unlocked = getUnlockedBreeds(number);
  if (unlocked.length <= 6) return Object.freeze(unlocked);
  const newest = unlocked[unlocked.length - 1];
  const familiar = unlocked.slice(0, -1);
  const start = Math.floor((number - 1) / 10) % familiar.length;
  return Object.freeze([...Array.from({ length: 5 }, (_, offset) => familiar[(start + offset) % familiar.length]), newest]);
}
function makeLevel(number) {
  const chapterIndex = Math.floor((number - 1) / 10);
  const stage = (number - 1) % 10;
  const chapter = CAMPAIGN_CHAPTERS[chapterIndex];
  const breedPool = boardPalette(number);
  const discovery = discoveryForLevel(number);
  const welcome = !!discovery && discovery.kind !== "challenge";
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
  let objectives;
  let description;
  if (welcome || picnic) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: "collect", breed: featuredBreed, target: 12 }, { kind: "score", target: Math.max(800, scoreTarget - 300) }];
    description = welcome ? discovery.description : "A gentle picnic for the pack. Enjoy a familiar match and your earned picnic perks.";
  } else if (number === 8) {
    grassLayers = 1;
    grassCount = 8;
    objectives = [{ kind: "grass", target: 8 }, { kind: "score", target: 800 }];
    description = discovery.description;
  } else if (number === 20) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: "collect", breed: featuredBreed, target: 8 }, { kind: "collect", breed: secondBreed, target: 8 }, { kind: "score", target: 1200 }];
    description = discovery.description;
  } else if (number === 32) {
    grassLayers = 2;
    grassCount = 8;
    objectives = [{ kind: "grass", target: 16 }, { kind: "score", target: 1100 }];
    description = discovery.description;
  } else if (number === 44 || specialGoal || [92, 128, 164].includes(number)) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: "special", target: number === 44 ? 1 : Math.min(3, 1 + Math.floor((number - 44) / 60)) }, { kind: "collect", breed: featuredBreed, target: singleTarget }];
    description = "Make specials with matches of four, five, or an L or T shape. Newly created specials count; clearing existing ones does not.";
  } else if (number === 56 || cascadeGoal || [116, 152].includes(number)) {
    grassLayers = grassCount = 0;
    objectives = [{ kind: "cascade", target: number === 56 ? 1 : Math.min(4, 1 + Math.floor((number - 56) / 40)) }, { kind: "score", target: scoreTarget }];
    description = "Set off happy chain reactions. Each clearing stage after the first in a chain adds one cascade to the goal.";
  } else if (number === 68 || [104, 140, 176].includes(number)) {
    grassLayers = number >= 104 ? 2 : 1;
    grassCount = number === 68 ? 12 : 16;
    objectives = [{ kind: "collect", breed: featuredBreed, target: 14 }, { kind: "grass", target: grassCount * grassLayers }, { kind: "score", target: scoreTarget }];
    description = "Bring the pack together, clear the garden, and reach the score goal. Every familiar skill has a place here.";
  } else {
    objectives = [];
    if (dual) {
      objectives.push({ kind: "collect", breed: featuredBreed, target: dualTarget }, { kind: "collect", breed: secondBreed, target: dualTarget });
    } else if (!grassLayers) objectives.push({ kind: "collect", breed: featuredBreed, target: singleTarget });
    if (grassLayers) objectives.push({ kind: "grass", target: grassCount * grassLayers });
    if (objectives.length < 3) objectives.push({ kind: "score", target: scoreTarget });
    description = grassLayers ? `${grassLayers === 2 ? "Clear two layers of" : "Clear the"} grass to make room for the puppy picnic.` : dual ? `Bring ${BREEDS[featuredBreed].name} and ${BREEDS[secondBreed].name} pals together.` : `Match ${BREEDS[featuredBreed].name} faces to make new friends.`;
  }
  if (number === 1) description = "Tap two neighboring puppies to swap. Match three of the same face and bring your first pals together.";
  objectives.forEach(Object.freeze);
  const bonusMoves = number >= 26 && picnic ? 2 : 0;
  const startingSpecial = number >= 62 && picnic ? chapterIndex % 2 === 0 ? "row" : "column" : void 0;
  return Object.freeze({
    number,
    name: INTRO_NAMES[number] || chapter.levels[stage],
    chapter: chapterIndex + 1,
    chapterName: chapter.name,
    moves: Math.min(32, 24 + Math.floor(chapterIndex / 3) + Math.floor(stage / 3)),
    description,
    objectives: Object.freeze(objectives),
    breeds: breedPool.length,
    breedPool,
    grassLayers,
    grassCount,
    ...bonusMoves ? { bonusMoves } : {},
    ...startingSpecial ? { startingSpecial } : {}
  });
}
function makeExtendedLevel(number) {
  const chapterIndex = Math.floor((number - 1) / 10);
  const extensionChapter = chapterIndex - 18;
  const stage = (number - 1) % 10;
  const chapter = CAMPAIGN_CHAPTERS[chapterIndex];
  const breedPool = boardPalette(number);
  const discovery = discoveryForLevel(number);
  const picnic = isPicnicLevel(number);
  const featuredBreed = discovery?.breed ?? breedPool[(extensionChapter + stage) % breedPool.length];
  const secondBreed = breedPool[(breedPool.indexOf(featuredBreed) + 2) % breedPool.length];
  const wave = extensionChapter % 4;
  const scoreTarget = 1800 + wave * 200 + stage * 60;
  const collectionTarget = 14 + wave * 2;
  const dualTarget = 9 + wave;
  const challenge = discovery?.challenge ?? ["mixed", "cascade", "special", "dual", "grass", "collection", "special", "mixed", "cascade", "garden-pals"][stage];
  let grassCount = 0, grassLayers = 0;
  let objectives;
  let description;
  if (picnic) {
    objectives = [{ kind: "collect", breed: featuredBreed, target: 12 }, { kind: "score", target: 1600 + wave * 150 }];
    description = discovery?.description ?? "A familiar picnic break: enjoy two extra opening moves, a striped puppy, and first-win treat coins.";
  } else if (challenge === "special") {
    objectives = [{ kind: "special", target: wave === 3 ? 3 : 2 }, { kind: "collect", breed: featuredBreed, target: collectionTarget }];
    description = "Create specials with matches of four, five, or an L or T shape, and bring a favorite breed together.";
  } else if (challenge === "cascade") {
    objectives = [{ kind: "cascade", target: wave >= 2 ? 3 : 2 }, { kind: "score", target: scoreTarget }];
    description = "Let falling puppies make extra matches. Each clearing stage after the first in a chain counts toward your cascade goal.";
  } else if (challenge === "dual") {
    objectives = [{ kind: "collect", breed: featuredBreed, target: dualTarget }, { kind: "collect", breed: secondBreed, target: dualTarget }, { kind: "score", target: scoreTarget }];
    description = `Bring ${BREEDS[featuredBreed].name} and ${BREEDS[secondBreed].name} pals together, then reach the score goal.`;
  } else if (challenge === "grass") {
    grassCount = 12 + wave * 2;
    grassLayers = extensionChapter % 3 === 0 ? 1 : 2;
    objectives = [{ kind: "grass", target: grassCount * grassLayers }, { kind: "score", target: scoreTarget }];
    description = `Match over the garden to clear ${grassLayers === 2 ? "both layers of" : "the"} grass and reach the score goal.`;
  } else if (challenge === "mixed" || challenge === "garden-pals") {
    grassCount = challenge === "garden-pals" ? 12 : 10 + wave * 2;
    grassLayers = extensionChapter % 3 === 0 ? 1 : 2;
    objectives = challenge === "garden-pals" ? [{ kind: "collect", breed: featuredBreed, target: dualTarget }, { kind: "collect", breed: secondBreed, target: dualTarget }, { kind: "grass", target: grassCount * grassLayers }] : [{ kind: "collect", breed: featuredBreed, target: collectionTarget }, { kind: "grass", target: grassCount * grassLayers }, { kind: "score", target: scoreTarget }];
    description = challenge === "garden-pals" ? "Bring two breeds together while clearing a small garden. Every goal uses a skill your pack already knows." : "Bring a favorite breed together, clear a small garden, and reach the score goal using your familiar skills.";
  } else {
    objectives = [{ kind: "collect", breed: featuredBreed, target: collectionTarget }, { kind: "score", target: scoreTarget }];
    description = `Enjoy a familiar collection level with your ${BREEDS[featuredBreed].name} pals.`;
  }
  objectives.forEach(Object.freeze);
  return Object.freeze({
    number,
    name: chapter.levels[stage],
    chapter: chapterIndex + 1,
    chapterName: chapter.name,
    moves: 30 + (wave >= 2 ? 1 : 0) + (stage === 9 ? 1 : 0),
    description,
    objectives: Object.freeze(objectives),
    breeds: breedPool.length,
    breedPool,
    grassLayers,
    grassCount,
    ...picnic ? { bonusMoves: 2, startingSpecial: chapterIndex % 2 === 0 ? "row" : "column" } : {}
  });
}
var LEVELS = Object.freeze(Array.from({ length: LEVEL_COUNT }, (_, index) => index < 180 ? makeLevel(index + 1) : makeExtendedLevel(index + 1)));
function getLevel(number, ruleset = 2) {
  if (ruleset !== 1 && ruleset !== 2) throw new RangeError("Choose a supported Puppy Pals campaign.");
  const campaign = ruleset === 1 ? LEGACY_LEVELS : LEVELS;
  if (!Number.isInteger(number) || number < 1 || number > campaign.length) {
    throw new RangeError(`Choose a Puppy Pals level between 1 and ${campaign.length}.`);
  }
  return campaign[number - 1];
}

// src/puppy/engine.ts
var BOARD_SIZE = 8;
var key = ({ r, c }) => r * BOARD_SIZE + c;
var coordinate = (index) => ({ r: Math.floor(index / BOARD_SIZE), c: index % BOARD_SIZE });
var inside = ({ r, c }) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
var adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
var normalBreed = (tile) => tile && tile.breed >= 0 && tile.special !== "rainbow" ? tile.breed : -1;
function analyzeMatches(board) {
  const runs = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; ) {
      const breed = normalBreed(board[r]?.[c]);
      let end = c + 1;
      while (breed >= 0 && end < BOARD_SIZE && normalBreed(board[r]?.[end]) === breed) end++;
      if (breed >= 0 && end - c >= 3) runs.push({ direction: "row", cells: Array.from({ length: end - c }, (_, i) => ({ r, c: c + i })) });
      c = end;
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r < BOARD_SIZE; ) {
      const breed = normalBreed(board[r]?.[c]);
      let end = r + 1;
      while (breed >= 0 && end < BOARD_SIZE && normalBreed(board[end]?.[c]) === breed) end++;
      if (breed >= 0 && end - r >= 3) runs.push({ direction: "column", cells: Array.from({ length: end - r }, (_, i) => ({ r: r + i, c })) });
      r = end;
    }
  }
  const groups = [];
  for (const run of runs) {
    const indexes = run.cells.map(key);
    const overlaps = groups.filter((group) => indexes.some((index) => group.cells.has(index)));
    if (!overlaps.length) {
      groups.push({ runs: [run], cells: new Set(indexes) });
      continue;
    }
    const merged = overlaps[0];
    merged.runs.push(run);
    indexes.forEach((index) => merged.cells.add(index));
    for (const other of overlaps.slice(1)) {
      merged.runs.push(...other.runs);
      other.cells.forEach((index) => merged.cells.add(index));
      groups.splice(groups.indexOf(other), 1);
    }
  }
  return groups.map((group) => {
    const longest = group.runs.reduce((a, b) => a.cells.length >= b.cells.length ? a : b);
    const horizontal = group.runs.find((run) => run.direction === "row");
    const vertical = group.runs.find((run) => run.direction === "column");
    const intersection = horizontal && vertical ? horizontal.cells.find((cell) => vertical.cells.some((other) => key(cell) === key(other))) : void 0;
    const special = longest.cells.length >= 5 ? "rainbow" : horizontal && vertical ? "bomb" : longest.cells.length === 4 ? longest.direction : null;
    return { cells: [...group.cells].map(coordinate), special, ...intersection ? { intersection } : {} };
  });
}
function findLegalMove(board) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const a = { r, c };
      for (const b of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (!inside(b) || !board[r]?.[c] || !board[b.r]?.[b.c]) continue;
        const first = board[r][c];
        const second = board[b.r][b.c];
        if (first.special === "rainbow" || second.special === "rainbow" || first.special && second.special) return { a, b };
        [board[a.r][a.c], board[b.r][b.c]] = [second, first];
        const matches = analyzeMatches(board);
        [board[a.r][a.c], board[b.r][b.c]] = [first, second];
        if (matches.some((group) => group.cells.some((cell) => key(cell) === key(a) || key(cell) === key(b)))) return { a, b };
      }
    }
  }
  return null;
}
var PuppyGame = class {
  constructor(levelNumber, seed, ruleset = 2) {
    __publicField(this, "ruleset", ruleset);
    __publicField(this, "level");
    __publicField(this, "breedPool");
    __publicField(this, "board");
    __publicField(this, "grass");
    __publicField(this, "moves");
    __publicField(this, "score", 0);
    __publicField(this, "objectives");
    __publicField(this, "won", false);
    __publicField(this, "lost", false);
    __publicField(this, "randomState");
    __publicField(this, "nextTileId", 1);
    this.level = getLevel(levelNumber, ruleset);
    this.breedPool = this.level.breedPool ?? Array.from({ length: this.level.breeds }, (_, i) => i);
    this.randomState = (Number.isFinite(seed) ? seed : Math.floor(Math.random() * 4294967296)) >>> 0;
    this.moves = this.level.moves + (this.level.bonusMoves ?? 0);
    this.objectives = this.level.objectives.map((objective) => ({ ...objective, current: 0 }));
    this.board = this.newPlayableBoard();
    this.grass = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    const grassCells = this.permute(Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i));
    for (const index of grassCells.slice(0, this.level.grassCount)) {
      const { r, c } = coordinate(index);
      this.grass[r][c] = this.level.grassLayers;
    }
    if (this.level.startingSpecial) this.board[3][3].special = this.level.startingSpecial;
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
  tile(breed = this.breedPool[Math.floor(this.random() * this.breedPool.length)], special = null) {
    return { id: this.nextTileId++, breed, special };
  }
  newPlayableBoard() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const board = Array.from({ length: BOARD_SIZE }, () => []);
      for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
        const excluded = /* @__PURE__ */ new Set();
        if (c >= 2 && board[r][c - 1].breed === board[r][c - 2].breed) excluded.add(board[r][c - 1].breed);
        if (r >= 2 && board[r - 1][c].breed === board[r - 2][c].breed) excluded.add(board[r - 1][c].breed);
        const breeds = this.breedPool.filter((breed) => !excluded.has(breed));
        board[r].push(this.tile(breeds[Math.floor(this.random() * breeds.length)]));
      }
      if (findLegalMove(board)) return board;
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
    if (this.ruleset === 1) {
      const counts2 = Array(this.level.breeds).fill(0);
      for (const row of this.board) for (const tile of row) if (tile && tile.breed >= 0) counts2[tile.breed]++;
      return counts2.indexOf(Math.max(...counts2));
    }
    const counts = new Map(this.breedPool.map((breed) => [breed, 0]));
    for (const row of this.board) for (const tile of row) if (tile && tile.breed >= 0) counts.set(tile.breed, (counts.get(tile.breed) ?? 0) + 1);
    let mostCommon = this.breedPool[0];
    for (const [breed, count] of counts) if (count > (counts.get(mostCommon) ?? 0)) mostCommon = breed;
    return mostCommon;
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
        const selected = [destination, origin, group.intersection].find((candidate) => candidate && group.cells.some((cell2) => key(cell2) === key(candidate)));
        const cell = selected ?? group.cells[Math.floor(group.cells.length / 2)];
        const breed = group.special === "rainbow" ? -1 : this.board[cell.r][cell.c].breed;
        return { cell, tile: this.tile(breed, group.special) };
      });
      const cleared = this.expandEffects(matched);
      combos++;
      for (const objective of this.objectives) {
        if (objective.kind === "special") objective.current = Math.min(objective.target, objective.current + spawns.length);
        if (objective.kind === "cascade" && combos > 1) objective.current = Math.min(objective.target, objective.current + 1);
      }
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

// src/puppy/progress-storage.ts
var timestamp = (data) => data && Number.isFinite(data.savedAt) && data.savedAt >= 0 ? Math.floor(data.savedAt) : 0;
var copy = (data) => JSON.parse(JSON.stringify(data));
function bounded(operation, timeoutMs) {
  let timer;
  return Promise.race([
    operation,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Device storage did not respond")), timeoutMs);
    })
  ]).finally(() => clearTimeout(timer));
}
function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
function createIndexedDbMirror(timeoutMs = 2e3) {
  let factory;
  try {
    factory = globalThis.indexedDB;
    if (!factory) return null;
  } catch {
    return null;
  }
  let connection;
  function open() {
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
      let settled = false;
      const request = factory.open("puppy-pals-progress", 1);
      const finish = (error, database) => {
        if (settled) {
          database?.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(database);
      };
      const timer = setTimeout(() => finish(new Error("Device storage is busy")), timeoutMs);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("saves")) request.result.createObjectStore("saves");
      };
      request.onerror = () => finish(request.error ?? new Error("Device storage is unavailable"));
      request.onblocked = () => finish(new Error("Another tab is updating device storage"));
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          connection = void 0;
        };
        finish(void 0, database);
      };
    });
    connection.catch(() => {
      connection = void 0;
    });
    return connection;
  }
  async function transact(key2, value) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const writing = value !== void 0;
      const transaction = database.transaction("saves", writing ? "readwrite" : "readonly");
      const store = transaction.objectStore("saves");
      let result = null;
      const timer = setTimeout(() => {
        try {
          transaction.abort();
        } catch {
        }
        reject(new Error("Device storage did not finish saving"));
      }, timeoutMs);
      transaction.oncomplete = () => {
        clearTimeout(timer);
        resolve(result);
      };
      transaction.onerror = transaction.onabort = () => {
        clearTimeout(timer);
        reject(transaction.error ?? new Error("Device storage could not save"));
      };
      const request = writing ? store.put(value, key2) : store.get(key2);
      if (!writing) request.onsuccess = () => {
        result = request.result ?? null;
      };
    });
  }
  return { read: (key2) => transact(key2), write: async (key2, data) => {
    await transact(key2, data);
  } };
}
var ProgressStore = class {
  constructor(key2, validate, options = {}) {
    __publicField(this, "key", key2);
    __publicField(this, "validate", validate);
    __publicField(this, "options", options);
    __publicField(this, "backupKey");
    __publicField(this, "recoveryKey");
    __publicField(this, "recoveryPendingKey");
    __publicField(this, "storage");
    __publicField(this, "mirror");
    __publicField(this, "clock");
    __publicField(this, "timeoutMs");
    __publicField(this, "current", null);
    __publicField(this, "revision", 0);
    __publicField(this, "localSavedAt", -1);
    __publicField(this, "mirrorSavedAt", -1);
    __publicField(this, "mirrorTail", Promise.resolve());
    __publicField(this, "restoring", null);
    __publicField(this, "mirrorReadConfirmed", false);
    __publicField(this, "pendingRecovery", null);
    this.backupKey = `${key2}:backup`;
    this.recoveryKey = `${key2}:recovery`;
    this.recoveryPendingKey = `${key2}:mirror-recovery-pending`;
    this.timeoutMs = Math.max(20, options.timeoutMs ?? 2e3);
    this.storage = options.storage === void 0 ? browserStorage() : options.storage;
    this.mirror = options.mirror === void 0 ? createIndexedDbMirror(this.timeoutMs) : options.mirror;
    this.clock = options.now ?? Date.now;
    try {
      const marker = JSON.parse(this.storage?.getItem(this.recoveryPendingKey) ?? "null");
      if (marker?.pending === true && typeof marker.id === "string") this.pendingRecovery = marker;
    } catch {
    }
  }
  get status() {
    if (!this.current) return { saved: false, savedAt: null, source: null };
    const at = timestamp(this.current);
    if (this.localSavedAt === at) return { saved: true, savedAt: at, source: "local" };
    if (this.mirrorSavedAt === at) return { saved: true, savedAt: at, source: "indexeddb" };
    return { saved: false, savedAt: at, source: null };
  }
  report() {
    try {
      this.options.onStatus?.(this.status);
    } catch {
    }
  }
  candidate(value) {
    try {
      if (value === null || value === void 0) return null;
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      const valid = this.validate(copy(parsed));
      if (!valid) return null;
      valid.savedAt = timestamp(parsed);
      return copy(valid);
    } catch {
      return null;
    }
  }
  recoveryRecord(value) {
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (parsed?.format !== "puppy-pals-recovery" || typeof parsed.id !== "string") return null;
      const progress = this.candidate(parsed.progress);
      if (!progress) return null;
      return { format: "puppy-pals-recovery", id: parsed.id, progress, archivedAt: Number.isFinite(parsed.archivedAt) ? parsed.archivedAt : 0 };
    } catch {
      return null;
    }
  }
  localRecovery() {
    try {
      return this.recoveryRecord(this.storage?.getItem(this.recoveryKey));
    } catch {
      return null;
    }
  }
  markUncertain() {
    this.pendingRecovery || (this.pendingRecovery = { pending: true, id: `${this.clock()}-${Math.random().toString(36).slice(2)}` });
    try {
      this.storage?.setItem(this.recoveryPendingKey, JSON.stringify(this.pendingRecovery));
    } catch {
    }
  }
  clearUncertainty() {
    this.pendingRecovery = null;
    try {
      this.storage?.setItem(this.recoveryPendingKey, "null");
    } catch {
    }
  }
  /** An earlier valid checkpoint, kept separate from the current adventure. */
  async recovery() {
    let newest = this.localRecovery();
    if (this.mirror) {
      try {
        const archived = this.recoveryRecord(await bounded(this.mirror.read(this.recoveryKey), this.timeoutMs));
        if (archived && (!newest || timestamp(archived.progress) > timestamp(newest.progress))) newest = archived;
      } catch {
      }
    }
    return newest ? copy(newest.progress) : null;
  }
  read() {
    let newest = null;
    for (const key2 of [this.key, this.backupKey]) {
      let candidate = null;
      try {
        candidate = this.candidate(this.storage?.getItem(key2));
      } catch {
      }
      if (candidate && (!newest || timestamp(candidate) > timestamp(newest))) newest = candidate;
    }
    if (newest) this.localSavedAt = timestamp(newest);
    if (this.current && (!newest || timestamp(this.current) > timestamp(newest))) newest = this.current;
    if (newest) this.current = copy(newest);
    this.report();
    return newest ? copy(newest) : null;
  }
  restore() {
    if (this.restoring) return this.restoring;
    this.restoring = this.restoreNewest().finally(() => {
      this.restoring = null;
    });
    return this.restoring;
  }
  async restoreNewest() {
    const revision = this.revision;
    const local = this.read();
    let mirrored = null;
    let mirrorReadSucceeded = false;
    if (this.mirror) {
      try {
        mirrored = this.candidate(await bounded(this.mirror.read(this.key), this.timeoutMs));
        mirrorReadSucceeded = true;
        this.mirrorReadConfirmed = true;
      } catch {
        this.markUncertain();
      }
    }
    if (this.revision !== revision) {
      this.report();
      return this.current ? copy(this.current) : null;
    }
    if (mirrored) this.mirrorSavedAt = timestamp(mirrored);
    const newest = mirrored && (!local || timestamp(mirrored) > timestamp(local)) ? mirrored : local;
    if (!newest) return null;
    this.current = copy(newest);
    if (this.writeLocal(newest)) this.localSavedAt = timestamp(newest);
    if (mirrorReadSucceeded && (!mirrored || timestamp(newest) > timestamp(mirrored))) this.queueMirror(newest);
    this.report();
    return copy(newest);
  }
  writeLocal(data) {
    if (!this.storage) return false;
    const serialized = JSON.stringify(data);
    let saved = false;
    for (const key2 of [this.backupKey, this.key]) {
      try {
        this.storage.setItem(key2, serialized);
        saved = true;
      } catch {
      }
    }
    return saved;
  }
  queueMirror(data) {
    if (!this.mirror) return;
    const snapshot = copy(data);
    this.mirrorTail = this.mirrorTail.then(async () => {
      try {
        if (!await this.prepareMirrorWrite()) {
          this.report();
          return;
        }
        await this.mirror.write(this.key, snapshot);
        this.mirrorSavedAt = timestamp(snapshot);
      } catch {
      }
      this.report();
    });
  }
  async prepareMirrorWrite() {
    if (!this.mirror || this.mirrorReadConfirmed && !this.pendingRecovery) return !!this.mirror;
    let existing;
    try {
      existing = this.candidate(await bounded(this.mirror.read(this.key), this.timeoutMs));
      this.mirrorReadConfirmed = true;
    } catch {
      this.markUncertain();
      return false;
    }
    if (!this.pendingRecovery) {
      if (!existing) return true;
      this.markUncertain();
    }
    if (existing) {
      const marker = this.pendingRecovery;
      let archived;
      try {
        archived = this.recoveryRecord(await bounded(this.mirror.read(this.recoveryKey), this.timeoutMs));
      } catch {
        return false;
      }
      if (!archived || archived.id !== marker.id) {
        const local = this.localRecovery();
        let progress = existing;
        for (const prior of [local, archived]) if (prior && timestamp(prior.progress) > timestamp(progress)) progress = prior.progress;
        archived = { format: "puppy-pals-recovery", id: marker.id, progress: copy(progress), archivedAt: this.clock() };
        try {
          await bounded(this.mirror.write(this.recoveryKey, archived), this.timeoutMs);
        } catch {
          return false;
        }
      }
      try {
        this.storage?.setItem(this.recoveryKey, JSON.stringify(archived));
      } catch {
      }
      try {
        this.options.onRecovery?.(copy(archived.progress));
      } catch {
      }
    }
    this.clearUncertainty();
    return true;
  }
  /** Returns true only when a current checkpoint was synchronously saved locally. */
  save(data) {
    let snapshot;
    try {
      const at = Math.max(1, Math.floor(this.clock()), timestamp(this.current) + 1);
      snapshot = copy({ ...data, savedAt: at });
      data.savedAt = at;
    } catch {
      this.report();
      return false;
    }
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
  async flush() {
    try {
      await bounded(this.mirrorTail, this.timeoutMs);
    } catch {
    }
    return this.status.saved;
  }
};

// src/puppy/profile.ts
var BOOSTERS = ["paw", "shuffle", "rainbow"];
var LEGACY_LEVEL_COUNT = 100;
var PREVIOUS_CAMPAIGN_LENGTHS = [LEGACY_LEVEL_COUNT, 180];
function emptySave() {
  return {
    version: 1,
    unlocked: 1,
    stars: Array(LEVEL_COUNT).fill(0),
    best: Array(LEVEL_COUNT).fill(0),
    coins: 120,
    boosters: { paw: 0, shuffle: 0, rainbow: 0 },
    discoveries: [],
    sound: false,
    dailyAt: 0,
    run: null,
    offlineWallet: { lives: 5, nextLifeAt: null },
    pendingFinishes: [],
    pendingPayment: null
  };
}
function record(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function coordinate2(value) {
  if (!record(value) || !Number.isInteger(value.r) || !Number.isInteger(value.c) || value.r < 0 || value.r >= 8 || value.c < 0 || value.c >= 8) return null;
  return { r: value.r, c: value.c };
}
function action(value) {
  if (!record(value)) return null;
  if (value.kind === "swap") {
    const a = coordinate2(value.a), b = coordinate2(value.b);
    return a && b ? { kind: "swap", a, b } : null;
  }
  if (value.kind === "shuffle") return { kind: "shuffle" };
  if (value.kind === "paw" || value.kind === "rainbow") {
    const target = coordinate2(value.target);
    return target ? { kind: value.kind, target } : null;
  }
  return null;
}
function validateSave(value) {
  try {
    if (!record(value) || value.version !== 1) return null;
    if (!Array.isArray(value.stars) || !Array.isArray(value.best) || value.stars.length !== value.best.length || ![...PREVIOUS_CAMPAIGN_LENGTHS, LEVEL_COUNT].includes(value.stars.length)) return null;
    if (!Number.isInteger(value.unlocked) || value.unlocked < 1 || value.unlocked > value.stars.length) return null;
    const base = emptySave();
    const count = (input, max) => Number.isInteger(input) && Number(input) >= 0 ? Math.min(Number(input), max) : 0;
    const time = (input) => typeof input === "number" && Number.isFinite(input) && input >= 0 ? input : 0;
    base.unlocked = value.unlocked;
    base.coins = count(value.coins, 1e6);
    base.sound = !!value.sound;
    base.dailyAt = time(value.dailyAt);
    if (typeof value.savedAt === "number" && Number.isFinite(value.savedAt) && value.savedAt >= 0) base.savedAt = value.savedAt;
    base.stars = base.stars.map((_, i) => count(value.stars[i], 3));
    base.best = base.best.map((_, i) => count(value.best[i], 1e9));
    for (const kind of BOOSTERS) base.boosters[kind] = count(record(value.boosters) ? value.boosters[kind] : void 0, 999);
    if (PREVIOUS_CAMPAIGN_LENGTHS.includes(base.unlocked) && base.stars[base.unlocked - 1] > 0) base.unlocked = Math.min(LEVEL_COUNT, base.unlocked + 1);
    if (value.discoveries === void 0) {
      base.discoveries = DISCOVERIES.filter((discovery) => discovery.level <= base.unlocked).map((discovery) => discovery.id);
    } else {
      if (!Array.isArray(value.discoveries)) return null;
      const known = new Set(DISCOVERIES.map((discovery) => discovery.id));
      base.discoveries = [...new Set(value.discoveries.filter((id) => typeof id === "string" && known.has(id)))];
    }
    if (record(value.offlineWallet)) base.offlineWallet = { lives: count(value.offlineWallet.lives, 5), nextLifeAt: typeof value.offlineWallet.nextLifeAt === "number" && Number.isFinite(value.offlineWallet.nextLifeAt) && value.offlineWallet.nextLifeAt >= 0 ? value.offlineWallet.nextLifeAt : null };
    if (Array.isArray(value.pendingFinishes)) base.pendingFinishes = value.pendingFinishes.filter((item) => record(item) && typeof item.attemptId === "string" && ["won", "lost", "abandoned"].includes(item.outcome)).slice(0, 20).map((item) => ({ attemptId: item.attemptId, outcome: item.outcome }));
    if (typeof value.pendingPayment === "string") base.pendingPayment = value.pendingPayment;
    if (value.run != null) {
      const input = value.run;
      if (!record(input) || !Number.isInteger(input.level) || input.level < 1 || input.level > base.unlocked || !Number.isInteger(input.seed) || !Array.isArray(input.actions) || input.actions.length > 1e3) return null;
      const ruleset = input.ruleset === void 0 ? 1 : input.ruleset;
      if (ruleset !== 1 && ruleset !== 2 || ruleset === 1 && input.level > LEGACY_LEVEL_COUNT) return null;
      const actions = [];
      for (const item of input.actions) {
        const parsed = action(item);
        if (!parsed) return null;
        actions.push(parsed);
      }
      base.run = {
        level: input.level,
        seed: input.seed,
        actions,
        ruleset,
        attemptId: typeof input.attemptId === "string" ? input.attemptId : null,
        mode: input.mode === "online" || input.mode === "offline" ? input.mode : null,
        resultHandled: !!input.resultHandled,
        ...typeof input.reservationId === "string" ? { reservationId: input.reservationId } : {}
      };
      const replay = new PuppyGame(base.run.level, base.run.seed, ruleset);
      for (const item of actions) {
        if (!(item.kind === "swap" ? replay.swap(item.a, item.b) : replay.useBooster(item.kind, item.target)).valid) return null;
      }
    }
    return base;
  } catch {
    return null;
  }
}

// src/puppy/app.ts
async function boot() {
  const KEY = "puppy-pals-save-v1";
  const ART = "/puppy-pals/art/";
  const TILE_COLORS = ["#fff0d9", "#f4e8d9", "#e2edf7", "#f6e5f0", "#efe5d2", "#eeebf7", "#f7edcc", "#e6e8f0", "#f6e0cf", "#eee0d1", "#e8f1f8", "#e5ece5", "#f2e3c9", "#e4e8ed", "#f8e9d1", "#e8e3dd"];
  const REGION_TONES = [
    ["#eee6f6", "#e4ddf1", "#716187"],
    ["#e0eff4", "#dcecf0", "#557986"],
    ["#fbebdb", "#f2e2cf", "#93754e"],
    ["#e3eee1", "#ddebd8", "#617d58"],
    ["#f3e4ed", "#eedce7", "#926e83"],
    ["#e4e9f5", "#dde5f3", "#647397"],
    ["#f8efdc", "#f1e7ce", "#958250"],
    ["#e3f0eb", "#dcece5", "#5f8276"]
  ];
  const BOOSTERS2 = {
    paw: { name: "Paw pop", cost: 40, description: "Clear one puppy without using a move." },
    shuffle: { name: "Mix it up", cost: 60, description: "Shuffle the board for a fresh start." },
    rainbow: { name: "Rainbow", cost: 80, description: "Clear every puppy of your chosen breed." }
  };
  const paths = {
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
  const icon = (name, cls = "") => `<svg viewBox="0 0 24 24" aria-hidden="true" class="${cls}">${paths[name] || paths.paw}</svg>`;
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (n) => n.toLocaleString();
  const $ = (selector) => document.querySelector(selector);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : ms));
  const isNative = () => !!window.Capacitor?.isNativePlatform?.() || ["capacitor:", "ionic:"].includes(location.protocol);
  let appMounted = false;
  let progressStatus = { saved: false, savedAt: null, source: null };
  let savingProgress = true;
  let saveGeneration = 0;
  let recoveryNoticeShown = false;
  const progressStore = new ProgressStore(KEY, validateSave, { onStatus(value) {
    progressStatus = value;
    if (appMounted) renderSaveStatus();
  }, onRecovery() {
    if (appMounted && !recoveryNoticeShown) {
      recoveryNoticeShown = true;
      toast("An earlier adventure was recovered. Open Save & restore to review it.");
    }
  } });
  const save = await progressStore.restore() || emptySave();
  let storageWarning = false;
  function persist() {
    const generation = ++saveGeneration;
    savingProgress = true;
    progressStore.save(save);
    void progressStore.flush().then((saved) => {
      if (generation !== saveGeneration) return;
      savingProgress = false;
      if (appMounted) renderSaveStatus();
      if (!saved && !storageWarning) {
        storageWarning = true;
        toast("A device save could not be confirmed. Use Save & restore to download a backup before closing the game.");
      }
    });
  }
  const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
  function freshRun(level) {
    return { level, seed: seed(), ruleset: 2, actions: [], attemptId: null, mode: null, resultHandled: false };
  }
  let run = save.run || freshRun(save.unlocked);
  let game = new PuppyGame(run.level, run.seed, run.ruleset ?? 1);
  try {
    for (const action2 of run.actions) {
      const result = action2.kind === "swap" ? game.swap(action2.a, action2.b) : game.useBooster(action2.kind, action2.target);
      if (!result.valid) throw new Error("Invalid saved move");
    }
  } catch {
    run = freshRun(save.unlocked);
    game = new PuppyGame(run.level, run.seed, run.ruleset ?? 1);
  }
  save.run = run;
  let selected = null;
  let activeBooster = null;
  let busy = false;
  let displayed = game.snapshot();
  let chapter = game.level.chapter;
  let connected = false;
  let wallet = null;
  let focusedCell = { r: 0, c: 0 };
  let modalKind = "";
  let previousFocus = null;
  let deferredInstall = null;
  let audio = null;
  let toastTimer;
  let suppressNextPointerClick = false;
  let importedProgress = null;
  let artworkReady = false;
  const tileViews = [];
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
  function boosterUnlocked(kind) {
    return save.unlocked >= BOOSTER_UNLOCKS[kind];
  }
  function claimDiscoveries(notify = false) {
    const newlyReached = DISCOVERIES.filter((discovery) => discovery.level <= save.unlocked && !save.discoveries.includes(discovery.id));
    for (const discovery of newlyReached) {
      save.discoveries.push(discovery.id);
      if (discovery.booster) save.boosters[discovery.booster] = Math.min(999, save.boosters[discovery.booster] + (discovery.amount || 1));
    }
    if (newlyReached.length) {
      persist();
      if (notify) toast(`A new discovery: ${newlyReached.map((discovery) => discovery.title).join(" \xB7 ")}. Open your discovery journal to meet it.`);
    }
  }
  function discoveryVisual(discovery, unlocked = true) {
    return discovery.breed !== void 0 && unlocked ? `<img src="${ART}dog-${discovery.breed}.svg" alt="${esc(BREEDS[discovery.breed].name)}">` : icon(unlocked ? discovery.kind === "challenge" ? "grass" : discovery.booster || "gift" : "lock");
  }
  function renderDiscoveries() {
    const reached = DISCOVERIES.filter((discovery2) => discovery2.level === run.level);
    const upcoming = nextDiscovery(save.unlocked);
    const discovery = reached[0] || upcoming;
    const bonus = run.ruleset === 2 ? [game.level.bonusMoves ? `+${game.level.bonusMoves} starting moves` : "", game.level.startingSpecial ? "A free opening line blast" : "", firstWinBonus(run.level) ? `+${firstWinBonus(run.level)} coins on your first win` : ""].filter(Boolean).join(" \xB7 ") : "";
    $("#discovery-banner").innerHTML = discovery ? `<button class="discovery-preview ${reached.length ? "new-discovery" : ""}" data-action="discoveries">${discoveryVisual(discovery, discovery.level <= save.unlocked)}<span><span class="discovery-eyebrow">${reached.length ? "A new little discovery" : `Coming at level ${discovery.level}`}</span><strong>${esc(discovery.title)}</strong><span class="discovery-detail">${esc(reached.length ? discovery.description : bonus || "A new friend, a little help, or a fresh challenge.")}</span></span>${icon("chevron")}</button>` : `<button class="discovery-preview" data-action="discoveries">${icon("paw")}<span><span class="discovery-eyebrow">Your growing adventure</span><strong>Look how far your pack has come.</strong><span class="discovery-detail">${esc(bonus || "Revisit your discoveries and favorite puppy pals.")}</span></span>${icon("chevron")}</button>`;
    $("#breed-collection").innerHTML = BREEDS.map((breed, i) => {
      const unlocked = save.unlocked >= BREED_UNLOCKS[i];
      return `<div class="breed-swatch ${unlocked ? "" : "breed-locked"}" data-breed="${i}"><div class="breed-picture" style="--tile-bg:${TILE_COLORS[i]}">${unlocked ? `<img src="${ART}dog-${i}.svg" alt="${esc(breed.name)}">` : icon("lock")}</div><span>${unlocked ? esc(breed.name) : `Level ${BREED_UNLOCKS[i]}`}</span></div>`;
    }).join("");
  }
  function showDiscoveries(showAll = false) {
    const recent = DISCOVERIES.reduce((last, discovery, i) => discovery.level <= save.unlocked ? i : last, 0);
    const start = showAll ? 0 : Math.max(0, recent - 5);
    const discoveries = showAll ? DISCOVERIES : DISCOVERIES.slice(start, start + 14);
    const overview = save.unlocked <= 72 ? ["First friends \xB7 1\u201324", "Growing together \xB7 25\u201348", "Puppy explorers \xB7 49\u201372"].map((act, i) => `<div class="${save.unlocked >= i * 24 + 1 ? "reached" : ""}"><span>WALK ${i + 1}</span><strong>${act}</strong></div>`).join("") : [[`${save.stars.filter(Boolean).length} / ${LEVEL_COUNT}`, "LEVELS COMPLETE"], [`${BREED_UNLOCKS.filter((level) => level <= save.unlocked).length} / ${BREEDS.length}`, "PUPPY PALS"], [String(DISCOVERIES.filter((discovery) => discovery.level <= save.unlocked).length), "DISCOVERIES"]].map(([value, label]) => `<div class="reached"><span>${label}</span><strong>${value}</strong></div>`).join("");
    showModal("discoveries", `<h2>A little more to discover.</h2><p class="modal-subtitle">Meet new pups, try a helping paw, then put it to work. Every discovery waits for you to reach its level, at your own pace.</p><div class="journey-acts">${overview}</div>${start ? '<p class="journal-range">Your recent discoveries and what\u2019s just ahead.</p>' : ""}<div class="discovery-list">${discoveries.map((discovery) => {
      const unlocked = discovery.level <= save.unlocked;
      return `<article class="discovery-card ${unlocked ? "discovered" : "discovery-locked"}" data-discovery="${discovery.id}"><div class="discovery-picture">${discoveryVisual(discovery, unlocked)}</div><div><span class="discovery-eyebrow">Level ${discovery.level} \xB7 ${unlocked ? "Discovered" : "Up ahead"}${discovery.kind === "challenge" ? " \xB7 Challenge" : ""}</span><h3>${esc(discovery.title)}</h3><p>${esc(discovery.description)}</p>${discovery.booster ? `<span class="discovery-gift">${discovery.amount || 1} free ${esc(BOOSTERS2[discovery.booster].name)}${(discovery.amount || 1) > 1 ? " boosts" : " boost"}</span>` : ""}</div></article>`;
    }).join("")}</div>${discoveries.length < DISCOVERIES.length ? '<button class="secondary-button" data-action="all-discoveries">View the full discovery trail</button>' : ""}<p class="modal-note">No rush and no daily gates. Your discoveries and puppy collection stay saved with your adventure.</p>`, true);
  }
  function shell() {
    $("#app").innerHTML = `
  <header class="topbar">
    <a class="brand" href="/" aria-label="Puppy Pals home"><img class="brand-icon" src="${ART}icon.svg" alt=""><div><div class="brand-name">Puppy Pals</div><div class="brand-tag">MATCH. PLAY. FALL IN LOVE.</div></div></a>
    <div class="top-actions"><button class="icon-button" data-action="help" aria-label="How to play">${icon("help")}</button><button class="icon-button sound-toggle" data-action="sound" aria-label="Turn sound on">${icon("mute")}</button><span class="top-divider"></span><div class="coin-pill" title="Treat coins, earned by playing">${icon("coin")}<span id="coins">${fmt(save.coins)}</span></div><button class="wallet-pill" data-action="shop" aria-label="Lives and extra attempts">${icon("heart", "heart")}<span id="lives">5</span><span class="plus">+</span></button></div>
  </header>
  <main class="layout">
    <aside class="sidebar" aria-label="Adventure navigation">
      <nav class="nav-links"><button class="nav-button active" data-action="play">${icon("paw")}<span class="nav-label">Let's play</span></button><button class="nav-button" data-action="map">${icon("map")}<span class="nav-label">My adventure</span><span class="tiny-pill">${LEVEL_COUNT} levels</span></button><button class="nav-button" data-action="shop">${icon("bag")}<span class="nav-label">Treat shop</span></button></nav>
      <section class="adventure-card" id="sidebar-map" aria-label="Level map"></section>
      <section class="install-card"><h3>${icon("phone")}Your happy place, anywhere.</h3><p>Add Puppy Pals to your home screen for a little joy on the go.</p><button class="text-button" data-action="install">Get the app ${icon("chevron")}</button></section>
      <button class="nav-button" data-action="progress">${icon("cloud")}<span class="nav-label">Save & restore</span></button>
      <div class="sidebar-footer">A little kindness. A lot of puppies.<br><a href="/privacy.html">Privacy & your progress</a></div>
    </aside>
    <section class="game-column" aria-label="Puppy Pals game">
      <div class="welcome"><div class="eyebrow">${icon("paw")}A PAWSITIVELY LOVELY ADVENTURE</div><h1>A little match. <em>A lot of love.</em></h1><p>Bring your favorite puppy pals together, three at a time.</p></div>
      <section class="game-card">
        <div class="level-header"><div class="level-heading"><span class="level-badge">${icon("paw")}</span><div><div class="level-label" id="level-label"></div><h2 id="level-title"></h2></div></div><div class="level-tools"><button class="small-icon" data-action="restart" aria-label="Restart level">${icon("reset")}</button><div class="moves-box" id="moves-box"><strong class="moves-number" id="moves">24</strong><span class="moves-label">moves<br>left</span></div></div></div>
        <div class="objectives" id="objectives" aria-label="Level goals"></div><section id="discovery-banner" class="discovery-banner" aria-label="Adventure discoveries"></section>
        <div class="board-wrap" data-loading="true"><div id="board" class="board" role="group" aria-label="8 by 8 dog matching board"></div><div class="board-loading" role="status">${icon("paw")}<span>Getting your pals ready\u2026</span></div><div id="combo-area" aria-live="off"></div></div>
        <div id="game-status" class="game-status" role="status" aria-live="polite"></div>
        <div class="game-bottom"><div><span class="score-label">YOUR SCORE</span><strong class="score-value" id="score">0</strong></div><button class="hint-button" data-action="hint">${icon("bulb")} A little hint</button></div>
      </section>
      <div class="booster-panel" aria-label="Boosters"><div class="booster-label">A little<br>helping paw</div>${Object.entries(BOOSTERS2).map(([kind, info]) => `<button class="booster" data-action="booster" data-booster="${kind}" title="${esc(info.description)}"><span class="booster-icon ${kind}">${icon(kind)}</span><span class="booster-name">${info.name}</span><span class="booster-count" id="count-${kind}">${save.boosters[kind]}</span></button>`).join("")}</div>
      <div class="game-footer"><button id="save-status" class="save-status" data-action="progress">${icon("cloud")}Saving progress\u2026</button><span id="connection" class="connection-status"><span class="connection-dot"></span>Connecting</span></div>
      <nav class="mobile-bottom" aria-label="Game menu"><button data-action="map">${icon("map")}Adventure</button><button data-action="help">${icon("help")}How to play</button><button data-action="sound" class="sound-toggle">${icon("mute")}Sound</button><button data-action="restart">${icon("reset")}Restart</button></nav>
    </section>
    <aside class="rightbar" aria-label="Your puppy pack">
      <section class="pack-card"><div class="card-kicker">${icon("heart")}YOUR GROWING PUPPY PACK</div><h3>Meet your new best friends.</h3><p class="intro">Different pups. One lovable pack.<br>Match their faces to make their day.</p><div class="breed-grid" id="breed-collection"></div><div class="pack-divider"></div><div class="pack-note">${icon("paw")}Each breed has a different face and color.<br>Because every puppy is special.</div></section>
      <section class="tip-card"><div class="card-kicker">${icon("bulb")}A LITTLE PUPPY WISDOM</div><h3>Good things come in threes.</h3><p>Swap two neighbors to match 3 pals.<br>Match 4 or 5 for a special surprise!</p><div class="match-demo"><img src="${ART}dog-0.svg" alt="Corgi"><img src="${ART}dog-0.svg" alt="Corgi"><img src="${ART}dog-0.svg" alt="Corgi"><span class="demo-result">${icon("heart")}</span></div></section>
      <div class="chapter-progress" id="campaign-progress"></div>
      <button class="daily-button" data-action="daily">${icon("gift")}<div><strong id="daily-label">Your daily little treat</strong><span id="daily-detail">50 treat coins + a free shuffle</span></div></button>
    </aside>
  </main>`;
  }
  function renderSaveStatus() {
    const button = document.querySelector("#save-status");
    if (!button) return;
    const text = progressStatus.saved ? "Progress saved on this device" : savingProgress ? "Saving progress\u2026" : "Save unavailable \xB7 download a backup";
    button.innerHTML = `${icon("cloud")}<span>${text}</span>`;
    button.dataset.saved = String(progressStatus.saved);
    button.title = progressStatus.savedAt ? `Last saved ${new Date(progressStatus.savedAt).toLocaleString()}. Open Save & restore for a backup.` : "Open Save & restore to download a backup.";
  }
  function mapHtml(inModal = false) {
    const start = (chapter - 1) * 10;
    const tone = REGION_TONES[Math.max(0, chapter - 19) % REGION_TONES.length];
    return `<div class="chapter-cover ${chapter > 18 ? "extended-region" : ""}" style="--chapter-sky:${tone[0]};--chapter-ground:${tone[1]};--chapter-ink:${tone[2]}"><div class="chapter-caption"><div class="eyebrow">YOUR NEXT HAPPY PLACE</div><h3>${esc(LEVELS[start].chapterName)}</h3></div></div><div class="chapter-switcher"><button data-action="chapter-prev" aria-label="Previous chapter" ${chapter === 1 ? "disabled" : ""}>${icon("back")}</button><span>Chapter ${chapter} of ${CHAPTER_COUNT}</span><button data-action="chapter-next" aria-label="Next chapter" ${chapter === CHAPTER_COUNT ? "disabled" : ""}>${icon("chevron")}</button></div><label class="chapter-picker" for="${inModal ? "chapter-jump" : "sidebar-chapter-jump"}"><span>Choose your next happy place</span><select id="${inModal ? "chapter-jump" : "sidebar-chapter-jump"}" data-action="chapter-jump" aria-label="Choose a chapter">${Array.from({ length: CHAPTER_COUNT }, (_, i) => `<option value="${i + 1}" ${chapter === i + 1 ? "selected" : ""}>${i + 1}. ${esc(LEVELS[i * 10].chapterName)}</option>`).join("")}</select></label><div class="level-trail">${LEVELS.slice(start, start + 10).map((level) => {
      const stars = save.stars[level.number - 1];
      const locked = level.number > save.unlocked;
      return `<div class="trail-item"><button class="level-node ${level.number === run.level ? "current" : stars ? "complete" : ""}" data-action="level" data-level="${level.number}" ${locked ? "disabled" : ""} aria-label="Level ${level.number}: ${esc(level.name)}${locked ? ", locked" : stars ? `, ${stars} stars` : ""}" ${level.number === run.level ? 'aria-current="step"' : ""}>${locked ? icon("lock") : level.number}</button><span aria-hidden="true" class="trail-stars ${stars ? "" : "empty"}">${"\u2605".repeat(stars)}${"\u2606".repeat(3 - stars)}</span></div>`;
    }).join("")}</div><div class="adventure-footer">${icon("lock")}A new adventure with every little win.</div>`;
  }
  function renderMap() {
    $("#sidebar-map").innerHTML = mapHtml();
    if (modalKind === "map") $("#modal-map").innerHTML = mapHtml(true);
    const completed = save.stars.filter(Boolean).length;
    $("#campaign-progress").innerHTML = `<div class="chapter-progress-top"><span>YOUR HAPPY LITTLE JOURNEY</span><strong>${completed} / ${LEVEL_COUNT}</strong></div><div class="chapter-progress-track"><div class="chapter-progress-fill" style="width:${completed / LEVEL_COUNT * 100}%"></div></div><p>One match closer to ${LEVEL_COUNT}<br>tail-wagging adventures.</p>`;
  }
  function renderWallet() {
    const offline = localWallet();
    const usingOffline = !connected || run.mode === "offline";
    const total = !usingOffline && wallet ? wallet.totalAttempts : offline.lives;
    $("#lives").textContent = String(total);
    $("#coins").textContent = fmt(save.coins);
    $("#connection").innerHTML = `<span class="connection-dot ${usingOffline ? "offline" : ""}"></span>${usingOffline ? "Offline play" : "Online"}`;
    renderSaveStatus();
    for (const kind of Object.keys(BOOSTERS2)) {
      $(`#count-${kind}`).textContent = String(save.boosters[kind]);
      const button = document.querySelector(`.booster[data-booster="${kind}"]`);
      button.hidden = !boosterUnlocked(kind);
      button.disabled = !boosterUnlocked(kind) || busy || !artworkReady || displayed.won || displayed.lost;
      button.classList.toggle("selected", activeBooster === kind);
    }
    $(".booster-panel").hidden = !Object.keys(BOOSTERS2).some((kind) => boosterUnlocked(kind));
    document.querySelectorAll(".sound-toggle").forEach((button) => {
      button.innerHTML = icon(save.sound ? "sound" : "mute") + (button.closest(".mobile-bottom") ? "Sound" : "");
      button.setAttribute("aria-label", save.sound ? "Turn sound off" : "Turn sound on");
      button.setAttribute("aria-pressed", String(save.sound));
    });
    const available = Date.now() - save.dailyAt >= 864e5;
    $(".daily-button").toggleAttribute("disabled", !available);
    $("#daily-label").textContent = available ? "Your daily little treat" : "A treat well deserved!";
    $("#daily-detail").textContent = available ? boosterUnlocked("shuffle") ? "50 treat coins + a free shuffle" : "50 treat coins for your adventure" : "Come back tomorrow for more";
    if (modalKind === "shop") updateShopCountdown();
  }
  function renderHud(snapshot) {
    $("#level-label").textContent = `LEVEL ${run.level} \xB7 ${game.level.chapterName}`;
    $("#level-title").textContent = game.level.name;
    $("#moves").textContent = String(snapshot.moves);
    $("#moves-box").classList.toggle("low", snapshot.moves <= 5);
    $("#score").textContent = fmt(snapshot.score);
    $("#objectives").innerHTML = snapshot.objectives.map((goal) => {
      const visual = goal.kind === "collect" ? `<img src="${ART}dog-${goal.breed}.svg" alt="">` : icon(goal.kind === "grass" ? "grass" : goal.kind === "special" ? "blast" : goal.kind === "cascade" ? "shuffle" : "star");
      const label = goal.kind === "collect" ? BREEDS[goal.breed].name + " pals" : goal.kind === "grass" ? "Clear grass" : goal.kind === "special" ? "Make specials" : goal.kind === "cascade" ? "Cascade matches" : "Score goal";
      return `<div class="objective ${goal.kind} ${goal.current >= goal.target ? "done" : ""}" aria-label="${label}: ${Math.min(goal.current, goal.target)} of ${goal.target}">${visual}<div class="objective-copy"><span class="label">${label}</span><div class="count">${fmt(Math.min(goal.current, goal.target))} <span>/ ${fmt(goal.target)}</span></div><div class="objective-track"><div class="objective-fill" style="width:${Math.min(100, goal.current / goal.target * 100)}%"></div></div></div></div>`;
    }).join("");
  }
  function renderBoard(snapshot, settling = false) {
    const board2 = $("#board");
    const hadFocus = document.activeElement?.closest("#board");
    board2.setAttribute("aria-busy", String(busy || !artworkReady));
    if (!tileViews.length) {
      const fragment = document.createDocumentFragment();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const button = document.createElement("button");
        button.className = "tile";
        button.dataset.r = String(r);
        button.dataset.c = String(c);
        tileViews.push({ button });
        fragment.append(button);
      }
      board2.append(fragment);
    }
    snapshot.board.forEach((row, r) => row.forEach((tile, c) => {
      const view = tileViews[r * 8 + c];
      const cell = view.button;
      const previousId = cell.dataset.tileId;
      const grass = snapshot.grass[r][c];
      const special = tile?.special;
      const rainbow = !!tile && tile.breed < 0;
      const breed = !tile ? "Empty space" : tile.breed >= 0 ? BREEDS[tile.breed].name : "Rainbow paw";
      const label = `Row ${r + 1}, column ${c + 1}: ${breed}${special ? ", " + special + " special" : ""}${grass ? ", " + grass + " grass layer" + (grass > 1 ? "s" : "") : ""}`;
      cell.classList.remove("clearing", "hint", "settling");
      cell.classList.toggle("grass", grass > 0);
      cell.classList.toggle("grass-double", grass > 1);
      cell.classList.toggle("selected", selected?.r === r && selected?.c === c);
      cell.dataset.breed = String(tile?.breed ?? -2);
      cell.dataset.tileId = tile ? String(tile.id) : "";
      cell.style.setProperty("--tile-bg", tile && tile.breed >= 0 ? TILE_COLORS[tile.breed] : "#f6f1e7");
      cell.tabIndex = focusedCell.r === r && focusedCell.c === c ? 0 : -1;
      cell.setAttribute("aria-label", label);
      cell.setAttribute("aria-pressed", String(selected?.r === r && selected?.c === c));
      cell.disabled = busy || !artworkReady || !tile || snapshot.won || snapshot.lost;
      if (tile && tile.breed >= 0) {
        if (!view.image) {
          view.image = new Image();
          view.image.alt = "";
          view.image.draggable = false;
          cell.prepend(view.image);
        }
        const source = `${ART}dog-${tile.breed}.svg`;
        if (view.image.getAttribute("src") !== source) view.image.src = source;
      }
      if (view.image) view.image.hidden = !tile || rainbow;
      if (rainbow && !view.rainbow) {
        view.rainbow = document.createElement("span");
        view.rainbow.className = "rainbow-paw";
        view.rainbow.innerHTML = icon("paw");
        cell.append(view.rainbow);
      }
      if (view.rainbow) view.rainbow.hidden = !rainbow;
      if (special && special !== "rainbow") {
        if (!view.badge) {
          view.badge = document.createElement("span");
          view.badge.className = "special-badge";
          cell.append(view.badge);
        }
        if (view.badge.dataset.special !== special) {
          view.badge.innerHTML = special === "row" ? "\u2194" : special === "column" ? "\u2195" : icon("blast");
          view.badge.dataset.special = special;
        }
      }
      if (view.badge) view.badge.hidden = !special || special === "rainbow";
      if (settling && tile && previousId !== String(tile.id)) cell.classList.add("settling");
    }));
    if (hadFocus && !busy) document.querySelector(`.tile[data-r="${focusedCell.r}"][data-c="${focusedCell.c}"]`)?.focus({ preventScroll: true });
  }
  async function prepareArtwork() {
    await Promise.allSettled(BREEDS.map((breed) => {
      const image = new Image();
      image.src = `${ART}dog-${breed.id}.svg`;
      return image.decode();
    }));
    artworkReady = true;
    $(".board-wrap").dataset.loading = "false";
    renderBoard(displayed);
    renderWallet();
  }
  function renderAll() {
    displayed = game.snapshot();
    renderHud(displayed);
    renderBoard(displayed);
    renderMap();
    renderWallet();
    renderDiscoveries();
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
  class ApiError extends Error {
    constructor(message, code, reasonCode, wallet2) {
      super(message);
      __publicField(this, "code", code);
      __publicField(this, "reasonCode", reasonCode);
      __publicField(this, "wallet", wallet2);
    }
  }
  async function api(route, payload, long = false) {
    const response = await fetch("/api/puppy/" + route, {
      credentials: "same-origin",
      cache: "no-store",
      ...payload === void 0 ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) },
      signal: AbortSignal.timeout(long ? 75e3 : route === "state" ? 3500 : 8e3)
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || "Something went wrong. Please try again.", response.status, data.code, data.wallet);
    return data;
  }
  let walletRefreshInFlight = null;
  let nextSyncAt = 0;
  let syncFailures = 0;
  function deferSync() {
    connected = false;
    nextSyncAt = Date.now() + Math.min(6e4, 5e3 * 2 ** Math.min(syncFailures++, 4));
  }
  function removePending(attemptId) {
    save.pendingFinishes = save.pendingFinishes.filter((item) => item.attemptId !== attemptId);
    persist();
  }
  function refreshWallet() {
    if (walletRefreshInFlight) return walletRefreshInFlight;
    walletRefreshInFlight = (async () => {
      try {
        wallet = await api("state");
        connected = !save.pendingFinishes.length;
        for (const pending of [...save.pendingFinishes]) {
          if (wallet.activeAttemptId !== pending.attemptId) {
            removePending(pending.attemptId);
            continue;
          }
          try {
            wallet = await api("attempt/finish", pending);
            removePending(pending.attemptId);
          } catch (error) {
            if (error instanceof ApiError && ["ATTEMPT_NOT_FOUND", "ATTEMPT_MISMATCH"].includes(error.reasonCode || "") && error.wallet && error.wallet.activeAttemptId !== pending.attemptId) {
              wallet = error.wallet;
              removePending(pending.attemptId);
              continue;
            }
            deferSync();
            return;
          }
        }
        connected = true;
        syncFailures = 0;
        nextSyncAt = Date.now() + 3e4;
      } catch {
        deferSync();
      } finally {
        renderWallet();
        walletRefreshInFlight = null;
      }
    })();
    return walletRefreshInFlight;
  }
  let ready;
  async function ensureAttempt() {
    await ready;
    if (run.attemptId) {
      if (run.mode === "offline" || !connected || wallet?.activeAttemptId === run.attemptId) return true;
      run.attemptId = null;
      run.mode = null;
      delete run.reservationId;
      persist();
    }
    if (connected && save.pendingFinishes.length) await refreshWallet();
    if (connected && wallet && (!wallet.activeAttemptId || !!run.reservationId && wallet.activeAttemptRequestId === run.reservationId)) {
      run.reservationId || (run.reservationId = crypto.randomUUID());
      persist();
      try {
        if (wallet.activeAttemptId && wallet.activeAttemptRequestId === run.reservationId) run.attemptId = wallet.activeAttemptId;
        else {
          wallet = await api("attempt/start", { requestId: run.reservationId });
          run.attemptId = wallet.activeAttemptId || wallet.attemptId;
        }
        run.mode = "online";
      } catch (error) {
        if (error instanceof ApiError && error.wallet) wallet = error.wallet;
        if (error instanceof ApiError && error.code === 409 && wallet?.activeAttemptRequestId === run.reservationId && wallet.activeAttemptId) {
          run.attemptId = wallet.activeAttemptId;
          run.mode = "online";
        }
        if (!run.attemptId) {
          if (error instanceof ApiError && (error.reasonCode === "NO_ATTEMPTS" || error.code === 402 || error.code === 409 && !wallet?.totalAttempts)) showShop();
          else {
            await refreshWallet();
            if (wallet?.activeAttemptRequestId === run.reservationId && wallet.activeAttemptId) {
              run.attemptId = wallet.activeAttemptId;
              run.mode = "online";
              persist();
              renderWallet();
              return true;
            }
            toast("The connection dropped. Your progress is safe; try your move again.");
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
    } else if (outcome === "won") {
      save.offlineWallet.lives = Math.min(5, localWallet().lives + 1);
      if (save.offlineWallet.lives === 5) save.offlineWallet.nextLifeAt = null;
    }
    run.attemptId = null;
    delete run.reservationId;
    persist();
    renderWallet();
    if (save.pendingFinishes.length) void refreshWallet();
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
      renderBoard(displayed, frame.combo > 0 && !frame.cleared.length);
      await sleep(frame.combo === 0 ? 100 : 90);
    }
    $("#combo-area").innerHTML = "";
  }
  async function doSwap(a, b) {
    if (busy || !artworkReady || displayed.won || displayed.lost) return;
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
    if (busy || !artworkReady || !boosterUnlocked(kind) || !save.boosters[kind] || displayed.won || displayed.lost) return;
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
    if (busy || !artworkReady || displayed.won || displayed.lost) return;
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
        save.unlocked = Math.min(LEVEL_COUNT, Math.max(save.unlocked, run.level + 1));
        save.coins += firstWin ? 40 + stars * 20 + firstWinBonus(run.level) : 10;
        claimDiscoveries(true);
      }
      persist();
      await finishAttempt(final.won ? "won" : "lost");
    }
    showResult(final.won);
  }
  function startLevel(level) {
    if (level < 1 || level > save.unlocked || level > LEVEL_COUNT) return;
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
    layer.innerHTML = `<section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${kind === "shop" ? "Treat shop and extra attempts" : kind === "map" ? `${LEVEL_COUNT}-level adventure` : "Puppy Pals"}"><button class="modal-close" data-action="close" aria-label="Close dialog">${icon("close")}</button>${content}</section>`;
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
    showModal("result", `<img class="modal-hero" src="${ART}dog-${won ? 0 : 4}.svg" alt="${won ? "Happy Corgi" : "Hopeful Pug"}"><h2>${won ? run.level === LEVEL_COUNT ? `${LEVEL_COUNT} happy adventures!` : "Pawsitively brilliant!" : "So close, little pal."}</h2><p class="modal-subtitle">${won ? run.level === LEVEL_COUNT ? "You\u2019ve completed every level. Your puppy pack couldn\u2019t be prouder!" : `Level ${run.level} complete. A whole pack of happy tails!` : "You\u2019re out of moves, but the puppies believe in you. Give it another go."}</p>${won ? `<div class="result-stars" aria-label="${stars} stars">${[1, 2, 3].map((n) => icon("star", n > stars ? "empty" : "")).join("")}</div>` : ""}<div class="result-stats"><div><strong>${fmt(snap.score)}</strong><span>YOUR SCORE</span></div><div><strong>${won ? snap.moves : wallet?.totalAttempts ?? localWallet().lives}</strong><span>${won ? "MOVES LEFT" : "ATTEMPTS LEFT"}</span></div></div><button class="primary-button" data-action="${won && run.level < LEVEL_COUNT ? "next" : "retry"}">${won ? run.level < LEVEL_COUNT ? "Meet the next adventure" : "Play this level again" : "Try again"} ${icon("chevron")}</button><button class="secondary-button" data-action="${won ? "map" : "shop"}">${icon(won ? "map" : "heart")}${won ? "Explore your adventure" : "More attempts"}</button><p class="modal-note">${won ? "You keep your attempt when you win. Good dog!" : "Free lives refill every 30 minutes. Take a little break anytime."}</p>`);
  }
  function showHelp() {
    showModal("help", `<img class="modal-hero" src="${ART}dog-2.svg" alt="Husky"><h2>Small matches. Big smiles.</h2><p class="modal-subtitle">Welcome to your happy little corner of the world.</p><div class="help-list"><div class="help-step"><span class="step-num">1</span><div><strong>Bring the pack together</strong><p>Tap two neighboring puppies, or swipe, to swap them. Match 3 or more of the same breed. On a keyboard, use arrows and Enter to choose.</p></div></div><div class="help-step"><span class="step-num">2</span><div><strong>Every level has a little mission</strong><p>Collect the puppies shown above the board, reach your score goal, or match over green grass to clear it. Finish every goal before your moves run out.</p></div></div><div class="help-step"><span class="step-num">3</span><div><strong>Make something pawsome</strong><p>Match 4 for a line blast, an L or T for a puppy burst, or 5 for a rainbow paw. Swap two specials for a bigger surprise!</p></div></div></div><div class="special-guide"><div>${icon("shuffle")}<strong>Match 4</strong><span>Clear a whole line</span></div><div>${icon("blast")}<strong>Match L or T</strong><span>A big puppy burst</span></div><div>${icon("rainbow")}<strong>Match 5</strong><span>Rainbow magic</span></div></div><p class="modal-note">Start with 5 free lives. One returns every 30 minutes. Wins keep your attempt; leaving a level or running out of moves uses it. Progress stays in this browser.</p><button class="primary-button" data-action="close" style="margin-top:19px">Let\u2019s make some pals ${icon("paw")}</button>`);
  }
  function showShop() {
    const native = isNative();
    const available = connected && !!wallet?.paymentsAvailable && !native;
    showModal("shop", `<h2>A little extra love.</h2><p class="modal-subtitle">Another chance to bring the pack together.</p><div class="life-row" aria-label="${connected ? wallet?.lives : localWallet().lives} free lives">${[0, 1, 2, 3, 4].map((i) => icon("heart", i >= (connected ? wallet?.lives ?? 0 : localWallet().lives) ? "empty" : "")).join("")}</div><p class="refill-time" id="refill-time"></p><div class="purchase-card"><div class="purchase-icon">${icon("heart")}</div><div class="purchase-detail"><strong>5 extra attempts</strong><span>Yours to use, whenever you like.</span></div><strong class="purchase-price">$0.99</strong></div><button class="primary-button ${available ? "paypal-button" : ""}" data-action="purchase" ${available ? "" : "disabled"}>${available ? 'Get 5 attempts with <span class="paypal-mark">PayPal</span>' : "Purchases coming soon"}</button><div class="shop-note">${native ? "Purchases will be available through your app store in a future update. You can always play with free refilling lives." : available ? "A one-time purchase of $0.99 USD. No subscription. Attempts are added after PayPal confirms payment." : "Paid checkout is not available yet. Your free lives still refill every 30 minutes, and winning keeps your attempt."}</div>${!native && !available ? '<p class="merchant-line">Payment details: coming soon.</p>' : ""}${save.pendingPayment && connected && !native ? '<button class="secondary-button" data-action="check-payment">Check a previous payment</button>' : ""}<h3 class="shop-heading">A helping paw \xB7 ${fmt(save.coins)} treat coins</h3><div class="shop-boosters">${Object.entries(BOOSTERS2).filter(([kind]) => boosterUnlocked(kind)).map(([kind, info]) => `<button class="shop-booster" data-action="buy-booster" data-booster="${kind}" ${save.coins < info.cost ? "disabled" : ""} aria-label="Buy ${info.name} for ${info.cost} treat coins"><span class="booster-icon ${kind}">${icon(kind)}</span><strong>${info.name}</strong><span class="cost">${icon("coin")}${info.cost}</span></button>`).join("")}</div><p class="modal-note">${Object.keys(BOOSTERS2).some((kind) => !boosterUnlocked(kind)) ? `A new helping paw arrives at level ${BOOSTER_UNLOCKS[Object.keys(BOOSTERS2).find((kind) => !boosterUnlocked(kind))]}. ` : ""}Earn treat coins by completing levels. Boosters never use a move.<br>Attempts and purchases are linked to this browser\u2019s session. Keep its cookies to keep your balance.</p>`);
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
    showModal("map", `<h2>Your happy little journey.</h2><p class="modal-subtitle">${LEVEL_COUNT} levels. ${BREEDS.length} best friends. New discoveries along the way.</p><button class="text-button journey-link" data-action="discoveries">${icon("gift")}Your discovery journal ${icon("chevron")}</button><div class="map-modal" id="modal-map"></div>`, true);
    renderMap();
  }
  function showProgress() {
    const completed = save.stars.filter(Boolean).length;
    const savedTime = progressStatus.savedAt ? new Date(progressStatus.savedAt).toLocaleString() : "Saving your latest move";
    showModal("progress", `<img class="modal-hero" src="${ART}dog-2.svg" alt="Husky"><h2>${progressStatus.saved ? "Your adventure, saved." : "Keep your adventure safe."}</h2><p class="modal-subtitle">Your level, stars, coins, boosters and current board save automatically on this device after each move, even when you\u2019re offline.</p><div class="result-stats"><div><strong>${completed}</strong><span>LEVELS COMPLETE</span></div><div><strong>${run.level}</strong><span>CURRENT LEVEL</span></div></div><p class="modal-note" id="progress-save-detail">${progressStatus.saved ? "Saved on this device: " + esc(savedTime) : "A device save has not been confirmed. Download a copy before closing the game."}</p><button class="primary-button" data-action="download-progress" style="margin-top:20px">${icon("cloud")}Download a backup</button><button class="secondary-button" data-action="import-progress">Restore a backup</button><input id="progress-file" type="file" accept="application/json,.json" hidden><div id="recovered-progress"></div><p class="modal-note">Keep a backup to move your adventure to another device or recover it after clearing browser data. Purchased attempts stay with your browser\u2019s wallet and are not part of this file.</p>`);
    void progressStore.recovery().then((data) => {
      const recovered = validateSave(data);
      if (recovered && modalKind === "progress") $("#recovered-progress").innerHTML = `<button class="secondary-button" data-action="recover-progress">Review earlier level ${recovered.run?.level || recovered.unlocked} save</button><p class="modal-note">An earlier checkpoint was kept safe when device storage was temporarily unavailable.</p>`;
    });
  }
  function portableSave() {
    const data = JSON.parse(JSON.stringify(save));
    data.pendingFinishes = [];
    data.pendingPayment = null;
    if (data.run) {
      data.run.attemptId = null;
      data.run.mode = null;
      delete data.run.reservationId;
    }
    return data;
  }
  function downloadProgress() {
    persist();
    const content = JSON.stringify({ format: "puppy-pals-save", version: 1, progress: portableSave() }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `puppy-pals-level-${run.level}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  function restoredGame(profile) {
    const restoredRun = profile.run || freshRun(profile.unlocked);
    const restored = new PuppyGame(restoredRun.level, restoredRun.seed, restoredRun.ruleset ?? 1);
    for (const action2 of restoredRun.actions) {
      const result = action2.kind === "swap" ? restored.swap(action2.a, action2.b) : restored.useBooster(action2.kind, action2.target);
      if (!result.valid) throw new Error("This backup contains a move that cannot be restored. Your current game is safe.");
    }
    return { run: restoredRun, game: restored };
  }
  async function readProgressFile(file) {
    try {
      if (file.size > 1024 * 1024) throw new Error("Choose a Puppy Pals backup smaller than 1 MB.");
      const data = JSON.parse(await file.text());
      const profile = validateSave(data.format === "puppy-pals-save" ? data.progress : data);
      if (!profile) throw new Error("This file is not a valid Puppy Pals backup.");
      if (profile.run) {
        profile.run.attemptId = null;
        profile.run.mode = null;
        delete profile.run.reservationId;
      }
      profile.pendingFinishes = [];
      profile.pendingPayment = null;
      restoredGame(profile);
      importedProgress = profile;
      showModal("restore", `<img class="modal-hero" src="${ART}dog-1.svg" alt="Beagle"><h2>Bring your pals back?</h2><p class="modal-subtitle">This backup has ${profile.stars.filter(Boolean).length} completed levels and resumes at level ${profile.run?.level || profile.unlocked}. It replaces this device\u2019s game progress.</p><button class="primary-button" data-action="confirm-import">Restore this adventure</button><button class="secondary-button" data-action="close">Keep my current game</button><p class="modal-note">Your purchased attempts stay unchanged.${run.attemptId && !displayed.won && !displayed.lost ? " Replacing your unfinished game will use its current attempt." : ""}</p>`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "This backup could not be read. Your current game is safe.");
    }
  }
  async function importProgress() {
    if (!importedProgress || busy) return;
    busy = true;
    let finished = false;
    try {
      const recovered = restoredGame(importedProgress);
      if (run.attemptId) await finishAttempt("abandoned");
      const keep = { offlineWallet: save.offlineWallet, pendingFinishes: save.pendingFinishes, pendingPayment: save.pendingPayment };
      Object.assign(save, importedProgress, keep);
      run = recovered.run;
      game = recovered.game;
      save.run = run;
      claimDiscoveries();
      selected = null;
      activeBooster = null;
      chapter = game.level.chapter;
      importedProgress = null;
      persist();
      closeModal();
      renderAll();
      status("Welcome back! Your puppy adventure is restored.", true);
      finished = displayed.won || displayed.lost;
    } finally {
      busy = false;
      renderAll();
    }
    if (finished) await checkResult();
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
    const action2 = button.dataset.action;
    if (action2 === "close") closeModal();
    else if (action2 === "progress") showProgress();
    else if (action2 === "download-progress") downloadProgress();
    else if (action2 === "import-progress") document.querySelector("#progress-file")?.click();
    else if (action2 === "recover-progress") void progressStore.recovery().then((data) => {
      if (data) return readProgressFile(new File([JSON.stringify({ format: "puppy-pals-save", version: 1, progress: data })], "puppy-pals-recovered.json", { type: "application/json" }));
    });
    else if (action2 === "confirm-import") void importProgress();
    else if (action2 === "help") showHelp();
    else if (action2 === "shop") showShop();
    else if (action2 === "map") showMap();
    else if (action2 === "discoveries") showDiscoveries();
    else if (action2 === "all-discoveries") showDiscoveries(true);
    else if (action2 === "play") {
      if (displayed.won || displayed.lost) showResult(displayed.won);
      else $("#board").scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (action2 === "sound") {
      save.sound = !save.sound;
      persist();
      renderWallet();
      sound("tap");
    } else if (action2 === "hint") hint();
    else if (action2 === "restart" || action2 === "retry") requestLevel(run.level);
    else if (action2 === "next") startLevel(Math.min(LEVEL_COUNT, run.level + 1));
    else if (action2 === "level") requestLevel(Number(button.dataset.level));
    else if (action2 === "confirm-level") {
      if (!busy) {
        busy = true;
        void finishAttempt("abandoned").then(() => {
          busy = false;
          startLevel(Number(button.dataset.level));
        });
      }
    } else if (action2 === "chapter-prev" || action2 === "chapter-next") {
      chapter = Math.max(1, Math.min(CHAPTER_COUNT, chapter + (action2 === "chapter-next" ? 1 : -1)));
      renderMap();
    } else if (action2 === "booster") {
      if (busy || displayed.won || displayed.lost) return;
      const kind = button.dataset.booster;
      if (!boosterUnlocked(kind)) return;
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
        status(activeBooster ? `Choose a puppy. ${BOOSTERS2[kind].description}` : "Tap two neighboring puppies to swap.", !!activeBooster);
      }
    } else if (action2 === "buy-booster") {
      const kind = button.dataset.booster;
      if (boosterUnlocked(kind) && save.coins >= BOOSTERS2[kind].cost) {
        save.coins -= BOOSTERS2[kind].cost;
        save.boosters[kind]++;
        persist();
        renderWallet();
        showShop();
        toast(`${BOOSTERS2[kind].name} added to your helping paws.`);
      }
    } else if (action2 === "daily") {
      if (Date.now() - save.dailyAt >= 864e5) {
        save.coins += 50;
        if (boosterUnlocked("shuffle")) save.boosters.shuffle++;
        save.dailyAt = Date.now();
        persist();
        renderWallet();
        toast(boosterUnlocked("shuffle") ? "A treat for a good pal: 50 coins and one shuffle." : "A treat for a good pal: 50 coins for your adventure.");
      }
    } else if (action2 === "purchase") void purchase();
    else if (action2 === "check-payment" && save.pendingPayment) void capture(save.pendingPayment);
    else if (action2 === "install") void install();
  });
  document.addEventListener("change", (event) => {
    const selection = event.target;
    if (selection instanceof HTMLSelectElement && selection.dataset.action === "chapter-jump") {
      const requested = Number(selection.value), focusId = selection.id;
      if (Number.isInteger(requested) && requested >= 1 && requested <= CHAPTER_COUNT) {
        chapter = requested;
        renderMap();
        document.getElementById(focusId)?.focus({ preventScroll: true });
      }
      return;
    }
    const input = event.target;
    if (input.id === "progress-file" && input.files?.[0]) void readProgressFile(input.files[0]);
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
      const focusable = Array.from(modal.querySelectorAll("button:not(:disabled),a[href],select:not(:disabled)"));
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
  claimDiscoveries();
  shell();
  appMounted = true;
  renderAll();
  status("Tap two neighbors or swipe. Match three to make new pals.");
  void prepareArtwork();
  const board = $("#board");
  board.addEventListener("click", (event) => {
    if (suppressNextPointerClick) {
      suppressNextPointerClick = false;
      if (event.detail > 0) return;
    }
    const tile = event.target.closest(".tile");
    if (tile) selectCell({ r: Number(tile.dataset.r), c: Number(tile.dataset.c) });
  });
  let pointer = null;
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
    if (Date.now() >= nextSyncAt && (!connected || save.pendingFinishes.length || wallet?.nextLifeAt && Date.now() >= wallet.nextLifeAt)) void refreshWallet();
    else if (!connected) {
      localWallet();
      renderWallet();
    }
  }, 1e3);
  if ("serviceWorker" in navigator && !isNative()) {
    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persist();
  });
  window.addEventListener("pagehide", () => {
    persist();
  });
  persist();
}
void boot().catch(() => {
  const app = document.querySelector("#app");
  if (app) app.innerHTML = '<div class="loading-screen"><h1>Puppy Pals</h1><p>Your saved progress has not been deleted. Please reload to try opening the game again.</p><button class="primary-button" id="retry-startup">Reload game</button></div>';
  document.querySelector("#retry-startup")?.addEventListener("click", () => location.reload());
});
