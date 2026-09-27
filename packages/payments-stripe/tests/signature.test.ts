import { describe, expect, it } from "vite-plus/test";
import { Option } from "effect";
import { parseSignatureHeader, timingSafeEqual } from "../src/internal/signature.ts";

describe("timingSafeEqual", () => {
  it("is true only for identical strings", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    // A length difference short-circuits: it is visible in the header anyway.
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("does not short-circuit on the first differing character", () => {
    // Asserting the result is all a unit test can do; the property itself is
    // in the implementation's shape (XOR-accumulate, no early exit).
    expect(timingSafeEqual("0aaaaaaa", "1aaaaaaa")).toBe(false);
    expect(timingSafeEqual("aaaaaaa0", "aaaaaaa1")).toBe(false);
  });
});

describe("parseSignatureHeader", () => {
  it("collects the timestamp and every v1 digest", () => {
    expect(parseSignatureHeader("t=10,v1=aa,v0=bb,v1=cc")).toStrictEqual(
      Option.some({ timestamp: 10, candidates: ["aa", "cc"] }),
    );
  });

  it("ignores parts without a key", () => {
    expect(parseSignatureHeader("junk,t=10,,v1=aa")).toStrictEqual(
      Option.some({ timestamp: 10, candidates: ["aa"] }),
    );
  });
});
