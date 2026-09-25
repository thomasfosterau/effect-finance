/**
 * Identity VerificationReport resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IdentityVerificationReport from "@thomasfosterau/effect-payments-stripe/Identity.VerificationReport";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const report = yield* IdentityVerificationReport.retrieve("vr_123");
 *   return report;
 * });
 *
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

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
): Effect.Effect<Stripe.Identity.VerificationReport, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationReports.retrieve(id, params));

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
): Effect.Effect<Stripe.ApiList<Stripe.Identity.VerificationReport>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationReports.list(params));
