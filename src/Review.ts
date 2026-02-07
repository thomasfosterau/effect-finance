/**
 * Review resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Review from "@thomasfosterau/effect-stripe/Review";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const review = yield* Review.retrieve("prv_123");
 *   const approved = yield* Review.approve(review.id);
 *   return approved;
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
 * Request to retrieve a review
 */
interface RetrieveReviewRequest extends Request.Request<
  Stripe.Review,
  StripeError
> {
  readonly _tag: "RetrieveReviewRequest";
  readonly id: string;
  readonly params?: Stripe.ReviewRetrieveParams;
}

const RetrieveReviewRequest = Request.tagged<RetrieveReviewRequest>(
  "RetrieveReviewRequest"
);

const RetrieveReviewResolver: RequestResolver.RequestResolver<
  RetrieveReviewRequest,
  StripeService
> = makeStripeResolver<RetrieveReviewRequest>((stripe, request) =>
  stripe.reviews.retrieve(request.id, request.params)
);

/**
 * Request to list reviews
 */
interface ListReviewsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Review>,
  StripeError
> {
  readonly _tag: "ListReviewsRequest";
  readonly params?: Stripe.ReviewListParams;
}

const ListReviewsRequest =
  Request.tagged<ListReviewsRequest>("ListReviewsRequest");

const ListReviewsResolver: RequestResolver.RequestResolver<
  ListReviewsRequest,
  StripeService
> = makeStripeResolver<ListReviewsRequest>((stripe, request) =>
  stripe.reviews.list(request.params)
);

/**
 * Request to approve a review
 */
interface ApproveReviewRequest extends Request.Request<
  Stripe.Review,
  StripeError
> {
  readonly _tag: "ApproveReviewRequest";
  readonly id: string;
  readonly params?: Stripe.ReviewApproveParams;
}

const ApproveReviewRequest = Request.tagged<ApproveReviewRequest>(
  "ApproveReviewRequest"
);

const ApproveReviewResolver: RequestResolver.RequestResolver<
  ApproveReviewRequest,
  StripeService
> = makeStripeResolver<ApproveReviewRequest>((stripe, request) =>
  stripe.reviews.approve(request.id, request.params)
);

/**
 * Retrieve a review
 */
export const retrieve = (
  id: string,
  params?: Stripe.ReviewRetrieveParams
): Effect.Effect<Stripe.Review, StripeError, StripeService> =>
  Effect.request(
    RetrieveReviewRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveReviewResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * List reviews
 */
export const list = (
  params?: Stripe.ReviewListParams
): Effect.Effect<Stripe.ApiList<Stripe.Review>, StripeError, StripeService> =>
  Effect.request(
    ListReviewsRequest({ params }),
    RequestResolver.contextFromEffect(ListReviewsResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Approve a review
 */
export const approve = (
  id: string,
  params?: Stripe.ReviewApproveParams
): Effect.Effect<Stripe.Review, StripeError, StripeService> =>
  Effect.request(
    ApproveReviewRequest({ id, params }),
    RequestResolver.contextFromEffect(ApproveReviewResolver)
  );
