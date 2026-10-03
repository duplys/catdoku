import type { Marks, Position, Puzzle } from '../src/game/types';

export const rowPuzzle: Puzzle = {
  id: 'rows',
  size: 5,
  regions: Array.from({ length: 5 }, (_, row) => Array<number>(5).fill(row)),
};

export function emptyMarks(size = 5): Marks {
  return Array.from({ length: size }, () => Array(size).fill('empty'));
}

export function withCats(cats: Position[], size = 5): Marks {
  const marks = emptyMarks(size);
  for (const { row, col } of cats) marks[row][col] = 'cat';
  return marks;
}

export const validCats = [0, 2, 4, 1, 3].map((col, row) => ({ row, col }));

export function forcedPuzzle(columns: number[]): Puzzle {
  const regions = Array.from({ length: 5 }, () => Array<number>(5).fill(0));
  columns.slice(1).forEach((col, index) => {
    regions[index + 1][col] = index + 1;
  });
  return { id: 'forced', size: 5, regions };
}
export const uniquePuzzle = forcedPuzzle([0, 2, 4, 1, 3]);
export const unsolvablePuzzle = forcedPuzzle([0, 1, 2, 3, 4]);
