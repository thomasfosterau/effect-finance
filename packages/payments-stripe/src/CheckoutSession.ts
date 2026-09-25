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

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a checkout session
 */
export const create = (
  params: Stripe.Checkout.SessionCreateParams,
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.checkout.sessions.create(params));

/**
 * Retrieve a checkout session
 */
export const retrieve = (
  id: string,
  params?: Stripe.Checkout.SessionRetrieveParams,
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.checkout.sessions.retrieve(id, params));

/**
 * Expire a checkout session
 */
export const expire = (
  id: string,
  params?: Stripe.Checkout.SessionExpireParams,
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.checkout.sessions.expire(id, params));

/**
 * List checkout sessions
 */
export const list = (
  params?: Stripe.Checkout.SessionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Checkout.Session>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.checkout.sessions.list(params));
