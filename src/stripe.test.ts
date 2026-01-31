import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { StripeService, makeStripeLayer } from "../src/stripe";

describe("StripeService", () => {
  describe("makeStripeLayer", () => {
    it("should create a layer with valid config", async () => {
      const layer = makeStripeLayer({
        apiKey: "sk_test_123",
      });

      const program = Effect.gen(function* () {
        const stripe = yield* StripeService;
        return stripe.client !== undefined;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe(true);
    });

    it("should fail with invalid config", async () => {
      const layer = makeStripeLayer({
        apiKey: "",
      });

      const program = Effect.gen(function* () {
        const stripe = yield* StripeService;
        return stripe;
      });

      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(layer),
          Effect.catchTag("StripeConfigError", (error) =>
            Effect.succeed({ error: error.message } as const)
          )
        )
      );

      if ("error" in result) {
        expect(result.error).toContain("API key is required");
      } else {
        throw new Error("Expected error but got success");
      }
    });

    it("should expose customer service", async () => {
      const layer = makeStripeLayer({
        apiKey: "sk_test_123",
      });

      const program = Effect.gen(function* () {
        const stripe = yield* StripeService;
        return typeof stripe.customers.create === "function";
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe(true);
    });

    it("should expose paymentIntents service", async () => {
      const layer = makeStripeLayer({
        apiKey: "sk_test_123",
      });

      const program = Effect.gen(function* () {
        const stripe = yield* StripeService;
        return typeof stripe.paymentIntents.create === "function";
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe(true);
    });

    it("should expose subscriptions service", async () => {
      const layer = makeStripeLayer({
        apiKey: "sk_test_123",
      });

      const program = Effect.gen(function* () {
        const stripe = yield* StripeService;
        return typeof stripe.subscriptions.create === "function";
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe(true);
    });

    it("should expose prices service", async () => {
      const layer = makeStripeLayer({
        apiKey: "sk_test_123",
      });

      const program = Effect.gen(function* () {
        const stripe = yield* StripeService;
        return typeof stripe.prices.create === "function";
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe(true);
    });

    it("should expose products service", async () => {
      const layer = makeStripeLayer({
        apiKey: "sk_test_123",
      });

      const program = Effect.gen(function* () {
        const stripe = yield* StripeService;
        return typeof stripe.products.create === "function";
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe(true);
    });
  });
});
