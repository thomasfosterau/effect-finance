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

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Retrieve an event
 */
export const retrieve = (
  id: string,
  params?: Stripe.EventRetrieveParams,
): Effect.Effect<Stripe.Event, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.events.retrieve(id, params));

/**
 * List events
 */
export const list = (
  params?: Stripe.EventListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Event>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.events.list(params));
