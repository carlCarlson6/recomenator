import { describe, expect, it } from 'vitest';

import {
  paginateRows,
  timelineCursorBounds,
  toTimelineCursor,
} from '#/modules/queries/timeline/timelinePagination.js';

describe('paginateRows', () => {
  it('returns all rows without a next page when there are fewer than the limit', () => {
    expect(paginateRows([1, 2, 3], 50)).toEqual({ page: [1, 2, 3], hasNextPage: false });
  });

  it('returns exactly the limit and reports a next page when one extra row is present', () => {
    const rows = Array.from({ length: 51 }, (_, i) => i);
    const { page, hasNextPage } = paginateRows(rows, 50);

    expect(page).toHaveLength(50);
    expect(page[0]).toBe(0);
    expect(page[49]).toBe(49);
    expect(hasNextPage).toBe(true);
  });

  it('returns an empty page when there are no rows', () => {
    expect(paginateRows([], 50)).toEqual({ page: [], hasNextPage: false });
  });
});

describe('toTimelineCursor', () => {
  it('encodes the last item timestamp and id', () => {
    const createdAt = new Date('2026-01-01T12:00:00.123Z');

    expect(toTimelineCursor({ createdAt, id: 'pst_1' })).toEqual({
      createdAt: '2026-01-01T12:00:00.123Z',
      id: 'pst_1',
    });
  });
});

describe('timelineCursorBounds', () => {
  it('computes a one-millisecond window starting at the cursor timestamp', () => {
    const cursor = { createdAt: '2026-01-01T12:00:00.123Z', id: 'pst_1' };
    const { floor, ceiling } = timelineCursorBounds(cursor);

    expect(floor.getTime()).toBe(new Date('2026-01-01T12:00:00.123Z').getTime());
    expect(ceiling.getTime()).toBe(floor.getTime() + 1);
  });
});
