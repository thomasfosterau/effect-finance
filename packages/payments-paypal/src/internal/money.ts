/**
 * Conversion between the neutral minor-unit amounts and the major-unit decimal
 * *strings* PayPal uses on the wire (e.g. `"10.00"`).
 *
 * @module
 */

// Currencies with no minor unit.
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

const decimals = (currency: string): number => Math.round(Math.log10(factor(currency)));

/** Format neutral minor units as a PayPal major-unit decimal string. */
export const toMajorString = (minor: number, currency: string): string =>
  (minor / factor(currency)).toFixed(decimals(currency));

/** Parse a PayPal major-unit decimal string into neutral minor units. */
export const toMinorUnits = (value: string, currency: string): number =>
  Math.round(Number.parseFloat(value) * factor(currency));
