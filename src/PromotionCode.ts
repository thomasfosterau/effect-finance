/**
 * PromotionCode resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as PromotionCode from "@thomasfosterau/effect-stripe/PromotionCode";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createPromoCode = (couponId: string, code: string) =>
 *   PromotionCode.create({ coupon: couponId, code });
 *
 * const program = Effect.gen(function* () {
 *   const promoCode = yield* createPromoCode("coupon_123", "SAVE10");
 *   return promoCode;
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
 * Request to create a promotion code
 */
interface CreatePromotionCodeRequest extends Request.Request<
  Stripe.PromotionCode,
  StripeError
> {
  readonly _tag: "CreatePromotionCodeRequest";
  readonly params: Stripe.PromotionCodeCreateParams;
}

const CreatePromotionCodeRequest = Request.tagged<CreatePromotionCodeRequest>(
  "CreatePromotionCodeRequest"
);

const CreatePromotionCodeResolver: RequestResolver.RequestResolver<
  CreatePromotionCodeRequest,
  StripeService
> = makeStripeResolver<CreatePromotionCodeRequest>((stripe, request) =>
  stripe.promotionCodes.create(request.params)
);

/**
 * Request to retrieve a promotion code
 */
interface RetrievePromotionCodeRequest extends Request.Request<
  Stripe.PromotionCode,
  StripeError
> {
  readonly _tag: "RetrievePromotionCodeRequest";
  readonly id: string;
  readonly params?: Stripe.PromotionCodeRetrieveParams;
}

const RetrievePromotionCodeRequest =
  Request.tagged<RetrievePromotionCodeRequest>("RetrievePromotionCodeRequest");

const RetrievePromotionCodeResolver: RequestResolver.RequestResolver<
  RetrievePromotionCodeRequest,
  StripeService
> = makeStripeResolver<RetrievePromotionCodeRequest>((stripe, request) =>
  stripe.promotionCodes.retrieve(request.id, request.params)
);

/**
 * Request to update a promotion code
 */
interface UpdatePromotionCodeRequest extends Request.Request<
  Stripe.PromotionCode,
  StripeError
> {
  readonly _tag: "UpdatePromotionCodeRequest";
  readonly id: string;
  readonly params?: Stripe.PromotionCodeUpdateParams;
}

const UpdatePromotionCodeRequest = Request.tagged<UpdatePromotionCodeRequest>(
  "UpdatePromotionCodeRequest"
);

const UpdatePromotionCodeResolver: RequestResolver.RequestResolver<
  UpdatePromotionCodeRequest,
  StripeService
> = makeStripeResolver<UpdatePromotionCodeRequest>((stripe, request) =>
  stripe.promotionCodes.update(request.id, request.params)
);

/**
 * Request to list promotion codes
 */
interface ListPromotionCodesRequest extends Request.Request<
  Stripe.ApiList<Stripe.PromotionCode>,
  StripeError
> {
  readonly _tag: "ListPromotionCodesRequest";
  readonly params?: Stripe.PromotionCodeListParams;
}

const ListPromotionCodesRequest = Request.tagged<ListPromotionCodesRequest>(
  "ListPromotionCodesRequest"
);

const ListPromotionCodesResolver: RequestResolver.RequestResolver<
  ListPromotionCodesRequest,
  StripeService
> = makeStripeResolver<ListPromotionCodesRequest>((stripe, request) =>
  stripe.promotionCodes.list(request.params)
);

/**
 * Create a promotion code
 */
export const create = (
  params: Stripe.PromotionCodeCreateParams
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeService> =>
  Effect.request(
    CreatePromotionCodeRequest({ params }),
    RequestResolver.contextFromEffect(CreatePromotionCodeResolver)
  );

/**
 * Retrieve a promotion code
 */
export const retrieve = (
  id: string,
  params?: Stripe.PromotionCodeRetrieveParams
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeService> =>
  Effect.request(
    RetrievePromotionCodeRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrievePromotionCodeResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a promotion code
 */
export const update = (
  id: string,
  params?: Stripe.PromotionCodeUpdateParams
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeService> =>
  Effect.request(
    UpdatePromotionCodeRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdatePromotionCodeResolver)
  );

/**
 * List promotion codes
 */
export const list = (
  params?: Stripe.PromotionCodeListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.PromotionCode>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListPromotionCodesRequest({ params }),
    RequestResolver.contextFromEffect(ListPromotionCodesResolver)
  ).pipe(Effect.withRequestCaching(true));
