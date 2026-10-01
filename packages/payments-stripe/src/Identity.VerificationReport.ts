/**
 * Identity VerificationReport resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as IdentityVerificationReport from "@thomasfosterau/effect-payments-stripe/Identity.VerificationReport";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const report = yield* IdentityVerificationReport.retrieve("vr_123");
 *   return report;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve a verification report
 *
 * @example
 * ```typescript
 * const report = yield* IdentityVerificationReport.retrieve("vr_123");
 * ```
 */
export const retrieve = (
  id: string,
  params?: Stripe.Identity.VerificationReportRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationReport, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/identity/verification_reports/${id}`, params, options);

/**
 * List verification reports
 *
 * @example
 * ```typescript
 * const reports = yield* IdentityVerificationReport.list({
 *   limit: 10,
 *   verification_session: "vs_123"
 * });
 * ```
 */
export const list = (
  params?: Stripe.Identity.VerificationReportListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Identity.VerificationReport>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/identity/verification_reports", params, options);
