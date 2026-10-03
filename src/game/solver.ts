import { catsTouch } from './rules';
import { validateStructure } from './structure';
import type { Position, Puzzle } from './types';

// Assign one column per row. Choose the most constrained remaining row;
// check both adjacent rows because assignment order is not chronological.
function search(
  puzzle: Puzzle,
  limit: number,
): { count: number; first: Position[] | null } {
  if (validateStructure(puzzle).length) return { count: 0, first: null };
  const columns = Array<number>(puzzle.size).fill(-1);
  const usedColumns = new Set<number>();
  const usedRegions = new Set<number>();
  let count = 0;
  let first: Position[] | null = null;

  function candidates(row: number): number[] {
    return Array.from({ length: puzzle.size }, (_, col) => col).filter(
      (col) => {
        if (usedColumns.has(col) || usedRegions.has(puzzle.regions[row][col]))
          return false;
        return [row - 1, row + 1].every(
          (neighbor) =>
            neighbor < 0 ||
            neighbor >= puzzle.size ||
            columns[neighbor] === -1 ||
            !catsTouch({ row, col }, { row: neighbor, col: columns[neighbor] }),
        );
      },
    );
  }

  function visit(remaining: number): boolean {
    if (remaining === 0) {
      count++;
      first ??= columns.map((col, row) => ({ row, col }));
      return count >= limit;
    }
    let selectedRow = -1;
    let options: number[] = [];
    for (let row = 0; row < puzzle.size; row++) {
      if (columns[row] !== -1) continue;
      const available = candidates(row);
      if (available.length === 0) return false;
      if (selectedRow === -1 || available.length < options.length) {
        selectedRow = row;
        options = available;
      }
    }
    for (const col of options) {
      const region = puzzle.regions[selectedRow][col];
      columns[selectedRow] = col;
      usedColumns.add(col);
      usedRegions.add(region);
      if (visit(remaining - 1)) return true;
      columns[selectedRow] = -1;
      usedColumns.delete(col);
      usedRegions.delete(region);
    }
    return false;
  }
  visit(puzzle.size);
  return { count, first };
}

export function solvePuzzle(puzzle: Puzzle): Position[] | null {
  return search(puzzle, 1).first;
}

export function countSolutions(puzzle: Puzzle, limit = 2): number {
  if (!(limit === Infinity || (Number.isInteger(limit) && limit > 0))) {
    throw new Error('Solution limit must be a positive integer or Infinity.');
  }
  return search(puzzle, limit).count;
}
