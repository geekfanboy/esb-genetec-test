import type { DataColumn, DataGridRow } from './dataGridTypes';

// just simple filtering, treating every value (based on accessorFn or row[column.key]) as a string for comparison
export function filterGridRows(
  rows: DataGridRow[],
  filters: { column: DataColumn; query: string }[],
): DataGridRow[] {
  const activeFilters = filters
    .filter(({ query }) => query !== '')
    .map(({ column, query }) => ({ column, query: query.toLowerCase() }));

  return rows.filter((row) =>
    activeFilters.every(({ column, query }) => {
      const value = column.accessorFn
        ? column.accessorFn(row)
        : row[column.key];
      return String(value ?? '')
        .toLowerCase()
        .includes(query);
    }),
  );
}
