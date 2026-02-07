/**
 * PaymentIntent resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as PaymentIntent from "@thomasfosterau/effect-stripe/PaymentIntent";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createPaymentIntent = (amount: number, currency: string) =>
 *   PaymentIntent.create({ amount, currency });
 *
 * const program = Effect.gen(function* () {
 *   const intent = yield* createPaymentIntent(2000, "usd");
 *   return intent;
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
 * Request to create a payment intent
 */
interface CreatePaymentIntentRequest extends Request.Request<
  Stripe.PaymentIntent,
  StripeError
> {
  readonly _tag: "CreatePaymentIntentRequest";
  readonly params: Stripe.PaymentIntentCreateParams;
}

const CreatePaymentIntentRequest = Request.tagged<CreatePaymentIntentRequest>(
  "CreatePaymentIntentRequest"
);

const CreatePaymentIntentResolver: RequestResolver.RequestResolver<
  CreatePaymentIntentRequest,
  StripeService
> = makeStripeResolver<CreatePaymentIntentRequest>((stripe, request) =>
  stripe.paymentIntents.create(request.params)
);

/**
 * Request to retrieve a payment intent
 */
interface RetrievePaymentIntentRequest extends Request.Request<
  Stripe.PaymentIntent,
  StripeError
> {
  readonly _tag: "RetrievePaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentRetrieveParams;
}

const RetrievePaymentIntentRequest =
  Request.tagged<RetrievePaymentIntentRequest>("RetrievePaymentIntentRequest");

const RetrievePaymentIntentResolver: RequestResolver.RequestResolver<
  RetrievePaymentIntentRequest,
  StripeService
> = makeStripeResolver<RetrievePaymentIntentRequest>((stripe, request) =>
  stripe.paymentIntents.retrieve(request.id, request.params)
);

/**
 * Request to update a payment intent
 */
interface UpdatePaymentIntentRequest extends Request.Request<
  Stripe.PaymentIntent,
  StripeError
> {
  readonly _tag: "UpdatePaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentUpdateParams;
}

const UpdatePaymentIntentRequest = Request.tagged<UpdatePaymentIntentRequest>(
  "UpdatePaymentIntentRequest"
);

const UpdatePaymentIntentResolver: RequestResolver.RequestResolver<
  UpdatePaymentIntentRequest,
  StripeService
> = makeStripeResolver<UpdatePaymentIntentRequest>((stripe, request) =>
  stripe.paymentIntents.update(request.id, request.params)
);

/**
 * Request to confirm a payment intent
 */
interface ConfirmPaymentIntentRequest extends Request.Request<
  Stripe.PaymentIntent,
  StripeError
> {
  readonly _tag: "ConfirmPaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentConfirmParams;
}

const ConfirmPaymentIntentRequest = Request.tagged<ConfirmPaymentIntentRequest>(
  "ConfirmPaymentIntentRequest"
);

const ConfirmPaymentIntentResolver: RequestResolver.RequestResolver<
  ConfirmPaymentIntentRequest,
  StripeService
> = makeStripeResolver<ConfirmPaymentIntentRequest>((stripe, request) =>
  stripe.paymentIntents.confirm(request.id, request.params)
);

/**
 * Request to cancel a payment intent
 */
interface CancelPaymentIntentRequest extends Request.Request<
  Stripe.PaymentIntent,
  StripeError
> {
  readonly _tag: "CancelPaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentCancelParams;
}

const CancelPaymentIntentRequest = Request.tagged<CancelPaymentIntentRequest>(
  "CancelPaymentIntentRequest"
);

const CancelPaymentIntentResolver: RequestResolver.RequestResolver<
  CancelPaymentIntentRequest,
  StripeService
> = makeStripeResolver<CancelPaymentIntentRequest>((stripe, request) =>
  stripe.paymentIntents.cancel(request.id, request.params)
);

/**
 * Request to list payment intents
 */
interface ListPaymentIntentsRequest extends Request.Request<
  Stripe.ApiList<Stripe.PaymentIntent>,
  StripeError
> {
  readonly _tag: "ListPaymentIntentsRequest";
  readonly params?: Stripe.PaymentIntentListParams;
}

const ListPaymentIntentsRequest = Request.tagged<ListPaymentIntentsRequest>(
  "ListPaymentIntentsRequest"
);

const ListPaymentIntentsResolver: RequestResolver.RequestResolver<
  ListPaymentIntentsRequest,
  StripeService
> = makeStripeResolver<ListPaymentIntentsRequest>((stripe, request) =>
  stripe.paymentIntents.list(request.params)
);

/**
 * Create a payment intent
 */
export const create = (
  params: Stripe.PaymentIntentCreateParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    CreatePaymentIntentRequest({ params }),
    RequestResolver.contextFromEffect(CreatePaymentIntentResolver)
  );

/**
 * Retrieve a payment intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentIntentRetrieveParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    RetrievePaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrievePaymentIntentResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a payment intent
 */
export const update = (
  id: string,
  params?: Stripe.PaymentIntentUpdateParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    UpdatePaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdatePaymentIntentResolver)
  );

/**
 * Confirm a payment intent
 */
export const confirm = (
  id: string,
  params?: Stripe.PaymentIntentConfirmParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    ConfirmPaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(ConfirmPaymentIntentResolver)
  );

/**
 * Cancel a payment intent
 */
export const cancel = (
  id: string,
  params?: Stripe.PaymentIntentCancelParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    CancelPaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(CancelPaymentIntentResolver)
  );

/**
 * List payment intents
 */
export const list = (
  params?: Stripe.PaymentIntentListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.PaymentIntent>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListPaymentIntentsRequest({ params }),
    RequestResolver.contextFromEffect(ListPaymentIntentsResolver)
  ).pipe(Effect.withRequestCaching(true));
