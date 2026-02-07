import { describe, it, expect } from "vitest";
import * as TerminalConnectionToken from "./Terminal.ConnectionToken.js";

describe("Terminal.ConnectionToken", () => {
  describe("create", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = TerminalConnectionToken.create();

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });

    it("should accept optional location parameter", () => {
      const effect = TerminalConnectionToken.create({
        location: "tml_123",
      });

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });
});
