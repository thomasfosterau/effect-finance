/**
 * Review resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Review from "@thomasfosterau/effect-payments-stripe/Review";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Retrieve a review
 */
export const retrieve = (
  id: string,
  params?: Stripe.ReviewRetrieveParams,
): Effect.Effect<Stripe.Review, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.reviews.retrieve(id, params));

/**
 * List reviews
 */
export const list = (
  params?: Stripe.ReviewListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Review>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.reviews.list(params));

/**
 * Approve a review
 */
export const approve = (
  id: string,
  params?: Stripe.ReviewApproveParams,
): Effect.Effect<Stripe.Review, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.reviews.approve(id, params));
