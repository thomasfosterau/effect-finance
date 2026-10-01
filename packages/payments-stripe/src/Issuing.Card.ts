/**
 * Issuing Card resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as IssuingCard from "@thomasfosterau/effect-payments-stripe/Issuing.Card";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createCard = (cardholderId: string) =>
 *   IssuingCard.create({
 *     cardholder: cardholderId,
 *     currency: "usd",
 *     type: "virtual",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const card = yield* createCard("ich_xxx");
 *   return card;
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
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create an issuing card
 */
export const create = (
  params: Stripe.Issuing.CardCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/issuing/cards", params, options);

/**
 * Retrieve an issuing card
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/cards/${id}`, params, options);

/**
 * Update an issuing card
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/cards/${id}`, params, options);

/**
 * List issuing cards
 */
export const list = (
  params?: Stripe.Issuing.CardListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Card>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/cards", params, options);
