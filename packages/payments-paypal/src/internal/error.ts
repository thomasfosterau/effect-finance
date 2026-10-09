/**
 * Translation of PayPal HTTP error responses into the vendor-neutral error
 * channel.
 *
 * @module
 */

import { Option, Schema } from "effect";
import {
  PaymentAuthenticationError,
  PaymentInvalidRequestError,
  PaymentProviderError,
  PaymentRateLimitError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";

/** The provider tag attached to neutral errors raised by this implementation. */
export const PROVIDER = "paypal";

/** The shape of a PayPal API error body (every member optional). */
export const PayPalErrorBody = Schema.Struct({
  name: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  details: Schema.optional(
    Schema.Array(
      Schema.Struct({
        field: Schema.optional(Schema.String),
        issue: Schema.optional(Schema.String),
      }),
    ),
  ),
});
export type PayPalErrorBody = typeof PayPalErrorBody.Type;

/** A vendor error body, decoded leniently: an unexpected shape maps as absent. */
export const errorBodyOf = (json: unknown): PayPalErrorBody | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(PayPalErrorBody)(json));

/**
 * Map a PayPal HTTP status + error body onto a neutral payments error.
 */
export const handlePayPalError = (
  status: number,
  body: PayPalErrorBody | undefined,
): PaymentsError => {
  const message = body?.message ?? `PayPal request failed with status ${status}`;

  if (status === 401 || status === 403) {
    return new PaymentAuthenticationError({ message, statusCode: status });
  }
  if (status === 429) {
    return new PaymentRateLimitError({ message });
  }
  if (status === 400 || status === 404 || status === 422) {
    return new PaymentInvalidRequestError({
      message,
      param: body?.details?.[0]?.field,
      statusCode: status,
    });
  }
  return new PaymentProviderError({
    message,
    provider: PROVIDER,
    code: body?.name,
    statusCode: status,
  });
};
