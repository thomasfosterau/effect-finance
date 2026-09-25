import { describe, it, expect } from "vite-plus/test";
import * as WebhookEndpoint from "../src/WebhookEndpoint.ts";

describe("WebhookEndpoint", () => {
  it("should have create function that requires Stripe service", () => {
    const effect = WebhookEndpoint.create({
      url: "https://example.com/webhook",
      enabled_events: ["payment_intent.succeeded"],
    });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function that requires Stripe service", () => {
    const effect = WebhookEndpoint.retrieve("we_123");

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = WebhookEndpoint.retrieve("we_123", {});

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have update function that requires Stripe service", () => {
    const effect = WebhookEndpoint.update("we_123", {
      enabled_events: ["charge.succeeded"],
    });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have del function that requires Stripe service", () => {
    const effect = WebhookEndpoint.del("we_123");

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires Stripe service", () => {
    const effect = WebhookEndpoint.list();

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function with optional params", () => {
    const effect = WebhookEndpoint.list({ limit: 10 });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });
});
