import { DataBlock, DataColumn, DataGrid } from '@org/components';
import { Check, X } from 'lucide-react';
import React from 'react';
import { getRowsAsync, ROW_COUNT } from '../../mockData';

const SIMULATED_DELAY = 2000; // 2 second delay for simulating async data fetching
type GridStatus = 'normal' | 'loading' | 'empty';

const STATUS_COLORS = new Map<unknown, string>([
  ['pending', 'bg-orange-500'],
  ['active', 'bg-green-700'],
  ['archived', 'bg-gray-700'],
  ['suspended', 'bg-red-700'],
]);

const COLUMNS: DataColumn[] = [
  { key: 'col0', label: 'ID', sortable: true, filterable: true },
  { key: 'col1', label: 'Name', sortable: true, filterable: true },
  {
    key: 'col2',
    label: 'Amount',
    accessorFn: (row) => row.col2,
    sortable: true,
    filterable: true,
  },
  {
    key: 'col3',
    label: 'Created',
    sortable: true,
    accessorFn: (row) => {
      return new Date(row.col3 as string);
    },
    renderFn: (value) => (value as Date).toISOString().slice(0, 10),
  },
  {
    key: 'col4',
    label: 'Verified',
    sortable: true,
    accessorFn: (row) => row.col4,
    renderFn: (value) => (
      <span className="inline-flex align-middle">
        {value ? (
          <Check className="text-green-500" />
        ) : (
          <X className="text-red-500" />
        )}
      </span>
    ),
  },
  {
    key: 'col5',
    label: 'Status',
    sortable: true,
    accessorFn: (row) => row.col5,
    sortingFn: (a, b) =>
      ['pending', 'active', 'suspended', 'archived'].indexOf(String(a.col5)) -
      ['pending', 'active', 'suspended', 'archived'].indexOf(String(b.col5)),
    renderFn: (value) => (
      <span
        className={`text-xs text-white p-1 rounded-xs font-bold uppercase ${STATUS_COLORS.get(value) ?? ''}`}
      >
        {String(value)}
      </span>
    ),
  },
  {
    key: 'col6',
    label: 'Column 6',
    accessorFn: (row) => row.col6,
    sortable: true,
  },
  {
    key: 'col7',
    label: 'Column 7',
    accessorFn: (row) => row.col7,
    sortable: true,
  },
  {
    key: 'col8',
    label: 'Column 8',
    accessorFn: (row) => row.col8,
    sortable: true,
  },
  {
    key: 'col9',
    label: 'Column 9',
    accessorFn: (row) => row.col9,
    sortable: true,
  },
];

export function DataGridPage() {
  const [blocks, setBlocks] = React.useState<DataBlock[]>([]);
  const [status, setStatus] = React.useState<GridStatus>('normal');
  const [pending, setPending] = React.useState(false);
  const requestId = React.useRef(0);

  const loadRows = React.useCallback(async (nextStatus: GridStatus) => {
    const currentRequestId = ++requestId.current;
    setStatus(nextStatus);
    setBlocks([]);

    if (nextStatus === 'empty') {
      setPending(false);
      return;
    }

    setPending(true);
    try {
      const rows = await getRowsAsync(
        0,
        ROW_COUNT,
        nextStatus === 'loading' ? SIMULATED_DELAY : undefined,
      );
      if (currentRequestId === requestId.current) {
        setBlocks([{ blockStartRow: 0, rows }]);
      }
    } catch (error: unknown) {
      console.error(error);
    } finally {
      if (currentRequestId === requestId.current) {
        setPending(false);
      }
    }
  }, []);

  React.useEffect(() => {
    void loadRows('normal');
    return () => {
      requestId.current += 1;
    };
  }, [loadRows]);

  const rowCount = status === 'empty' ? 0 : ROW_COUNT;

  // const loadBlock = React.useCallback(async (rb: number) => {
  //   const id = `${rb}`;
  //   if (requested.current.has(id)) return;
  //   requested.current.add(id);

  //   setPending((n) => n + 1);
  //   try {
  //     const rows = await getRowsAsync(rb * ROW_BLOCK, ROW_BLOCK);
  //     setBlocks((prev) => [...prev, { blockStartRow: rb * ROW_BLOCK, rows }]);
  //   } catch {
  //     requested.current.delete(id);
  //   } finally {
  //     setPending((n) => n - 1);
  //   }
  // }, []);

  // const handleRangeChange = React.useCallback(
  //   ({ startRow, endRow }: GridRange) => {
  //     for (
  //       let rb = Math.floor(startRow / ROW_BLOCK);
  //       rb <= Math.floor(endRow / ROW_BLOCK);
  //       rb++
  //     ) {
  //       void loadBlock(rb);
  //     }
  //   },
  //   [loadBlock],

  return (
    <main className="prose max-w-none p-6">
      <div className="flex justify-between">
        <h1>Data grid</h1>
        <span>
          {' '}
          <div
            role="group"
            aria-label="Data grid status"
            className="not-prose mb-2 flex gap-2 items-center"
          >
            {(['normal', 'loading', 'empty'] as const).map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                aria-pressed={status === nextStatus}
                onClick={() => void loadRows(nextStatus)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 aria-pressed:bg-gray-900 aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              >
                {nextStatus === 'loading'
                  ? 'Simulated Loading'
                  : nextStatus === 'empty'
                    ? 'Empty'
                    : 'Normal'}
              </button>
            ))}
          </div>
        </span>
      </div>

      <div className="h-[800px]">
        <DataGrid
          rowCount={rowCount}
          columns={COLUMNS}
          dataBlock={blocks}
          // onRangeChange={handleRangeChange}
          loading={pending}
        />
      </div>
    </main>
  );
}
