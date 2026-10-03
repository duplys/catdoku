import { expect, test } from 'vitest';
import { generatePuzzle } from '../src/game/generator';
import { isComplete } from '../src/game/rules';
import { countSolutions } from '../src/game/solver';
import { validatePuzzle } from '../src/game/validator';
import { withCats } from './fixtures';

test.each([5, 6, 7, 8, 9, 10, 11])(
  'generates connected unique puzzles and valid solutions for size %i',
  (size) => {
    for (const seed of ['first', 'second', 'third']) {
      const { puzzle, solution } = generatePuzzle({ size, seed });
      expect(puzzle.size).toBe(size);
      expect(puzzle.regions.flat().every(Number.isInteger)).toBe(true);
      expect(new Set(puzzle.regions.flat()).size).toBe(size);
      expect(validatePuzzle(puzzle)).toEqual({
        valid: true,
        errors: [],
        solutionCount: 1,
      });
      expect(countSolutions(puzzle, 2)).toBe(1);
      expect(isComplete(puzzle, withCats(solution, size))).toBe(true);
      for (const { row, col } of solution) {
        expect(
          solution.filter(
            (cat) =>
              puzzle.regions[cat.row][cat.col] === puzzle.regions[row][col],
          ),
        ).toHaveLength(1);
      }
    }
  },
);

test('same seed and size produce identical output', () => {
  expect(generatePuzzle({ size: 7, seed: 'repeat-me' })).toEqual(
    generatePuzzle({ size: 7, seed: 'repeat-me' }),
  );
});

test('different seeds normally produce different boards', () => {
  const boards = ['a', 'b', 'c', 'd'].map((seed) =>
    JSON.stringify(generatePuzzle({ size: 6, seed }).puzzle.regions),
  );
  expect(new Set(boards).size).toBe(4);
});

test('unseeded puzzle retains a seed that reproduces it', () => {
  const generated = generatePuzzle({ size: 5 });
  expect(generatePuzzle({ size: 5, seed: generated.puzzle.seed })).toEqual(
    generated,
  );
});

test.each([4, 12, 6.5, NaN])('rejects invalid size %s', (size) => {
  expect(() => generatePuzzle({ size })).toThrow('size');
});

test.each([0, -1, 1.5, Infinity])(
  'rejects invalid maxAttempts %s',
  (maxAttempts) => {
    expect(() => generatePuzzle({ size: 5, maxAttempts })).toThrow(
      'maxAttempts',
    );
  },
);

test('exhausts a bounded retry budget descriptively', () => {
  // Exercise actual non-unique constructions rather than mocking the solver.
  let failure: unknown;
  for (let seed = 0; seed < 100; seed++) {
    try {
      generatePuzzle({ size: 7, seed: String(seed), maxAttempts: 1 });
    } catch (error) {
      failure = error;
      break;
    }
  }
  expect(failure).toBeInstanceOf(Error);
  expect(String(failure)).toMatch(/unique 7×7 puzzle after 1 attempts.*seed:/);
});
