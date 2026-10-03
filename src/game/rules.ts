import type { Conflict, Marks, Position, Puzzle } from './types';

export function getCats(marks: Marks): Position[] {
  return marks.flatMap((cells, row) =>
    cells.flatMap((mark, col) => (mark === 'cat' ? [{ row, col }] : [])),
  );
}

export function getRowCatCount(marks: Marks, row: number): number {
  return marks[row].filter((mark) => mark === 'cat').length;
}

export function getColumnCatCount(marks: Marks, col: number): number {
  return marks.filter((row) => row[col] === 'cat').length;
}

export function getRegionCatCount(
  puzzle: Puzzle,
  marks: Marks,
  regionId: number,
): number {
  return getCats(marks).filter(
    ({ row, col }) => puzzle.regions[row][col] === regionId,
  ).length;
}

export function catsTouch(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
}

export function findConflicts(puzzle: Puzzle, marks: Marks): Conflict[] {
  const cats = getCats(marks);
  const conflicts: Conflict[] = [];
  for (const type of ['row', 'column', 'region'] as const) {
    const groups = new Map<number, Position[]>();
    for (const cat of cats) {
      const key =
        type === 'row'
          ? cat.row
          : type === 'column'
            ? cat.col
            : puzzle.regions[cat.row][cat.col];
      const group = groups.get(key) ?? [];
      group.push(cat);
      groups.set(key, group);
    }
    for (const cells of groups.values()) {
      if (cells.length > 1) conflicts.push({ type, cells });
    }
  }
  cats.forEach((cat, index) => {
    for (const other of cats.slice(index + 1)) {
      if (catsTouch(cat, other))
        conflicts.push({ type: 'touching', cells: [cat, other] });
    }
  });
  return conflicts;
}

export function isValidPartialState(puzzle: Puzzle, marks: Marks): boolean {
  return findConflicts(puzzle, marks).length === 0;
}

export function isComplete(puzzle: Puzzle, marks: Marks): boolean {
  return (
    getCats(marks).length === puzzle.size && isValidPartialState(puzzle, marks)
  );
}
