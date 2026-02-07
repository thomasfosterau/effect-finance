import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as IdentityVerificationSession from "./Identity.VerificationSession.js";

describe("Identity.VerificationSession", () => {
  describe("create", () => {
    it("should return an effect that creates a verification session", () => {
      const effect = IdentityVerificationSession.create({
        type: "document",
      });

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("retrieve", () => {
    it("should return an effect that retrieves a verification session", () => {
      const effect = IdentityVerificationSession.retrieve("vs_123");

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });

    it("should support optional params", () => {
      const effect = IdentityVerificationSession.retrieve("vs_123", {
        expand: ["verification_report"],
      });

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("update", () => {
    it("should return an effect that updates a verification session", () => {
      const effect = IdentityVerificationSession.update("vs_123", {
        metadata: { order_id: "order_123" },
      });

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });

    it("should work without params", () => {
      const effect = IdentityVerificationSession.update("vs_123");

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("cancel", () => {
    it("should return an effect that cancels a verification session", () => {
      const effect = IdentityVerificationSession.cancel("vs_123");

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("redact", () => {
    it("should return an effect that redacts a verification session", () => {
      const effect = IdentityVerificationSession.redact("vs_123");

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("list", () => {
    it("should return an effect that lists verification sessions", () => {
      const effect = IdentityVerificationSession.list();

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });

    it("should support params", () => {
      const effect = IdentityVerificationSession.list({
        limit: 10,
        status: "verified",
      });

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("integration", () => {
    it("should compose operations using Effect.gen", () => {
      const program = Effect.gen(function* () {
        const created = yield* IdentityVerificationSession.create({
          type: "document",
        });
        const retrieved = yield* IdentityVerificationSession.retrieve(
          created.id
        );
        return retrieved;
      });

      expect(program).toBeDefined();
      expect(Effect.isEffect(program)).toBe(true);
    });

    it("should handle errors with catchTag", () => {
      const program = Effect.gen(function* () {
        return yield* IdentityVerificationSession.retrieve("vs_123");
      }).pipe(
        Effect.catchTag("StripeAuthenticationError", (error) =>
          Effect.succeed({ error: error.message } as const)
        )
      );

      expect(program).toBeDefined();
      expect(Effect.isEffect(program)).toBe(true);
    });
  });
});
