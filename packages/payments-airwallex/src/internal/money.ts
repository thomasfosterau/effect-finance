/**
 * Conversion between the neutral minor-unit amounts and the major-unit decimal
 * amounts Airwallex uses on the wire.
 *
 * Stripe and the neutral core represent money in the smallest currency unit
 * (e.g. cents). Airwallex represents money in major units (e.g. `20.00`). The
 * factor depends on how many decimal places a currency has.
 *
 * @module
 */

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

const factor = (currency: string): number => {
  const code = currency.toLowerCase();
  if (ZERO_DECIMAL.has(code)) return 1;
  if (THREE_DECIMAL.has(code)) return 1000;
  return 100;
};

/** Convert a major-unit amount (Airwallex) to neutral minor units. */
export const toMinorUnits = (major: number, currency: string): number =>
  Math.round(major * factor(currency));

/** Convert neutral minor units to a major-unit amount (Airwallex). */
export const toMajorUnits = (minor: number, currency: string): number => minor / factor(currency);
