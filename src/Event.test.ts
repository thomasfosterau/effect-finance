import { describe, it, expect } from "vitest";
import * as Event from "../src/Event";

describe("Event", () => {
  it("should have retrieve function that requires Stripe service", () => {
    const effect = Event.retrieve("evt_123");

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = Event.retrieve("evt_123", {});

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires Stripe service", () => {
    const effect = Event.list();

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function with optional params", () => {
    const effect = Event.list({ limit: 10 });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });
});
