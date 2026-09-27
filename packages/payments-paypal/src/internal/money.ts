/**
 * Conversion between the neutral minor-unit amounts and the major-unit decimal
 * *strings* PayPal uses on the wire (e.g. `"10.00"`).
 *
 * Both directions use integer (string / `BigInt`) arithmetic, never a float,
 * so an amount is exact across the whole safe-integer range and a value with
 * more fraction digits than its currency allows is rejected instead of being
 * silently rounded.
 *
 * The number of fraction digits per currency follows PayPal's "Currency codes"
 * reference (https://developer.paypal.com/api/rest/reference/currency-codes/)
 * and its `Money` object ("an integer for currencies like `JPY` that are not
 * typically fractional; a decimal fraction for currencies like `TND` that are
 * subdivided into thousandths"), which defers to ISO 4217 except where PayPal
 * says otherwise. It is deliberately PayPal's table, not Stripe's: PayPal
 * rejects decimals on `HUF` and `TWD`, which ISO 4217 (and Stripe) give two.
 *
 * @module
 */

import { Effect } from "effect";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";

// PayPal's currency-codes reference: "This currency does not support
// decimals. If you pass a decimal amount, an error occurs."
const PAYPAL_ZERO_DECIMAL = ["huf", "jpy", "twd"];

// Stripe's other zero-decimal currencies (ISO 4217 exponent 0, except `MGA`,
// which has ISO exponent 2). None is a currency PayPal supports; they are kept
// so such an amount is never scaled by 100 here.
const OTHER_ZERO_DECIMAL = [
  "bif",
  "clp",
  "djf",
  "gnf",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
];

const ZERO_DECIMAL = new Set([...PAYPAL_ZERO_DECIMAL, ...OTHER_ZERO_DECIMAL]);

// Currencies with three decimal places (ISO 4217 exponent 3). PayPal supports
// none of them today; its `Money` object documents thousandths for currencies
// "like TND", so they keep three rather than being scaled by 100.
const THREE_DECIMAL = new Set(["bhd", "iqd", "jod", "kwd", "lyd", "omr", "tnd"]);

/** The number of fraction digits PayPal expects for `currency` (case-insensitive). */
export const exponent = (currency: string): 0 | 2 | 3 => {
  const code = currency.toLowerCase();
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
};

/** An optionally negative decimal: whole digits and an optional fraction. */
const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?$/;

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Parse a PayPal major-unit decimal string into neutral minor units, or
 * `undefined` when it is malformed, has more fraction digits than the
 * currency allows, or is outside the safe-integer range as minor units.
 */
export const parseMinorUnits = (value: string, currency: string): number | undefined => {
  const match = DECIMAL.exec(value);
  if (match === null) return undefined;
  const [, sign, whole, fraction = ""] = match;
  const digits = exponent(currency);
  if (fraction.length > digits) return undefined;
  const magnitude = BigInt(`${whole}${fraction.padEnd(digits, "0")}`);
  if (magnitude > MAX_SAFE) return undefined;
  // `magnitude` is 0 for "-0.00"; never produce -0.
  return sign === "-" && magnitude !== 0n ? -Number(magnitude) : Number(magnitude);
};

/**
 * Parse a PayPal major-unit decimal string that has already been validated
 * (the response decoders check every money value with
 * {@link parseMinorUnits}). Throws a `RangeError` on an invalid value, which
 * would be a bug in the caller.
 */
export const toMinorUnits = (value: string, currency: string): number => {
  const minor = parseMinorUnits(value, currency);
  if (minor === undefined) {
    throw new RangeError(`Unvalidated PayPal amount for ${currency.toUpperCase()}`);
  }
  return minor;
};

/** The decimal string for a safe-integer `minor` (checked by the callers). */
const digitsOf = (minor: number, currency: string): string => {
  const digits = exponent(currency);
  const sign = minor < 0 ? "-" : "";
  const magnitude = String(Math.abs(minor)).padStart(digits + 1, "0");
  if (digits === 0) return `${sign}${magnitude}`;
  const point = magnitude.length - digits;
  return `${sign}${magnitude.slice(0, point)}.${magnitude.slice(point)}`;
};

/**
 * Format neutral minor units as a PayPal major-unit decimal string, or
 * `undefined` when `minor` is not a safe integer (such an amount has no exact
 * decimal form, and sending a rounded one would charge a different amount).
 */
export const formatMinorUnits = (minor: number, currency: string): string | undefined =>
  Number.isSafeInteger(minor) ? digitsOf(minor, currency) : undefined;

/**
 * Check a request amount without needing its currency, failing with
 * {@link PaymentInvalidRequestError} (naming `param`) unless it is a
 * non-negative safe integer (a price, an order or a refund amount is never
 * below zero). Callers run it before sending anything.
 */
export const checkMinorUnits = (
  minor: number,
  param: string,
): Effect.Effect<void, PaymentInvalidRequestError> =>
  Number.isSafeInteger(minor) && minor >= 0
    ? Effect.void
    : Effect.fail(
        new PaymentInvalidRequestError({
          message: `\`${param}\` must be a non-negative whole number of minor units within the safe-integer range`,
          param,
        }),
      );

/**
 * Format neutral minor units for a request body, failing as
 * {@link checkMinorUnits} does when the amount is negative or not a safe
 * integer.
 */
export const toMajorString = (
  minor: number,
  currency: string,
  param: string,
): Effect.Effect<string, PaymentInvalidRequestError> =>
  Effect.map(checkMinorUnits(minor, param), () => digitsOf(minor, currency));
