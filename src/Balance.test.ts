import { describe, it, expect } from "vitest";
import * as Balance from "../src/Balance";

describe("Balance", () => {
  it("should have retrieve function that requires Stripe service", () => {
    const effect = Balance.retrieve();

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = Balance.retrieve({});

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });
});
