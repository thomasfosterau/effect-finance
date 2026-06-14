/**
 * CheckoutSession resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as CheckoutSession from "@thomasfosterau/effect-payments-stripe/CheckoutSession";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createSession = (priceId: string, successUrl: string, cancelUrl: string) =>
 *   CheckoutSession.create({
 *     line_items: [{ price: priceId, quantity: 1 }],
 *     mode: "payment",
 *     success_url: successUrl,
 *     cancel_url: cancelUrl,
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const session = yield* createSession("price_123", "https://example.com/success", "https://example.com/cancel");
 *   return session;
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
 * Request to create a checkout session
 */
interface CreateCheckoutSessionRequest extends Request.Request<
  Stripe.Checkout.Session,
  StripeError
> {
  readonly _tag: "CreateCheckoutSessionRequest";
  readonly params: Stripe.Checkout.SessionCreateParams;
}

const CreateCheckoutSessionRequest =
  Request.tagged<CreateCheckoutSessionRequest>("CreateCheckoutSessionRequest");

const CreateCheckoutSessionResolver: RequestResolver.RequestResolver<
  CreateCheckoutSessionRequest,
  StripeService
> = makeStripeResolver<CreateCheckoutSessionRequest>((stripe, request) =>
  stripe.checkout.sessions.create(request.params)
);

/**
 * Request to retrieve a checkout session
 */
interface RetrieveCheckoutSessionRequest extends Request.Request<
  Stripe.Checkout.Session,
  StripeError
> {
  readonly _tag: "RetrieveCheckoutSessionRequest";
  readonly id: string;
  readonly params?: Stripe.Checkout.SessionRetrieveParams;
}

const RetrieveCheckoutSessionRequest =
  Request.tagged<RetrieveCheckoutSessionRequest>(
    "RetrieveCheckoutSessionRequest"
  );

const RetrieveCheckoutSessionResolver: RequestResolver.RequestResolver<
  RetrieveCheckoutSessionRequest,
  StripeService
> = makeStripeResolver<RetrieveCheckoutSessionRequest>((stripe, request) =>
  stripe.checkout.sessions.retrieve(request.id, request.params)
);

/**
 * Request to expire a checkout session
 */
interface ExpireCheckoutSessionRequest extends Request.Request<
  Stripe.Checkout.Session,
  StripeError
> {
  readonly _tag: "ExpireCheckoutSessionRequest";
  readonly id: string;
  readonly params?: Stripe.Checkout.SessionExpireParams;
}

const ExpireCheckoutSessionRequest =
  Request.tagged<ExpireCheckoutSessionRequest>("ExpireCheckoutSessionRequest");

const ExpireCheckoutSessionResolver: RequestResolver.RequestResolver<
  ExpireCheckoutSessionRequest,
  StripeService
> = makeStripeResolver<ExpireCheckoutSessionRequest>((stripe, request) =>
  stripe.checkout.sessions.expire(request.id, request.params)
);

/**
 * Request to list checkout sessions
 */
interface ListCheckoutSessionsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Checkout.Session>,
  StripeError
> {
  readonly _tag: "ListCheckoutSessionsRequest";
  readonly params?: Stripe.Checkout.SessionListParams;
}

const ListCheckoutSessionsRequest = Request.tagged<ListCheckoutSessionsRequest>(
  "ListCheckoutSessionsRequest"
);

const ListCheckoutSessionsResolver: RequestResolver.RequestResolver<
  ListCheckoutSessionsRequest,
  StripeService
> = makeStripeResolver<ListCheckoutSessionsRequest>((stripe, request) =>
  stripe.checkout.sessions.list(request.params)
);

/**
 * Create a checkout session
 */
export const create = (
  params: Stripe.Checkout.SessionCreateParams
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeService> =>
  Effect.request(
    CreateCheckoutSessionRequest({ params }),
    RequestResolver.contextFromEffect(CreateCheckoutSessionResolver)
  );

/**
 * Retrieve a checkout session
 */
export const retrieve = (
  id: string,
  params?: Stripe.Checkout.SessionRetrieveParams
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeService> =>
  Effect.request(
    RetrieveCheckoutSessionRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveCheckoutSessionResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Expire a checkout session
 */
export const expire = (
  id: string,
  params?: Stripe.Checkout.SessionExpireParams
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeService> =>
  Effect.request(
    ExpireCheckoutSessionRequest({ id, params }),
    RequestResolver.contextFromEffect(ExpireCheckoutSessionResolver)
  );

/**
 * List checkout sessions
 */
export const list = (
  params?: Stripe.Checkout.SessionListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Checkout.Session>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListCheckoutSessionsRequest({ params }),
    RequestResolver.contextFromEffect(ListCheckoutSessionsResolver)
  ).pipe(Effect.withRequestCaching(true));
