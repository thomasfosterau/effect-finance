/**
 * WebhookEndpoint resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as WebhookEndpoint from "@thomasfosterau/effect-payments-stripe/WebhookEndpoint";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const endpoint = yield* WebhookEndpoint.create({
 *     url: "https://example.com/webhook",
 *     enabled_events: ["payment_intent.succeeded"],
 *   });
 *   const updated = yield* WebhookEndpoint.update(endpoint.id, {
 *     enabled_events: ["charge.succeeded", "charge.failed"],
 *   });
 *   return updated;
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
 * Create a webhook endpoint
 */
export const create = (
  params: Stripe.WebhookEndpointCreateParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/webhook_endpoints", params);

/**
 * Retrieve a webhook endpoint
 */
export const retrieve = (
  id: string,
  params?: Stripe.WebhookEndpointRetrieveParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/webhook_endpoints/${id}`, params);

/**
 * Update a webhook endpoint
 */
export const update = (
  id: string,
  params?: Stripe.WebhookEndpointUpdateParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/webhook_endpoints/${id}`, params);

/**
 * Delete a webhook endpoint
 */
export const del = (
  id: string,
): Effect.Effect<Stripe.DeletedWebhookEndpoint, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/webhook_endpoints/${id}`);

/**
 * List webhook endpoints
 */
export const list = (
  params?: Stripe.WebhookEndpointListParams,
): Effect.Effect<Stripe.ApiList<Stripe.WebhookEndpoint>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/webhook_endpoints", params);
