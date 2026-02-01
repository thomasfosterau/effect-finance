import { Data } from "effect";

/**
 * Base class for all Stripe-related errors
 */
export class StripeError extends Data.TaggedError("StripeError")<{
  readonly message: string;
  readonly code?: string;
  readonly statusCode?: number;
  readonly raw?: unknown;
}> {}

/**
 * Error thrown when Stripe API returns an error
 */
export class StripeApiError extends Data.TaggedError("StripeApiError")<{
  readonly message: string;
  readonly type: string;
  readonly code?: string;
  readonly statusCode?: number;
  readonly raw: unknown;
}> {}

/**
 * Error thrown when Stripe configuration is invalid
 */
export class StripeConfigError extends Data.TaggedError("StripeConfigError")<{
  readonly message: string;
}> {}

/**
 * Error thrown when a network error occurs
 */
export class StripeNetworkError extends Data.TaggedError("StripeNetworkError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error thrown when authentication fails
 */
export class StripeAuthenticationError extends Data.TaggedError(
  "StripeAuthenticationError"
)<{
  readonly message: string;
  readonly statusCode?: number;
}> {}

/**
 * Error thrown when rate limit is exceeded
 */
export class StripeRateLimitError extends Data.TaggedError(
  "StripeRateLimitError"
)<{
  readonly message: string;
  readonly retryAfter?: number;
}> {}

/**
 * Error thrown when a request is invalid
 */
export class StripeInvalidRequestError extends Data.TaggedError(
  "StripeInvalidRequestError"
)<{
  readonly message: string;
  readonly param?: string;
  readonly statusCode?: number;
}> {}
