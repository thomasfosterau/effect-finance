/**
 * Vendor-neutral error types for payment operations.
 *
 * These errors form the failure channel of every operation exposed by the
 * payments core. Concrete providers (e.g. the Stripe implementation) are
 * responsible for translating their SDK-specific errors into these neutral
 * variants so that programs written against the core never depend on a
 * particular vendor's error taxonomy.
 *
 * @module
 */

import { Data } from "effect";

/**
 * Raised when the payment provider rejects a request for a reason that does
 * not map onto a more specific variant (the catch-all API error).
 */
export class PaymentProviderError extends Data.TaggedError(
  "PaymentProviderError"
)<{
  readonly message: string;
  /** The provider that produced the error, e.g. `"stripe"`. */
  readonly provider: string;
  /** Provider-specific error code, when available. */
  readonly code?: string;
  /** HTTP status code returned by the provider, when available. */
  readonly statusCode?: number;
  /** The original, provider-specific error object. */
  readonly cause?: unknown;
}> {}

/**
 * Raised when the provider could not authenticate the request (e.g. an
 * invalid or revoked API key).
 */
export class PaymentAuthenticationError extends Data.TaggedError(
  "PaymentAuthenticationError"
)<{
  readonly message: string;
  readonly statusCode?: number;
}> {}

/**
 * Raised when the provider rejects a request because too many requests have
 * been made in a short window.
 */
export class PaymentRateLimitError extends Data.TaggedError(
  "PaymentRateLimitError"
)<{
  readonly message: string;
  /** Seconds to wait before retrying, when the provider advertises it. */
  readonly retryAfter?: number;
}> {}

/**
 * Raised when the request parameters are invalid.
 */
export class PaymentInvalidRequestError extends Data.TaggedError(
  "PaymentInvalidRequestError"
)<{
  readonly message: string;
  /** The offending parameter, when the provider identifies one. */
  readonly param?: string;
  readonly statusCode?: number;
}> {}

/**
 * Raised when a transport-level/network failure occurs while talking to the
 * provider.
 */
export class PaymentNetworkError extends Data.TaggedError(
  "PaymentNetworkError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Raised when a provider client/layer is misconfigured. This occurs during
 * layer construction rather than during an individual API call, which is why
 * it is not part of {@link PaymentsError}.
 */
export class PaymentConfigError extends Data.TaggedError("PaymentConfigError")<{
  readonly message: string;
}> {}

/**
 * Raised when verifying the signature of an incoming webhook fails.
 */
export class SignatureVerificationError extends Data.TaggedError(
  "SignatureVerificationError"
)<{
  readonly message: string;
  readonly header?: string;
  readonly payload?: string;
}> {}

/**
 * The union of errors that can occur during a payment API call.
 *
 * {@link PaymentConfigError} and {@link SignatureVerificationError} are
 * intentionally excluded: the former only arises during layer construction and
 * the latter only during webhook verification.
 */
export type PaymentsError =
  | PaymentProviderError
  | PaymentAuthenticationError
  | PaymentRateLimitError
  | PaymentInvalidRequestError
  | PaymentNetworkError;
