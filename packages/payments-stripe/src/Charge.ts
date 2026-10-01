/**
 * Charge resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Charge from "@thomasfosterau/effect-payments-stripe/Charge";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createCharge = (amount: number, currency: string, source: string) =>
 *   Charge.create({ amount, currency, source });
 *
 * const program = Effect.gen(function* () {
 *   const charge = yield* createCharge(2000, "usd", "tok_visa");
 *   return charge;
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
 * Create a charge
 */
export const create = (
  params: Stripe.ChargeCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Charge, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/charges", params, options);

/**
 * Retrieve a charge
 */
export const retrieve = (
  id: string,
  params?: Stripe.ChargeRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Charge, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/charges/${id}`, params, options);

/**
 * Update a charge
 */
export const update = (
  id: string,
  params?: Stripe.ChargeUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Charge, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/charges/${id}`, params, options);

/**
 * List charges
 */
export const list = (
  params?: Stripe.ChargeListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Charge>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/charges", params, options);
