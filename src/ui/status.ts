import { findConflicts, getCats } from '../game/rules';
import type { GameState } from '../game/types';
export function elapsedTime(state: GameState, now = Date.now()): string {
  const seconds = Math.max(
    0,
    Math.floor(((state.completedAt ?? now) - state.startedAt) / 1000),
  );
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export function updateStatus(element: HTMLElement, state: GameState) {
  const conflicts = findConflicts(state.puzzle, state.marks);
  element.classList.toggle('success', state.completedAt !== undefined);
  element.classList.toggle('warning', conflicts.length > 0);
  if (state.completedAt !== undefined) {
    element.textContent = `Lovely work! All cats have a place. Solved in ${elapsedTime(state)}. Try the next puzzle below.`;
  } else if (conflicts.length) {
    const types = [...new Set(conflicts.map((c) => c.type))];
    element.textContent = `Check the outlined cats: ${types.map((type) => (type === 'touching' ? 'cats are touching' : `more than one cat in a ${type}`)).join('; ')}.`;
  } else {
    element.textContent = `${getCats(state.marks).length} of ${state.puzzle.size} cats placed. Give each cat a little space.`;
  }
}
