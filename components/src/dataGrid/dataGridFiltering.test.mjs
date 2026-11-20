import assert from 'node:assert/strict';
import test from 'node:test';
import { filterGridRows } from './dataGridFiltering.ts';
import { sortGridRows } from './dataGridSorting.ts';

const name = { key: 'name', label: 'Name' };
const category = { key: 'category', label: 'Category' };

test('matches case-insensitive substrings across all active columns', () => {
  const rows = [
    { name: 'Alpha', category: 'North' },
    { name: 'alphabet', category: 'South' },
    { name: 'Beta', category: 'North' },
  ];
  assert.deepEqual(
    filterGridRows(rows, [
      { column: name, query: 'PH' },
      { column: category, query: 'nOr' },
    ]),
    [rows[0]],
  );
  assert.deepEqual(
    filterGridRows(rows, [{ column: name, query: 'missing' }]),
    [],
  );
});

test('uses accessor values, stringifies values, and treats nullish values as empty', () => {
  const rows = [
    { name: 'first', value: 123 },
    { name: 'second', value: false },
    { name: 'third', value: null },
    { name: 'fourth', value: undefined },
  ];
  const column = {
    key: 'name',
    label: 'Value',
    accessorFn: (row) => row.value,
  };
  assert.deepEqual(filterGridRows(rows, [{ column, query: '23' }]), [rows[0]]);
  assert.deepEqual(filterGridRows(rows, [{ column, query: 'FALSE' }]), [
    rows[1],
  ]);
  assert.deepEqual(filterGridRows(rows, [{ column, query: 'null' }]), []);
  assert.deepEqual(filterGridRows(rows, [{ column, query: '' }]), rows);
});

test('filtered results retain original order and can be sorted independently', () => {
  const rows = [
    { name: 'Alpha', rank: 2 },
    { name: 'Beta', rank: 1 },
    { name: 'Alpine', rank: 1 },
  ];
  const filtered = filterGridRows(rows, [{ column: name, query: 'al' }]);
  assert.deepEqual(filtered, [rows[0], rows[2]]);
  assert.deepEqual(
    sortGridRows(filtered, { key: 'rank', label: 'Rank' }, 'ascending'),
    [rows[2], rows[0]],
  );
  assert.deepEqual(
    rows.map((row) => row.name),
    ['Alpha', 'Beta', 'Alpine'],
  );
});
