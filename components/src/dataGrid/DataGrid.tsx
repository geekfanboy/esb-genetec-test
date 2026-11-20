import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Inbox } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '../components/ui/popover';
import { Paginator } from './Paginator';
import { filterGridRows } from './dataGridFiltering';
import { sortGridRows } from './dataGridSorting';
import type {
  DataBlock,
  DataColumn,
  DataGridRow,
  GridRange,
  SortDirection,
} from './dataGridTypes';
import { cn } from '../utils';

export type { DataBlock, DataColumn, GridRange } from './dataGridTypes';

export interface DataGridProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  rowCount: number;
  columns: DataColumn[];
  dataBlock: DataBlock[];
  onRangeChange?: (range: GridRange) => void;
  rowHeight?: number;
  loading?: boolean;
  pagination?: boolean;
  initialSort?: {
    key: string;
    direction: SortDirection;
  } | null;
}

function ColumnFilter({
  column,
  value,
  onApply,
}: {
  column: DataColumn;
  value: string;
  onApply: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [draftFilter, setDraftFilter] = React.useState(value);
  const id = React.useId();

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraftFilter(value);
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        aria-label={`Filter ${column.label}${value ? ' (active)' : ''}`}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-gray-900',
          value
            ? 'bg-gray-900 text-white'
            : 'text-slate-400 hover:bg-gray-200 hover:text-inherit focus-visible:text-inherit',
        )}
      >
        <Filter aria-hidden="true" className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="font-normal leading-normal">
        <PopoverTitle>Filter {column.label}</PopoverTitle>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onApply(draftFilter);
            setOpen(false);
          }}
        >
          <label htmlFor={id}>Contains</label>
          <input
            id={id}
            type="text"
            value={draftFilter}
            onChange={(event) => setDraftFilter(event.target.value)}
            className="min-w-0 rounded border border-gray-300 px-2 py-1"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftFilter('');
                onApply('');
                setOpen(false);
              }}
              className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100"
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded bg-gray-900 px-2 py-1 text-white hover:bg-gray-700"
            >
              Apply
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// built for to allow row visualization / handling large data. can be improved to be less unweildy for straightforward usecases

export const DataGrid = ({
  className,
  rowCount,
  columns,
  dataBlock,
  onRangeChange,
  rowHeight = 36,
  loading = false,
  pagination = true,
  initialSort = null,
  ...divProps
}: DataGridProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(100);
  const [sort, setSort] = React.useState(() =>
    initialSort ? { ...initialSort } : null,
  );
  const [filters, setFilters] = React.useState<Map<string, string>>(
    () => new Map(),
  );
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const visibleColumns = React.useMemo(
    () => columns.filter((column) => column.show !== false),
    [columns],
  );

  // Merge blocks into a row map. its all still just combining, later we cn further optimize by disposing
  const rowsByIndex = React.useMemo(() => {
    const map = new Map<number, DataGridRow>();
    for (const block of dataBlock) {
      block.rows.forEach((row, i) => {
        const index = block.blockStartRow + i;
        const existing = map.get(index);
        map.set(index, existing ? { ...existing, ...row } : row);
      });
    }
    return map;
  }, [dataBlock]);

  const sortColumn = visibleColumns.find(
    (column) => column.key === sort?.key && column.sortable,
  );

  const activeFilters = React.useMemo(
    () =>
      visibleColumns.flatMap((column) => {
        const query = filters.get(column.key);
        return column.filterable && query ? [{ column, query }] : [];
      }),
    [visibleColumns, filters],
  );

  const transformedLoading =
    loading && (activeFilters.length > 0 || sortColumn !== undefined);

  const inputRows = React.useMemo(
    () =>
      (activeFilters.length || sortColumn) && !loading
        ? [...rowsByIndex.entries()]
            .filter(([index]) => index >= 0 && index < rowCount)
            .sort(([a], [b]) => a - b)
            .map(([, row]) => row)
        : null,
    [activeFilters, sortColumn, loading, rowsByIndex, rowCount],
  );

  const filteredRows = React.useMemo(
    () =>
      inputRows && activeFilters.length
        ? filterGridRows(inputRows, activeFilters)
        : inputRows,
    [inputRows, activeFilters],
  );

  const sortedRows = React.useMemo(() => {
    if (!sort || !sortColumn || !filteredRows) return null;
    return sortGridRows(filteredRows, sortColumn, sort.direction);
  }, [sort, sortColumn, filteredRows]);

  const displayedRows = sortedRows ?? filteredRows;
  const displayRowCount = displayedRows ? displayedRows.length : rowCount;
  const pages = Math.max(1, Math.ceil(displayRowCount / itemsPerPage));
  const page = Math.min(currentPage, pages);
  const pageStart = pagination ? (page - 1) * itemsPerPage : 0;
  const pageRowCount = pagination
    ? Math.min(itemsPerPage, Math.max(0, displayRowCount - pageStart))
    : displayRowCount;

  React.useEffect(() => {
    if (currentPage > pages) setCurrentPage(pages);
  }, [currentPage, pages]);

  React.useEffect(() => {
    setFilters((current) => {
      const keys = new Set(
        visibleColumns
          .filter((column) => column.filterable)
          .map((column) => column.key),
      );
      if ([...current.keys()].every((key) => keys.has(key))) return current;
      return new Map([...current].filter(([key]) => keys.has(key)));
    });
  }, [visibleColumns]);

  React.useEffect(() => {
    if (sort && !sortColumn) setSort(null);
  }, [sort, sortColumn]);

  const rowVirtualizer = useVirtualizer({
    count: pageRowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  React.useLayoutEffect(() => {
    rowVirtualizer.scrollToOffset(0);
  }, [page, itemsPerPage, pagination, rowVirtualizer, sort, filters]);

  const gridTemplateColumns = React.useMemo(
    () =>
      visibleColumns
        .map((column, index) => {
          if (column.width === undefined) return 'minmax(0, 1fr)';
          return index === visibleColumns.length - 1
            ? `minmax(${column.width}px, 1fr)`
            : `${column.width}px`;
        })
        .join(' '),
    [visibleColumns],
  );

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  const startRow = virtualRows[0]?.index;
  const endRow = virtualRows[virtualRows.length - 1]?.index;

  // trigger on range changes
  React.useEffect(() => {
    if (startRow === undefined || endRow === undefined) return;
    onRangeChange?.({
      startRow: pageStart + startRow,
      endRow: pageStart + endRow,
    });
  }, [startRow, endRow, pageStart, onRangeChange]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          role="table"
          aria-busy={loading}
          aria-rowcount={displayRowCount + 1}
          aria-colcount={visibleColumns.length}
          tabIndex={displayRowCount > 0 && visibleColumns.length > 0 ? 0 : -1}
          {...divProps}
          className={cn(
            'relative h-full overflow-auto border border-slate-300',
            className,
          )}
        >
          {/* HEADER */}
          <div
            role="row"
            aria-rowindex={1}
            className="sticky top-0 z-10 grid w-full bg-slate-100 font-bold"
            style={{
              height: rowHeight,
              gridTemplateColumns,
            }}
          >
            {visibleColumns.map((column, index) => (
              <div
                key={column.key}
                role="columnheader"
                aria-colindex={index + 1}
                aria-sort={
                  sort?.key === column.key && column.sortable
                    ? sort.direction
                    : undefined
                }
                className="relative flex min-w-0 items-center gap-1 border-b border-slate-300 px-2 leading-9"
              >
                <span className="min-w-0 flex-1 truncate">{column.label}</span>
                {column.sortable && (
                  <button
                    type="button"
                    aria-label={`Sort ${column.label}`}
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-gray-900',
                      sort?.key === column.key
                        ? 'bg-gray-900 text-white'
                        : 'text-slate-400 hover:bg-gray-200 hover:text-inherit focus-visible:text-inherit',
                    )}
                    onClick={() => {
                      setSort((current) =>
                        current?.key !== column.key
                          ? { key: column.key, direction: 'ascending' }
                          : current.direction === 'ascending'
                            ? { key: column.key, direction: 'descending' }
                            : null,
                      );
                      setCurrentPage(1);
                    }}
                  >
                    {sort?.key !== column.key ? (
                      <ArrowUpDown aria-hidden="true" className="size-4" />
                    ) : sort.direction === 'ascending' ? (
                      <ArrowUp aria-hidden="true" className="size-4" />
                    ) : (
                      <ArrowDown aria-hidden="true" className="size-4" />
                    )}
                  </button>
                )}
                {column.filterable && (
                  <ColumnFilter
                    column={column}
                    value={filters.get(column.key) ?? ''}
                    onApply={(value) => {
                      if ((filters.get(column.key) ?? '') === value) return;
                      setFilters((current) => {
                        const next = new Map(current);
                        if (value) next.set(column.key, value);
                        else next.delete(column.key);
                        return next;
                      });
                      setCurrentPage(1);
                    }}
                  />
                )}
                {index < visibleColumns.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1 right-0 w-px bg-slate-300"
                  />
                )}
              </div>
            ))}
          </div>

          {/* BODY */}
          <div
            className="relative grid w-full"
            style={{
              height: totalHeight,
              gridTemplateColumns,
            }}
          >
            {virtualRows.map((row) => {
              const indexInDataset = pageStart + row.index;
              const data = transformedLoading
                ? undefined
                : displayedRows
                  ? displayedRows[indexInDataset]
                  : rowsByIndex.get(indexInDataset);
              return (
                <div
                  key={indexInDataset}
                  role="row"
                  aria-rowindex={indexInDataset + 2}
                  className="absolute left-0 top-0 grid w-full"
                  style={{
                    gridTemplateColumns,
                    height: row.size,
                    transform: `translateY(${row.start}px)`,
                  }}
                >
                  {visibleColumns.map((column, index) => {
                    const value =
                      data === undefined
                        ? undefined
                        : column.accessorFn
                          ? column.accessorFn(data)
                          : data[column.key];
                    return (
                      <div
                        key={column.key}
                        role="cell"
                        aria-colindex={index + 1}
                        className="relative truncate border-b border-slate-100 px-2 leading-9"
                      >
                        {value === undefined ? (
                          <span
                            aria-hidden="true"
                            className="mt-3 block h-3 w-3/4 animate-pulse rounded bg-slate-200"
                          />
                        ) : column.renderFn ? (
                          column.renderFn(value)
                        ) : (
                          String(value)
                        )}
                        {index < visibleColumns.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-1 right-0 w-px bg-slate-100"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {displayRowCount === 0 && !loading && (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-2 text-md text-slate-300"
            style={{ top: rowHeight }}
          >
            <Inbox aria-hidden="true" className="size-8" strokeWidth={1.5} />
            <span>
              {activeFilters.length
                ? 'No matching rows.'
                : 'No rows to display.'}
            </span>
          </div>
        )}
      </div>

      {pagination && (
        <Paginator
          className="shrink-0"
          pages={pages}
          currentPage={page}
          disabled={displayRowCount === 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};
