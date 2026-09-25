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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a webhook endpoint
 */
interface CreateWebhookEndpointRequest extends Request.Request<
  Stripe.WebhookEndpoint,
  StripeError
> {
  readonly _tag: "CreateWebhookEndpointRequest";
  readonly params: Stripe.WebhookEndpointCreateParams;
}

const CreateWebhookEndpointRequest = Request.tagged<CreateWebhookEndpointRequest>(
  "CreateWebhookEndpointRequest",
);

const CreateWebhookEndpointResolver: RequestResolver.RequestResolver<
  CreateWebhookEndpointRequest,
  StripeService
> = makeStripeResolver<CreateWebhookEndpointRequest>((stripe, request) =>
  stripe.webhookEndpoints.create(request.params),
);

/**
 * Request to retrieve a webhook endpoint
 */
interface RetrieveWebhookEndpointRequest extends Request.Request<
  Stripe.WebhookEndpoint,
  StripeError
> {
  readonly _tag: "RetrieveWebhookEndpointRequest";
  readonly id: string;
  readonly params?: Stripe.WebhookEndpointRetrieveParams | undefined;
}

const RetrieveWebhookEndpointRequest = Request.tagged<RetrieveWebhookEndpointRequest>(
  "RetrieveWebhookEndpointRequest",
);

const RetrieveWebhookEndpointResolver: RequestResolver.RequestResolver<
  RetrieveWebhookEndpointRequest,
  StripeService
> = makeStripeResolver<RetrieveWebhookEndpointRequest>((stripe, request) =>
  stripe.webhookEndpoints.retrieve(request.id, request.params),
);

/**
 * Request to update a webhook endpoint
 */
interface UpdateWebhookEndpointRequest extends Request.Request<
  Stripe.WebhookEndpoint,
  StripeError
> {
  readonly _tag: "UpdateWebhookEndpointRequest";
  readonly id: string;
  readonly params?: Stripe.WebhookEndpointUpdateParams | undefined;
}

const UpdateWebhookEndpointRequest = Request.tagged<UpdateWebhookEndpointRequest>(
  "UpdateWebhookEndpointRequest",
);

const UpdateWebhookEndpointResolver: RequestResolver.RequestResolver<
  UpdateWebhookEndpointRequest,
  StripeService
> = makeStripeResolver<UpdateWebhookEndpointRequest>((stripe, request) =>
  stripe.webhookEndpoints.update(request.id, request.params),
);

/**
 * Request to delete a webhook endpoint
 */
interface DeleteWebhookEndpointRequest extends Request.Request<
  Stripe.DeletedWebhookEndpoint,
  StripeError
> {
  readonly _tag: "DeleteWebhookEndpointRequest";
  readonly id: string;
}

const DeleteWebhookEndpointRequest = Request.tagged<DeleteWebhookEndpointRequest>(
  "DeleteWebhookEndpointRequest",
);

const DeleteWebhookEndpointResolver: RequestResolver.RequestResolver<
  DeleteWebhookEndpointRequest,
  StripeService
> = makeStripeResolver<DeleteWebhookEndpointRequest>((stripe, request) =>
  stripe.webhookEndpoints.del(request.id),
);

/**
 * Request to list webhook endpoints
 */
interface ListWebhookEndpointsRequest extends Request.Request<
  Stripe.ApiList<Stripe.WebhookEndpoint>,
  StripeError
> {
  readonly _tag: "ListWebhookEndpointsRequest";
  readonly params?: Stripe.WebhookEndpointListParams | undefined;
}

const ListWebhookEndpointsRequest = Request.tagged<ListWebhookEndpointsRequest>(
  "ListWebhookEndpointsRequest",
);

const ListWebhookEndpointsResolver: RequestResolver.RequestResolver<
  ListWebhookEndpointsRequest,
  StripeService
> = makeStripeResolver<ListWebhookEndpointsRequest>((stripe, request) =>
  stripe.webhookEndpoints.list(request.params),
);

/**
 * Create a webhook endpoint
 */
export const create = (
  params: Stripe.WebhookEndpointCreateParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeService> =>
  Effect.request(
    CreateWebhookEndpointRequest({ params }),
    RequestResolver.contextFromEffect(CreateWebhookEndpointResolver),
  );

/**
 * Retrieve a webhook endpoint
 */
export const retrieve = (
  id: string,
  params?: Stripe.WebhookEndpointRetrieveParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeService> =>
  Effect.request(
    RetrieveWebhookEndpointRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveWebhookEndpointResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a webhook endpoint
 */
export const update = (
  id: string,
  params?: Stripe.WebhookEndpointUpdateParams,
): Effect.Effect<Stripe.WebhookEndpoint, StripeError, StripeService> =>
  Effect.request(
    UpdateWebhookEndpointRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateWebhookEndpointResolver),
  );

/**
 * Delete a webhook endpoint
 */
export const del = (
  id: string,
): Effect.Effect<Stripe.DeletedWebhookEndpoint, StripeError, StripeService> =>
  Effect.request(
    DeleteWebhookEndpointRequest({ id }),
    RequestResolver.contextFromEffect(DeleteWebhookEndpointResolver),
  );

/**
 * List webhook endpoints
 */
export const list = (
  params?: Stripe.WebhookEndpointListParams,
): Effect.Effect<Stripe.ApiList<Stripe.WebhookEndpoint>, StripeError, StripeService> =>
  Effect.request(
    ListWebhookEndpointsRequest({ params }),
    RequestResolver.contextFromEffect(ListWebhookEndpointsResolver),
  ).pipe(Effect.withRequestCaching(true));
