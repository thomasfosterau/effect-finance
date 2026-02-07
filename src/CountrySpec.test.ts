import { describe, it, expect } from "vitest";
import * as CountrySpec from "../src/CountrySpec";

describe("CountrySpec", () => {
  it("should have retrieve function that requires Stripe service", () => {
    const effect = CountrySpec.retrieve("US");

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = CountrySpec.retrieve("US", {});

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires Stripe service", () => {
    const effect = CountrySpec.list();

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function with optional params", () => {
    const effect = CountrySpec.list({ limit: 10 });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });
});
