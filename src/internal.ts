import { Effect } from "effect";
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
      case "StripeRateLimitError":
        return new StripeRateLimitError({ message });
      case "StripeInvalidRequestError":
        return new StripeInvalidRequestError({
          message,
          param: (error as Stripe.errors.StripeInvalidRequestError).param,
          statusCode,
        });
      case "StripeConnectionError":
        return new StripeNetworkError({ message, cause: error });
      default:
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
