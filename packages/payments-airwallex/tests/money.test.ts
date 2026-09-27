import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";
import {
  exponent,
  formatMinorUnits,
  parseMinorUnits,
  toMajorNumber,
  toMinorUnits,
} from "../src/internal/money.ts";

/** A small seeded PRNG (mulberry32), so the property runs are reproducible. */
const prng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** A random non-negative safe integer, biased towards both small and very large magnitudes. */
const safeInteger = (next: () => number): number =>
  Math.floor(next() * 2 ** Math.floor(next() * 54));

const CURRENCIES = [
  { code: "usd", digits: 2 },
  { code: "EUR", digits: 2 },
  { code: "jpy", digits: 0 },
  { code: "KRW", digits: 0 },
  { code: "kwd", digits: 3 },
  { code: "BHD", digits: 3 },
] as const;

describe("Airwallex money: currency exponents", () => {
  it("keeps the existing (unverified) table: zero, two and three decimals", () => {
    for (const { code, digits } of CURRENCIES) expect(exponent(code)).toBe(digits);
  });
});

describe("Airwallex money: parse", () => {
  it("reads amounts exactly from their decimal form", () => {
    expect(parseMinorUnits(20, "usd")).toBe(2000);
    expect(parseMinorUnits(20.5, "usd")).toBe(2050);
    expect(parseMinorUnits(0.05, "usd")).toBe(5);
    expect(parseMinorUnits(1.005, "kwd")).toBe(1005);
    expect(parseMinorUnits(2000, "jpy")).toBe(2000);
    expect(parseMinorUnits(-12.34, "usd")).toBe(-1234);
    expect(Object.is(parseMinorUnits(-0, "usd"), 0)).toBe(true);
  });

  it("rejects an amount with more decimals than the currency allows (#68: 10.005 USD)", () => {
    expect(parseMinorUnits(10.005, "usd")).toBeUndefined();
    expect(parseMinorUnits(10.5, "jpy")).toBeUndefined();
    expect(parseMinorUnits(1.0005, "kwd")).toBeUndefined();
    // A float sum whose shortest form carries the float error is not rounded away.
    expect(parseMinorUnits(0.1 + 0.2, "usd")).toBeUndefined();
    expect(() => toMinorUnits(10.005, "usd")).toThrow(RangeError);
  });

  it("parses a large amount exactly (#68: 45035996273704.95 USD)", () => {
    expect(parseMinorUnits(45035996273704.95, "usd")).toBe(4503599627370495);
    expect(toMinorUnits(45035996273704.95, "usd")).toBe(4503599627370495);
    expect(parseMinorUnits(90071992547409.9, "usd")).toBe(9007199254740990);
  });

  it("rejects an amount outside the safe-integer range in minor units", () => {
    expect(parseMinorUnits(90071992547410, "usd")).toBeUndefined();
    expect(parseMinorUnits(9007199254740992, "jpy")).toBeUndefined();
    expect(parseMinorUnits(-90071992547410, "usd")).toBeUndefined();
  });

  it("reads exponent notation exactly instead of rounding it", () => {
    // `String(n)` switches to exponent notation below 1e-6 and from 1e21; no
    // such amount fits a currency here, so each is rejected, not rounded.
    expect(String(1e-7)).toBe("1e-7");
    expect(parseMinorUnits(1e-7, "usd")).toBeUndefined();
    expect(parseMinorUnits(-2.5e-7, "kwd")).toBeUndefined();
    expect(String(1e21)).toBe("1e+21");
    expect(parseMinorUnits(1e21, "jpy")).toBeUndefined();
    expect(parseMinorUnits(1.5e21, "usd")).toBeUndefined();
  });

  it("rejects non-finite amounts", () => {
    expect(parseMinorUnits(Number.NaN, "usd")).toBeUndefined();
    expect(parseMinorUnits(Number.POSITIVE_INFINITY, "usd")).toBeUndefined();
  });
});

describe("Airwallex money: format", () => {
  it("formats fixed examples as numbers whose JSON text is the exact decimal", () => {
    expect(JSON.stringify(formatMinorUnits(2000, "usd"))).toBe("20");
    expect(JSON.stringify(formatMinorUnits(2050, "usd"))).toBe("20.5");
    expect(JSON.stringify(formatMinorUnits(5, "usd"))).toBe("0.05");
    expect(JSON.stringify(formatMinorUnits(5, "kwd"))).toBe("0.005");
    expect(JSON.stringify(formatMinorUnits(2000, "jpy"))).toBe("2000");
    expect(JSON.stringify(formatMinorUnits(4503599627370495, "usd"))).toBe("45035996273704.95");
  });

  for (const { code, digits } of CURRENCIES) {
    it(`minor units -> number -> minor units is the identity whenever it formats, for ${code}`, () => {
      const next = prng(0x5eed + digits);
      for (let i = 0; i < 2000; i++) {
        const minor = safeInteger(next);
        const major = formatMinorUnits(minor, code);
        if (major === undefined) continue;
        expect(parseMinorUnits(JSON.parse(JSON.stringify(major)) as number, code)).toBe(minor);
      }
    });
  }

  it("formats every safe integer up to 15 digits", () => {
    const next = prng(0xa1e);
    for (let i = 0; i < 2000; i++) {
      const minor = Math.floor(next() * 1e15);
      for (const { code } of CURRENCIES) expect(formatMinorUnits(minor, code)).toBeDefined();
    }
  });

  it("refuses an amount no JSON number carries exactly", () => {
    // 90071992547409.91 has 16 significant digits; its nearest double prints
    // as 90071992547409.9, which would charge a different amount.
    expect(String(Number.MAX_SAFE_INTEGER / 100)).toBe("90071992547409.9");
    expect(formatMinorUnits(Number.MAX_SAFE_INTEGER, "usd")).toBeUndefined();
    expect(formatMinorUnits(Number.MAX_SAFE_INTEGER, "jpy")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("refuses an amount that is not a safe integer", () => {
    expect(formatMinorUnits(10.5, "usd")).toBeUndefined();
    expect(formatMinorUnits(2 ** 53, "jpy")).toBeUndefined();
    expect(formatMinorUnits(Number.NaN, "usd")).toBeUndefined();
  });
});

describe("Airwallex money: request amounts", () => {
  it("toMajorNumber succeeds with the exact number", async () => {
    expect(await Effect.runPromise(toMajorNumber(1234, "usd", "amount"))).toBe(12.34);
    expect(await Effect.runPromise(toMajorNumber(0, "usd", "amount"))).toBe(0);
    expect(Object.is(await Effect.runPromise(toMajorNumber(-0, "usd", "amount")), 0)).toBe(true);
  });

  it("toMajorNumber fails with an invalid-request error naming the parameter", async () => {
    for (const minor of [10.5, -1, Number.MAX_SAFE_INTEGER, 2 ** 53]) {
      const error = await Effect.runPromise(Effect.flip(toMajorNumber(minor, "usd", "amount")));
      expect(error).toBeInstanceOf(PaymentInvalidRequestError);
      expect(error.param).toBe("amount");
    }
  });
});
