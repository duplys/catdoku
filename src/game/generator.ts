import { seededRandom, shuffled, type Random } from './random';
import { catsTouch } from './rules';
import { countSolutions } from './solver';
import type { Position, Puzzle } from './types';

export interface GeneratorOptions {
  size: number;
  seed?: string;
  maxAttempts?: number;
}
export interface GeneratedPuzzle {
  puzzle: Puzzle;
  solution: Position[];
}

function placeCats(size: number, random: Random): Position[] {
  const solution: Position[] = [];
  const used = new Set<number>();
  const columns = Array.from({ length: size }, (_, col) => col);
  function visit(row: number): boolean {
    if (row === size) return true;
    for (const col of shuffled(columns, random)) {
      if (
        used.has(col) ||
        (row > 0 && catsTouch(solution[row - 1], { row, col }))
      )
        continue;
      solution.push({ row, col });
      used.add(col);
      if (visit(row + 1)) return true;
      solution.pop();
      used.delete(col);
    }
    return false;
  }
  if (!visit(0))
    throw new Error(
      `Unable to place non-touching cats on a ${size}×${size} board.`,
    );
  return solution;
}

function growRegions(
  size: number,
  solution: Position[],
  random: Random,
): number[][] {
  const regions = Array.from({ length: size }, () =>
    Array<number>(size).fill(-1),
  );
  const frontier: Position[][] = Array.from({ length: size }, () => []);
  // Different growth rates encourage irregular regions and reduce uniqueness retries.
  const rates = solution.map(() => Math.max(0.0001, random() ** 4));
  solution.forEach(({ row, col }, region) => {
    regions[row][col] = region;
  });

  function addNeighbors({ row, col }: Position, region: number) {
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (
        nextRow >= 0 &&
        nextRow < size &&
        nextCol >= 0 &&
        nextCol < size &&
        regions[nextRow][nextCol] === -1
      ) {
        frontier[region].push({ row: nextRow, col: nextCol });
      }
    }
  }
  solution.forEach(addNeighbors);
  while (frontier.some((cells) => cells.length > 0)) {
    const weights = frontier.map(
      (cells, region) => cells.length * rates[region],
    );
    let choice = random() * weights.reduce((sum, weight) => sum + weight, 0);
    let region = 0;
    while (region < size - 1 && choice >= weights[region]) {
      choice -= weights[region];
      region++;
    }
    const cells = frontier[region];
    const index = Math.floor(random() * cells.length);
    const cell = cells[index];
    cells[index] = cells[cells.length - 1];
    cells.pop();
    if (regions[cell.row][cell.col] !== -1) continue;
    regions[cell.row][cell.col] = region;
    addNeighbors(cell, region);
  }
  return regions;
}

export function generatePuzzle({
  size,
  seed,
  maxAttempts = 1000,
}: GeneratorOptions): GeneratedPuzzle {
  if (!Number.isInteger(size) || size < 5 || size > 11)
    throw new Error('Generator size must be an integer from 5 through 11.');
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1)
    throw new Error('maxAttempts must be a positive integer.');
  const actualSeed = seed ?? `${Date.now()}-${Math.random()}`;
  const random = seededRandom(actualSeed);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = placeCats(size, random);
    const puzzle: Puzzle = {
      id: `generated-${size}-${actualSeed}`,
      title: 'A new nook',
      size,
      seed: actualSeed,
      regions: growRegions(size, solution, random),
    };
    if (countSolutions(puzzle, 2) === 1) return { puzzle, solution };
  }
  throw new Error(
    `Could not generate a unique ${size}×${size} puzzle after ${maxAttempts} attempts (seed: ${actualSeed}). Try another seed or increase maxAttempts.`,
  );
}
