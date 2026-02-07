import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { StripeService } from "./Stripe.js";
import * as Webhook from "./Webhook.js";
import { StripeSignatureVerificationError } from "./errors.js";
import Stripe from "stripe";

describe("Webhook", () => {
  const mockStripe = new Stripe("sk_test_mock", {
    apiVersion: "2025-02-24.acacia",
  });

  const testLayer = Layer.succeed(StripeService, mockStripe);

  describe("constructEvent", () => {
    it("should construct event with valid signature", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } },
      });
      const secret = "whsec_test_secret";

      const program = Effect.gen(function* () {
        // Generate test signature
        const signature = yield* Webhook.generateTestHeaderString(
          payload,
          secret
        );

        // Verify signature and construct event
        const event = yield* Webhook.constructEvent(payload, signature, secret);

        return event;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toBeDefined();
      expect(result.type).toBe("payment_intent.succeeded");
    });

    it("should fail with invalid signature", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } },
      });
      const secret = "whsec_test_secret";
      const invalidSignature = "t=1234567890,v1=invalid_signature";

      const program = Webhook.constructEvent(payload, invalidSignature, secret);

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer), Effect.flip)
      );

      expect(result).toBeInstanceOf(StripeSignatureVerificationError);
      expect(result._tag).toBe("StripeSignatureVerificationError");
    });

    it("should fail with wrong secret", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } },
      });
      const secret = "whsec_test_secret";
      const wrongSecret = "whsec_wrong_secret";

      const program = Effect.gen(function* () {
        const signature = yield* Webhook.generateTestHeaderString(
          payload,
          secret
        );
        return yield* Webhook.constructEvent(payload, signature, wrongSecret);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer), Effect.flip)
      );

      expect(result).toBeInstanceOf(StripeSignatureVerificationError);
    });

    it("should work with Buffer payload", async () => {
      const payloadString = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } },
      });
      const payload = Buffer.from(payloadString, "utf8");
      const secret = "whsec_test_secret";

      const program = Effect.gen(function* () {
        const signature = yield* Webhook.generateTestHeaderString(
          payload,
          secret
        );
        const event = yield* Webhook.constructEvent(payload, signature, secret);
        return event;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toBeDefined();
      expect(result.type).toBe("payment_intent.succeeded");
    });

    it("should respect tolerance parameter", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } },
      });
      const secret = "whsec_test_secret";
      const veryOldTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const program = Effect.gen(function* () {
        const signature = yield* Webhook.generateTestHeaderString(
          payload,
          secret,
          veryOldTimestamp
        );

        // Should fail with default tolerance (300 seconds)
        const failedEffect = Effect.flip(
          Webhook.constructEvent(payload, signature, secret)
        );
        const error = yield* failedEffect;
        expect(error).toBeInstanceOf(StripeSignatureVerificationError);

        // Should succeed with large tolerance
        const event = yield* Webhook.constructEvent(
          payload,
          signature,
          secret,
          7200 // 2 hours
        );
        return event;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toBeDefined();
      expect(result.type).toBe("payment_intent.succeeded");
    });
  });

  describe("constructEventAsync", () => {
    it("should construct event with valid signature (async)", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } },
      });
      const secret = "whsec_test_secret";

      const program = Effect.gen(function* () {
        const signature = yield* Webhook.generateTestHeaderStringAsync(
          payload,
          secret
        );
        const event = yield* Webhook.constructEventAsync(
          payload,
          signature,
          secret
        );
        return event;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toBeDefined();
      expect(result.type).toBe("payment_intent.succeeded");
    });

    it("should fail with invalid signature (async)", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } },
      });
      const secret = "whsec_test_secret";
      const invalidSignature = "t=1234567890,v1=invalid_signature";

      const program = Webhook.constructEventAsync(
        payload,
        invalidSignature,
        secret
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer), Effect.flip)
      );

      expect(result).toBeInstanceOf(StripeSignatureVerificationError);
    });
  });

  describe("generateTestHeaderString", () => {
    it("should generate valid test header", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
      });
      const secret = "whsec_test_secret";

      const program = Webhook.generateTestHeaderString(payload, secret);

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^t=\d+,v1=[a-f0-9]+/);
    });

    it("should use custom timestamp", async () => {
      const payload = "test payload";
      const secret = "whsec_test_secret";
      const timestamp = 1234567890;

      const program = Webhook.generateTestHeaderString(
        payload,
        secret,
        timestamp
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toContain(`t=${timestamp}`);
    });
  });

  describe("generateTestHeaderStringAsync", () => {
    it("should generate valid test header (async)", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
      });
      const secret = "whsec_test_secret";

      const program = Webhook.generateTestHeaderStringAsync(payload, secret);

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^t=\d+,v1=[a-f0-9]+/);
    });
  });

  describe("DEFAULT_TOLERANCE", () => {
    it("should export default tolerance constant", () => {
      expect(Webhook.DEFAULT_TOLERANCE).toBe(300);
    });
  });

  describe("error handling", () => {
    it("should include error details in StripeSignatureVerificationError", async () => {
      const payload = "invalid payload";
      const signature = "invalid signature";
      const secret = "whsec_test_secret";

      const program = Webhook.constructEvent(payload, signature, secret);

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer), Effect.flip)
      );

      expect(result).toBeInstanceOf(StripeSignatureVerificationError);
      expect(result.message).toBeDefined();
      expect(result.header).toBe(signature);
      expect(result.payload).toBe(payload);
    });
  });
});
