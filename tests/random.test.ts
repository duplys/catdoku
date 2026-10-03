import { expect, test } from 'vitest';
import { seededRandom, shuffled } from '../src/game/random';

test('PRNG is reproducible, distinct across seeds and in [0, 1)', () => {
  const sequence = (seed: string) => {
    const random = seededRandom(seed);
    return Array.from({ length: 100 }, () => random());
  };
  expect(sequence('cat')).toEqual(sequence('cat'));
  expect(sequence('cat')).not.toEqual(sequence('dog'));
  expect(sequence('cat').every((value) => value >= 0 && value < 1)).toBe(true);
});

test('shuffle preserves its input and all members', () => {
  const values = [0, 1, 2, 3, 4];
  const result = shuffled(values, seededRandom('cat'));
  expect([...result].sort()).toEqual(values);
  expect(values).toEqual([0, 1, 2, 3, 4]);
});
