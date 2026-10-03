export const TIMELINE_PAGE_SIZE = 50;

export type TimelineCursor = {
  createdAt: string;
  id: string;
};

/**
 * Splits an over-fetched page (queried with `limit + 1` rows) into the page to
 * return and a flag signalling whether more rows exist. Fetching one extra row
 * is the cheapest way to know there is a next page without a count query.
 */
export function paginateRows<T>(
  rows: T[],
  limit: number,
): { page: T[]; hasNextPage: boolean } {
  const hasNextPage = rows.length > limit;
  const page = hasNextPage ? rows.slice(0, limit) : rows;
  return { page, hasNextPage };
}

/** Encodes the last returned item into the cursor the client sends back. */
export function toTimelineCursor(last: { createdAt: Date; id: string }): TimelineCursor {
  return { createdAt: last.createdAt.toISOString(), id: last.id };
}

/**
 * The cursor timestamp is millisecond-precise while Postgres stores
 * microsecond-precise timestamps. The tie-break therefore matches the whole
 * millisecond of the cursor (from `floor` inclusive to `ceiling` exclusive)
 * instead of an exact `=` comparison, which would silently skip rows sharing
 * the cursor's millisecond.
 */
export function timelineCursorBounds(cursor: TimelineCursor): { floor: Date; ceiling: Date } {
  const floor = new Date(cursor.createdAt);
  return { floor, ceiling: new Date(floor.getTime() + 1) };
}
