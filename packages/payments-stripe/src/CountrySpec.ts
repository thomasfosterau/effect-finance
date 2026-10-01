/**
 * Stripe's `/v1/country_specs` API as a raw resource module, the escape hatch
 * for what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve a country spec (`GET /v1/country_specs/{country}`).
 */
export const retrieve = (
  country: string,
  params?: Stripe.CountrySpecRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.CountrySpec, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/country_specs/${country}`, params, options);

/**
 * List country specs (`GET /v1/country_specs`).
 */
export const list = (
  params?: Stripe.CountrySpecListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.CountrySpec>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/country_specs", params, options);
