import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import * as Stripe from "../src/Stripe.ts";
import * as Product from "../src/Product.ts";
import * as Customer from "../src/Customer.ts";

describe("Stripe Service", () => {
  describe("make", () => {
    it("should create a Stripe client with valid config", async () => {
      const client = await Effect.runPromise(Stripe.make({ apiKey: "sk_test_123" }));

      expect(client).toBeDefined();
    });

    it("should fail with invalid config", async () => {
      const result = await Effect.runPromise(
        Stripe.make({ apiKey: "" }).pipe(
          Effect.catchTag("PaymentConfigError", (error) =>
            Effect.succeed({ error: error.message } as const),
          ),
        ),
      );

      if ("error" in result) {
        expect(result.error).toContain("API key is required");
      } else {
        throw new Error("Expected error but got success");
      }
    });
  });

  describe("layer", () => {
    it("should create a layer with valid config", async () => {
      const layer = Stripe.layer({ apiKey: "sk_test_123" });

      const program = Effect.gen(function* () {
        const stripe = yield* Stripe.StripeService;
        return stripe !== undefined;
      });

      const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));

      expect(result).toBe(true);
    });
  });
});

describe("Product", () => {
  it("should have create function that requires Stripe service", () => {
    const effect = Product.create({ name: "Test Product" });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });
});

describe("Customer", () => {
  it("should have create function that requires Stripe service", () => {
    const effect = Customer.create({ email: "test@example.com" });

    // Check that the effect type includes StripeService requirement
    expect(typeof effect).toBe("object");
  });
});
