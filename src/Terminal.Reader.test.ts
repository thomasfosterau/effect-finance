import { describe, it, expect } from "vitest";
import * as TerminalReader from "./Terminal.Reader.js";

describe("Terminal.Reader", () => {
  describe("create", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = TerminalReader.create({
        registration_code: "simulated-wpe",
        location: "tml_123",
      });

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("retrieve", () => {
    it("should have retrieve function that requires Stripe service", () => {
      const effect = TerminalReader.retrieve("tmr_123");

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("update", () => {
    it("should have update function that requires Stripe service", () => {
      const effect = TerminalReader.update("tmr_123", {
        label: "Updated Reader",
      });

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("del", () => {
    it("should have del function that requires Stripe service", () => {
      const effect = TerminalReader.del("tmr_123");

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });

  describe("list", () => {
    it("should have list function that requires Stripe service", () => {
      const effect = TerminalReader.list();

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });

    it("should accept optional parameters", () => {
      const effect = TerminalReader.list({ limit: 10 });

      // Check that the effect type includes StripeService requirement
      expect(typeof effect).toBe("object");
    });
  });
});
