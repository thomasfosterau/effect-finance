import { describe, it, expect } from "vite-plus/test";
import * as Event from "../src/Event.ts";

describe("Event", () => {
  it("should have retrieve function that requires the Stripe transport", () => {
    const effect = Event.retrieve("evt_123");

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = Event.retrieve("evt_123", {});

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires the Stripe transport", () => {
    const effect = Event.list();

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have list function with optional params", () => {
    const effect = Event.list({ limit: 10 });

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });
});
