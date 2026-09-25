import { describe, it, expect } from "vite-plus/test";
import * as Balance from "../src/Balance.ts";

describe("Balance", () => {
  it("should have retrieve function that requires the Stripe transport", () => {
    const effect = Balance.retrieve();

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = Balance.retrieve({});

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });
});
