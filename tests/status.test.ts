import { expect, test } from 'vitest';
import { createGame } from '../src/game/state';
import { elapsedTime } from '../src/ui/status';
import { rowPuzzle } from './fixtures';
test('elapsed time uses start time, freezes at completion, and never goes negative', () => {
  const state = createGame(rowPuzzle, 1000);
  expect(elapsedTime(state, 62000)).toBe('1:01');
  expect(elapsedTime({ ...state, completedAt: 31000 }, 100000)).toBe('0:30');
  expect(elapsedTime(state, 0)).toBe('0:00');
});
