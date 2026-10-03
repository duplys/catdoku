import { findConflicts } from '../game/rules';
import type { GameState, Position, Puzzle } from '../game/types';
import { catIcon, excludedIcon } from './icons';
const colors = [
  '#dce8cd',
  '#f4d9c4',
  '#d5e6ed',
  '#e7ddf0',
  '#f4e8b9',
  '#eed3d8',
  '#cce8df',
  '#e1e2f0',
  '#eddfc7',
  '#d8e9bc',
  '#d9e0e5',
];
export function createBoard(
  container: HTMLElement,
  onCycle: (position: Position) => void,
) {
  let currentId = '';
  let size = 0;
  let buttons: HTMLButtonElement[] = [];
  function build(puzzle: Puzzle) {
    currentId = puzzle.id;
    size = puzzle.size;
    const ids = [...new Set(puzzle.regions.flat())].sort((a, b) => a - b);
    container.replaceChildren();
    container.style.setProperty('--size', String(size));
    container.setAttribute(
      'aria-label',
      `${puzzle.title ?? 'Puzzle'}, ${size} rows and columns`,
    );
    buttons = puzzle.regions.flatMap((cells, row) =>
      cells.map((region, col) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cell';
        button.style.setProperty('--region-color', colors[ids.indexOf(region)]);
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        for (const [side, dr, dc] of [
          ['top', -1, 0],
          ['right', 0, 1],
          ['bottom', 1, 0],
          ['left', 0, -1],
        ] as const) {
          if (puzzle.regions[row + dr]?.[col + dc] !== region)
            button.classList.add(`edge-${side}`);
        }
        button.addEventListener('click', () => onCycle({ row, col }));
        container.append(button);
        return button;
      }),
    );
  }
  container.addEventListener('keydown', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const row = Number(event.target.dataset.row);
    const col = Number(event.target.dataset.col);
    const next = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col - 1],
      ArrowRight: [row, col + 1],
      Home: [row, 0],
      End: [row, size - 1],
    }[event.key];
    if (!next) return;
    event.preventDefault();
    const [r, c] = next;
    if (r >= 0 && r < size && c >= 0 && c < size) buttons[r * size + c].focus();
  });
  return {
    update(state: GameState) {
      if (currentId !== state.puzzle.id) build(state.puzzle);
      const conflicts = findConflicts(state.puzzle, state.marks);
      const ids = [...new Set(state.puzzle.regions.flat())].sort(
        (a, b) => a - b,
      );
      for (const [index, button] of buttons.entries()) {
        const row = Math.floor(index / size);
        const col = index % size;
        const mark = state.marks[row][col];
        const reasons = [
          ...new Set(
            conflicts
              .filter((conflict) =>
                conflict.cells.some(
                  (cell) => cell.row === row && cell.col === col,
                ),
              )
              .map((c) => c.type),
          ),
        ];
        const regionNumber = ids.indexOf(state.puzzle.regions[row][col]) + 1;
        button.classList.toggle('conflict', reasons.length > 0);
        button.dataset.mark = mark;
        button.setAttribute(
          'aria-label',
          `Row ${row + 1}, column ${col + 1}, region ${regionNumber}: ${mark}${reasons.length ? `. Conflict: ${reasons.join(', ')}` : ''}`,
        );
        if (button.dataset.renderedMark !== mark) {
          button.innerHTML =
            mark === 'cat' ? catIcon : mark === 'excluded' ? excludedIcon : '';
          button.dataset.renderedMark = mark;
        }
      }
    },
  };
}
