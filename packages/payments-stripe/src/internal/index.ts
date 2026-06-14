import { Effect, Request, RequestResolver } from "effect";
import Stripe from "stripe";
import {
  PaymentAuthenticationError,
  PaymentInvalidRequestError,
  PaymentNetworkError,
  PaymentProviderError,
  PaymentRateLimitError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { StripeService } from "../Stripe.js";

/**
 * The provider tag attached to neutral errors raised by this implementation.
 */
export const PROVIDER = "stripe";

/**
 * All possible errors that can occur during a Stripe API call, expressed in
 * terms of the vendor-neutral {@link PaymentsError} channel.
 *
 * Note: configuration errors are not included as they only occur during layer
 * initialization, not during API calls wrapped with `wrapStripeCall`.
 */
export type StripeError = PaymentsError;

/**
 * Convert a thrown Stripe SDK error into a vendor-neutral payments error.
 */
export const handleStripeError = (error: unknown): PaymentsError => {
  if (error instanceof Stripe.errors.StripeError) {
    const { message, type, code, statusCode, raw } = error;

    switch (type) {
      case "StripeAuthenticationError":
        return new PaymentAuthenticationError({ message, statusCode });
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
        return new PaymentRateLimitError({ message, retryAfter });
      }
      case "StripeInvalidRequestError":
        return new PaymentInvalidRequestError({
          message,
          param: (error as Stripe.errors.StripeInvalidRequestError).param,
          statusCode,
        });
      case "StripeConnectionError":
        return new PaymentNetworkError({ message, cause: error });
      case "StripePermissionError":
      case "StripeIdempotencyError":
      case "StripeAPIError":
      default:
        // Handle all other error types as a generic provider error
        return new PaymentProviderError({
          message,
          provider: PROVIDER,
          code: code ?? type,
          statusCode,
          cause: raw,
        });
    }
  }

  return new PaymentProviderError({
    message: error instanceof Error ? error.message : String(error),
    provider: PROVIDER,
    cause: error,
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
      }) as Effect.Effect<
        Request.Request.Success<R>,
        Request.Request.Error<R>,
        never
      >;
    })
  );
