/**
 * Airwallex implementations of the vendor-neutral payments capabilities.
 *
 * Airwallex's payment-acceptance API maps naturally onto the `Customers`,
 * `PaymentIntents` and `Refunds` capabilities. It has no first-class catalog or
 * subscription billing in the same shape as the core's `Products`, `Prices` and
 * `Subscriptions`, so this provider simply does not implement those — because
 * each capability is its own service, a program only needs to provide the
 * capabilities it actually uses.
 *
 * A few individual operations also have no Airwallex equivalent (deleting a
 * customer, updating a payment intent or refund). Those fail with a neutral
 * {@link PaymentInvalidRequestError} rather than pretending to succeed.
 *
 * @module
 */

import { Effect, Layer } from "effect";
import {
  Customer as CustomerNS,
  PaymentIntent as PaymentIntentNS,
  Refund as RefundNS,
  CheckoutSession as CheckoutSessionNS,
  BillingPortal as BillingPortalNS,
  IdempotencyKey as IdempotencyKeyNS,
  Stub,
  PaymentInvalidRequestError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import {
  AirwallexClient,
  layer as clientLayer,
  layerFromEnv as clientLayerFromEnv,
  type AirwallexConfig,
  type AirwallexRequest,
} from "./Airwallex.js";
import {
  decodeCustomer,
  decodeCustomerPage,
  decodePaymentIntent,
  decodePaymentIntentCurrency,
  decodePaymentIntentPage,
  decodeRefund,
  decodeRefundPage,
} from "./internal/mapping.js";
import { checkMinorUnits } from "@thomasfosterau/effect-payments/internal";
import { toMajorNumber } from "./internal/money.js";

/** A fresh idempotency key for a write request. */
const requestId = (): string => globalThis.crypto.randomUUID();

/**
 * `client.request` for a neutral write: the caller's idempotency key, checked,
 * becomes the request's `requestId`, which the client writes over the fresh
 * `request_id` in the body. With no key the body keeps its fresh id (which
 * deduplicates nothing across a caller's retry).
 */
const write = (
  client: AirwallexClient["Service"],
  request: Omit<AirwallexRequest, "requestId">,
  idempotencyKey: string | undefined,
): Effect.Effect<unknown, PaymentsError> =>
  Effect.flatMap(IdempotencyKeyNS.validate(idempotencyKey), (requestId) =>
    client.request({ ...request, requestId }),
  );

/** Fail with a neutral error for an operation Airwallex does not support. */
const notSupported = (operation: string): Effect.Effect<never, PaymentsError> =>
  Effect.fail(
    new PaymentInvalidRequestError({
      message: `Airwallex does not support ${operation}`,
    }),
  );

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/**
 * Airwallex customers as the {@link CustomerNS.Customers} capability. `del`
 * fails with {@link PaymentInvalidRequestError} (Airwallex has no
 * delete-customer endpoint).
 */
export const customersLayer: Layer.Layer<CustomerNS.Customers, never, AirwallexClient> =
  Layer.effect(
    CustomerNS.Customers,
    Effect.map(AirwallexClient, (client) =>
      CustomerNS.Customers.of({
        create: (params) =>
          write(
            client,
            {
              method: "POST",
              path: "/api/v1/pa/customers",
              body: {
                request_id: requestId(),
                email: params.email,
                first_name: params.name,
                phone_number: params.phone,
                metadata: params.metadata,
              },
            },
            params.idempotencyKey,
          ).pipe(Effect.flatMap(decodeCustomer)),
        retrieve: (id) =>
          client
            .request({
              method: "GET",
              path: `/api/v1/pa/customers/${id}`,
            })
            .pipe(Effect.flatMap(decodeCustomer)),
        update: (id, params) =>
          client
            .request({
              method: "POST",
              path: `/api/v1/pa/customers/${id}/update`,
              body: {
                request_id: requestId(),
                email: params.email,
                first_name: params.name,
                phone_number: params.phone,
                metadata: params.metadata,
              },
            })
            .pipe(Effect.flatMap(decodeCustomer)),
        del: () => notSupported("deleting customers"),
        list: (params) =>
          client
            .request({
              method: "GET",
              path: "/api/v1/pa/customers",
              query: { page_size: params?.limit },
            })
            .pipe(Effect.flatMap(decodeCustomerPage)),
      }),
    ),
  );

// ---------------------------------------------------------------------------
// PaymentIntents
// ---------------------------------------------------------------------------

/**
 * Airwallex payment intents as the {@link PaymentIntentNS.PaymentIntents}
 * capability. `update` fails with {@link PaymentInvalidRequestError}; use
 * `confirm` or `cancel`.
 */
export const paymentIntentsLayer: Layer.Layer<
  PaymentIntentNS.PaymentIntents,
  never,
  AirwallexClient
> = Layer.effect(
  PaymentIntentNS.PaymentIntents,
  Effect.map(AirwallexClient, (client) =>
    PaymentIntentNS.PaymentIntents.of({
      create: (params) =>
        toMajorNumber(params.amount, params.currency, "amount").pipe(
          Effect.flatMap((amount) =>
            write(
              client,
              {
                method: "POST",
                path: "/api/v1/pa/payment_intents",
                body: {
                  request_id: requestId(),
                  amount,
                  currency: params.currency,
                  customer_id: params.customer,
                  descriptor: params.description,
                  metadata: params.metadata,
                },
              },
              params.idempotencyKey,
            ),
          ),
          Effect.flatMap(decodePaymentIntent),
        ),
      retrieve: (id) =>
        client
          .request({
            method: "GET",
            path: `/api/v1/pa/payment_intents/${id}`,
          })
          .pipe(Effect.flatMap(decodePaymentIntent)),
      update: () => notSupported("updating payment intents"),
      confirm: (id, params) =>
        write(
          client,
          {
            method: "POST",
            path: `/api/v1/pa/payment_intents/${id}/confirm`,
            body: {
              request_id: requestId(),
              ...(params?.paymentMethod ? { payment_method: { id: params.paymentMethod } } : {}),
            },
          },
          params?.idempotencyKey,
        ).pipe(Effect.flatMap(decodePaymentIntent)),
      cancel: (id) =>
        client
          .request({
            method: "POST",
            path: `/api/v1/pa/payment_intents/${id}/cancel`,
            body: { request_id: requestId() },
          })
          .pipe(Effect.flatMap(decodePaymentIntent)),
      list: (params) =>
        client
          .request({
            method: "GET",
            path: "/api/v1/pa/payment_intents",
            query: { page_size: params?.limit, customer_id: params?.customer },
          })
          .pipe(Effect.flatMap(decodePaymentIntentPage)),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/**
 * Airwallex refunds as the {@link RefundNS.Refunds} capability. A refund
 * references a `paymentIntent`: `create` without one (a `charge` only) fails
 * with {@link PaymentInvalidRequestError}, and so does `update`.
 */
export const refundsLayer: Layer.Layer<RefundNS.Refunds, never, AirwallexClient> = Layer.effect(
  RefundNS.Refunds,
  Effect.map(AirwallexClient, (client) =>
    RefundNS.Refunds.of({
      create: (params) =>
        Effect.gen(function* () {
          if (!params.paymentIntent) {
            return yield* notSupported(
              "refunds without a payment intent (charges are not supported)",
            );
          }
          // Refuse a bad key, or a negative or fractional amount, before the
          // currency lookup.
          const idempotencyKey = yield* IdempotencyKeyNS.validate(params.idempotencyKey);
          if (params.amount != null) yield* checkMinorUnits(params.amount, "amount");
          // The neutral amount is in minor units; Airwallex needs major units,
          // and the conversion depends on the currency, so resolve it from the
          // payment intent when a partial amount is requested.
          let amount: number | undefined;
          if (params.amount != null) {
            const currency = yield* client
              .request({
                method: "GET",
                path: `/api/v1/pa/payment_intents/${params.paymentIntent}`,
              })
              .pipe(Effect.flatMap(decodePaymentIntentCurrency));
            amount = yield* toMajorNumber(params.amount, currency, "amount");
          }
          return yield* client
            .request({
              method: "POST",
              path: "/api/v1/pa/refunds",
              body: {
                request_id: requestId(),
                payment_intent_id: params.paymentIntent,
                amount,
                reason: params.reason,
                metadata: params.metadata,
              },
              requestId: idempotencyKey,
            })
            .pipe(Effect.flatMap(decodeRefund));
        }),
      retrieve: (id) =>
        client
          .request({
            method: "GET",
            path: `/api/v1/pa/refunds/${id}`,
          })
          .pipe(Effect.flatMap(decodeRefund)),
      update: () => notSupported("updating refunds"),
      list: (params) =>
        client
          .request({
            method: "GET",
            path: "/api/v1/pa/refunds",
            query: {
              page_size: params?.limit,
              payment_intent_id: params?.paymentIntent,
            },
          })
          .pipe(Effect.flatMap(decodeRefundPage)),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Hosted checkout and billing portal (unsupported)
// ---------------------------------------------------------------------------

/**
 * The {@link CheckoutSessionNS.CheckoutSessions} capability for Airwallex: every
 * call fails with {@link PaymentInvalidRequestError}, because this provider
 * does not implement the neutral hosted checkout. It is not part of
 * {@link capabilities} — a program that needs hosted checkout does not
 * type-check against Airwallex by default — and exists for a program that must
 * run on several providers and handles the failure itself.
 */
export const checkoutSessionsLayer: Layer.Layer<CheckoutSessionNS.CheckoutSessions> =
  Stub.checkoutSessions(notSupported("hosted checkout sessions"));

/**
 * The {@link BillingPortalNS.BillingPortalSessions} capability for Airwallex:
 * every call fails with {@link PaymentInvalidRequestError}, because this
 * provider has no hosted billing portal. Like {@link checkoutSessionsLayer}, it
 * is not part of {@link capabilities}.
 */
export const billingPortalSessionsLayer: Layer.Layer<BillingPortalNS.BillingPortalSessions> =
  Stub.billingPortalSessions(notSupported("billing portal sessions"));

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------

/**
 * The capabilities Airwallex implements (`Customers`, `PaymentIntents`,
 * `Refunds`), built on top of an existing {@link AirwallexClient}.
 */
export const capabilities: Layer.Layer<
  CustomerNS.Customers | PaymentIntentNS.PaymentIntents | RefundNS.Refunds,
  never,
  AirwallexClient
> = Layer.mergeAll(customersLayer, paymentIntentsLayer, refundsLayer);

/**
 * The Airwallex client and its capabilities in one layer, built from
 * configuration. Requires an `HttpClient` (`FetchHttpClient.layer`).
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Customer from "@thomasfosterau/effect-payments/Customer";
 * import * as AirwallexPayments from "@thomasfosterau/effect-payments-airwallex/AirwallexPayments";
 *
 * const program = Customer.create({ email: "jane@example.com" });
 *
 * const layer = AirwallexPayments.layer({
 *   clientId: "...",
 *   apiKey: Redacted.make("..."),
 * }).pipe(Layer.provide(FetchHttpClient.layer));
 * // Calls Airwallex when invoked, so it needs real credentials.
 * const run = () => Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */
export const layer = (config: AirwallexConfig) => Layer.provide(capabilities, clientLayer(config));

/**
 * The Airwallex client and its capabilities in one layer, with the client
 * built from environment variables (`AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`,
 * the required `AIRWALLEX_ENV` of `live` or `sandbox`, and the optional
 * `AIRWALLEX_BASE_URL` override; see `Airwallex.layerFromEnv`). Requires an
 * `HttpClient` (`FetchHttpClient.layer`).
 */
export const layerFromEnv = (clientIdVar?: string, apiKeyVar?: string) =>
  Layer.provide(capabilities, clientLayerFromEnv(clientIdVar, apiKeyVar));
