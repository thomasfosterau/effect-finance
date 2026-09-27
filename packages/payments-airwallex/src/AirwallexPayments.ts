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
  PaymentInvalidRequestError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import {
  AirwallexClient,
  layer as clientLayer,
  layerFromEnv as clientLayerFromEnv,
  type AirwallexConfig,
} from "./Airwallex.js";
import {
  toCustomer,
  toPage,
  toPaymentIntent,
  toRefund,
  type AirwallexCustomer,
  type AirwallexList,
  type AirwallexPaymentIntent,
  type AirwallexRefund,
} from "./internal/mapping.js";
import { toMajorUnits } from "./internal/money.js";

/** A fresh idempotency key for a write request. */
const requestId = (): string => globalThis.crypto.randomUUID();

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

/** Airwallex implementation of the {@link CustomerNS.Customers} capability. */
export const customersLayer: Layer.Layer<CustomerNS.Customers, never, AirwallexClient> =
  Layer.effect(
    CustomerNS.Customers,
    Effect.map(AirwallexClient, (client) =>
      CustomerNS.Customers.of({
        create: (params) =>
          client
            .request<AirwallexCustomer>({
              method: "POST",
              path: "/api/v1/pa/customers",
              body: {
                request_id: requestId(),
                email: params.email,
                first_name: params.name,
                phone_number: params.phone,
                metadata: params.metadata,
              },
            })
            .pipe(Effect.map(toCustomer)),
        retrieve: (id) =>
          client
            .request<AirwallexCustomer>({
              method: "GET",
              path: `/api/v1/pa/customers/${id}`,
            })
            .pipe(Effect.map(toCustomer)),
        update: (id, params) =>
          client
            .request<AirwallexCustomer>({
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
            .pipe(Effect.map(toCustomer)),
        del: () => notSupported("deleting customers"),
        list: (params) =>
          client
            .request<AirwallexList<AirwallexCustomer>>({
              method: "GET",
              path: "/api/v1/pa/customers",
              query: { page_size: params?.limit },
            })
            .pipe(Effect.map((list) => toPage(list, toCustomer))),
      }),
    ),
  );

// ---------------------------------------------------------------------------
// PaymentIntents
// ---------------------------------------------------------------------------

/** Airwallex implementation of the {@link PaymentIntentNS.PaymentIntents} capability. */
export const paymentIntentsLayer: Layer.Layer<
  PaymentIntentNS.PaymentIntents,
  never,
  AirwallexClient
> = Layer.effect(
  PaymentIntentNS.PaymentIntents,
  Effect.map(AirwallexClient, (client) =>
    PaymentIntentNS.PaymentIntents.of({
      create: (params) =>
        client
          .request<AirwallexPaymentIntent>({
            method: "POST",
            path: "/api/v1/pa/payment_intents",
            body: {
              request_id: requestId(),
              amount: toMajorUnits(params.amount, params.currency),
              currency: params.currency,
              customer_id: params.customer,
              descriptor: params.description,
              metadata: params.metadata,
            },
          })
          .pipe(Effect.map(toPaymentIntent)),
      retrieve: (id) =>
        client
          .request<AirwallexPaymentIntent>({
            method: "GET",
            path: `/api/v1/pa/payment_intents/${id}`,
          })
          .pipe(Effect.map(toPaymentIntent)),
      update: () => notSupported("updating payment intents"),
      confirm: (id, params) =>
        client
          .request<AirwallexPaymentIntent>({
            method: "POST",
            path: `/api/v1/pa/payment_intents/${id}/confirm`,
            body: {
              request_id: requestId(),
              ...(params?.paymentMethod ? { payment_method: { id: params.paymentMethod } } : {}),
            },
          })
          .pipe(Effect.map(toPaymentIntent)),
      cancel: (id) =>
        client
          .request<AirwallexPaymentIntent>({
            method: "POST",
            path: `/api/v1/pa/payment_intents/${id}/cancel`,
            body: { request_id: requestId() },
          })
          .pipe(Effect.map(toPaymentIntent)),
      list: (params) =>
        client
          .request<AirwallexList<AirwallexPaymentIntent>>({
            method: "GET",
            path: "/api/v1/pa/payment_intents",
            query: { page_size: params?.limit, customer_id: params?.customer },
          })
          .pipe(Effect.map((list) => toPage(list, toPaymentIntent))),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/** Airwallex implementation of the {@link RefundNS.Refunds} capability. */
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
          // The neutral amount is in minor units; Airwallex needs major units,
          // and the conversion depends on the currency, so resolve it from the
          // payment intent when a partial amount is requested.
          let amount: number | undefined;
          if (params.amount != null) {
            const intent = yield* client.request<AirwallexPaymentIntent>({
              method: "GET",
              path: `/api/v1/pa/payment_intents/${params.paymentIntent}`,
            });
            amount = toMajorUnits(params.amount, intent.currency);
          }
          const refund = yield* client.request<AirwallexRefund>({
            method: "POST",
            path: "/api/v1/pa/refunds",
            body: {
              request_id: requestId(),
              payment_intent_id: params.paymentIntent,
              amount,
              reason: params.reason,
              metadata: params.metadata,
            },
          });
          return toRefund(refund);
        }),
      retrieve: (id) =>
        client
          .request<AirwallexRefund>({
            method: "GET",
            path: `/api/v1/pa/refunds/${id}`,
          })
          .pipe(Effect.map(toRefund)),
      update: () => notSupported("updating refunds"),
      list: (params) =>
        client
          .request<AirwallexList<AirwallexRefund>>({
            method: "GET",
            path: "/api/v1/pa/refunds",
            query: {
              page_size: params?.limit,
              payment_intent_id: params?.paymentIntent,
            },
          })
          .pipe(Effect.map((list) => toPage(list, toRefund))),
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
export const checkoutSessionsLayer: Layer.Layer<CheckoutSessionNS.CheckoutSessions> = Layer.succeed(
  CheckoutSessionNS.CheckoutSessions,
  CheckoutSessionNS.CheckoutSessions.of({
    create: () => notSupported("hosted checkout sessions"),
  }),
);

/**
 * The {@link BillingPortalNS.BillingPortalSessions} capability for Airwallex:
 * every call fails with {@link PaymentInvalidRequestError}, because this
 * provider has no hosted billing portal. Like {@link checkoutSessionsLayer}, it
 * is not part of {@link capabilities}.
 */
export const billingPortalSessionsLayer: Layer.Layer<BillingPortalNS.BillingPortalSessions> =
  Layer.succeed(
    BillingPortalNS.BillingPortalSessions,
    BillingPortalNS.BillingPortalSessions.of({
      create: () => notSupported("billing portal sessions"),
    }),
  );

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
 * A self-contained layer providing the Airwallex client and its capabilities,
 * built from configuration.
 */
export const layer = (config: AirwallexConfig) => Layer.provide(capabilities, clientLayer(config));

/**
 * A self-contained layer providing the Airwallex client and its capabilities,
 * with the client built from environment variables.
 */
export const layerFromEnv = (clientIdVar?: string, apiKeyVar?: string) =>
  Layer.provide(capabilities, clientLayerFromEnv(clientIdVar, apiKeyVar));
