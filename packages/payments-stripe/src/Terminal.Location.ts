/**
 * Terminal Location resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TerminalLocation from "@thomasfosterau/effect-payments-stripe/Terminal.Location";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createLocation = () =>
 *   TerminalLocation.create({
 *     display_name: "HQ",
 *     address: {
 *       line1: "1272 Valencia Street",
 *       city: "San Francisco",
 *       state: "CA",
 *       country: "US",
 *       postal_code: "94110"
 *     }
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const location = yield* createLocation();
 *   return location;
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
 * Create a terminal location
 */
export const create = (
  params: Stripe.Terminal.LocationCreateParams,
): Effect.Effect<Stripe.Terminal.Location, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.terminal.locations.create(params));

/**
 * Retrieve a terminal location
 */
export const retrieve = (
  id: string,
  params?: Stripe.Terminal.LocationRetrieveParams,
): Effect.Effect<Stripe.Terminal.Location, StripeError, StripeService> =>
  // SAFETY: NOT checked. The SDK types the response `T | Deleted`, and Stripe
  // can answer a deleted object with its `{ deleted: true }` stub; this
  // signature (kept from before the v4 migration) does not model that. The
  // typed transport in #39 replaces the cast with a decoded union.
  wrapStripeCall(
    (stripe) => stripe.terminal.locations.retrieve(id, params) as Promise<Stripe.Terminal.Location>,
  );

/**
 * Update a terminal location
 */
export const update = (
  id: string,
  params?: Stripe.Terminal.LocationUpdateParams,
): Effect.Effect<Stripe.Terminal.Location, StripeError, StripeService> =>
  // SAFETY: NOT checked. The SDK types the response `T | Deleted`, and Stripe
  // can answer a deleted object with its `{ deleted: true }` stub; this
  // signature (kept from before the v4 migration) does not model that. The
  // typed transport in #39 replaces the cast with a decoded union.
  wrapStripeCall(
    (stripe) => stripe.terminal.locations.update(id, params) as Promise<Stripe.Terminal.Location>,
  );

/**
 * Delete a terminal location
 */
export const del = (
  id: string,
): Effect.Effect<Stripe.Terminal.DeletedLocation, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.terminal.locations.del(id));

/**
 * List terminal locations
 */
export const list = (
  params?: Stripe.Terminal.LocationListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Terminal.Location>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.terminal.locations.list(params));
