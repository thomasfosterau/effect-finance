/**
 * Coupon resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Coupon from "@thomasfosterau/effect-stripe/Coupon";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createCoupon = (percentOff: number) =>
 *   Coupon.create({ percent_off: percentOff, duration: "once" });
 *
 * const program = Effect.gen(function* () {
 *   const coupon = yield* createCoupon(25);
 *   return coupon;
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
 * Request to create a coupon
 */
interface CreateCouponRequest extends Request.Request<
  Stripe.Coupon,
  StripeError
> {
  readonly _tag: "CreateCouponRequest";
  readonly params: Stripe.CouponCreateParams;
}

const CreateCouponRequest = Request.tagged<CreateCouponRequest>(
  "CreateCouponRequest"
);

const CreateCouponResolver: RequestResolver.RequestResolver<
  CreateCouponRequest,
  StripeService
> = makeStripeResolver<CreateCouponRequest>((stripe, request) =>
  stripe.coupons.create(request.params)
);

/**
 * Request to retrieve a coupon
 */
interface RetrieveCouponRequest extends Request.Request<
  Stripe.Coupon,
  StripeError
> {
  readonly _tag: "RetrieveCouponRequest";
  readonly id: string;
  readonly params?: Stripe.CouponRetrieveParams;
}

const RetrieveCouponRequest = Request.tagged<RetrieveCouponRequest>(
  "RetrieveCouponRequest"
);

const RetrieveCouponResolver: RequestResolver.RequestResolver<
  RetrieveCouponRequest,
  StripeService
> = makeStripeResolver<RetrieveCouponRequest>((stripe, request) =>
  stripe.coupons.retrieve(request.id, request.params)
);

/**
 * Request to update a coupon
 */
interface UpdateCouponRequest extends Request.Request<
  Stripe.Coupon,
  StripeError
> {
  readonly _tag: "UpdateCouponRequest";
  readonly id: string;
  readonly params?: Stripe.CouponUpdateParams;
}

const UpdateCouponRequest = Request.tagged<UpdateCouponRequest>(
  "UpdateCouponRequest"
);

const UpdateCouponResolver: RequestResolver.RequestResolver<
  UpdateCouponRequest,
  StripeService
> = makeStripeResolver<UpdateCouponRequest>((stripe, request) =>
  stripe.coupons.update(request.id, request.params)
);

/**
 * Request to delete a coupon
 */
interface DeleteCouponRequest extends Request.Request<
  Stripe.DeletedCoupon,
  StripeError
> {
  readonly _tag: "DeleteCouponRequest";
  readonly id: string;
}

const DeleteCouponRequest = Request.tagged<DeleteCouponRequest>(
  "DeleteCouponRequest"
);

const DeleteCouponResolver: RequestResolver.RequestResolver<
  DeleteCouponRequest,
  StripeService
> = makeStripeResolver<DeleteCouponRequest>((stripe, request) =>
  stripe.coupons.del(request.id)
);

/**
 * Request to list coupons
 */
interface ListCouponsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Coupon>,
  StripeError
> {
  readonly _tag: "ListCouponsRequest";
  readonly params?: Stripe.CouponListParams;
}

const ListCouponsRequest =
  Request.tagged<ListCouponsRequest>("ListCouponsRequest");

const ListCouponsResolver: RequestResolver.RequestResolver<
  ListCouponsRequest,
  StripeService
> = makeStripeResolver<ListCouponsRequest>((stripe, request) =>
  stripe.coupons.list(request.params)
);

/**
 * Create a coupon
 */
export const create = (
  params: Stripe.CouponCreateParams
): Effect.Effect<Stripe.Coupon, StripeError, StripeService> =>
  Effect.request(
    CreateCouponRequest({ params }),
    RequestResolver.contextFromEffect(CreateCouponResolver)
  );

/**
 * Retrieve a coupon
 */
export const retrieve = (
  id: string,
  params?: Stripe.CouponRetrieveParams
): Effect.Effect<Stripe.Coupon, StripeError, StripeService> =>
  Effect.request(
    RetrieveCouponRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveCouponResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a coupon
 */
export const update = (
  id: string,
  params?: Stripe.CouponUpdateParams
): Effect.Effect<Stripe.Coupon, StripeError, StripeService> =>
  Effect.request(
    UpdateCouponRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateCouponResolver)
  );

/**
 * Delete a coupon
 */
export const del = (
  id: string
): Effect.Effect<Stripe.DeletedCoupon, StripeError, StripeService> =>
  Effect.request(
    DeleteCouponRequest({ id }),
    RequestResolver.contextFromEffect(DeleteCouponResolver)
  );

/**
 * List coupons
 */
export const list = (
  params?: Stripe.CouponListParams
): Effect.Effect<Stripe.ApiList<Stripe.Coupon>, StripeError, StripeService> =>
  Effect.request(
    ListCouponsRequest({ params }),
    RequestResolver.contextFromEffect(ListCouponsResolver)
  ).pipe(Effect.withRequestCaching(true));
