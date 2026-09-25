/**
 * Issuing Card resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingCard from "@thomasfosterau/effect-payments-stripe/Issuing.Card";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create an issuing card
 */
export const create = (
  params: Stripe.Issuing.CardCreateParams,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cards.create(params));

/**
 * Retrieve an issuing card
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardRetrieveParams,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cards.retrieve(id, params));

/**
 * Update an issuing card
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardUpdateParams,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cards.update(id, params));

/**
 * List issuing cards
 */
export const list = (
  params?: Stripe.Issuing.CardListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Card>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cards.list(params));
