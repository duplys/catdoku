import { expect, test } from 'vitest';
import { validatePuzzle } from '../src/game/validator';
import { rowPuzzle, uniquePuzzle, unsolvablePuzzle } from './fixtures';

test('accepts original connected unique puzzle', () => {
  expect(validatePuzzle(uniquePuzzle)).toEqual({
    valid: true,
    errors: [],
    solutionCount: 1,
  });
});

test.each([4, 12, 5.5, NaN])('rejects unsupported size %s', (size) => {
  expect(validatePuzzle({ ...rowPuzzle, size }).valid).toBe(false);
});

test('rejects malformed dimensions and integer IDs', () => {
  for (const regions of [
    [],
    [[0]],
    [...rowPuzzle.regions.slice(1)],
    rowPuzzle.regions.map((r) => r.slice(1)),
    rowPuzzle.regions.map((r) => r.map((id) => id + 0.5)),
  ]) {
    expect(validatePuzzle({ ...rowPuzzle, regions }).valid).toBe(false);
  }
});

test('rejects incorrect region count', () => {
  expect(
    validatePuzzle({
      ...rowPuzzle,
      regions: rowPuzzle.regions.map(() => Array(5).fill(0)),
    }).errors.join(),
  ).toContain('non-empty regions');
});

test('rejects disconnected regions (diagonal contact does not connect)', () => {
  const regions = rowPuzzle.regions.map((row) => [...row]);
  regions[2][2] = 0;
  expect(validatePuzzle({ ...rowPuzzle, regions }).errors).toContain(
    'Region 0 is not orthogonally connected.',
  );
});

test('rejects zero and multiple solutions', () => {
  expect(validatePuzzle(unsolvablePuzzle).solutionCount).toBe(0);
  expect(validatePuzzle(rowPuzzle)).toEqual({
    valid: false,
    errors: ['Puzzle has multiple solutions.'],
    solutionCount: 2,
  });
});

test('region IDs need not be contiguous or positive', () => {
  expect(
    validatePuzzle({
      ...uniquePuzzle,
      regions: uniquePuzzle.regions.map((r) => r.map((id) => id * 10 - 20)),
    }).valid,
  ).toBe(true);
});
