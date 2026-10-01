/**
 * Stripe's `/v1/identity/verification_reports` API as a raw resource module,
 * the escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve a verification report
 * (`GET /v1/identity/verification_reports/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Identity.VerificationReportRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationReport, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/identity/verification_reports/${id}`, params, options);

/**
 * List verification reports (`GET /v1/identity/verification_reports`).
 */
export const list = (
  params?: Stripe.Identity.VerificationReportListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Identity.VerificationReport>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/identity/verification_reports", params, options);
