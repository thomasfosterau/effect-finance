/**
 * `T` with every key whose type admits `undefined` made optional and
 * `undefined`-free: the shape Distilled's operation inputs take under
 * `exactOptionalPropertyTypes`, which declare `key?: T`, never
 * `key?: T | undefined`.
 */
export type OmitUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

/**
 * Drop the keys whose value is `undefined`, so an input assembled from
 * optional neutral parameters type-checks against a Distilled operation's
 * input. Distilled skips `undefined` members when it builds the request, so
 * the wire format is unchanged.
 */
export const omitUndefined = <T extends object>(record: T): OmitUndefined<T> =>
  // SAFETY: the filter removes exactly the `undefined`-valued keys, which is
  // what `OmitUndefined<T>` describes.
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  ) as OmitUndefined<T>;
