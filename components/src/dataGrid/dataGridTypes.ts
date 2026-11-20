import type React from 'react';

export type DataGridRow = Record<string, unknown>;

export type SortDirection = 'ascending' | 'descending';

export interface GridRange {
  startRow: number;
  endRow: number;
}

export interface DataBlock {
  blockStartRow: number;
  rows: DataGridRow[];
}

export interface DataColumn {
  key: string;
  label: string;
  show?: boolean;
  accessorFn?: (row: DataGridRow) => unknown;
  renderFn?: (value: unknown) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  sortingFn?: (rowA: DataGridRow, rowB: DataGridRow) => number;
  /** The last column expands beyond given width to fill the grid if needed. */
  width?: number;
}
