/**
 * Event resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Event from "@thomasfosterau/effect-payments-stripe/Event";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const event = yield* Event.retrieve("evt_123");
 *   const events = yield* Event.list({ limit: 10 });
 *   return { event, events };
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
 * Request to retrieve an event
 */
interface RetrieveEventRequest extends Request.Request<
  Stripe.Event,
  StripeError
> {
  readonly _tag: "RetrieveEventRequest";
  readonly id: string;
  readonly params?: Stripe.EventRetrieveParams;
}

const RetrieveEventRequest = Request.tagged<RetrieveEventRequest>(
  "RetrieveEventRequest"
);

const RetrieveEventResolver: RequestResolver.RequestResolver<
  RetrieveEventRequest,
  StripeService
> = makeStripeResolver<RetrieveEventRequest>((stripe, request) =>
  stripe.events.retrieve(request.id, request.params)
);

/**
 * Request to list events
 */
interface ListEventsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Event>,
  StripeError
> {
  readonly _tag: "ListEventsRequest";
  readonly params?: Stripe.EventListParams;
}

const ListEventsRequest =
  Request.tagged<ListEventsRequest>("ListEventsRequest");

const ListEventsResolver: RequestResolver.RequestResolver<
  ListEventsRequest,
  StripeService
> = makeStripeResolver<ListEventsRequest>((stripe, request) =>
  stripe.events.list(request.params)
);

/**
 * Retrieve an event
 */
export const retrieve = (
  id: string,
  params?: Stripe.EventRetrieveParams
): Effect.Effect<Stripe.Event, StripeError, StripeService> =>
  Effect.request(
    RetrieveEventRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveEventResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * List events
 */
export const list = (
  params?: Stripe.EventListParams
): Effect.Effect<Stripe.ApiList<Stripe.Event>, StripeError, StripeService> =>
  Effect.request(
    ListEventsRequest({ params }),
    RequestResolver.contextFromEffect(ListEventsResolver)
  ).pipe(Effect.withRequestCaching(true));
