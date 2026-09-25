/**
 * Terminal Reader resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as TerminalReader from "@thomasfosterau/effect-payments-stripe/Terminal.Reader";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create a terminal reader
 */
export const create = (
  params: Stripe.Terminal.ReaderCreateParams,
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/terminal/readers", params);

/**
 * Retrieve a terminal reader. Stripe answers a deleted one with its
 * `{ deleted: true }` stub, so the result is the SDK's `Reader | DeletedReader`.
 */
export const retrieve = (
  id: string,
  params?: Stripe.Terminal.ReaderRetrieveParams,
): Effect.Effect<Stripe.Terminal.Reader | Stripe.Terminal.DeletedReader, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/terminal/readers/${id}`, params);

/**
 * Update a terminal reader. Stripe answers a deleted one with its
 * `{ deleted: true }` stub, so the result is the SDK's `Reader | DeletedReader`.
 */
export const update = (
  id: string,
  params?: Stripe.Terminal.ReaderUpdateParams,
): Effect.Effect<Stripe.Terminal.Reader | Stripe.Terminal.DeletedReader, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/terminal/readers/${id}`, params);

/**
 * Delete a terminal reader
 */
export const del = (
  id: string,
): Effect.Effect<Stripe.Terminal.DeletedReader, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/terminal/readers/${id}`);

/**
 * List terminal readers
 */
export const list = (
  params?: Stripe.Terminal.ReaderListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Terminal.Reader>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/terminal/readers", params);
