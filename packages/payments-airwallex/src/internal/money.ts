/**
 * Conversion between the neutral minor-unit amounts and the major-unit decimal
 * amounts Airwallex uses on the wire.
 *
 * The neutral core represents money in the smallest currency unit (e.g.
 * cents). Airwallex represents money in major units (e.g. `20.5`), sent and
 * received as JSON **numbers**. Neither direction goes through float
 * arithmetic:
 *
 * - **Parse.** A response amount is read from its shortest decimal form,
 *   `String(n)` (which is also its JSON text), including exponent notation
 *   such as `1e-7` or `1.5e+21`, and scaled with integer (`BigInt`)
 *   arithmetic. More fraction digits than the currency allows, or an amount
 *   beyond the safe-integer range in minor units, is rejected instead of
 *   being silently rounded.
 * - **Format.** A request amount must be a non-negative safe integer in minor
 *   units. Its exact decimal is built as a string and converted to a number
 *   only when that number's JSON text reads back as the same amount;
 *   otherwise the request fails instead of sending a different value.
 *
 * @module
 */

import { Effect } from "effect";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";

// NOTE: the exponent table below is Stripe's zero- and three-decimal list, not
// Airwallex's. It has NOT been verified against Airwallex's own currency
// reference (#68); until it is, an amount in a currency whose exponent
// Airwallex defines differently is scaled by the wrong factor.

// Currencies with no minor unit (1 major unit == 1 minor unit).
const ZERO_DECIMAL = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
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
]);

// Currencies with three decimal places.
const THREE_DECIMAL = new Set(["bhd", "iqd", "jod", "kwd", "lyd", "omr", "tnd"]);

/** The number of fraction digits used for `currency` (case-insensitive). */
export const exponent = (currency: string): 0 | 2 | 3 => {
  const code = currency.toLowerCase();
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
};

/**
 * A number's shortest decimal form as `String(n)` prints it: an optional sign,
 * whole digits, an optional fraction and an optional exponent.
 */
const NUMBER_TEXT = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/;

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Parse an Airwallex major-unit amount into neutral minor units, or
 * `undefined` when it is not finite, has more fraction digits than the
 * currency allows, or is outside the safe-integer range as minor units.
 *
 * The amount is read from `String(major)` — the same text `JSON.parse` read
 * it from, up to its shortest form — never multiplied as a float.
 */
export const parseMinorUnits = (major: number, currency: string): number | undefined => {
  const match = NUMBER_TEXT.exec(String(major));
  if (match === null) return undefined;
  const [, sign, whole, fraction = "", exp = "0"] = match;
  // The value is `mantissa × 10^-scale`, with `scale` fraction digits.
  const mantissa = BigInt(`${whole}${fraction}`);
  const scale = fraction.length - Number(exp);
  const digits = exponent(currency);
  if (scale > digits) return undefined;
  const magnitude = mantissa * 10n ** BigInt(digits - scale);
  if (magnitude > MAX_SAFE) return undefined;
  // `magnitude` is 0 for `-0`; never produce -0.
  return sign === "-" && magnitude !== 0n ? -Number(magnitude) : Number(magnitude);
};

/**
 * Parse an Airwallex major-unit amount that has already been validated (the
 * response decoders check every amount with {@link parseMinorUnits}). Throws a
 * `RangeError` on an invalid value, which would be a bug in the caller.
 */
export const toMinorUnits = (major: number, currency: string): number => {
  const minor = parseMinorUnits(major, currency);
  if (minor === undefined) {
    throw new RangeError(`Unvalidated Airwallex amount for ${currency.toUpperCase()}`);
  }
  return minor;
};

/**
 * Format neutral minor units as an Airwallex major-unit number whose JSON text
 * is the exact decimal, or `undefined` when there is no such number: `minor`
 * is not a safe integer, or its decimal has more significant digits than a
 * double carries (some large amounts with a fraction).
 */
export const formatMinorUnits = (minor: number, currency: string): number | undefined => {
  if (!Number.isSafeInteger(minor)) return undefined;
  const digits = exponent(currency);
  const sign = minor < 0 ? "-" : "";
  const text = String(Math.abs(minor)).padStart(digits + 1, "0");
  const point = text.length - digits;
  const major = Number(
    digits === 0 ? `${sign}${text}` : `${sign}${text.slice(0, point)}.${text.slice(point)}`,
  );
  // `JSON.stringify(major)` is `String(major)`: keep it only when that text
  // reads back as exactly `minor`.
  return parseMinorUnits(major, currency) === minor ? major : undefined;
};

/**
 * Format neutral minor units for a request body, failing with
 * {@link PaymentInvalidRequestError} (naming `param`) before anything is sent
 * when the amount is negative (a payment intent or a refund amount is never
 * below zero), not a safe integer, or has no exact JSON number form.
 */
export const toMajorNumber = (
  minor: number,
  currency: string,
  param: string,
): Effect.Effect<number, PaymentInvalidRequestError> => {
  const value = minor < 0 ? undefined : formatMinorUnits(minor, currency);
  return value === undefined
    ? Effect.fail(
        new PaymentInvalidRequestError({
          message: `\`${param}\` must be a non-negative whole number of minor units that Airwallex can receive exactly`,
          param,
        }),
      )
    : Effect.succeed(value);
};
