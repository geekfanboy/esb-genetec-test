import assert from 'node:assert/strict';
import test from 'node:test';
import { sortGridRows } from './dataGridSorting.ts';

const column = { key: 'value', label: 'Value' };
const sortedValues = (rows, direction, overrides = {}) =>
  sortGridRows(rows, { ...column, ...overrides }, direction).map(
    (row) => row.value,
  );

test('sorts numeric accessor values globally and preserves ties and input order', () => {
  const rows = [
    { value: 'first', rank: 10 },
    { value: 'second', rank: 2 },
    { value: 'third', rank: 2 },
  ];
  const accessorFn = (row) => row.rank;
  assert.deepEqual(sortedValues(rows, 'ascending', { accessorFn }), [
    'second',
    'third',
    'first',
  ]);
  assert.deepEqual(sortedValues(rows, 'descending', { accessorFn }), [
    'first',
    'second',
    'third',
  ]);
  assert.deepEqual(
    rows.map((row) => row.value),
    ['first', 'second', 'third'],
  );
});

test('sorts dates and booleans and leaves nullish values last in both directions', () => {
  const dates = [
    { value: new Date('2024-01-01') },
    { value: null },
    { value: new Date('2020-01-01') },
    { value: undefined },
  ];
  assert.deepEqual(sortedValues(dates, 'ascending'), [
    dates[2].value,
    dates[0].value,
    null,
    undefined,
  ]);
  assert.deepEqual(sortedValues(dates, 'descending'), [
    dates[0].value,
    dates[2].value,
    null,
    undefined,
  ]);
  assert.deepEqual(
    sortedValues([{ value: true }, { value: false }], 'ascending'),
    [false, true],
  );
});

test('uses string comparison consistently for mixed types', () => {
  const rows = [{ value: 2 }, { value: 10 }, { value: '3' }];
  assert.deepEqual(sortedValues(rows, 'ascending'), [10, 2, '3']);
  assert.deepEqual(sortedValues(rows, 'descending'), ['3', 2, 10]);
});

test('custom comparator receives rows and reverses while keeping ties stable', () => {
  const rows = [
    { value: 'a', rank: 1 },
    { value: 'b', rank: 3 },
    { value: 'c', rank: 3 },
  ];
  const sortingFn = (a, b) => a.rank - b.rank;
  assert.deepEqual(sortedValues(rows, 'ascending', { sortingFn }), [
    'a',
    'b',
    'c',
  ]);
  assert.deepEqual(sortedValues(rows, 'descending', { sortingFn }), [
    'b',
    'c',
    'a',
  ]);
});
