import { describe, expect, test } from 'vitest';
import {
  catsTouch,
  findConflicts,
  getCats,
  getColumnCatCount,
  getRegionCatCount,
  getRowCatCount,
  isComplete,
  isValidPartialState,
} from '../src/game/rules';
import { emptyMarks, rowPuzzle, validCats, withCats } from './fixtures';

describe('rules', () => {
  test.each([
    [
      'row',
      [
        { row: 0, col: 0 },
        { row: 0, col: 3 },
      ],
    ],
    [
      'column',
      [
        { row: 0, col: 0 },
        { row: 3, col: 0 },
      ],
    ],
    [
      'region',
      [
        { row: 0, col: 0 },
        { row: 0, col: 4 },
      ],
    ],
  ])('detects %s conflicts', (type, cats) => {
    expect(findConflicts(rowPuzzle, withCats(cats))).toContainEqual({
      type,
      cells: cats,
    });
  });

  test('regions can conflict independently of rows and columns', () => {
    const puzzle = {
      ...rowPuzzle,
      regions: rowPuzzle.regions.map((row) => [...row]),
    };
    puzzle.regions[3][3] = 0;
    expect(
      findConflicts(
        puzzle,
        withCats([
          { row: 0, col: 0 },
          { row: 3, col: 3 },
        ]),
      ).map((c) => c.type),
    ).toEqual(['region']);
  });

  test.each([
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ])('detects touching at $row,$col', (other) => {
    expect(catsTouch({ row: 0, col: 0 }, other)).toBe(true);
    expect(
      findConflicts(rowPuzzle, withCats([{ row: 0, col: 0 }, other])).some(
        (c) => c.type === 'touching',
      ),
    ).toBe(true);
  });

  test('counts cats without counting exclusions', () => {
    const marks = withCats(validCats);
    marks[0][4] = 'excluded';
    expect(getCats(marks)).toEqual(validCats);
    expect(getRowCatCount(marks, 0)).toBe(1);
    expect(getColumnCatCount(marks, 4)).toBe(1);
    expect(getRegionCatCount(rowPuzzle, marks, 3)).toBe(1);
  });

  test('accepts a complete valid board and rejects incomplete/conflicting boards', () => {
    expect(catsTouch({ row: 0, col: 0 }, { row: 1, col: 2 })).toBe(false);
    expect(findConflicts(rowPuzzle, withCats(validCats))).toEqual([]);
    expect(isComplete(rowPuzzle, withCats(validCats))).toBe(true);
    expect(isComplete(rowPuzzle, emptyMarks())).toBe(false);
    expect(isValidPartialState(rowPuzzle, emptyMarks())).toBe(true);
    const conflict = withCats([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ]);
    expect(isValidPartialState(rowPuzzle, conflict)).toBe(false);
    expect(isComplete(rowPuzzle, conflict)).toBe(false);
  });

  test.each([5, 6, 7, 8, 9, 10, 11])('supports size %i', (size) => {
    const puzzle = {
      id: `size-${size}`,
      size,
      regions: Array.from({ length: size }, (_, r) => Array(size).fill(r)),
    };
    expect(isValidPartialState(puzzle, emptyMarks(size))).toBe(true);
  });
});
