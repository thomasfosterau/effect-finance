/**
 * Vendor-neutral pagination types.
 *
 * @module
 */

/**
 * A single page of results returned by a `list` operation.
 *
 * Providers expose cursor-based pagination through the `startingAfter`
 * parameter on list params; {@link Page.hasMore} indicates whether another
 * page is available beyond the returned {@link Page.data}.
 */
export interface Page<A> {
  readonly data: ReadonlyArray<A>;
  readonly hasMore: boolean;
}

/**
 * The result of deleting a resource: the id of the deleted entity.
 */
export interface Deleted {
  readonly id: string;
  readonly deleted: true;
}
