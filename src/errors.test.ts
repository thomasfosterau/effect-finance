import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import {
  StripeError,
  StripeApiError,
  StripeConfigError,
  StripeAuthenticationError,
} from "../src/errors";

describe("Errors", () => {
  describe("StripeError", () => {
    it("should create a StripeError", () => {
      const error = new StripeError({ message: "Test error" });
      expect(error._tag).toBe("StripeError");
      expect(error.message).toBe("Test error");
    });

    it("should create a StripeError with code and statusCode", () => {
      const error = new StripeError({
        message: "Test error",
        code: "test_code",
        statusCode: 400,
      });
      expect(error.code).toBe("test_code");
      expect(error.statusCode).toBe(400);
    });
  });

  describe("StripeApiError", () => {
    it("should create a StripeApiError", () => {
      const error = new StripeApiError({
        message: "API error",
        type: "api_error",
        raw: {},
      });
      expect(error._tag).toBe("StripeApiError");
      expect(error.message).toBe("API error");
      expect(error.type).toBe("api_error");
    });
  });

  describe("StripeConfigError", () => {
    it("should create a StripeConfigError", () => {
      const error = new StripeConfigError({ message: "Config error" });
      expect(error._tag).toBe("StripeConfigError");
      expect(error.message).toBe("Config error");
    });
  });

  describe("StripeAuthenticationError", () => {
    it("should create a StripeAuthenticationError", () => {
      const error = new StripeAuthenticationError({
        message: "Auth error",
        statusCode: 401,
      });
      expect(error._tag).toBe("StripeAuthenticationError");
      expect(error.message).toBe("Auth error");
      expect(error.statusCode).toBe(401);
    });
  });

  it("should be usable in Effect error channel", async () => {
    const program = Effect.fail(
      new StripeApiError({
        message: "Test error",
        type: "test_error",
        raw: {},
      })
    );

    const result = await Effect.runPromise(
      program.pipe(
        Effect.catchTag("StripeApiError", (error) =>
          Effect.succeed({ caught: true, message: error.message })
        )
      )
    );

    expect(result.caught).toBe(true);
    expect(result.message).toBe("Test error");
  });
});
