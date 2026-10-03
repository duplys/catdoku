export interface Position {
  row: number;
  col: number;
}

export type CellMark = 'empty' | 'excluded' | 'cat';
export type Marks = CellMark[][];

export interface Puzzle {
  id: string;
  title?: string;
  size: number;
  regions: number[][];
  difficulty?: 'easy' | 'medium' | 'hard';
  seed?: string;
}

export type ConflictType = 'row' | 'column' | 'region' | 'touching';
export interface Conflict {
  type: ConflictType;
  cells: Position[];
}

export interface Snapshot {
  marks: Marks;
  completedAt?: number;
}

export interface GameState extends Snapshot {
  puzzle: Puzzle;
  history: Snapshot[];
  future: Snapshot[];
  startedAt: number;
}
