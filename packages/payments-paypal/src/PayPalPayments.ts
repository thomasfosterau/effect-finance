/**
 * PayPal implementations of the vendor-neutral payments capabilities.
 *
 * PayPal's billing suite and checkout APIs map onto the `Products`, `Prices`
 * (billing plans), `PaymentIntents` (orders), `Subscriptions` and `Refunds`
 * capabilities. PayPal has no first-class customer resource, so this provider
 * does not implement `Customers` at all — a program that only uses the
 * capabilities above is fully satisfied.
 *
 * Several individual operations have no PayPal equivalent (listing orders or
 * subscriptions, canceling an order, updating a subscription). Those fail with a
 * neutral {@link PaymentInvalidRequestError} rather than pretending to succeed.
 *
 * @module
 */

import { Effect, Layer } from "effect";
import {
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  CheckoutSession as CheckoutSessionNS,
  BillingPortal as BillingPortalNS,
  Stub,
  PaymentInvalidRequestError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import {
  PayPalClient,
  layer as clientLayer,
  layerFromEnv as clientLayerFromEnv,
  type PayPalConfig,
} from "./PayPal.js";
import {
  decodeCaptureCurrency,
  decodeOrderCaptureId,
  decodePaymentIntent,
  decodePrice,
  decodePricePage,
  decodeProduct,
  decodeProductPage,
  decodeRefund,
  decodeSubscription,
} from "./internal/mapping.js";
import { toMajorString } from "./internal/money.js";

/** Fail with a neutral error for an operation PayPal does not support. */
const notSupported = (operation: string): Effect.Effect<never, PaymentsError> =>
  Effect.fail(
    new PaymentInvalidRequestError({
      message: `PayPal does not support ${operation}`,
    }),
  );

// ---------------------------------------------------------------------------
// Products (catalog products)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link ProductNS.Products} capability. */
export const productsLayer: Layer.Layer<ProductNS.Products, never, PayPalClient> = Layer.effect(
  ProductNS.Products,
  Effect.map(PayPalClient, (client) =>
    ProductNS.Products.of({
      create: (params) =>
        client
          .request({
            method: "POST",
            path: "/v1/catalogs/products",
            body: {
              name: params.name,
              description: params.description,
              type: "SERVICE",
              category: "SOFTWARE",
            },
          })
          .pipe(Effect.flatMap(decodeProduct)),
      retrieve: (id) =>
        client
          .request({
            method: "GET",
            path: `/v1/catalogs/products/${id}`,
          })
          .pipe(Effect.flatMap(decodeProduct)),
      update: (id, params) =>
        // PayPal patches a product, then returns 204; re-read to map the result.
        params.description === undefined
          ? notSupported("updating a product without a description")
          : client
              .request({
                method: "PATCH",
                path: `/v1/catalogs/products/${id}`,
                body: [
                  {
                    op: "replace",
                    path: "/description",
                    value: params.description,
                  },
                ],
              })
              .pipe(
                Effect.flatMap(() =>
                  client.request({
                    method: "GET",
                    path: `/v1/catalogs/products/${id}`,
                  }),
                ),
                Effect.flatMap(decodeProduct),
              ),
      del: () => notSupported("deleting products"),
      list: (params) =>
        client
          .request({
            method: "GET",
            path: "/v1/catalogs/products",
            query: { page_size: params?.limit },
          })
          .pipe(Effect.flatMap(decodeProductPage)),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Prices (billing plans)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link PriceNS.Prices} capability. */
export const pricesLayer: Layer.Layer<PriceNS.Prices, never, PayPalClient> = Layer.effect(
  PriceNS.Prices,
  Effect.map(PayPalClient, (client) =>
    PriceNS.Prices.of({
      create: (params) => {
        // PayPal plans are inherently recurring.
        if (!params.recurring) {
          return notSupported("one-time prices (plans must be recurring)");
        }
        const recurring = params.recurring;
        return toMajorString(params.unitAmount, params.currency, "unitAmount").pipe(
          Effect.flatMap((value) =>
            client.request({
              method: "POST",
              path: "/v1/billing/plans",
              body: {
                product_id: params.product,
                name: "Plan",
                billing_cycles: [
                  {
                    tenure_type: "REGULAR",
                    sequence: 1,
                    total_cycles: 0,
                    frequency: {
                      interval_unit: recurring.interval.toUpperCase(),
                      interval_count: recurring.intervalCount ?? 1,
                    },
                    pricing_scheme: {
                      fixed_price: {
                        currency_code: params.currency.toUpperCase(),
                        value,
                      },
                    },
                  },
                ],
                payment_preferences: { auto_bill_outstanding: true },
              },
            }),
          ),
          Effect.flatMap(decodePrice),
        );
      },
      retrieve: (id) =>
        client
          .request({
            method: "GET",
            path: `/v1/billing/plans/${id}`,
          })
          .pipe(Effect.flatMap(decodePrice)),
      update: (id, params) => {
        // The only neutral field PayPal can act on is `active`, via
        // activate/deactivate; then re-read the plan to map the result.
        if (params.active === undefined) {
          return notSupported("updating a plan other than activating it");
        }
        const action = params.active ? "activate" : "deactivate";
        return client
          .request({
            method: "POST",
            path: `/v1/billing/plans/${id}/${action}`,
          })
          .pipe(
            Effect.flatMap(() =>
              client.request({
                method: "GET",
                path: `/v1/billing/plans/${id}`,
              }),
            ),
            Effect.flatMap(decodePrice),
          );
      },
      list: (params) =>
        client
          .request({
            method: "GET",
            path: "/v1/billing/plans",
            query: { page_size: params?.limit, product_id: params?.product },
          })
          .pipe(Effect.flatMap(decodePricePage)),
    }),
  ),
);

// ---------------------------------------------------------------------------
// PaymentIntents (orders)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link PaymentIntentNS.PaymentIntents} capability. */
export const paymentIntentsLayer: Layer.Layer<PaymentIntentNS.PaymentIntents, never, PayPalClient> =
  Layer.effect(
    PaymentIntentNS.PaymentIntents,
    Effect.map(PayPalClient, (client) =>
      PaymentIntentNS.PaymentIntents.of({
        create: (params) =>
          toMajorString(params.amount, params.currency, "amount").pipe(
            Effect.flatMap((value) =>
              client.request({
                method: "POST",
                path: "/v2/checkout/orders",
                body: {
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: params.currency.toUpperCase(),
                        value,
                      },
                      description: params.description,
                      custom_id: params.customer,
                    },
                  ],
                },
              }),
            ),
            Effect.flatMap(decodePaymentIntent),
          ),
        retrieve: (id) =>
          client
            .request({
              method: "GET",
              path: `/v2/checkout/orders/${id}`,
            })
            .pipe(Effect.flatMap(decodePaymentIntent)),
        update: () => notSupported("updating orders"),
        // Confirming a neutral payment intent maps onto capturing a PayPal order.
        confirm: (id) =>
          client
            .request({
              method: "POST",
              path: `/v2/checkout/orders/${id}/capture`,
              body: {},
            })
            .pipe(Effect.flatMap(decodePaymentIntent)),
        cancel: () => notSupported("canceling orders"),
        list: () => notSupported("listing orders"),
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link SubscriptionNS.Subscriptions} capability. */
export const subscriptionsLayer: Layer.Layer<SubscriptionNS.Subscriptions, never, PayPalClient> =
  Layer.effect(
    SubscriptionNS.Subscriptions,
    Effect.map(PayPalClient, (client) =>
      SubscriptionNS.Subscriptions.of({
        // PayPal subscriptions bill against a single plan; the first neutral item's
        // price is used as the plan id, and the customer id is stored in custom_id.
        create: (params) =>
          client
            .request({
              method: "POST",
              path: "/v1/billing/subscriptions",
              body: {
                plan_id: params.items[0]?.price,
                quantity: params.items[0]?.quantity ? String(params.items[0].quantity) : undefined,
                custom_id: params.customer,
              },
            })
            .pipe(Effect.flatMap(decodeSubscription)),
        retrieve: (id) =>
          client
            .request({
              method: "GET",
              path: `/v1/billing/subscriptions/${id}`,
            })
            .pipe(Effect.flatMap(decodeSubscription)),
        update: () => notSupported("updating subscriptions"),
        cancel: (id) =>
          client
            .request({
              method: "POST",
              path: `/v1/billing/subscriptions/${id}/cancel`,
              body: { reason: "Canceled via effect-payments" },
            })
            .pipe(
              Effect.flatMap(() =>
                client.request({
                  method: "GET",
                  path: `/v1/billing/subscriptions/${id}`,
                }),
              ),
              Effect.flatMap(decodeSubscription),
            ),
        list: () => notSupported("listing subscriptions"),
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Refunds (capture refunds)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link RefundNS.Refunds} capability. */
export const refundsLayer: Layer.Layer<RefundNS.Refunds, never, PayPalClient> = Layer.effect(
  RefundNS.Refunds,
  Effect.map(PayPalClient, (client) =>
    RefundNS.Refunds.of({
      create: (params) =>
        Effect.gen(function* () {
          // PayPal refunds a capture. Accept a capture id directly (`charge`)
          // or resolve the first capture of an order (`paymentIntent`).
          let captureId = params.charge ?? null;
          if (!captureId && params.paymentIntent) {
            captureId = yield* client
              .request({
                method: "GET",
                path: `/v2/checkout/orders/${params.paymentIntent}`,
              })
              .pipe(Effect.flatMap(decodeOrderCaptureId));
          }
          if (!captureId) {
            return yield* notSupported(
              "refunds without a capture id (provide `charge` or a captured `paymentIntent`)",
            );
          }

          // A partial-amount refund needs the capture's currency to format the
          // major-unit value, so look the capture up when an amount is given.
          let amount: { currency_code: string; value: string } | undefined;
          if (params.amount != null) {
            const currency = yield* client
              .request({
                method: "GET",
                path: `/v2/payments/captures/${captureId}`,
              })
              .pipe(Effect.flatMap(decodeCaptureCurrency));
            amount = {
              currency_code: currency,
              value: yield* toMajorString(params.amount, currency, "amount"),
            };
          }

          return yield* client
            .request({
              method: "POST",
              path: `/v2/payments/captures/${captureId}/refund`,
              body: amount ? { amount } : {},
            })
            .pipe(Effect.flatMap(decodeRefund));
        }),
      retrieve: (id) =>
        client
          .request({
            method: "GET",
            path: `/v2/payments/refunds/${id}`,
          })
          .pipe(Effect.flatMap(decodeRefund)),
      update: () => notSupported("updating refunds"),
      list: () => notSupported("listing refunds"),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Hosted checkout and billing portal (unsupported)
// ---------------------------------------------------------------------------

/**
 * The {@link CheckoutSessionNS.CheckoutSessions} capability for PayPal: every
 * call fails with {@link PaymentInvalidRequestError}, because this provider
 * does not implement the neutral hosted checkout. It is not part of
 * {@link capabilities} — a program that needs hosted checkout does not
 * type-check against PayPal by default — and exists for a program that must
 * run on several providers and handles the failure itself.
 */
export const checkoutSessionsLayer: Layer.Layer<CheckoutSessionNS.CheckoutSessions> =
  Stub.checkoutSessions(notSupported("hosted checkout sessions"));

/**
 * The {@link BillingPortalNS.BillingPortalSessions} capability for PayPal:
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
 * The capabilities PayPal implements (`Products`, `Prices`, `PaymentIntents`,
 * `Subscriptions`, `Refunds`), built on top of an existing {@link PayPalClient}.
 */
export const capabilities: Layer.Layer<
  | ProductNS.Products
  | PriceNS.Prices
  | PaymentIntentNS.PaymentIntents
  | SubscriptionNS.Subscriptions
  | RefundNS.Refunds,
  never,
  PayPalClient
> = Layer.mergeAll(
  productsLayer,
  pricesLayer,
  paymentIntentsLayer,
  subscriptionsLayer,
  refundsLayer,
);

/**
 * A self-contained layer providing the PayPal client and its capabilities,
 * built from configuration.
 */
export const layer = (config: PayPalConfig) => Layer.provide(capabilities, clientLayer(config));

/**
 * A self-contained layer providing the PayPal client and its capabilities, with
 * the client built from environment variables.
 */
export const layerFromEnv = (clientIdVar?: string, clientSecretVar?: string) =>
  Layer.provide(capabilities, clientLayerFromEnv(clientIdVar, clientSecretVar));
