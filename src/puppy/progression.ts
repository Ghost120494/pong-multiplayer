/** Progress-based discoveries. Minute/day estimates are design targets, never timers. */
export type BoosterKind = 'paw' | 'shuffle' | 'rainbow';
export type Discovery = {
  id: string;
  level: number;
  kind: 'bonus' | 'challenge' | 'puppy';
  title: string;
  description: string;
  booster?: BoosterKind;
  amount?: number;
  breed?: number;
};

export const BOOSTER_UNLOCKS = Object.freeze({ paw: 2, shuffle: 14, rainbow: 38 });
/** Indexed by the stable sprite/breed ID. */
export const BREED_UNLOCKS: readonly number[] = Object.freeze([1, 1, 1, 1, 1, 14, 26, 50, 74, 98, 122, 146]);

export const DISCOVERIES: readonly Discovery[] = Object.freeze([
  { id: 'paw-pop', level: 2, kind: 'bonus', title: 'A little helping paw', description: 'Meet Paw pop! Try your two free pops to clear a puppy without spending a move.', booster: 'paw', amount: 2 },
  { id: 'first-grass', level: 8, kind: 'challenge', title: 'A little overgrown', description: 'Match over green grass to clear it. Paw pop can reach a stubborn patch, too.' },
  { id: 'shuffle', level: 14, kind: 'bonus', title: 'A fresh mix of friends', description: 'Two free shuffles and a spotted new friend! Mix it up rearranges the pups without using a move.', booster: 'shuffle', amount: 2 },
  { id: 'dalmatian', level: 14, kind: 'puppy', title: 'Meet the Dalmatian', description: 'A spotted sweetheart joins the pack. Look for the white face with black spots.', breed: 5 },
  { id: 'dual-goals', level: 20, kind: 'challenge', title: 'Better together', description: 'Collect two different puppy breeds in one level. A fresh shuffle can help you find both.' },
  { id: 'lucky-start', level: 26, kind: 'bonus', title: 'Lucky Start', description: 'Picnic and welcome levels now begin with two extra moves. A Golden Retriever is here to celebrate.' },
  { id: 'golden-retriever', level: 26, kind: 'puppy', title: 'Meet the Golden Retriever', description: 'A floppy-eared golden friend joins your sunny adventures.', breed: 6 },
  { id: 'double-grass', level: 32, kind: 'challenge', title: 'Into the tall grass', description: 'Darker grass has two layers. Clear the same square twice to let the flowers through.' },
  { id: 'rainbow', level: 38, kind: 'bonus', title: 'A rainbow kind of day', description: 'Your free Rainbow clears every puppy of a chosen breed without spending a move.', booster: 'rainbow', amount: 1 },
  { id: 'special-makers', level: 44, kind: 'challenge', title: 'Make something pawsome', description: 'Create a special puppy with a match of four, five, or an L or T shape. Clearing an existing special does not count.' },
  { id: 'treat-trail', level: 50, kind: 'bonus', title: 'The Treat Trail', description: 'First wins on picnic and welcome levels now earn 25 extra coins. Meet your Boston Terrier along the way.' },
  { id: 'boston-terrier', level: 50, kind: 'puppy', title: 'Meet the Boston Terrier', description: 'This little tuxedo pup brings big ears and a bigger smile.', breed: 7 },
  { id: 'cascade-capers', level: 56, kind: 'challenge', title: 'One happy match leads to another', description: 'Let falling puppies make extra matches. Each clear after the first in a chain adds one cascade to your goal.' },
  { id: 'trail-charm', level: 62, kind: 'bonus', title: 'Your lucky Trail Charm', description: 'Picnic and welcome levels now start with a striped puppy. Match it to clear a whole line.' },
  { id: 'mixed-finale', level: 68, kind: 'challenge', title: 'All paws together', description: 'Bring your new skills together: collect a favorite breed, clear the garden, and reach the score goal.' },
  { id: 'shiba-inu', level: 74, kind: 'puppy', title: 'Meet the Shiba Inu', description: 'A fox-red friend joins the moonlit trail. Enjoy a gentle welcome level with your picnic perks.', breed: 8 },
  { id: 'moon-garden', level: 80, kind: 'challenge', title: 'Moonlight garden party', description: 'Bring two breeds together while clearing a moonlit garden.' },
  { id: 'rainbow-picnic', level: 86, kind: 'bonus', title: 'A picnic above the clouds', description: 'Take a gentler welcome break with extra moves and a striped puppy. Your first win adds picnic coins.' },
  { id: 'ridge-makers', level: 92, kind: 'challenge', title: 'Ridge of little wonders', description: 'Practice making specials among the colors of Rainbow Ridge.' },
  { id: 'dachshund', level: 98, kind: 'puppy', title: 'Meet the Dachshund', description: 'Long ears, a warm chocolate face, and a very happy little welcome party.', breed: 9 },
  { id: 'golden-garden', level: 104, kind: 'challenge', title: 'The golden garden', description: 'Plan a patient path through a new garden challenge.' },
  { id: 'grove-picnic', level: 110, kind: 'bonus', title: 'A sunny grove picnic', description: 'Enjoy your opening stripe, extra moves, and first-win picnic coins in a gentler level.' },
  { id: 'terrace-cascades', level: 116, kind: 'challenge', title: 'Tumbling terrier terrace', description: 'Let one clear lead into another as the terrace fills with playful pups.' },
  { id: 'samoyed', level: 122, kind: 'puppy', title: 'Meet the Samoyed', description: 'A fluffy white cloud of a pup is waiting on Marshmallow Mountain.', breed: 10 },
  { id: 'snowy-makers', level: 128, kind: 'challenge', title: 'Snowflakes and specials', description: 'Make special puppies on your way through the snowy trail.' },
  { id: 'river-picnic', level: 134, kind: 'bonus', title: 'A little riverside rest', description: 'A gentle picnic level gives your growing pack room to play with all three picnic perks.' },
  { id: 'ribbon-garden', level: 140, kind: 'challenge', title: 'Ribbon River garden', description: 'Match carefully through a garden full of familiar friends.' },
  { id: 'border-collie', level: 146, kind: 'puppy', title: 'Meet the Border Collie', description: 'A clever black-and-white friend joins the coast for the next stretch of your journey.', breed: 11 },
  { id: 'coastal-cascades', level: 152, kind: 'challenge', title: 'Coastal cascade capers', description: 'Find the little matches that start a bigger chain along the coast.' },
  { id: 'starflower-picnic', level: 158, kind: 'bonus', title: 'A starflower picnic', description: 'Celebrate your full puppy pack in a gentle level with your earned picnic perks.' },
  { id: 'festival-makers', level: 164, kind: 'challenge', title: 'Festival of specials', description: 'Put your match-making practice to work and create a few happy surprises.' },
  { id: 'homecoming-picnic', level: 170, kind: 'bonus', title: 'The homecoming picnic', description: 'Gather your friends for one more gentle picnic before the final chapter.' },
  { id: 'homeward-garden', level: 176, kind: 'challenge', title: 'The homeward garden', description: 'A final garden challenge brings your collection and clearing skills together.' },
].map(discovery => Object.freeze(discovery as Discovery)));

export function getUnlockedBreeds(level: number): number[] {
  return BREED_UNLOCKS.flatMap((unlock, breed) => unlock <= level ? [breed] : []);
}

/** The next beat strictly after the supplied level; shared-level puppy reveals accompany its bonus. */
export function nextDiscovery(level: number): Discovery | undefined {
  return DISCOVERIES.find(discovery => discovery.level > level);
}

export function discoveryForLevel(level: number): Discovery | undefined {
  return DISCOVERIES.find(discovery => discovery.level === level);
}

/** Gentle chapter openings and positive discovery tutorials, shared by level and reward rules. */
export function isPicnicLevel(level: number): boolean {
  return level >= 1 && ((level - 1) % 10 === 0 || DISCOVERIES.some(discovery => discovery.level === level && discovery.kind !== 'challenge'));
}

export function firstWinBonus(level: number): number {
  return level >= 50 && isPicnicLevel(level) ? 25 : 0;
}
