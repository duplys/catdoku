import { expect, test } from 'vitest';
import { createGame, setCellMark } from '../src/game/state';
import {
  decodeGameState,
  loadGame,
  saveGame,
  storageKey,
} from '../src/ui/storage';
import { emptyMarks, rowPuzzle, validCats, withCats } from './fixtures';

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
}
const saved = {
  version: 1,
  puzzleId: rowPuzzle.id,
  marks: emptyMarks(),
  startedAt: 100,
};

test('round-trips marks, current puzzle and start time with a versioned key', () => {
  const storage = memoryStorage();
  const state = setCellMark(
    createGame(rowPuzzle, 100),
    { row: 2, col: 3 },
    'excluded',
    200,
  );
  expect(saveGame(storage, state)).toBe(true);
  expect(storage.getItem(storageKey)).not.toBeNull();
  const restored = loadGame(storage, [rowPuzzle], 1000).state;
  expect(restored?.marks).toEqual(state.marks);
  expect(restored?.startedAt).toBe(100);
  expect(restored?.puzzle).toEqual(rowPuzzle);
  // Undo/redo are intentionally session-local; saved data stays small.
  expect(restored?.history).toEqual([]);
});

test('preserves completed state and final elapsed time', () => {
  const storage = memoryStorage();
  let state = createGame(rowPuzzle, 100);
  for (const cat of validCats) state = setCellMark(state, cat, 'cat', 500);
  saveGame(storage, state);
  expect(loadGame(storage, [rowPuzzle], 1000).state?.completedAt).toBe(500);
});

test.each([
  null,
  [],
  {},
  { ...saved, version: 2 },
  { ...saved, puzzleId: 'missing' },
  { ...saved, marks: [] },
  { ...saved, marks: [['cat']] },
  { ...saved, marks: Array.from({ length: 5 }, () => Array(5).fill('bogus')) },
  { ...saved, marks: Array.from({ length: 5 }, () => null) },
  { ...saved, startedAt: -1 },
  { ...saved, startedAt: '100' },
  { ...saved, startedAt: 2000 },
  { ...saved, completedAt: 500 },
  { ...saved, marks: withCats(validCats) },
  { ...saved, marks: withCats(validCats), completedAt: 50 },
  { ...saved, marks: withCats(validCats), completedAt: 2000 },
])('safely discards malformed/incompatible storage %#', (value) => {
  expect(decodeGameState(JSON.stringify(value), [rowPuzzle], 1000)).toBeNull();
});

test('resets corrupt JSON with a visible notice and removes it', () => {
  const storage = memoryStorage();
  storage.setItem(storageKey, '{invalid');
  expect(loadGame(storage, [rowPuzzle]).notice).toMatch(/damaged/);
  expect(storage.getItem(storageKey)).toBeNull();
});

test('missing data is normal; unavailable storage and quota errors do not crash', () => {
  expect(loadGame(memoryStorage(), [rowPuzzle])).toEqual({ state: null });
  const unavailable = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {},
  };
  expect(loadGame(unavailable, [rowPuzzle]).notice).toMatch(/unavailable/);
  expect(saveGame(unavailable, createGame(rowPuzzle))).toBe(false);
});
