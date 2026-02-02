import { Effect, Request, RequestResolver } from "effect";
import Stripe from "stripe";
import { StripeService } from "./Stripe.js";
import {
  StripeApiError,
  StripeAuthenticationError,
  StripeInvalidRequestError,
  StripeNetworkError,
  StripeRateLimitError,
} from "./errors.js";

/**
 * All possible Stripe errors that can occur during API calls
 * Note: StripeConfigError is not included as it only occurs during layer initialization,
 * not during API calls wrapped with wrapStripeCall.
 */
export type StripeError =
  | StripeApiError
  | StripeNetworkError
  | StripeAuthenticationError
  | StripeRateLimitError
  | StripeInvalidRequestError;

/**
 * Helper function to convert Stripe errors to Effect errors
 */
export const handleStripeError = (error: unknown): StripeError => {
  if (error instanceof Stripe.errors.StripeError) {
    const { message, type, code, statusCode, raw } = error;

    switch (type) {
      case "StripeAuthenticationError":
        return new StripeAuthenticationError({ message, statusCode });
      case "StripeRateLimitError": {
        // Extract retry-after information from headers
        // Stripe returns this in the "Retry-After" header
        const rateLimitError = error as Stripe.errors.StripeRateLimitError;
        const headers = rateLimitError.headers;
        const retryAfterHeader =
          headers?.["Retry-After"] ?? headers?.["retry-after"];
        let retryAfter: number | undefined;
        if (retryAfterHeader !== undefined) {
          const parsed = Number.parseInt(String(retryAfterHeader), 10);
          retryAfter = Number.isNaN(parsed) ? undefined : parsed;
        }
        return new StripeRateLimitError({ message, retryAfter });
      }
      case "StripeInvalidRequestError":
        return new StripeInvalidRequestError({
          message,
          param: (error as Stripe.errors.StripeInvalidRequestError).param,
          statusCode,
        });
      case "StripeConnectionError":
        return new StripeNetworkError({ message, cause: error });
      case "StripePermissionError":
      case "StripeIdempotencyError":
      case "StripeAPIError":
      default:
        // Handle all other error types as generic StripeApiError
        return new StripeApiError({
          message,
          type: type || "UnknownError",
          code,
          statusCode,
          raw,
        });
    }
  }

  return new StripeApiError({
    message: error instanceof Error ? error.message : String(error),
    type: "UnknownError",
    raw: error,
  });
};

/**
 * Wraps a Stripe API call in an Effect with the Stripe service from context
 */
export const wrapStripeCall = <A>(
  fn: (stripe: Stripe) => Promise<A>
): Effect.Effect<A, StripeError, StripeService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeService;
    return yield* Effect.tryPromise({
      try: () => fn(stripe),
      catch: handleStripeError,
    });
  });

/**
 * Create a RequestResolver for Stripe API calls
 * The resolver accesses StripeService from context for each request.
 */
export const makeStripeResolver = <R extends Request.Request<any, any>>(
  execute: (stripe: Stripe, request: R) => Promise<Request.Request.Success<R>>
): RequestResolver.RequestResolver<R, StripeService> =>
  RequestResolver.fromEffect((request: R) =>
    Effect.gen(function* () {
      const stripe = yield* StripeService;
      return yield* Effect.tryPromise({
        try: () => execute(stripe, request),
        catch: handleStripeError,
      }) as Effect.Effect<Request.Request.Success<R>, Request.Request.Error<R>, never>;
    })
  );
