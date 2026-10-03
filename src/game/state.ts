import { isComplete } from './rules';
import type {
  CellMark,
  GameState,
  Marks,
  Position,
  Puzzle,
  Snapshot,
} from './types';

export function createMarks(size: number): Marks {
  return Array.from({ length: size }, () =>
    Array<CellMark>(size).fill('empty'),
  );
}

export function createGame(puzzle: Puzzle, now = Date.now()): GameState {
  return {
    puzzle,
    marks: createMarks(puzzle.size),
    history: [],
    future: [],
    startedAt: now,
  };
}

function snapshot(state: GameState): Snapshot {
  return { marks: state.marks, completedAt: state.completedAt };
}

export function setCellMark(
  state: GameState,
  position: Position,
  mark: CellMark,
  now = Date.now(),
): GameState {
  const { row, col } = position;
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    col < 0 ||
    row >= state.puzzle.size ||
    col >= state.puzzle.size
  )
    throw new Error('Cell is outside the board.');
  if (!['empty', 'excluded', 'cat'].includes(mark))
    throw new Error('Unknown cell mark.');
  if (state.marks[row][col] === mark) return state;
  const marks = state.marks.map((cells, r) =>
    cells.map((cell, c) => (r === row && c === col ? mark : cell)),
  );
  return {
    ...state,
    marks,
    history: [...state.history, snapshot(state)],
    future: [],
    completedAt: isComplete(state.puzzle, marks)
      ? (state.completedAt ?? now)
      : undefined,
  };
}

export function cycleCellMark(
  state: GameState,
  position: Position,
  now = Date.now(),
): GameState {
  const mark = state.marks[position.row]?.[position.col];
  const next: CellMark =
    mark === 'empty' ? 'excluded' : mark === 'excluded' ? 'cat' : 'empty';
  return setCellMark(state, position, next, now);
}

export function undo(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (!previous) return state;
  return {
    ...state,
    ...previous,
    history: state.history.slice(0, -1),
    future: [...state.future, snapshot(state)],
  };
}

export function redo(state: GameState): GameState {
  const next = state.future.at(-1);
  if (!next) return state;
  return {
    ...state,
    ...next,
    history: [...state.history, snapshot(state)],
    future: state.future.slice(0, -1),
  };
}

export function restart(state: GameState, now = Date.now()): GameState {
  // SPEC explicitly defines restart as a fresh game with cleared history.
  return createGame(state.puzzle, now);
}
