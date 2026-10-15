/**
 * `T` with every key whose type admits `undefined` made optional and
 * `undefined`-free: the shape Distilled's Stripe input types take under
 * `exactOptionalPropertyTypes`, which declare `key?: T`, never
 * `key?: T | undefined`.
 */
export type OmitUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

/**
 * Drop the keys whose value is `undefined`, so an options object assembled
 * from optional inputs type-checks against Distilled's input types. Distilled's
 * encoder already skips `undefined` values when it form-encodes a request, so
 * the wire format is unchanged.
 */
export const omitUndefined = <T extends object>(record: T): OmitUndefined<T> =>
  // SAFETY: the filter removes exactly the `undefined`-valued keys, which is
  // what `OmitUndefined<T>` describes.
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  ) as OmitUndefined<T>;
