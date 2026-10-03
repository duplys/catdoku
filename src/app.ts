import { createGame, cycleCellMark, redo, restart, undo } from './game/state';
import type { GameState } from './game/types';
import { validatePuzzle } from './game/validator';
import { builtins } from './puzzles';
import { createBoard } from './ui/board';
import { createControls } from './ui/controls';
import { catIcon } from './ui/icons';
import { elapsedTime, updateStatus } from './ui/status';
import { loadGame, saveGame } from './ui/storage';
export function startApp(root: HTMLElement): () => void {
  const invalid = builtins.find((puzzle) => !validatePuzzle(puzzle).valid);
  if (invalid || builtins.length === 0) {
    root.textContent =
      'The puzzle collection could not be loaded. Please reload or contact the site maintainer.';
    return () => {};
  }
  let restored: ReturnType<typeof loadGame>;
  try {
    restored = loadGame(window.localStorage, builtins);
  } catch {
    restored = {
      state: null,
      notice: 'Browser storage is unavailable. Progress cannot be saved.',
    };
  }
  let state = restored.state ?? createGame(builtins[0]);
  root.innerHTML = `<header class="header"><a class="wordmark" href="/" aria-label="Catdoku home"><span class="brand-icon">${catIcon}</span> Catdoku</a><span class="eyebrow">A little room for logic</span></header>
    <section class="intro"><p class="eyebrow">Settle in. Find their places.</p><h1>A quiet puzzle,<br />a few curious cats.</h1><p>One cat in every row, column, and region.<br />No touching — even at the corners.</p></section>
    <section class="game" aria-label="Catdoku puzzle"><div class="board-heading"><h2 id="puzzle-title"></h2><span id="timer" aria-label="Elapsed time"></span></div>
    <div id="board" class="board" role="group" aria-describedby="interaction"></div>
    <p id="interaction" class="interaction">Tap to cycle: empty <span aria-hidden="true">→</span> × <span aria-hidden="true">→</span> cat. Use Tab or arrow keys, then Enter or Space.</p>
    <p id="status" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
    <div id="controls" class="controls"></div><p id="storage-notice" class="storage-notice" role="status" hidden></p></section>
    <details class="rules"><summary>How to play</summary><ol><li>Place exactly one cat in each row.</li><li>Place exactly one cat in each column.</li><li>Place exactly one cat in each bordered region.</li><li>Keep cats apart, including diagonally.</li></ol><p>Use × to rule out cells. Conflicting cats stay on the board, with a red outline. You can always undo a move.</p></details>
    <footer>A small game. No ads. No trackers. Just you and the cats.</footer>`;
  const board = createBoard(
    root.querySelector<HTMLElement>('#board')!,
    (position) => commit(cycleCellMark(state, position)),
  );
  const controls = createControls(
    root.querySelector<HTMLElement>('#controls')!,
    builtins,
    {
      undo: () => commit(undo(state)),
      redo: () => commit(redo(state)),
      restart: () => commit(restart(state)),
      next: () =>
        select(
          builtins[
            (builtins.findIndex((p) => p.id === state.puzzle.id) + 1) %
              builtins.length
          ].id,
        ),
      select,
    },
  );
  const status = root.querySelector<HTMLElement>('#status')!;
  const timer = root.querySelector<HTMLElement>('#timer')!;
  const title = root.querySelector<HTMLElement>('#puzzle-title')!;
  const storageNotice = root.querySelector<HTMLElement>('#storage-notice')!;
  if (restored.notice) {
    storageNotice.hidden = false;
    storageNotice.textContent = restored.notice;
  }
  function select(id: string) {
    const puzzle = builtins.find((p) => p.id === id);
    if (puzzle) commit(createGame(puzzle));
  }
  function commit(next: GameState) {
    state = next;
    try {
      if (!saveGame(window.localStorage, state))
        throw new Error('Storage unavailable');
    } catch {
      storageNotice.hidden = false;
      storageNotice.textContent =
        'Progress could not be saved. You can continue playing, but a refresh may lose these moves.';
    }
    render();
  }
  function render() {
    board.update(state);
    controls.update(state);
    title.textContent = state.puzzle.title ?? state.puzzle.id;
    timer.textContent = elapsedTime(state);
    updateStatus(status, state);
  }
  render();
  const interval = window.setInterval(() => {
    timer.textContent = elapsedTime(state);
  }, 1000);
  return () => window.clearInterval(interval);
}
