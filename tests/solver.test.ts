import { expect, test } from 'vitest';
import { countSolutions, solvePuzzle } from '../src/game/solver';
import { isComplete } from '../src/game/rules';
import {
  rowPuzzle,
  uniquePuzzle,
  unsolvablePuzzle,
  validCats,
  withCats,
} from './fixtures';

test('solves a unique puzzle and returns a valid deterministic solution', () => {
  expect(solvePuzzle(uniquePuzzle)).toEqual(validCats);
  expect(countSolutions(uniquePuzzle, 2)).toBe(1);
  expect(
    isComplete(uniquePuzzle, withCats(solvePuzzle(uniquePuzzle) ?? [])),
  ).toBe(true);
});

test('returns null and zero for unsolvable puzzles', () => {
  expect(solvePuzzle(unsolvablePuzzle)).toBeNull();
  expect(countSolutions(unsolvablePuzzle)).toBe(0);
});

test('counts all solutions or stops at the requested limit', () => {
  // Independent enumeration of all 5-column permutations gives 14 no-touch placements.
  expect(countSolutions(rowPuzzle, Infinity)).toBe(14);
  expect(countSolutions(rowPuzzle, 1)).toBe(1);
  expect(countSolutions(rowPuzzle, 2)).toBe(2);
  expect(countSolutions(rowPuzzle, 3)).toBe(3);
  expect(countSolutions(rowPuzzle, 20)).toBe(14);
});

test.each([0, -1, 1.5, NaN])('rejects invalid limit %s', (limit) => {
  expect(() => countSolutions(rowPuzzle, limit)).toThrow('Solution limit');
});

test('rejects malformed puzzles safely', () => {
  expect(solvePuzzle({ ...rowPuzzle, regions: [] })).toBeNull();
});

test.each([5, 6, 7, 8, 9, 10, 11])(
  'solves size %i without hard-coded dimensions',
  (size) => {
    const puzzle = {
      id: 'rows',
      size,
      regions: Array.from({ length: size }, (_, r) =>
        Array<number>(size).fill(r),
      ),
    };
    const solution = solvePuzzle(puzzle);
    expect(solution).not.toBeNull();
    expect(isComplete(puzzle, withCats(solution ?? [], size))).toBe(true);
  },
);
