import type { Puzzle } from './types';

export function validateStructure(puzzle: Puzzle): string[] {
  if (!Number.isInteger(puzzle.size) || puzzle.size < 5 || puzzle.size > 11) {
    return ['Size must be an integer from 5 through 11.'];
  }
  if (
    !Array.isArray(puzzle.regions) ||
    puzzle.regions.length !== puzzle.size ||
    puzzle.regions.some(
      (row) => !Array.isArray(row) || row.length !== puzzle.size,
    )
  ) {
    return ['Regions must form a square matrix matching the size.'];
  }
  const cells = puzzle.regions.flat();
  if (cells.some((region) => !Number.isInteger(region)))
    return ['Region IDs must be integers.'];
  const ids = new Set(cells);
  const errors: string[] = [];
  if (ids.size !== puzzle.size)
    errors.push(
      `Expected ${puzzle.size} non-empty regions; found ${ids.size}.`,
    );
  for (const id of ids) {
    const start = cells.indexOf(id);
    const seen = new Set([start]);
    const queue = [start];
    for (let index = 0; index < queue.length; index++) {
      const row = Math.floor(queue[index] / puzzle.size);
      const col = queue[index] % puzzle.size;
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        const key = nextRow * puzzle.size + nextCol;
        if (
          nextRow >= 0 &&
          nextRow < puzzle.size &&
          nextCol >= 0 &&
          nextCol < puzzle.size &&
          puzzle.regions[nextRow][nextCol] === id &&
          !seen.has(key)
        ) {
          seen.add(key);
          queue.push(key);
        }
      }
    }
    if (seen.size !== cells.filter((cell) => cell === id).length)
      errors.push(`Region ${id} is not orthogonally connected.`);
  }
  return errors;
}
