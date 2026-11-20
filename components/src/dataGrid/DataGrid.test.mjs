import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

test('hidden columns are omitted and filters are available only when opted in', async () => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../..', import.meta.url)),
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  try {
    const { DataGrid } = await server.ssrLoadModule(
      '/src/dataGrid/DataGrid.tsx',
    );
    const html = renderToStaticMarkup(
      React.createElement(DataGrid, {
        rowCount: 0,
        dataBlock: [],
        columns: [
          { key: 'default', label: 'Default' },
          { key: 'disabled', label: 'Disabled', filterable: false },
          {
            key: 'hidden',
            label: 'Hidden',
            show: false,
            filterable: true,
            sortable: true,
          },
          {
            key: 'enabled',
            label: 'Enabled',
            filterable: true,
            sortable: true,
          },
        ],
      }),
    );
    assert.doesNotMatch(html, /aria-label="Filter Default"/);
    assert.doesNotMatch(html, /aria-label="Filter Disabled"/);
    assert.doesNotMatch(html, /Hidden/);
    assert.match(html, /aria-label="Filter Enabled"/);
    assert.doesNotMatch(html, /aria-label="Sort Default"/);
    assert.doesNotMatch(html, /aria-label="Sort Hidden"/);
    assert.match(html, /aria-label="Sort Enabled"/);
    assert.match(html, /aria-colcount="3"/);
    assert.equal((html.match(/lucide-arrow-up-down/g) ?? []).length, 1);
    assert.match(
      html,
      /lucide-arrow-up-down[\s\S]*?<\/button><button[^>]*aria-label="Filter Enabled"/,
    );

    const hiddenColumnGrid = renderToStaticMarkup(
      React.createElement(DataGrid, {
        rowCount: 1,
        dataBlock: [
          {
            blockStartRow: 0,
            rows: [{ visible: 'Displayed value', hidden: 'Secret value' }],
          },
        ],
        columns: [
          { key: 'visible', label: 'Visible' },
          { key: 'hidden', label: 'Hidden', show: false },
        ],
      }),
    );
    assert.match(hiddenColumnGrid, /aria-colcount="1"/);
    assert.doesNotMatch(hiddenColumnGrid, /Hidden/);
    assert.deepEqual(
      [...hiddenColumnGrid.matchAll(/grid-template-columns:([^;"]+)/g)].map(
        ([, template]) => template,
      ),
      ['minmax(0, 1fr)', 'minmax(0, 1fr)'],
    );
  } finally {
    await server.close();
  }
});

test('initial sort applies to sortable columns without activating filters', async () => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../..', import.meta.url)),
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  try {
    const { DataGrid } = await server.ssrLoadModule(
      '/src/dataGrid/DataGrid.tsx',
    );
    const comparedRows = [];
    const html = renderToStaticMarkup(
      React.createElement(DataGrid, {
        rowCount: 2,
        dataBlock: [
          { blockStartRow: 0, rows: [{ name: 'Alice' }, { name: 'Bob' }] },
        ],
        columns: [
          {
            key: 'name',
            label: 'Name',
            sortable: true,
            filterable: true,
            sortingFn: (a, b) => {
              comparedRows.push(a.name, b.name);
              return a.name.localeCompare(b.name);
            },
          },
        ],
        initialSort: { key: 'name', direction: 'descending' },
      }),
    );
    assert.match(html, /aria-rowcount="3"/);
    assert.match(html, /aria-sort="descending"/);
    assert.match(html, /aria-label="Filter Name"/);
    assert.ok(comparedRows.includes('Alice'));
    assert.ok(comparedRows.includes('Bob'));

    const ineligible = renderToStaticMarkup(
      React.createElement(DataGrid, {
        rowCount: 1,
        dataBlock: [{ blockStartRow: 0, rows: [{ name: 'Alice' }] }],
        columns: [{ key: 'name', label: 'Name' }],
        initialSort: { key: 'name', direction: 'ascending' },
      }),
    );
    assert.match(ineligible, /aria-rowcount="2"/);
    assert.doesNotMatch(ineligible, /aria-sort=/);
  } finally {
    await server.close();
  }
});

test('forwards div attributes and merges overlapping blocks without copying other rows', async () => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../..', import.meta.url)),
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  try {
    const { DataGrid } = await server.ssrLoadModule(
      '/src/dataGrid/DataGrid.tsx',
    );
    const first = { name: 'Alice', retained: true, replaced: 'old' };
    const second = { name: 'Bob' };
    const comparedRows = [];
    const html = renderToStaticMarkup(
      React.createElement(DataGrid, {
        id: 'events-grid',
        'aria-label': 'Events',
        'data-testid': 'grid',
        className: 'custom-grid',
        rowCount: 2,
        dataBlock: [
          { blockStartRow: 0, rows: [first, second] },
          { blockStartRow: 0, rows: [{ replaced: 'new' }] },
        ],
        columns: [
          {
            key: 'name',
            label: 'Name',
            sortable: true,
            sortingFn: (a, b) => {
              comparedRows.push(a, b);
              return a.name.localeCompare(b.name);
            },
          },
        ],
        initialSort: { key: 'name', direction: 'ascending' },
      }),
    );
    assert.match(html, /role="table"[^>]*aria-label="Events"/);
    assert.match(html, /id="events-grid"/);
    assert.match(html, /data-testid="grid"/);
    assert.match(html, /class="[^"]*overflow-auto[^"]*custom-grid/);
    assert.ok(comparedRows.includes(second));
    assert.deepEqual(
      comparedRows.find((row) => row.name === 'Alice'),
      { name: 'Alice', retained: true, replaced: 'new' },
    );
    assert.equal(first.replaced, 'old');
  } finally {
    await server.close();
  }
});
