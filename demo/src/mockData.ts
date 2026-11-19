// components/src/mockData.ts
export const ROW_COUNT = 100_000;
export const COLUMN_COUNT = 10_000;

const FIRST = [
  'Ava',
  'Liam',
  'Noah',
  'Emma',
  'Olivia',
  'Lucas',
  'Mia',
  'Ethan',
  'Zoe',
  'Karl',
];
const LAST = [
  'Smith',
  'Jensen',
  'Garcia',
  'Muller',
  'Rossi',
  'Nguyen',
  'Silva',
  'Kowalski',
  'Berg',
  'Dubois',
];
const STATUS = ['active', 'pending', 'suspended', 'archived'] as const;
const BASE_DATE = Date.UTC(2020, 0, 1);

export type Cell = string | number | boolean; // Types we are handling in mock

export interface ColumnDef {
  key: string;
  label: string;
  type: 'id' | 'text' | 'number' | 'date' | 'boolean' | 'enum';
}

export const columns: ColumnDef[] = Array.from(
  { length: COLUMN_COUNT },
  (_, c) => {
    const colType: ColumnDef['type'][] = [
      'id',
      'text',
      'number',
      'date',
      'boolean',
      'enum',
    ];
    return c < colType.length
      ? {
          key: `col${c}`,
          label: ['ID', 'Name', 'Amount', 'Created', 'Verified', 'Status'][c],
          type: colType[c],
        }
      : { key: `col${c}`, label: `Column ${c}`, type: 'number' };
  },
);

export function getCell(row: number, col: number): Cell {
  switch (col) {
    case 0:
      return row + 1;
    case 1:
      return `${FIRST[row % FIRST.length]} ${LAST[Math.floor(row / FIRST.length) % LAST.length]}`;
    case 2:
      return (row % 1_000_000) / 100;
    case 3:
      return new Date(BASE_DATE + (row % (365 * 5)) * 86_400_000)
        .toISOString()
        .slice(0, 10);
    case 4:
      return row % 3 !== 0;
    case 5:
      return STATUS[row % STATUS.length];
    default:
      return (row + col) % 100_000;
  }
}

export function getRow(
  row: number,
  startCol = 0,
  colCount = 50,
): Record<string, Cell> {
  const out: Record<string, Cell> = {};
  const end = Math.min(startCol + colCount, COLUMN_COUNT);
  for (let c = startCol; c < end; c++) {
    out[`col${c}`] = getCell(row, c);
  }
  return out;
}

export function getRows(
  startRow: number,
  count: number,
  startCol = 0,
  colCount = 50,
) {
  const end = Math.min(startRow + count, ROW_COUNT);
  const rows: Record<string, Cell>[] = [];
  for (let r = startRow; r < end; r++) {
    rows.push(getRow(r, startCol, colCount));
  }
  return rows;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simualate fetch delay to see loading status. add half sec
export async function getRowsAsync(
  startRow: number,
  count: number,
  startCol = 0,
  colCount = 100,
  delayMs = 500 + Math.random() * 700,
) {
  await sleep(delayMs);
  return getRows(startRow, count, startCol, colCount);
}
