/**
 * CheckoutSession resource operations
 *
 * The types here are **generated** from Stripe's OpenAPI spec at the pinned
 * API version (`scripts/generate-stripe-schemas.ts`), not taken from the
 * `stripe` package, and every response is **decoded** with the generated
 * {@link Session} schema: a body that does not match fails with
 * `PaymentProviderError` instead of being cast. An expandable field
 * (`customer`, `payment_intent`, `subscription`, …) decodes as its id or, when
 * expanded, an open JSON object; its own resource module types it in full.
 * Every enumeration in a response (`mode`, `status`, `payment_status`, …) is
 * lenient (`Enumeration` from the core): a value Stripe adds later decodes as
 * `Other` carrying the raw string instead of failing a call that has already
 * taken effect. Request enumerations stay closed.
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
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
 * // Calls Stripe when invoked, so it needs a real key.
 * const run = () => Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import * as Generated from "./internal/generated/schemas.js";
import { stripeRequestDecoded } from "./internal/decode.js";
import { path, type StripeError } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/** The Checkout Session object, as a `Schema` (the decoder for every response here). */
export const Session = Generated.Checkout_session;
/** The Checkout Session object. */
export type Session = Generated.Checkout_session;

/** A page of Checkout Sessions, as a `Schema`. */
export const SessionList = Generated.GetCheckoutSessions200;
/** A page of Checkout Sessions. */
export type SessionList = Generated.GetCheckoutSessions200;

/** The parameters of {@link create}. */
export type SessionCreateParams = Generated.PostCheckoutSessionsRequestFormUrlEncoded;
/** The parameters of {@link retrieve}. */
export type SessionRetrieveParams = Generated.GetCheckoutSessionsSessionParams;
/** The parameters of {@link expire}. */
export type SessionExpireParams = Generated.PostCheckoutSessionsSessionExpireRequestFormUrlEncoded;
/**
 * The parameters of {@link list}. A `deepObject` query parameter is a flat,
 * bracketed key (`"customer_details[email]": "…"`, which is also its wire
 * name), not a nested object; `created` is the exception, since Stripe's spec
 * gives it a `number | { gt, gte, lt, lte }` schema.
 */
export type SessionListParams = Generated.GetCheckoutSessionsParams;

/**
 * Create a checkout session
 */
export const create = (
  params: SessionCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Session, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "checkout session",
    Session,
    "POST",
    "/v1/checkout/sessions",
    params,
    options,
  );

/**
 * Retrieve a checkout session
 */
export const retrieve = (
  id: string,
  params?: SessionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Session, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "checkout session",
    Session,
    "GET",
    path`/v1/checkout/sessions/${id}`,
    params,
    options,
  );

/**
 * Expire a checkout session
 */
export const expire = (
  id: string,
  params?: SessionExpireParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Session, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "checkout session",
    Session,
    "POST",
    path`/v1/checkout/sessions/${id}/expire`,
    params,
    options,
  );

/**
 * List checkout sessions
 */
export const list = (
  params?: SessionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SessionList, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "checkout session list",
    SessionList,
    "GET",
    "/v1/checkout/sessions",
    params,
    options,
  );
