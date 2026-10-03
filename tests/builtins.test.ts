import { expect, test } from 'vitest';
import { builtins } from '../src/puzzles';
import { validatePuzzle } from '../src/game/validator';
test('ships ten original distinct boards across sizes and manual difficulty labels', () => {
  expect(builtins.length).toBeGreaterThanOrEqual(10);
  expect(new Set(builtins.map((p) => p.id)).size).toBe(builtins.length);
  expect(new Set(builtins.map((p) => JSON.stringify(p.regions))).size).toBe(
    builtins.length,
  );
  expect(new Set(builtins.map((p) => p.size)).size).toBeGreaterThanOrEqual(2);
  expect(builtins.filter((p) => p.difficulty === 'easy')).toHaveLength(4);
  expect(builtins.filter((p) => p.difficulty === 'medium')).toHaveLength(4);
  expect(builtins.filter((p) => p.difficulty === 'hard')).toHaveLength(2);
});
test.each(builtins)('$id is structurally valid and unique', (puzzle) => {
  expect(validatePuzzle(puzzle)).toEqual({
    valid: true,
    errors: [],
    solutionCount: 1,
  });
});
