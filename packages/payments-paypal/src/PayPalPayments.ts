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
  toPaymentIntent,
  toPrice,
  toProduct,
  toRefund,
  toSubscription,
  toPage,
  type PayPalCapture,
  type PayPalLink,
  type PayPalOrder,
  type PayPalPlan,
  type PayPalProduct,
  type PayPalRefund,
  type PayPalSubscription,
} from "./internal/mapping.js";
import { toMajorString } from "./internal/money.js";

/** Fail with a neutral error for an operation PayPal does not support. */
const notSupported = (operation: string): Effect.Effect<never, PaymentsError> =>
  Effect.fail(
    new PaymentInvalidRequestError({
      message: `PayPal does not support ${operation}`,
    })
  );

// ---------------------------------------------------------------------------
// Products (catalog products)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link ProductNS.Products} capability. */
export const productsLayer: Layer.Layer<
  ProductNS.Products,
  never,
  PayPalClient
> = Layer.effect(
  ProductNS.Products,
  Effect.map(PayPalClient, (client) =>
    ProductNS.Products.of({
      create: (params) =>
        client
          .request<PayPalProduct>({
            method: "POST",
            path: "/v1/catalogs/products",
            body: {
              name: params.name,
              description: params.description,
              type: "SERVICE",
              category: "SOFTWARE",
            },
          })
          .pipe(Effect.map(toProduct)),
      retrieve: (id) =>
        client
          .request<PayPalProduct>({
            method: "GET",
            path: `/v1/catalogs/products/${id}`,
          })
          .pipe(Effect.map(toProduct)),
      update: (id, params) =>
        // PayPal patches a product, then returns 204; re-read to map the result.
        params.description === undefined
          ? notSupported("updating a product without a description")
          : client
              .request<void>({
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
                  client.request<PayPalProduct>({
                    method: "GET",
                    path: `/v1/catalogs/products/${id}`,
                  })
                ),
                Effect.map(toProduct)
              ),
      del: () => notSupported("deleting products"),
      list: (params) =>
        client
          .request<{ products: PayPalProduct[]; links?: PayPalLink[] }>({
            method: "GET",
            path: "/v1/catalogs/products",
            query: { page_size: params?.limit },
          })
          .pipe(
            Effect.map((res) => toPage(res.products.map(toProduct), res.links))
          ),
    })
  )
);

// ---------------------------------------------------------------------------
// Prices (billing plans)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link PriceNS.Prices} capability. */
export const pricesLayer: Layer.Layer<PriceNS.Prices, never, PayPalClient> =
  Layer.effect(
    PriceNS.Prices,
    Effect.map(PayPalClient, (client) =>
      PriceNS.Prices.of({
        create: (params) => {
          // PayPal plans are inherently recurring.
          if (!params.recurring) {
            return notSupported("one-time prices (plans must be recurring)");
          }
          return client
            .request<PayPalPlan>({
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
                      interval_unit: params.recurring.interval.toUpperCase(),
                      interval_count: params.recurring.intervalCount ?? 1,
                    },
                    pricing_scheme: {
                      fixed_price: {
                        currency_code: params.currency.toUpperCase(),
                        value: toMajorString(
                          params.unitAmount,
                          params.currency
                        ),
                      },
                    },
                  },
                ],
                payment_preferences: { auto_bill_outstanding: true },
              },
            })
            .pipe(Effect.map(toPrice));
        },
        retrieve: (id) =>
          client
            .request<PayPalPlan>({
              method: "GET",
              path: `/v1/billing/plans/${id}`,
            })
            .pipe(Effect.map(toPrice)),
        update: (id, params) => {
          // The only neutral field PayPal can act on is `active`, via
          // activate/deactivate; then re-read the plan to map the result.
          if (params.active === undefined) {
            return notSupported("updating a plan other than activating it");
          }
          const action = params.active ? "activate" : "deactivate";
          return client
            .request<void>({
              method: "POST",
              path: `/v1/billing/plans/${id}/${action}`,
            })
            .pipe(
              Effect.flatMap(() =>
                client.request<PayPalPlan>({
                  method: "GET",
                  path: `/v1/billing/plans/${id}`,
                })
              ),
              Effect.map(toPrice)
            );
        },
        list: (params) =>
          client
            .request<{ plans: PayPalPlan[]; links?: PayPalLink[] }>({
              method: "GET",
              path: "/v1/billing/plans",
              query: { page_size: params?.limit, product_id: params?.product },
            })
            .pipe(
              Effect.map((res) => toPage(res.plans.map(toPrice), res.links))
            ),
      })
    )
  );

// ---------------------------------------------------------------------------
// PaymentIntents (orders)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link PaymentIntentNS.PaymentIntents} capability. */
export const paymentIntentsLayer: Layer.Layer<
  PaymentIntentNS.PaymentIntents,
  never,
  PayPalClient
> = Layer.effect(
  PaymentIntentNS.PaymentIntents,
  Effect.map(PayPalClient, (client) =>
    PaymentIntentNS.PaymentIntents.of({
      create: (params) =>
        client
          .request<PayPalOrder>({
            method: "POST",
            path: "/v2/checkout/orders",
            body: {
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: params.currency.toUpperCase(),
                    value: toMajorString(params.amount, params.currency),
                  },
                  description: params.description,
                  custom_id: params.customer,
                },
              ],
            },
          })
          .pipe(Effect.map(toPaymentIntent)),
      retrieve: (id) =>
        client
          .request<PayPalOrder>({
            method: "GET",
            path: `/v2/checkout/orders/${id}`,
          })
          .pipe(Effect.map(toPaymentIntent)),
      update: () => notSupported("updating orders"),
      // Confirming a neutral payment intent maps onto capturing a PayPal order.
      confirm: (id) =>
        client
          .request<PayPalOrder>({
            method: "POST",
            path: `/v2/checkout/orders/${id}/capture`,
            body: {},
          })
          .pipe(Effect.map(toPaymentIntent)),
      cancel: () => notSupported("canceling orders"),
      list: () => notSupported("listing orders"),
    })
  )
);

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link SubscriptionNS.Subscriptions} capability. */
export const subscriptionsLayer: Layer.Layer<
  SubscriptionNS.Subscriptions,
  never,
  PayPalClient
> = Layer.effect(
  SubscriptionNS.Subscriptions,
  Effect.map(PayPalClient, (client) =>
    SubscriptionNS.Subscriptions.of({
      // PayPal subscriptions bill against a single plan; the first neutral item's
      // price is used as the plan id, and the customer id is stored in custom_id.
      create: (params) =>
        client
          .request<PayPalSubscription>({
            method: "POST",
            path: "/v1/billing/subscriptions",
            body: {
              plan_id: params.items[0]?.price,
              quantity: params.items[0]?.quantity
                ? String(params.items[0].quantity)
                : undefined,
              custom_id: params.customer,
            },
          })
          .pipe(Effect.map(toSubscription)),
      retrieve: (id) =>
        client
          .request<PayPalSubscription>({
            method: "GET",
            path: `/v1/billing/subscriptions/${id}`,
          })
          .pipe(Effect.map(toSubscription)),
      update: () => notSupported("updating subscriptions"),
      cancel: (id) =>
        client
          .request<void>({
            method: "POST",
            path: `/v1/billing/subscriptions/${id}/cancel`,
            body: { reason: "Canceled via effect-payments" },
          })
          .pipe(
            Effect.flatMap(() =>
              client.request<PayPalSubscription>({
                method: "GET",
                path: `/v1/billing/subscriptions/${id}`,
              })
            ),
            Effect.map(toSubscription)
          ),
      list: () => notSupported("listing subscriptions"),
    })
  )
);

// ---------------------------------------------------------------------------
// Refunds (capture refunds)
// ---------------------------------------------------------------------------

/** PayPal implementation of the {@link RefundNS.Refunds} capability. */
export const refundsLayer: Layer.Layer<RefundNS.Refunds, never, PayPalClient> =
  Layer.effect(
    RefundNS.Refunds,
    Effect.map(PayPalClient, (client) =>
      RefundNS.Refunds.of({
        create: (params) =>
          Effect.gen(function* () {
            // PayPal refunds a capture. Accept a capture id directly (`charge`)
            // or resolve the first capture of an order (`paymentIntent`).
            let captureId = params.charge ?? null;
            if (!captureId && params.paymentIntent) {
              const order = yield* client.request<PayPalOrder>({
                method: "GET",
                path: `/v2/checkout/orders/${params.paymentIntent}`,
              });
              captureId =
                order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
            }
            if (!captureId) {
              return yield* notSupported(
                "refunds without a capture id (provide `charge` or a captured `paymentIntent`)"
              );
            }

            // A partial-amount refund needs the capture's currency to format the
            // major-unit value, so look the capture up when an amount is given.
            let amount: { currency_code: string; value: string } | undefined;
            if (params.amount != null) {
              const capture = yield* client.request<PayPalCapture>({
                method: "GET",
                path: `/v2/payments/captures/${captureId}`,
              });
              const currency = capture.amount?.currency_code ?? "USD";
              amount = {
                currency_code: currency,
                value: toMajorString(params.amount, currency),
              };
            }

            const refund = yield* client.request<PayPalRefund>({
              method: "POST",
              path: `/v2/payments/captures/${captureId}/refund`,
              body: amount ? { amount } : {},
            });
            return toRefund(refund);
          }),
        retrieve: (id) =>
          client
            .request<PayPalRefund>({
              method: "GET",
              path: `/v2/payments/refunds/${id}`,
            })
            .pipe(Effect.map(toRefund)),
        update: () => notSupported("updating refunds"),
        list: () => notSupported("listing refunds"),
      })
    )
  );

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
  refundsLayer
);

/**
 * A self-contained layer providing the PayPal client and its capabilities,
 * built from configuration.
 */
export const layer = (config: PayPalConfig) =>
  Layer.provide(capabilities, clientLayer(config));

/**
 * A self-contained layer providing the PayPal client and its capabilities, with
 * the client built from environment variables.
 */
export const layerFromEnv = (clientIdVar?: string, clientSecretVar?: string) =>
  Layer.provide(capabilities, clientLayerFromEnv(clientIdVar, clientSecretVar));
