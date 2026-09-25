/**
 * Translation of Airwallex HTTP error responses into the vendor-neutral error
 * channel.
 *
 * @module
 */

import { Schema } from "effect";
import {
  PaymentAuthenticationError,
  PaymentInvalidRequestError,
  PaymentProviderError,
  PaymentRateLimitError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";

/** The provider tag attached to neutral errors raised by this implementation. */
export const PROVIDER = "airwallex";

/** The shape of an Airwallex API error body (every member optional). */
export const AirwallexErrorBody = Schema.Struct({
  code: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  source: Schema.optional(Schema.String),
});
export type AirwallexErrorBody = typeof AirwallexErrorBody.Type;

/**
 * Map an Airwallex HTTP status + error body onto a neutral payments error.
 */
export const handleAirwallexError = (
  status: number,
  body: AirwallexErrorBody | undefined,
): PaymentsError => {
  const message = body?.message ?? `Airwallex request failed with status ${status}`;

  if (status === 401 || status === 403) {
    return new PaymentAuthenticationError({ message, statusCode: status });
  }
  if (status === 429) {
    return new PaymentRateLimitError({ message });
  }
  if (status === 400 || status === 404 || status === 422) {
    return new PaymentInvalidRequestError({
      message,
      param: body?.source,
      statusCode: status,
    });
  }
  return new PaymentProviderError({
    message,
    provider: PROVIDER,
    code: body?.code,
    statusCode: status,
  });
};
