/**
 * PaymentMethod resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as PaymentMethod from "@thomasfosterau/effect-payments-stripe/PaymentMethod";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createPaymentMethod = (type: string) =>
 *   PaymentMethod.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const paymentMethod = yield* createPaymentMethod("card");
 *   return paymentMethod;
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
 * Request to create a payment method
 */
interface CreatePaymentMethodRequest extends Request.Request<Stripe.PaymentMethod, StripeError> {
  readonly _tag: "CreatePaymentMethodRequest";
  readonly params: Stripe.PaymentMethodCreateParams;
}

const CreatePaymentMethodRequest = Request.tagged<CreatePaymentMethodRequest>(
  "CreatePaymentMethodRequest",
);

const CreatePaymentMethodResolver: RequestResolver.RequestResolver<
  CreatePaymentMethodRequest,
  StripeService
> = makeStripeResolver<CreatePaymentMethodRequest>((stripe, request) =>
  stripe.paymentMethods.create(request.params),
);

/**
 * Request to retrieve a payment method
 */
interface RetrievePaymentMethodRequest extends Request.Request<Stripe.PaymentMethod, StripeError> {
  readonly _tag: "RetrievePaymentMethodRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentMethodRetrieveParams | undefined;
}

const RetrievePaymentMethodRequest = Request.tagged<RetrievePaymentMethodRequest>(
  "RetrievePaymentMethodRequest",
);

const RetrievePaymentMethodResolver: RequestResolver.RequestResolver<
  RetrievePaymentMethodRequest,
  StripeService
> = makeStripeResolver<RetrievePaymentMethodRequest>((stripe, request) =>
  stripe.paymentMethods.retrieve(request.id, request.params),
);

/**
 * Request to update a payment method
 */
interface UpdatePaymentMethodRequest extends Request.Request<Stripe.PaymentMethod, StripeError> {
  readonly _tag: "UpdatePaymentMethodRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentMethodUpdateParams | undefined;
}

const UpdatePaymentMethodRequest = Request.tagged<UpdatePaymentMethodRequest>(
  "UpdatePaymentMethodRequest",
);

const UpdatePaymentMethodResolver: RequestResolver.RequestResolver<
  UpdatePaymentMethodRequest,
  StripeService
> = makeStripeResolver<UpdatePaymentMethodRequest>((stripe, request) =>
  stripe.paymentMethods.update(request.id, request.params),
);

/**
 * Request to attach a payment method to a customer
 */
interface AttachPaymentMethodRequest extends Request.Request<Stripe.PaymentMethod, StripeError> {
  readonly _tag: "AttachPaymentMethodRequest";
  readonly id: string;
  readonly params: Stripe.PaymentMethodAttachParams;
}

const AttachPaymentMethodRequest = Request.tagged<AttachPaymentMethodRequest>(
  "AttachPaymentMethodRequest",
);

const AttachPaymentMethodResolver: RequestResolver.RequestResolver<
  AttachPaymentMethodRequest,
  StripeService
> = makeStripeResolver<AttachPaymentMethodRequest>((stripe, request) =>
  stripe.paymentMethods.attach(request.id, request.params),
);

/**
 * Request to detach a payment method from a customer
 */
interface DetachPaymentMethodRequest extends Request.Request<Stripe.PaymentMethod, StripeError> {
  readonly _tag: "DetachPaymentMethodRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentMethodDetachParams | undefined;
}

const DetachPaymentMethodRequest = Request.tagged<DetachPaymentMethodRequest>(
  "DetachPaymentMethodRequest",
);

const DetachPaymentMethodResolver: RequestResolver.RequestResolver<
  DetachPaymentMethodRequest,
  StripeService
> = makeStripeResolver<DetachPaymentMethodRequest>((stripe, request) =>
  stripe.paymentMethods.detach(request.id, request.params),
);

/**
 * Request to list payment methods
 */
interface ListPaymentMethodsRequest extends Request.Request<
  Stripe.ApiList<Stripe.PaymentMethod>,
  StripeError
> {
  readonly _tag: "ListPaymentMethodsRequest";
  readonly params: Stripe.PaymentMethodListParams;
}

const ListPaymentMethodsRequest = Request.tagged<ListPaymentMethodsRequest>(
  "ListPaymentMethodsRequest",
);

const ListPaymentMethodsResolver: RequestResolver.RequestResolver<
  ListPaymentMethodsRequest,
  StripeService
> = makeStripeResolver<ListPaymentMethodsRequest>((stripe, request) =>
  stripe.paymentMethods.list(request.params),
);

/**
 * Create a payment method
 */
export const create = (
  params: Stripe.PaymentMethodCreateParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  Effect.request(
    CreatePaymentMethodRequest({ params }),
    RequestResolver.contextFromEffect(CreatePaymentMethodResolver),
  );

/**
 * Retrieve a payment method
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentMethodRetrieveParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  Effect.request(
    RetrievePaymentMethodRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrievePaymentMethodResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a payment method
 */
export const update = (
  id: string,
  params?: Stripe.PaymentMethodUpdateParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  Effect.request(
    UpdatePaymentMethodRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdatePaymentMethodResolver),
  );

/**
 * Attach a payment method to a customer
 */
export const attach = (
  id: string,
  params: Stripe.PaymentMethodAttachParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  Effect.request(
    AttachPaymentMethodRequest({ id, params }),
    RequestResolver.contextFromEffect(AttachPaymentMethodResolver),
  );

/**
 * Detach a payment method from a customer
 */
export const detach = (
  id: string,
  params?: Stripe.PaymentMethodDetachParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  Effect.request(
    DetachPaymentMethodRequest({ id, params }),
    RequestResolver.contextFromEffect(DetachPaymentMethodResolver),
  );

/**
 * List payment methods
 */
export const list = (
  params: Stripe.PaymentMethodListParams,
): Effect.Effect<Stripe.ApiList<Stripe.PaymentMethod>, StripeError, StripeService> =>
  Effect.request(
    ListPaymentMethodsRequest({ params }),
    RequestResolver.contextFromEffect(ListPaymentMethodsResolver),
  ).pipe(Effect.withRequestCaching(true));
