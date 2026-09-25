/**
 * Stripe's v1 wire encoding for request parameters: an
 * `application/x-www-form-urlencoded` body (or query string) with bracketed
 * nesting — `metadata[plan]=pro`, `items[0][price]=price_1`.
 *
 * This reproduces what the official SDK sends (`qs.stringify` with
 * `arrayFormat: "indices"`, dates as Unix seconds, the brackets left
 * unescaped) without depending on `qs` or on any Node API:
 *
 * - `undefined` is skipped, so an options object assembled from optional
 *   inputs encodes only what was set;
 * - `null` and `""` encode as an empty value (`key=`), Stripe's idiom for
 *   unsetting a field;
 * - an empty object or array encodes nothing;
 * - a `Date` encodes as whole Unix seconds; booleans as `true` / `false`.
 *
 * @module
 */

import { Predicate, Record } from "effect";
import type { StripeParams } from "./params.js";

/** One flattened `key=value` pair, still unescaped. */
type Pair = readonly [key: string, value: string];

/**
 * `encodeURIComponent` plus the five characters it leaves alone that `qs`
 * (RFC 3986) escapes: `!`, `'`, `(`, `)`, `*`.
 */
const escape = (text: string): string =>
  // `toWellFormed` replaces a lone surrogate with U+FFFD, which
  // `encodeURIComponent` would otherwise reject with a `URIError`.
  encodeURIComponent(text.toWellFormed()).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

/** A scalar's wire value; a value with none (a function, a symbol) encodes nothing. */
const scalarPairs = (key: string, value: unknown): ReadonlyArray<Pair> =>
  Predicate.isString(value) ||
  Predicate.isNumber(value) ||
  Predicate.isBigInt(value) ||
  Predicate.isBoolean(value)
    ? [[key, String(value)]]
    : [];

const flatten = (key: string, value: unknown): ReadonlyArray<Pair> => {
  if (value === undefined) return [];
  if (value === null) return [[key, ""]];
  if (Predicate.isDate(value)) return [[key, String(Math.floor(value.getTime() / 1000))]];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(`${key}[${index}]`, item));
  }
  if (Predicate.isObject(value)) {
    return entriesOf(value).flatMap(([child, item]) => flatten(`${key}[${child}]`, item));
  }
  return scalarPairs(key, value);
};

/** The own enumerable string-keyed entries of a parameters object. */
export const entriesOf = (params: StripeParams | undefined): ReadonlyArray<[string, unknown]> =>
  Predicate.isObject(params) ? Record.toEntries(params) : [];

/**
 * Flatten a parameters object into bracket-keyed pairs, unescaped, in
 * insertion order. The multipart encoder shares this with {@link encodeForm}.
 */
export const flattenParams = (params: StripeParams | undefined): ReadonlyArray<Pair> =>
  entriesOf(params).flatMap(([key, value]) => flatten(key, value));

/**
 * Encode a parameters object the way the Stripe SDK does, for a form body or
 * a query string. An absent or empty object encodes as `""`.
 */
export const encodeForm = (params: StripeParams | undefined): string =>
  flattenParams(params)
    .map(([key, value]) => `${escape(key)}=${escape(value)}`)
    .join("&")
    // Like the SDK: the bracket control characters stay literal, which the
    // API accepts and which keeps a logged parameter string readable.
    .replace(/%5B/g, "[")
    .replace(/%5D/g, "]");
