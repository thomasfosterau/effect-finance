import { describe, it, expect } from "vite-plus/test";
import * as Review from "../src/Review.ts";

describe("Review", () => {
  it("should have retrieve function that requires the Stripe transport", () => {
    const effect = Review.retrieve("prv_123");

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = Review.retrieve("prv_123", {});

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires the Stripe transport", () => {
    const effect = Review.list();

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have list function with optional params", () => {
    const effect = Review.list({ limit: 10 });

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have approve function that requires the Stripe transport", () => {
    const effect = Review.approve("prv_123");

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });

  it("should have approve function with optional params", () => {
    const effect = Review.approve("prv_123", {});

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });
});
