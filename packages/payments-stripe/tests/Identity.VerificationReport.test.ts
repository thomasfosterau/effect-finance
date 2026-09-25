import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import * as IdentityVerificationReport from "../src/Identity.VerificationReport.ts";

describe("Identity.VerificationReport", () => {
  describe("retrieve", () => {
    it("should return an effect that retrieves a verification report", () => {
      const effect = IdentityVerificationReport.retrieve("vr_123");

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });

    it("should support optional params", () => {
      const effect = IdentityVerificationReport.retrieve("vr_123", {
        expand: ["verification_session"],
      });

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("list", () => {
    it("should return an effect that lists verification reports", () => {
      const effect = IdentityVerificationReport.list();

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });

    it("should support params", () => {
      const effect = IdentityVerificationReport.list({
        limit: 10,
        verification_session: "vs_123",
      });

      expect(effect).toBeDefined();
      expect(Effect.isEffect(effect)).toBe(true);
    });
  });

  describe("integration", () => {
    it("should compose operations using Effect.gen", () => {
      const program = Effect.gen(function* () {
        const reports = yield* IdentityVerificationReport.list({
          limit: 5,
        });
        if (reports.data.length > 0) {
          const report = yield* IdentityVerificationReport.retrieve(reports.data[0].id);
          return report;
        }
        return null;
      });

      expect(program).toBeDefined();
      expect(Effect.isEffect(program)).toBe(true);
    });

    it("should handle errors with catchTag", () => {
      const program = Effect.gen(function* () {
        return yield* IdentityVerificationReport.retrieve("vr_123");
      }).pipe(
        Effect.catchTag("PaymentAuthenticationError", (error) =>
          Effect.succeed({ error: error.message } as const),
        ),
      );

      expect(program).toBeDefined();
      expect(Effect.isEffect(program)).toBe(true);
    });
  });
});
