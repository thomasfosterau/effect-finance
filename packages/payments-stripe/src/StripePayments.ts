/**
 * Stripe implementations of the vendor-neutral payments capabilities.
 *
 * Each capability defined by `@thomasfosterau/effect-payments` is implemented
 * here as a `Layer` over the {@link StripeHttp} transport: neutral parameters
 * are mapped onto Stripe's form-encoded ones, and every response is decoded
 * with `Schema` before it is mapped onto a neutral entity. The {@link layer} /
 * {@link layerFromEnv} helpers bundle the fetch transport together with every
 * capability, so a program written against the neutral core is satisfied by
 * one `Effect.provide` (plus an `HttpClient`, e.g. `FetchHttpClient.layer`).
 * To run on the SDK instead, provide {@link capabilities} with the `Stripe`
 * module's layer.
 *
 * @module
 */

import { Effect, Layer } from "effect";
import type { HttpClient } from "effect/unstable/http";
import {
  Customer as CustomerNS,
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  CheckoutSession as CheckoutSessionNS,
  BillingPortal as BillingPortalNS,
  IdempotencyKey as IdempotencyKeyNS,
  type PaymentConfigError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import type { StripeParams } from "./internal/params.js";
import { path, type RequestPath, withPath } from "./internal/index.js";
import {
  decodeBillingPortalSession,
  decodeCheckoutSession,
  decodeCustomer,
  decodeCustomerPage,
  decodeDeleted,
  decodePaymentIntent,
  decodePaymentIntentPage,
  decodePrice,
  decodePricePage,
  decodeProduct,
  decodeProductPage,
  decodeRefund,
  decodeRefundPage,
  decodeSubscription,
  decodeSubscriptionPage,
} from "./internal/mapping.js";
import {
  layer as httpLayer,
  layerConfig as httpLayerConfig,
  layerFromEnv as httpLayerFromEnv,
  type LayerConfigOptions,
  StripeHttp,
  type StripeHttpConfig,
  type StripeMethod,
} from "./StripeHttp.js";

/**
 * One call through the transport, its response decoded by `decode`. Parameter
 * objects are passed as assembled: the form encoder skips `undefined` values.
 * `idempotencyKey` is the neutral key of a create or confirm operation, sent
 * as the `Idempotency-Key` header.
 */
const call =
  (http: StripeHttp["Service"]) =>
  <A>(
    method: StripeMethod,
    requestPath: RequestPath,
    params: StripeParams | undefined,
    decode: (body: unknown) => Effect.Effect<A, PaymentsError>,
    idempotencyKey?: string | undefined,
  ): Effect.Effect<A, PaymentsError> =>
    // The key is checked before anything is sent: the brand guarantees its
    // shape for typed callers, this refuses a raw string from untyped code.
    Effect.flatMap(IdempotencyKeyNS.validate(idempotencyKey), (key) =>
      withPath(requestPath, (valid) =>
        Effect.flatMap(http.request({ method, path: valid, params, idempotencyKey: key }), decode),
      ),
    );

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link CustomerNS.Customers} capability. */
export const customersLayer: Layer.Layer<CustomerNS.Customers, never, StripeHttp> = Layer.effect(
  CustomerNS.Customers,
  Effect.map(StripeHttp, (http) => {
    const request = call(http);
    const fields = (params: CustomerNS.UpdateParams) => ({
      email: params.email,
      name: params.name,
      phone: params.phone,
      description: params.description,
      metadata: params.metadata,
    });
    return CustomerNS.Customers.of({
      create: (params) =>
        request("POST", "/v1/customers", fields(params), decodeCustomer, params.idempotencyKey),
      retrieve: (id) => request("GET", path`/v1/customers/${id}`, undefined, decodeCustomer),
      update: (id, params) =>
        request("POST", path`/v1/customers/${id}`, fields(params), decodeCustomer),
      del: (id) => request("DELETE", path`/v1/customers/${id}`, undefined, decodeDeleted),
      list: (params) =>
        request(
          "GET",
          "/v1/customers",
          { limit: params?.limit, email: params?.email, starting_after: params?.startingAfter },
          decodeCustomerPage,
        ),
    });
  }),
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link ProductNS.Products} capability. */
export const productsLayer: Layer.Layer<ProductNS.Products, never, StripeHttp> = Layer.effect(
  ProductNS.Products,
  Effect.map(StripeHttp, (http) => {
    const request = call(http);
    const fields = (params: ProductNS.UpdateParams) => ({
      name: params.name,
      description: params.description,
      active: params.active,
      metadata: params.metadata,
    });
    return ProductNS.Products.of({
      create: (params) =>
        request("POST", "/v1/products", fields(params), decodeProduct, params.idempotencyKey),
      retrieve: (id) => request("GET", path`/v1/products/${id}`, undefined, decodeProduct),
      update: (id, params) =>
        request("POST", path`/v1/products/${id}`, fields(params), decodeProduct),
      del: (id) => request("DELETE", path`/v1/products/${id}`, undefined, decodeDeleted),
      list: (params) =>
        request(
          "GET",
          "/v1/products",
          { limit: params?.limit, active: params?.active, starting_after: params?.startingAfter },
          decodeProductPage,
        ),
    });
  }),
);

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link PriceNS.Prices} capability. */
export const pricesLayer: Layer.Layer<PriceNS.Prices, never, StripeHttp> = Layer.effect(
  PriceNS.Prices,
  Effect.map(StripeHttp, (http) => {
    const request = call(http);
    return PriceNS.Prices.of({
      create: (params) =>
        request(
          "POST",
          "/v1/prices",
          {
            product: params.product,
            currency: params.currency,
            unit_amount: params.unitAmount,
            recurring: params.recurring && {
              interval: params.recurring.interval,
              interval_count: params.recurring.intervalCount,
            },
            active: params.active,
            metadata: params.metadata,
          },
          decodePrice,
          params.idempotencyKey,
        ),
      retrieve: (id) => request("GET", path`/v1/prices/${id}`, undefined, decodePrice),
      update: (id, params) =>
        request(
          "POST",
          path`/v1/prices/${id}`,
          { active: params.active, metadata: params.metadata },
          decodePrice,
        ),
      list: (params) =>
        request(
          "GET",
          "/v1/prices",
          {
            limit: params?.limit,
            product: params?.product,
            active: params?.active,
            starting_after: params?.startingAfter,
          },
          decodePricePage,
        ),
    });
  }),
);

// ---------------------------------------------------------------------------
// PaymentIntents
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link PaymentIntentNS.PaymentIntents} capability. */
export const paymentIntentsLayer: Layer.Layer<PaymentIntentNS.PaymentIntents, never, StripeHttp> =
  Layer.effect(
    PaymentIntentNS.PaymentIntents,
    Effect.map(StripeHttp, (http) => {
      const request = call(http);
      return PaymentIntentNS.PaymentIntents.of({
        create: (params) =>
          request(
            "POST",
            "/v1/payment_intents",
            {
              amount: params.amount,
              currency: params.currency,
              customer: params.customer,
              payment_method: params.paymentMethod,
              description: params.description,
              metadata: params.metadata,
            },
            decodePaymentIntent,
            params.idempotencyKey,
          ),
        retrieve: (id) =>
          request("GET", path`/v1/payment_intents/${id}`, undefined, decodePaymentIntent),
        update: (id, params) =>
          request(
            "POST",
            path`/v1/payment_intents/${id}`,
            { amount: params.amount, description: params.description, metadata: params.metadata },
            decodePaymentIntent,
          ),
        confirm: (id, params) =>
          request(
            "POST",
            path`/v1/payment_intents/${id}/confirm`,
            { payment_method: params?.paymentMethod },
            decodePaymentIntent,
            params?.idempotencyKey,
          ),
        cancel: (id) =>
          request("POST", path`/v1/payment_intents/${id}/cancel`, undefined, decodePaymentIntent),
        list: (params) =>
          request(
            "GET",
            "/v1/payment_intents",
            {
              limit: params?.limit,
              customer: params?.customer,
              starting_after: params?.startingAfter,
            },
            decodePaymentIntentPage,
          ),
      });
    }),
  );

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link SubscriptionNS.Subscriptions} capability. */
export const subscriptionsLayer: Layer.Layer<SubscriptionNS.Subscriptions, never, StripeHttp> =
  Layer.effect(
    SubscriptionNS.Subscriptions,
    Effect.map(StripeHttp, (http) => {
      const request = call(http);
      return SubscriptionNS.Subscriptions.of({
        create: (params) =>
          request(
            "POST",
            "/v1/subscriptions",
            {
              customer: params.customer,
              items: params.items.map((item) => ({ price: item.price, quantity: item.quantity })),
              cancel_at_period_end: params.cancelAtPeriodEnd,
              metadata: params.metadata,
            },
            decodeSubscription,
            params.idempotencyKey,
          ),
        retrieve: (id) =>
          request("GET", path`/v1/subscriptions/${id}`, undefined, decodeSubscription),
        update: (id, params) =>
          request(
            "POST",
            path`/v1/subscriptions/${id}`,
            { cancel_at_period_end: params.cancelAtPeriodEnd, metadata: params.metadata },
            decodeSubscription,
          ),
        cancel: (id) =>
          request("DELETE", path`/v1/subscriptions/${id}`, undefined, decodeSubscription),
        list: (params) =>
          request(
            "GET",
            "/v1/subscriptions",
            {
              limit: params?.limit,
              customer: params?.customer,
              status: params?.status,
              starting_after: params?.startingAfter,
            },
            decodeSubscriptionPage,
          ),
      });
    }),
  );

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link RefundNS.Refunds} capability. */
export const refundsLayer: Layer.Layer<RefundNS.Refunds, never, StripeHttp> = Layer.effect(
  RefundNS.Refunds,
  Effect.map(StripeHttp, (http) => {
    const request = call(http);
    return RefundNS.Refunds.of({
      create: (params) =>
        request(
          "POST",
          "/v1/refunds",
          {
            payment_intent: params.paymentIntent,
            charge: params.charge,
            amount: params.amount,
            // Passed through verbatim: Stripe validates `reason` against its
            // enum and answers an unknown value with an invalid-request error.
            reason: params.reason,
            metadata: params.metadata,
          },
          decodeRefund,
          params.idempotencyKey,
        ),
      retrieve: (id) => request("GET", path`/v1/refunds/${id}`, undefined, decodeRefund),
      update: (id, params) =>
        request("POST", path`/v1/refunds/${id}`, { metadata: params.metadata }, decodeRefund),
      list: (params) =>
        request(
          "GET",
          "/v1/refunds",
          {
            limit: params?.limit,
            payment_intent: params?.paymentIntent,
            charge: params?.charge,
            starting_after: params?.startingAfter,
          },
          decodeRefundPage,
        ),
    });
  }),
);

// ---------------------------------------------------------------------------
// CheckoutSessions
// ---------------------------------------------------------------------------

/**
 * Stripe implementation of the {@link CheckoutSessionNS.CheckoutSessions}
 * capability: a hosted Checkout session (`POST /v1/checkout/sessions`). Each
 * line item names a price, with a quantity of 1 unless given; no amount is
 * ever sent. `subscriptionMetadata` becomes `subscription_data[metadata]`, so
 * it lands on the subscription Stripe creates.
 */
export const checkoutSessionsLayer: Layer.Layer<
  CheckoutSessionNS.CheckoutSessions,
  never,
  StripeHttp
> = Layer.effect(
  CheckoutSessionNS.CheckoutSessions,
  Effect.map(StripeHttp, (http) => {
    const request = call(http);
    return CheckoutSessionNS.CheckoutSessions.of({
      create: (params) =>
        request(
          "POST",
          "/v1/checkout/sessions",
          {
            mode: params.mode,
            customer: params.customer,
            line_items: params.lineItems.map((item) => ({
              price: item.price,
              quantity: item.quantity ?? 1,
            })),
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            metadata: params.metadata,
            subscription_data:
              params.mode === "subscription" && params.subscriptionMetadata
                ? { metadata: params.subscriptionMetadata }
                : undefined,
          },
          decodeCheckoutSession,
          params.idempotencyKey,
        ),
    });
  }),
);

// ---------------------------------------------------------------------------
// BillingPortalSessions
// ---------------------------------------------------------------------------

/**
 * Stripe implementation of the {@link BillingPortalNS.BillingPortalSessions}
 * capability: a customer portal session (`POST /v1/billing_portal/sessions`),
 * using the account's default portal configuration.
 */
export const billingPortalSessionsLayer: Layer.Layer<
  BillingPortalNS.BillingPortalSessions,
  never,
  StripeHttp
> = Layer.effect(
  BillingPortalNS.BillingPortalSessions,
  Effect.map(StripeHttp, (http) => {
    const request = call(http);
    return BillingPortalNS.BillingPortalSessions.of({
      create: (params) =>
        request(
          "POST",
          "/v1/billing_portal/sessions",
          { customer: params.customer, return_url: params.returnUrl },
          decodeBillingPortalSession,
        ),
    });
  }),
);

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------

/**
 * Every neutral capability implemented on top of an existing
 * {@link StripeHttp} transport — the fetch one (`StripeHttp.layer`) or the
 * SDK one (`Stripe.layer`), provided separately.
 */
export const capabilities: Layer.Layer<
  | CustomerNS.Customers
  | ProductNS.Products
  | PriceNS.Prices
  | PaymentIntentNS.PaymentIntents
  | SubscriptionNS.Subscriptions
  | RefundNS.Refunds
  | CheckoutSessionNS.CheckoutSessions
  | BillingPortalNS.BillingPortalSessions,
  never,
  StripeHttp
> = Layer.mergeAll(
  customersLayer,
  productsLayer,
  pricesLayer,
  paymentIntentsLayer,
  subscriptionsLayer,
  refundsLayer,
  checkoutSessionsLayer,
  billingPortalSessionsLayer,
);

/**
 * Every neutral capability over the fetch transport, built from
 * configuration. Requires an `HttpClient` (`FetchHttpClient.layer`).
 */
export const layer = (
  config: StripeHttpConfig,
): Layer.Layer<Layer.Success<typeof capabilities>, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.provide(capabilities, httpLayer(config));

/**
 * Every neutral capability over the fetch transport, with the key read from
 * a configuration variable (`STRIPE_API_KEY` by default). Requires an
 * `HttpClient` (`FetchHttpClient.layer`).
 */
export const layerFromEnv = (
  envVar?: string,
): Layer.Layer<Layer.Success<typeof capabilities>, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.provide(capabilities, httpLayerFromEnv(envVar));

/**
 * Every neutral capability in the "not configured ≡ down" posture: the key is
 * read from a configuration variable (`STRIPE_API_KEY` by default) at CALL
 * time, never while the layer is built, so building it cannot fail and an
 * application without Stripe configured still starts. While the variable is
 * absent every capability call fails with `PaymentsUnavailable`; once it is
 * present, calls go over the fetch transport. Requires an `HttpClient`
 * (`FetchHttpClient.layer`). Each call reads the calling fiber's
 * `ConfigProvider` first, then falls back to the one the layer was built
 * under, so a provider attached with `Layer.provide` is honoured. See
 * `StripeHttp.layerConfig`.
 */
export const layerConfig = (
  options?: LayerConfigOptions,
): Layer.Layer<Layer.Success<typeof capabilities>, never, HttpClient.HttpClient> =>
  Layer.provide(capabilities, httpLayerConfig(options));
