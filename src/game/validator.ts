import { countSolutions } from './solver';
import { validateStructure } from './structure';
import type { Puzzle } from './types';

export interface PuzzleValidationResult {
  valid: boolean;
  errors: string[];
  solutionCount?: number;
}

export function validatePuzzle(puzzle: Puzzle): PuzzleValidationResult {
  const errors = validateStructure(puzzle);
  if (errors.length) return { valid: false, errors };
  const solutionCount = countSolutions(puzzle, 2);
  if (solutionCount === 0) errors.push('Puzzle has no solution.');
  if (solutionCount > 1) errors.push('Puzzle has multiple solutions.');
  return { valid: errors.length === 0, errors, solutionCount };
}
