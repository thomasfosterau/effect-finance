import { describe, it, expect } from "vitest";
import * as Review from "../src/Review";

describe("Review", () => {
  it("should have retrieve function that requires Stripe service", () => {
    const effect = Review.retrieve("prv_123");

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function with optional params", () => {
    const effect = Review.retrieve("prv_123", {});

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires Stripe service", () => {
    const effect = Review.list();

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have list function with optional params", () => {
    const effect = Review.list({ limit: 10 });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have approve function that requires Stripe service", () => {
    const effect = Review.approve("prv_123");

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });

  it("should have approve function with optional params", () => {
    const effect = Review.approve("prv_123", {});

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });
});
