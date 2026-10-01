/**
 * Stripe's `/v1/webhook_endpoints` API as a raw resource module, the escape
 * hatch for what the neutral capabilities do not cover. Results are typed with
 * the `stripe` package's declarations and are not decoded.
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
 * Create a webhook endpoint (`POST /v1/webhook_endpoints`).
 */
export const create = (
  params: Stripe.WebhookEndpointCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/webhook_endpoints", params, options);

/**
 * Retrieve a webhook endpoint (`GET /v1/webhook_endpoints/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.WebhookEndpointRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/webhook_endpoints/${id}`, params, options);

/**
 * Update a webhook endpoint (`POST /v1/webhook_endpoints/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.WebhookEndpointUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/webhook_endpoints/${id}`, params, options);

/**
 * Delete a webhook endpoint (`DELETE /v1/webhook_endpoints/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedWebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/webhook_endpoints/${id}`, undefined, options);

/**
 * List webhook endpoints (`GET /v1/webhook_endpoints`).
 */
export const list = (
  params?: Stripe.WebhookEndpointListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.WebhookEndpoint>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/webhook_endpoints", params, options);
