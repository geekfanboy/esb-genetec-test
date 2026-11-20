import type { DataColumn, DataGridRow, SortDirection } from './dataGridTypes';

type ValueType = 'number' | 'string' | 'boolean' | 'date' | 'other';

// infer value type of value so that theyre not all sorted as strings. might be useful later if filtering is improved not just as string
function valueType(value: unknown): ValueType {
  if (typeof value === 'number' && !Number.isNaN(value)) return 'number';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return 'date';
  return 'other';
}

// infers the value type of a column based on its non-null values (i.e. in case of mixed types it will return 'other')
function inferColumnValueType(values: unknown[]): ValueType {
  const types = new Set(
    values.filter((value) => value != null).map((value) => valueType(value)),
  );
  const type = types.values().next().value;
  return types.size === 1 && type ? type : 'other';
}

function compareNumbers(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// compares two values of the same type, falling back to string comparison for 'other' type
function compareValues(a: unknown, b: unknown, type: ValueType): number {
  switch (type) {
    case 'number':
      if (typeof a === 'number' && typeof b === 'number') {
        return compareNumbers(a, b);
      }
      break;
    case 'date':
      if (a instanceof Date && b instanceof Date) {
        return compareNumbers(a.getTime(), b.getTime());
      }
      break;
    case 'boolean':
      if (typeof a === 'boolean' && typeof b === 'boolean') {
        return compareNumbers(Number(a), Number(b));
      }
      break;
  }

  return String(a).localeCompare(String(b));
}

// sorts grid rows based on a column and direction, using custom sorting function if provided, and falling back to inferred value types for non-null values
export function sortGridRows(
  inputRows: DataGridRow[],
  column: DataColumn,
  direction: SortDirection,
): DataGridRow[] {
  const sortingFn = column.sortingFn;
  const rows = inputRows.map((row, index) => ({
    row,
    index,
    value: sortingFn
      ? undefined
      : column.accessorFn
        ? column.accessorFn(row)
        : row[column.key],
  }));
  const type = sortingFn
    ? 'other'
    : inferColumnValueType(rows.map(({ value }) => value));

  const directionMultiplier = direction === 'ascending' ? 1 : -1;

  rows.sort((a, b) => {
    let comparison: number;
    if (sortingFn) {
      // use custom sorting function if provided
      comparison = sortingFn(a.row, b.row) * directionMultiplier;
    } else if (a.value == null || b.value == null) {
      // handle null or undefined values gracefully
      comparison = a.value == null ? (b.value == null ? 0 : 1) : -1;
    } else {
      // compare non-null values based on inferred type
      comparison = compareValues(a.value, b.value, type) * directionMultiplier;
    }
    // fallback to original order if comparison is 0
    return comparison || a.index - b.index;
  });

  return rows.map(({ row }) => row);
}
