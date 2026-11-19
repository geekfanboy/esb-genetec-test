import { DataBlock, DataGrid, GridRange } from '@org/components';
import React from 'react';
import { columns, getRowsAsync, ROW_COUNT } from '../../mockData';

const ROW_BLOCK = 100; // Hardcode for now. decide later if theres improvements possible here
const COL_BLOCK = 50;

export function DataGridPage() {
  const requested = React.useRef(new Set<string>());

  const [blocks, setBlocks] = React.useState<DataBlock[]>([]);
  const [pending, setPending] = React.useState(0);

  // still not happy how we are managing aylazy block loading.
  // 1) add disposal (maybe set max numbe rof blocks?) 2) not clear on
  // 2) overlaps?
  // 3) some of these i think should happen internally in datagrid, not here
  const loadBlock = React.useCallback(async (rb: number, cb: number) => {
    const id = `${rb}:${cb}`;
    if (requested.current.has(id)) return;
    requested.current.add(id);

    setPending((n) => n + 1);
    try {
      const rows = await getRowsAsync(
        rb * ROW_BLOCK,
        ROW_BLOCK,
        cb * COL_BLOCK,
        COL_BLOCK,
      );
      setBlocks((prev) => [...prev, { blockStartRow: rb * ROW_BLOCK, rows }]);
    } catch {
      requested.current.delete(id);
    } finally {
      setPending((n) => n - 1);
    }
  }, []);

  const handleRangeChange = React.useCallback(
    ({ startRow, endRow, startColumn, endColumn }: GridRange) => {
      for (
        let rb = Math.floor(startRow / ROW_BLOCK);
        rb <= Math.floor(endRow / ROW_BLOCK);
        rb++
      ) {
        for (
          let cb = Math.floor(startColumn / COL_BLOCK);
          cb <= Math.floor(endColumn / COL_BLOCK);
          cb++
        ) {
          void loadBlock(rb, cb);
        }
      }
    },
    [loadBlock],
  );

  return (
    <main className="prose max-w-none p-6">
      <h1>Data grid</h1>
      <DataGrid
        rowCount={ROW_COUNT}
        columns={columns}
        blocks={blocks}
        onRangeChange={handleRangeChange}
        loading={pending > 0}
      />
    </main>
  );
}
