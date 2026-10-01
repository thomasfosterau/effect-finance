/**
 * CountrySpec resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as CountrySpec from "@thomasfosterau/effect-payments-stripe/CountrySpec";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const usSpec = yield* CountrySpec.retrieve("US");
 *   const allSpecs = yield* CountrySpec.list({ limit: 10 });
 *   return { usSpec, allSpecs };
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
 * Retrieve a country spec
 */
export const retrieve = (
  country: string,
  params?: Stripe.CountrySpecRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.CountrySpec, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/country_specs/${country}`, params, options);

/**
 * List country specs
 */
export const list = (
  params?: Stripe.CountrySpecListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.CountrySpec>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/country_specs", params, options);
