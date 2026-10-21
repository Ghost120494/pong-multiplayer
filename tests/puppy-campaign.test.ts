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

test('expanded campaign has coherent goals and a bounded palette of introduced puppies', () => {
  assert.equal(LEVELS.length, LEVEL_COUNT);
  assert.equal(LEVEL_COUNT, 180);
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
  assert.equal(nextDiscovery(180), undefined);
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
  assert.equal(BREEDS.length, 12);
  assert.deepEqual(BREED_UNLOCKS, [1, 1, 1, 1, 1, 14, 26, 50, 74, 98, 122, 146]);
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
