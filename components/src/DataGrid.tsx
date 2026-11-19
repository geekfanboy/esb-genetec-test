import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Paginator } from './Paginator';
import { cn } from './utils';

export interface GridRange {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

export interface DataBlock {
  blockStartRow: number;
  rows: Record<string, unknown>[];
}

export interface DataColumn {
  key: string;
  label: string;
  width?: number;
}

export interface DataGridProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  rowCount: number;
  columns: DataColumn[];
  blocks: DataBlock[];
  onRangeChange?: (range: GridRange) => void;
  rowHeight?: number;
  columnWidth?: number;
  height?: number;
  loading?: boolean;
}

// this has fixed cell sizes for both rows and columns. make customizable or calculate?
// no sorting / filtering implemented yet
// built for large datasets. update to be able to handle smaller tables with less necessary params
// no faclity for styling individual cells yet. maybe just expose classnames?
// add hiding of columns
// filtering based on columns?
// empty and error states
// more obvious loading?

export const DataGrid = ({
  className,
  rowCount,
  columns,
  blocks,
  onRangeChange,
  rowHeight = 36,
  columnWidth = 160,
  height = 500,
  loading = false,
}: DataGridProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Merge blocks into a row map
  const rowsByIndex = React.useMemo(() => {
    const map = new Map<number, Record<string, unknown>>();
    for (const block of blocks) {
      block.rows.forEach((row, i) => {
        const index = block.blockStartRow + i;
        map.set(index, { ...map.get(index), ...row });
      });
    }
    return map;
  }, [blocks]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => columns[i].width ?? columnWidth,
    overscan: 3,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalWidth = columnVirtualizer.getTotalSize();
  const totalHeight = rowVirtualizer.getTotalSize();

  const startRow = virtualRows[0]?.index;
  const endRow = virtualRows[virtualRows.length - 1]?.index;
  const startColumn = virtualColumns[0]?.index;
  const endColumn = virtualColumns[virtualColumns.length - 1]?.index;

  // trigger on range changes
  React.useEffect(() => {
    if (
      startRow === undefined ||
      endRow === undefined ||
      startColumn === undefined ||
      endColumn === undefined
    )
      return;
    onRangeChange?.({ startRow, endRow, startColumn, endColumn });
  }, [startRow, endRow, startColumn, endColumn, onRangeChange]);

  return (
    <>
      <div className="relative">
        <div
          ref={scrollRef}
          role="grid"
          aria-busy={loading}
          aria-rowcount={rowCount + 1}
          aria-colcount={columns.length}
          className={cn(
            'relative overflow-auto border border-slate-300',
            className,
          )}
          style={{ height }}
        >
          {/* HEADER */}
          <div
            role="row"
            aria-rowindex={1}
            className="sticky top-0 z-10 bg-slate-100 font-bold"
            style={{ height: rowHeight, width: totalWidth }}
          >
            {virtualColumns.map((col) => (
              <div
                key={col.key}
                role="columnheader"
                aria-colindex={col.index + 1}
                className="absolute top-0 px-2 truncate border-b border-slate-300 leading-9"
                style={{
                  left: col.start,
                  width: col.size,
                  height: rowHeight,
                }}
              >
                {columns[col.index].label}
              </div>
            ))}
          </div>

          {/* BODY */}
          <div
            style={{
              height: totalHeight,
              width: totalWidth,
              position: 'relative',
            }}
          >
            {virtualRows.map((row) => (
              <div
                key={row.key}
                role="row"
                aria-rowindex={row.index + 2}
                className="contents"
              >
                {virtualColumns.map((col) => {
                  const value = rowsByIndex.get(row.index)?.[
                    columns[col.index].key
                  ];
                  return (
                    <div
                      key={col.key}
                      role="gridcell"
                      aria-colindex={col.index + 1}
                      className="absolute top-0 left-0 px-2 truncate leading-9 border-b border-slate-100"
                      style={{
                        width: col.size,
                        height: row.size,
                        transform: `translate(${col.start}px, ${row.start}px)`,
                      }}
                    >
                      {value === undefined ? (
                        <span
                          aria-hidden="true"
                          className="mt-3 block h-3 w-3/4 animate-pulse rounded bg-slate-200"
                        />
                      ) : (
                        String(value)
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination -  Not Connected yet*/}
      <Paginator
        pages={100}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
};
