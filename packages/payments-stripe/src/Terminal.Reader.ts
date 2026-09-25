/**
 * Terminal Reader resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TerminalReader from "@thomasfosterau/effect-payments-stripe/Terminal.Reader";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const registerReader = (registrationCode: string, locationId: string) =>
 *   TerminalReader.create({
 *     registration_code: registrationCode,
 *     location: locationId,
 *     label: "Front Desk Reader"
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const reader = yield* registerReader("simulated-wpe", "tml_123");
 *   return reader;
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
 * Create a terminal reader
 */
export const create = (
  params: Stripe.Terminal.ReaderCreateParams,
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.terminal.readers.create(params));

/**
 * Retrieve a terminal reader
 */
export const retrieve = (
  id: string,
  params?: Stripe.Terminal.ReaderRetrieveParams,
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeService> =>
  // SAFETY: NOT checked. The SDK types the response `T | Deleted`, and Stripe
  // can answer a deleted object with its `{ deleted: true }` stub; this
  // signature (kept from before the v4 migration) does not model that. The
  // typed transport in #39 replaces the cast with a decoded union.
  wrapStripeCall(
    (stripe) => stripe.terminal.readers.retrieve(id, params) as Promise<Stripe.Terminal.Reader>,
  );

/**
 * Update a terminal reader
 */
export const update = (
  id: string,
  params?: Stripe.Terminal.ReaderUpdateParams,
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeService> =>
  // SAFETY: NOT checked. The SDK types the response `T | Deleted`, and Stripe
  // can answer a deleted object with its `{ deleted: true }` stub; this
  // signature (kept from before the v4 migration) does not model that. The
  // typed transport in #39 replaces the cast with a decoded union.
  wrapStripeCall(
    (stripe) => stripe.terminal.readers.update(id, params) as Promise<Stripe.Terminal.Reader>,
  );

/**
 * Delete a terminal reader
 */
export const del = (
  id: string,
): Effect.Effect<Stripe.Terminal.DeletedReader, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.terminal.readers.del(id));

/**
 * List terminal readers
 */
export const list = (
  params?: Stripe.Terminal.ReaderListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Terminal.Reader>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.terminal.readers.list(params));
