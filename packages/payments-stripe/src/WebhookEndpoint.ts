/**
 * WebhookEndpoint resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as WebhookEndpoint from "@thomasfosterau/effect-payments-stripe/WebhookEndpoint";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a webhook endpoint
 */
export const create = (
  params: Stripe.WebhookEndpointCreateParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.webhookEndpoints.create(params));

/**
 * Retrieve a webhook endpoint
 */
export const retrieve = (
  id: string,
  params?: Stripe.WebhookEndpointRetrieveParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.webhookEndpoints.retrieve(id, params));

/**
 * Update a webhook endpoint
 */
export const update = (
  id: string,
  params?: Stripe.WebhookEndpointUpdateParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.webhookEndpoints.update(id, params));

/**
 * Delete a webhook endpoint
 */
export const del = (
  id: string,
): Effect.Effect<Stripe.DeletedWebhookEndpoint, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.webhookEndpoints.del(id));

/**
 * List webhook endpoints
 */
export const list = (
  params?: Stripe.WebhookEndpointListParams,
): Effect.Effect<Stripe.ApiList<Stripe.WebhookEndpoint>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.webhookEndpoints.list(params));
