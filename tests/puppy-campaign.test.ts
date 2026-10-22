import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { BREEDS, CHAPTER_COUNT, LEVEL_COUNT, LEVELS, LEGACY_LEVELS, getLevel } from '../src/puppy/levels';
import { BOOSTER_UNLOCKS, BREED_UNLOCKS, DISCOVERIES, discoveryForLevel, firstWinBonus, getUnlockedBreeds, isPicnicLevel, nextDiscovery } from '../src/puppy/progression';

test('all original level metadata remains byte-equivalent for existing saved runs', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(LEGACY_LEVELS)).digest('hex'), 'ebde7b0ef8faeb77f6ecd0982ab04c565723284816d94c2036dd4906a0d1e626');
  assert.equal(getLevel(100, 1), LEGACY_LEVELS[99]);
  assert.throws(() => getLevel(101, 1), RangeError);
});

test('shipped 180 discovery levels remain byte-equivalent for saved rules-2 runs', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(LEVELS.slice(0, 180))).digest('hex'), 'bbb750dc0ff7f214433f6daea65778bc81230567fc51ee771a3767ee120a038e');
});

test('expanded campaign has coherent goals and a bounded palette of introduced puppies', () => {
  assert.equal(LEVELS.length, LEVEL_COUNT);
  assert.equal(LEVEL_COUNT, 500);
  assert.equal(CHAPTER_COUNT, 50);
  assert.equal(new Set(LEVELS.map(level => level.name)).size, LEVEL_COUNT);
  assert.equal(new Set(LEVELS.map(level => level.chapter)).size, CHAPTER_COUNT);
  for (const level of LEVELS) {
    const unlocked = getUnlockedBreeds(level.number);
    const pool = level.breedPool!;
    assert(pool.length >= 5 && pool.length <= 6, `level${level.number} keeps a playable palette`);
    assert.equal(new Set(pool).size, pool.length);
    assert.equal(level.breeds, pool.length);
    assert(pool.every(breed => unlocked.includes(breed)));
    assert(level.objectives.length >= 2 && level.objectives.length <= 3);
    for (const goal of level.objectives) {
      assert(Number.isInteger(goal.target) && goal.target > 0);
      if (goal.kind === 'collect') assert(pool.includes(goal.breed!), `level${level.number}'s requested breed can refill`);
    }
    const grass = level.objectives.find(goal => goal.kind === 'grass');
    assert.equal(grass?.target ?? 0, level.grassCount * level.grassLayers);
  }
});

test('first three acts alternate a real positive discovery and a follow-up challenge every six levels', () => {
  const beats = [...new Set(DISCOVERIES.filter(discovery => discovery.level <= 72).map(discovery => discovery.level))];
  assert.deepEqual(beats, [2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68]);
  assert.equal(beats.length * 6, 72, 'the first three24level acts contain twelve discovery beats');
  beats.forEach((level, index) => {
    assert.equal(discoveryForLevel(level)?.kind, index % 2 === 0 ? 'bonus' : 'challenge');
    if (index) assert.equal(level - beats[index - 1], 6);
  });
  assert.equal(nextDiscovery(7)?.id, 'first-grass');
  assert.equal(nextDiscovery(14)?.id, 'dual-goals');
  assert.equal(nextDiscovery(180)?.level, 182);
  assert.equal(nextDiscovery(500), undefined);
});

test('new challenges wait until their teaching level and each booster precedes its paired challenge', () => {
  assert.equal(LEVELS.find(level => level.grassCount > 0)?.number, 8);
  assert.equal(LEVELS.find(level => level.objectives.filter(goal => goal.kind === 'collect').length === 2)?.number, 20);
  assert.equal(LEVELS.find(level => level.grassLayers === 2)?.number, 32);
  assert.equal(LEVELS.find(level => level.objectives.some(goal => goal.kind === 'special'))?.number, 44);
  assert.equal(LEVELS.find(level => level.objectives.some(goal => goal.kind === 'cascade'))?.number, 56);
  assert.deepEqual(BOOSTER_UNLOCKS, { paw: 2, shuffle: 14, rainbow: 38 });
  assert.deepEqual(DISCOVERIES.filter(discovery => discovery.booster).map(discovery => [discovery.booster, discovery.level, discovery.amount]), [['paw', 2, 2], ['shuffle', 14, 2], ['rainbow', 38, 1]]);
  assert(BOOSTER_UNLOCKS.paw < 8 && BOOSTER_UNLOCKS.shuffle < 20 && BOOSTER_UNLOCKS.rainbow < 44);
});

test('each new puppy enters its welcome board and never appears before its discovery', () => {
  assert.equal(BREEDS.length, 16);
  assert.deepEqual(BREED_UNLOCKS, [1, 1, 1, 1, 1, 14, 26, 50, 74, 98, 122, 146, 194, 266, 338, 410]);
  for (let breed = 5; breed < BREEDS.length; breed++) {
    const at = BREED_UNLOCKS[breed];
    assert(!getUnlockedBreeds(at - 1).includes(breed));
    assert(getUnlockedBreeds(at).includes(breed));
    assert(getLevel(at).breedPool!.includes(breed));
    assert(getLevel(at).objectives.some(goal => goal.kind === 'collect' && goal.breed === breed));
    assert(DISCOVERIES.some(discovery => discovery.kind === 'puppy' && discovery.breed === breed && discovery.level === at));
  }
});

test('earned picnic bonuses have real effects and do not leak into earlier or challenge levels', () => {
  assert.equal(getLevel(25).bonusMoves, undefined);
  assert.equal(getLevel(26).bonusMoves, 2);
  assert.equal(getLevel(32).bonusMoves, undefined);
  assert.equal(firstWinBonus(49), 0);
  assert.equal(firstWinBonus(50), 25);
  assert.equal(firstWinBonus(56), 0);
  assert.equal(getLevel(61).startingSpecial, undefined);
  assert(['row', 'column'].includes(getLevel(62).startingSpecial!));
  assert.equal(getLevel(68).startingSpecial, undefined);
  for (const level of LEVELS) {
    assert.equal(level.bonusMoves ?? 0, level.number >= 26 && isPicnicLevel(level.number) ? 2 : 0);
    assert.equal(!!level.startingSpecial, level.number >= 62 && isPicnicLevel(level.number));
    if (level.bonusMoves || level.startingSpecial) {
      assert.equal(level.grassCount, 0, 'picnics practice earned bonuses before the next challenge');
      assert(level.objectives.every(goal => ['collect', 'score'].includes(goal.kind)));
    }
  }
});


test('the later trail spaces familiar picnic and challenge beats without adding rules', () => {
  const later = DISCOVERIES.filter(discovery => discovery.level > 180);
  assert.equal(later.length, 54);
  assert.deepEqual(later.map(discovery => discovery.level), Array.from({ length: 54 }, (_, index) => 182 + index * 6));
  const goalKinds = new Set(['collect', 'grass', 'score', 'special', 'cascade']);
  later.forEach((discovery, index) => {
    const level = getLevel(discovery.level);
    if (index % 2 === 0) {
      assert(discovery.kind === 'bonus' || discovery.kind === 'puppy');
      assert.equal(level.bonusMoves, 2);
      assert(level.startingSpecial);
      assert.equal(firstWinBonus(level.number), 25);
      assert.equal(level.grassCount, 0);
      assert(level.objectives.every(goal => goal.kind === 'collect' || goal.kind === 'score'));
    } else {
      assert.equal(discovery.kind, 'challenge');
      assert.equal(level.bonusMoves, undefined);
      assert.equal(level.startingSpecial, undefined);
      assert.equal(firstWinBonus(level.number), 0);
      const kinds = level.objectives.map(goal => goal.kind);
      if (discovery.challenge === 'grass') assert(kinds.includes('grass'));
      if (discovery.challenge === 'dual') assert.equal(kinds.filter(kind => kind === 'collect').length, 2);
      if (discovery.challenge === 'special') assert(kinds.includes('special'));
      if (discovery.challenge === 'cascade') assert(kinds.includes('cascade'));
      if (discovery.challenge === 'mixed') assert.deepEqual(kinds, ['collect', 'grass', 'score']);
    }
    assert(level.objectives.every(goal => goalKinds.has(goal.kind)));
    assert.equal(discovery.booster, undefined, 'later welcomes reuse earned help instead of adding another boost type');
  });
  assert.equal(new Set(DISCOVERIES.map(discovery => discovery.id)).size, DISCOVERIES.length);
  assert.deepEqual(later.filter(discovery => discovery.breed !== undefined).map(discovery => [discovery.level, discovery.breed]), [[194, 12], [266, 13], [338, 14], [410, 15]]);
});

test('later difficulty stays bounded and cycles through readable familiar goals', () => {
  const later = LEVELS.slice(180);
  assert.equal(later.length, 320);
  for (const level of later) {
    assert(level.moves >= 30 && level.moves <= 32);
    assert(level.grassCount <= 18 && level.grassLayers <= 2);
    assert(level.objectives.length >= 2 && level.objectives.length <= 3);
    for (const goal of level.objectives) {
      if (goal.kind === 'collect') assert(goal.target >= 9 && goal.target <= 20);
      if (goal.kind === 'score') assert(goal.target <= 3200);
      if (goal.kind === 'special' || goal.kind === 'cascade') assert(goal.target >= 2 && goal.target <= 3);
    }
  }
  assert.equal(getLevel(500).chapter, 50);
  assert.throws(() => getLevel(501), RangeError);
});
