import { isComplete } from '../game/rules';
import { createGame } from '../game/state';
import type { GameState, Marks, Puzzle } from '../game/types';

export const storageKey = 'catdoku:v1:game-state';
type GameStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isMarks(value: unknown, size: number): value is Marks {
  return (
    Array.isArray(value) &&
    value.length === size &&
    value.every(
      (row: unknown) =>
        Array.isArray(row) &&
        row.length === size &&
        row.every(
          (mark: unknown) =>
            mark === 'empty' || mark === 'excluded' || mark === 'cat',
        ),
    )
  );
}
function isTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function decodeGameState(
  raw: string,
  puzzles: Puzzle[],
  now = Date.now(),
): GameState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.puzzleId !== 'string'
  )
    return null;
  const puzzle = puzzles.find((p) => p.id === value.puzzleId);
  if (
    !puzzle ||
    !isMarks(value.marks, puzzle.size) ||
    !isTime(value.startedAt) ||
    value.startedAt > now
  )
    return null;
  const complete = isComplete(puzzle, value.marks);
  if (complete !== (value.completedAt !== undefined)) return null;
  if (
    value.completedAt !== undefined &&
    (!isTime(value.completedAt) ||
      value.completedAt < value.startedAt ||
      value.completedAt > now)
  )
    return null;
  return {
    ...createGame(puzzle, value.startedAt),
    marks: value.marks,
    completedAt: isTime(value.completedAt) ? value.completedAt : undefined,
  };
}

export function loadGame(
  storage: GameStorage,
  puzzles: Puzzle[],
  now = Date.now(),
): { state: GameState | null; notice?: string } {
  try {
    const raw = storage.getItem(storageKey);
    if (raw === null) return { state: null };
    const state = decodeGameState(raw, puzzles, now);
    if (state) return { state };
    storage.removeItem(storageKey);
    return {
      state: null,
      notice:
        'Saved progress was incompatible or damaged. A fresh puzzle is ready.',
    };
  } catch {
    return {
      state: null,
      notice:
        'Browser storage is unavailable. You can play, but progress will not survive a refresh.',
    };
  }
}

export function saveGame(storage: GameStorage, state: GameState): boolean {
  try {
    storage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        puzzleId: state.puzzle.id,
        marks: state.marks,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
