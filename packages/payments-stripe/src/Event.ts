/**
 * Event resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Event from "@thomasfosterau/effect-payments-stripe/Event";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const event = yield* Event.retrieve("evt_123");
 *   const events = yield* Event.list({ limit: 10 });
 *   return { event, events };
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve an event
 */
export const retrieve = (
  id: string,
  params?: Stripe.EventRetrieveParams,
): Effect.Effect<Stripe.Event, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/events/${id}`, params);

/**
 * List events
 */
export const list = (
  params?: Stripe.EventListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Event>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/events", params);
