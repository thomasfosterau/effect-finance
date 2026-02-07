/**
 * Identity VerificationReport resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IdentityVerificationReport from "@thomasfosterau/effect-stripe/Identity.VerificationReport";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to retrieve a verification report
 */
interface RetrieveVerificationReportRequest
  extends Request.Request<
    Stripe.Identity.VerificationReport,
    StripeError
  > {
  readonly _tag: "RetrieveVerificationReportRequest";
  readonly id: string;
  readonly params?: Stripe.Identity.VerificationReportRetrieveParams;
}

const RetrieveVerificationReportRequest =
  Request.tagged<RetrieveVerificationReportRequest>(
    "RetrieveVerificationReportRequest"
  );

const RetrieveVerificationReportResolver: RequestResolver.RequestResolver<
  RetrieveVerificationReportRequest,
  StripeService
> = makeStripeResolver<RetrieveVerificationReportRequest>(
  (stripe, request) =>
    stripe.identity.verificationReports.retrieve(request.id, request.params)
);

/**
 * Request to list verification reports
 */
interface ListVerificationReportsRequest
  extends Request.Request<
    Stripe.ApiList<Stripe.Identity.VerificationReport>,
    StripeError
  > {
  readonly _tag: "ListVerificationReportsRequest";
  readonly params?: Stripe.Identity.VerificationReportListParams;
}

const ListVerificationReportsRequest =
  Request.tagged<ListVerificationReportsRequest>(
    "ListVerificationReportsRequest"
  );

const ListVerificationReportsResolver: RequestResolver.RequestResolver<
  ListVerificationReportsRequest,
  StripeService
> = makeStripeResolver<ListVerificationReportsRequest>(
  (stripe, request) =>
    stripe.identity.verificationReports.list(request.params)
);

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
  params?: Stripe.Identity.VerificationReportRetrieveParams
): Effect.Effect<
  Stripe.Identity.VerificationReport,
  StripeError,
  StripeService
> =>
  Effect.request(
    RetrieveVerificationReportRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveVerificationReportResolver)
  ).pipe(Effect.withRequestCaching(true));

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
  params?: Stripe.Identity.VerificationReportListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Identity.VerificationReport>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListVerificationReportsRequest({ params }),
    RequestResolver.contextFromEffect(ListVerificationReportsResolver)
  ).pipe(Effect.withRequestCaching(true));
