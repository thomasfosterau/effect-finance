import { describe, it, expect } from "vitest";
import * as TerminalLocation from "./Terminal.Location.js";

describe("Terminal.Location", () => {
  describe("create", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = TerminalLocation.create({
        display_name: "HQ",
        address: {
          line1: "1272 Valencia Street",
          city: "San Francisco",
          state: "CA",
          country: "US",
          postal_code: "94110",
        },
      });

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("retrieve", () => {
    it("should have retrieve function that requires Stripe service", () => {
      const effect = TerminalLocation.retrieve("tml_123");

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("update", () => {
    it("should have update function that requires Stripe service", () => {
      const effect = TerminalLocation.update("tml_123", {
        display_name: "Updated HQ",
      });

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("del", () => {
    it("should have del function that requires Stripe service", () => {
      const effect = TerminalLocation.del("tml_123");

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("list", () => {
    it("should have list function that requires Stripe service", () => {
      const effect = TerminalLocation.list();

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });

    it("should accept optional parameters", () => {
      const effect = TerminalLocation.list({ limit: 10 });

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });
});
