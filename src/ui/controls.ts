import type { GameState, Puzzle } from '../game/types';
interface Actions {
  undo(): void;
  redo(): void;
  restart(): void;
  next(): void;
  select(id: string): void;
}
export function createControls(
  container: HTMLElement,
  puzzles: Puzzle[],
  actions: Actions,
) {
  container.innerHTML = `<div class="puzzle-picker"><label for="puzzle">Your puzzle</label><select id="puzzle"></select></div>
    <div class="control-row"><button type="button" data-action="undo">↶ Undo</button><button type="button" data-action="redo">↷ Redo</button><button type="button" data-action="restart">Restart</button></div>
    <button type="button" class="next-button" data-action="next">Next puzzle <span aria-hidden="true">→</span></button>`;
  const select = container.querySelector<HTMLSelectElement>('select')!;
  for (const puzzle of puzzles) {
    const option = document.createElement('option');
    option.value = puzzle.id;
    option.textContent = `${puzzle.title ?? puzzle.id} · ${puzzle.size}×${puzzle.size} · ${puzzle.difficulty ?? 'unrated'}`;
    select.append(option);
  }
  select.addEventListener('change', () => actions.select(select.value));
  const undo = container.querySelector<HTMLButtonElement>(
    '[data-action="undo"]',
  )!;
  const redo = container.querySelector<HTMLButtonElement>(
    '[data-action="redo"]',
  )!;
  for (const action of ['undo', 'redo', 'restart', 'next'] as const) {
    container
      .querySelector(`[data-action="${action}"]`)!
      .addEventListener('click', actions[action]);
  }
  return {
    update(state: GameState) {
      select.value = state.puzzle.id;
      undo.disabled = state.history.length === 0;
      redo.disabled = state.future.length === 0;
    },
  };
}
