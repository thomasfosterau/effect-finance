/**
 * CheckoutSession resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as CheckoutSession from "@thomasfosterau/effect-payments-stripe/CheckoutSession";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create a checkout session
 */
export const create = (
  params: Stripe.Checkout.SessionCreateParams,
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/checkout/sessions", params);

/**
 * Retrieve a checkout session
 */
export const retrieve = (
  id: string,
  params?: Stripe.Checkout.SessionRetrieveParams,
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/checkout/sessions/${id}`, params);

/**
 * Expire a checkout session
 */
export const expire = (
  id: string,
  params?: Stripe.Checkout.SessionExpireParams,
): Effect.Effect<Stripe.Checkout.Session, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/checkout/sessions/${id}/expire`, params);

/**
 * List checkout sessions
 */
export const list = (
  params?: Stripe.Checkout.SessionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Checkout.Session>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/checkout/sessions", params);
