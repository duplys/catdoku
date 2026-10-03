import { expect, test } from 'vitest';
import {
  createGame,
  cycleCellMark,
  redo,
  restart,
  setCellMark,
  undo,
} from '../src/game/state';
import { rowPuzzle, validCats } from './fixtures';

test('cycles empty → excluded → cat → empty, immutably', () => {
  const original = createGame(rowPuzzle, 100);
  let state = original;
  for (const mark of ['excluded', 'cat', 'empty']) {
    state = cycleCellMark(state, { row: 0, col: 0 });
    expect(state.marks[0][0]).toBe(mark);
  }
  expect(original.marks[0][0]).toBe('empty');
  expect(original.history).toEqual([]);
});

test('undo and redo restore exact marks, multiple moves, and boundaries', () => {
  const original = createGame(rowPuzzle, 100);
  const first = cycleCellMark(original, { row: 0, col: 0 });
  const second = cycleCellMark(first, { row: 2, col: 3 });
  expect(undo(second).marks).toEqual(first.marks);
  expect(undo(undo(second)).marks).toEqual(original.marks);
  expect(redo(undo(second))).toEqual(second);
  expect(undo(original)).toBe(original);
  expect(redo(original)).toBe(original);
});

test('a new move after undo clears redo but a no-op does not', () => {
  const moved = cycleCellMark(createGame(rowPuzzle), { row: 0, col: 0 });
  const undone = undo(moved);
  expect(setCellMark(undone, { row: 0, col: 0 }, 'empty')).toBe(undone);
  expect(cycleCellMark(undone, { row: 2, col: 2 }).future).toEqual([]);
});

test('allows conflicting moves', () => {
  const first = setCellMark(createGame(rowPuzzle), { row: 0, col: 0 }, 'cat');
  expect(
    setCellMark(first, { row: 0, col: 1 }, 'cat').marks[0].slice(0, 2),
  ).toEqual(['cat', 'cat']);
});

test('completion timing is restored exactly by undo and redo', () => {
  let state = createGame(rowPuzzle, 100);
  validCats.forEach((position) => {
    state = setCellMark(state, position, 'cat', 200);
  });
  expect(state.completedAt).toBe(200);
  expect(undo(state).completedAt).toBeUndefined();
  expect(redo(undo(state)).completedAt).toBe(200);
  const edit = setCellMark(state, { row: 0, col: 4 }, 'excluded', 300);
  expect(edit.completedAt).toBe(200);
  const broken = setCellMark(edit, validCats[0], 'empty', 400);
  expect(broken.completedAt).toBeUndefined();
  expect(undo(broken).completedAt).toBe(200);
});

test('restart clears marks, history, redo, completion and resets start time', () => {
  const state = cycleCellMark(createGame(rowPuzzle), { row: 0, col: 0 });
  expect(restart(state, 500)).toEqual(createGame(rowPuzzle, 500));
});

test('rejects invalid positions without changing state', () => {
  const state = createGame(rowPuzzle);
  for (const row of [-1, 5, 0.5, NaN]) {
    expect(() => setCellMark(state, { row, col: 0 }, 'cat')).toThrow('outside');
  }
  expect(() => cycleCellMark(state, { row: 0, col: 5 })).toThrow('outside');
});
