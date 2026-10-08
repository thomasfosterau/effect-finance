/**
 * Stripe's `/v1/prices` API as a raw resource module, the escape hatch for what
 * the neutral capabilities do not cover; prefer the neutral `Prices`
 * capability where it covers the call.
 *
 * Like {@link "./Customer"}, typed by a schema **generated** from Stripe's
 * OpenAPI spec at the pinned API version (not by the `stripe` package), with
 * every response decoded at the boundary: a body that does not match fails
 * with `PaymentProviderError`. The expandable `product` decodes as its id or,
 * when expanded, an open JSON object. Response enumerations (`type`,
 * `billing_scheme`, `recurring.interval`, …) are lenient: a value Stripe adds
 * later decodes as `Enumeration.Other`. Request enumerations stay closed.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import * as Generated from "./internal/generated/schemas.js";
import { stripeRequestDecoded } from "./internal/decode.js";
import { path, type StripeError } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/** The Price object, as a `Schema` (the decoder for every single-price response). */
export const Price = Generated.Price;
/** The Price object. */
export type Price = Generated.Price;

/** A page of prices, as a `Schema`. */
export const PriceList = Generated.GetPrices200;
/** A page of prices. */
export type PriceList = Generated.GetPrices200;

/** The parameters of {@link create}. */
export type PriceCreateParams = Generated.PostPricesRequestFormUrlEncoded;
/** The parameters of {@link retrieve}. */
export type PriceRetrieveParams = Generated.GetPricesPriceParams;
/** The parameters of {@link update}. */
export type PriceUpdateParams = Generated.PostPricesPriceRequestFormUrlEncoded;
/**
 * The parameters of {@link list}. A `deepObject` query parameter is a flat,
 * bracketed key (`"recurring[interval]": "month"`, which is also its wire
 * name), not a nested object; `created` is the exception, since Stripe's spec
 * gives it a `number | { gt, gte, lt, lte }` schema.
 */
export type PriceListParams = Generated.GetPricesParams;

/**
 * Create a price (`POST /v1/prices`).
 */
export const create = (
  params: PriceCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Price, StripeError, StripeHttp> =>
  stripeRequestDecoded("price", Price, "POST", "/v1/prices", params, options);

/**
 * Retrieve a price (`GET /v1/prices/{id}`).
 */
export const retrieve = (
  id: string,
  params?: PriceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Price, StripeError, StripeHttp> =>
  stripeRequestDecoded("price", Price, "GET", path`/v1/prices/${id}`, params, options);

/**
 * Update a price (`POST /v1/prices/{id}`).
 */
export const update = (
  id: string,
  params?: PriceUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Price, StripeError, StripeHttp> =>
  stripeRequestDecoded("price", Price, "POST", path`/v1/prices/${id}`, params, options);

/**
 * List prices (`GET /v1/prices`).
 */
export const list = (
  params?: PriceListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<PriceList, StripeError, StripeHttp> =>
  stripeRequestDecoded("price list", PriceList, "GET", "/v1/prices", params, options);
