/**
 * PayPal implementations of the vendor-neutral payments capabilities.
 *
 * PayPal's billing suite and checkout APIs map onto the `Products`, `Prices`
 * (billing plans), `PaymentIntents` (orders), `Subscriptions` and `Refunds`
 * capabilities. PayPal has no first-class customer resource, so this provider
 * does not implement `Customers` at all — a program that only uses the
 * capabilities above is fully satisfied.
 *
 * Each capability is a `Layer` over Distilled's PayPal operations
 * (`@distilled.cloud/paypal`): neutral parameters are mapped onto the
 * operation's input, the call runs under this package's request policy (the
 * access token from the OAuth login and its cache, `Content-Type:
 * application/json` on every request, no retries, a per-request timeout,
 * failures mapped onto the neutral {@link PaymentsError} channel), and every
 * response is decoded with `Schema` before it is mapped onto a neutral entity.
 *
 * The per-capability layers and {@link capabilities} need Distilled's
 * `Credentials` (an access token and base URL) and an `HttpClient`. The
 * {@link layer} / {@link layerFromEnv} helpers log in with the client
 * credentials instead, so a program written against the neutral core is
 * satisfied by one `Effect.provide` plus an `HttpClient` (e.g.
 * `FetchHttpClient.layer`).
 *
 * Several individual operations have no PayPal equivalent (listing orders or
 * subscriptions, canceling an order, updating a subscription). Those fail with a
 * neutral {@link PaymentInvalidRequestError} rather than pretending to succeed.
 *
 * @module
 */

import { type Context, Effect, Layer, Predicate, type Redacted } from "effect";
import type { HttpClient } from "effect/http";
import type { Credentials } from "@distilled.cloud/paypal/Credentials";
import {
  activatePlan,
  cancelSubscription,
  createPlan,
  createSubscription,
  deactivatePlan,
  getPlan,
  getSubscription,
  listPlans,
} from "@distilled.cloud/paypal/billing_subscriptions_v1";
import {
  createProduct,
  getProduct,
  listProducts,
  patchProduct,
} from "@distilled.cloud/paypal/catalogs_products_v1";
import { captureOrder, createOrder, getOrder } from "@distilled.cloud/paypal/checkout_orders_v2";
import { getCapture, getRefund, refundCapture } from "@distilled.cloud/paypal/payments_payment_v2";
// The capability modules are imported by subpath, as namespaces: a bundler can
// then tell that the tags passed to the pure layer constructions below are
// side-effect free, and drop every capability (and the Distilled operations
// it calls) a program does not use.
import * as BillingPortalNS from "@thomasfosterau/effect-payments/BillingPortal";
import * as CheckoutSessionNS from "@thomasfosterau/effect-payments/CheckoutSession";
import * as IdempotencyKeyNS from "@thomasfosterau/effect-payments/IdempotencyKey";
import * as PaymentIntentNS from "@thomasfosterau/effect-payments/PaymentIntent";
import * as PriceNS from "@thomasfosterau/effect-payments/Price";
import * as ProductNS from "@thomasfosterau/effect-payments/Product";
import * as RefundNS from "@thomasfosterau/effect-payments/Refund";
import * as StubNS from "@thomasfosterau/effect-payments/Stub";
import * as SubscriptionNS from "@thomasfosterau/effect-payments/Subscription";
import {
  type PaymentConfigError,
  PaymentInvalidRequestError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { checkMinorUnits } from "@thomasfosterau/effect-payments/internal";
import {
  DistilledClient,
  layer as clientLayer,
  layerFromContext as clientLayerFromContext,
  layerFromEnv as clientLayerFromEnv,
  type Operation,
} from "./internal/distilled.js";
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
import { omitUndefined } from "./internal/omitUndefined.js";

/**
 * Which PayPal environment the capabilities talk to: `live` (real money) or
 * `sandbox` (PayPal's test environment).
 */
export type PayPalEnvironment = "live" | "sandbox";

/** The configuration {@link layer} logs in and sends every request with. */
export interface PayPalConfig {
  /** The REST app's client id. */
  readonly clientId: string;
  /** The client secret, kept `Redacted` so it never reaches a log line or an error. */
  readonly clientSecret: Redacted.Redacted<string>;
  /**
   * The environment to talk to, which selects the API base URL: `live`
   * (`https://api-m.paypal.com`) or `sandbox`
   * (`https://api-m.sandbox.paypal.com`). Defaults to `live`; `baseUrl`, when
   * set, wins over it. {@link layerFromEnv} always passes it (`PAYPAL_ENV` is
   * required there).
   */
  readonly environment?: PayPalEnvironment | undefined;
  /**
   * Override the API base URL (by default the {@link PayPalConfig.environment}'s
   * endpoint). Must be an absolute http(s) URL: an empty or relative value
   * fails {@link layer} with {@link PaymentConfigError} rather than falling
   * back to an environment's endpoint.
   */
  readonly baseUrl?: string | undefined;
  /**
   * How long the token login may take, in milliseconds, before it fails with
   * `PaymentNetworkError`. Defaults to 30 000; `Infinity` disables it, and
   * `0`, a negative number or `NaN` fails with `PaymentConfigError`. Only one
   * login is in flight at a time, so a login that never answers would otherwise stall every
   * request. Callers that arrive while a login is in flight share its
   * outcome, so each waits at most about one `loginTimeout`; the next call
   * after a failure logs in afresh (#65).
   */
  readonly loginTimeout?: number | undefined;
  /**
   * How long a resource request may take (response headers and body), in
   * milliseconds, before it fails with `PaymentNetworkError`. Defaults to
   * 80 000, the Stripe client's per-attempt timeout; `Infinity` disables it.
   * It does not include acquiring a token (see `loginTimeout`). A write that
   * times out has an unknown outcome — PayPal may have applied it — so retry
   * it only with the same `idempotencyKey` (#66).
   */
  readonly timeout?: number | undefined;
}

/**
 * The requirements of a capability layer: Distilled's `Credentials` (an
 * access token, as a `Redacted<string>` `apiKey`, and API origin, e.g.
 * `fromApiKey({ apiKey: Redacted.make(token), apiBaseUrl })` from
 * `@distilled.cloud/paypal/Credentials`) and an `HttpClient`.
 */
type Requirements = Credentials | HttpClient.HttpClient;

/** Fail with a neutral error for an operation PayPal does not support. */
const notSupported = (operation: string): Effect.Effect<never, PaymentsError> =>
  Effect.fail(
    new PaymentInvalidRequestError({
      message: `PayPal does not support ${operation}`,
    }),
  );

/**
 * Refuse an id that is not a non-empty string before anything is sent:
 * Distilled would splice `""` into the path (`/v1/catalogs/products/` is the
 * list), and an `undefined` from untyped code would leave the label in it.
 */
const checkId = (resource: string, id: string): Effect.Effect<void, PaymentInvalidRequestError> =>
  Predicate.isString(id) && id !== ""
    ? Effect.void
    : Effect.fail(
        new PaymentInvalidRequestError({
          message: `The ${resource} id must be a non-empty string`,
          param: "id",
        }),
      );

/**
 * One call through the client, its response decoded by `decode`. `id`, when
 * given, names the resource and the path id the input carries, checked first.
 */
const call =
  (client: DistilledClient["Service"]) =>
  <I, O, E, A>(
    operation: Operation<I, O, E>,
    input: I,
    decode: (body: unknown) => Effect.Effect<A, PaymentsError>,
    id?: readonly [resource: string, id: string] | undefined,
  ): Effect.Effect<A, PaymentsError> =>
    (id === undefined ? Effect.void : checkId(...id)).pipe(
      Effect.andThen(client.call(operation, input)),
      Effect.flatMap(decode),
    );

/** The request function a capability's implementation is written against. */
type Request = ReturnType<typeof call>;

/**
 * The neutral key of a create or confirm, checked, as the
 * `PayPal-Request-Id` of the write `send` makes with it. With no key none is
 * sent: a random id would deduplicate nothing, because a caller's retry
 * re-runs this and would draw another.
 */
const withRequestId = <A>(
  idempotencyKey: string | undefined,
  send: (payPalRequestId: string | undefined) => Effect.Effect<A, PaymentsError>,
): Effect.Effect<A, PaymentsError> =>
  Effect.flatMap(IdempotencyKeyNS.validate(idempotencyKey), send);

/** A capability layer over the client, given the service it builds from it. */
const over = <I, S>(
  tag: Context.Key<I, S>,
  build: (request: Request) => NoInfer<S>,
): Layer.Layer<I, never, DistilledClient> =>
  Layer.effect(
    tag,
    Effect.map(DistilledClient, (client) => build(call(client))),
  );

// ---------------------------------------------------------------------------
// Products (catalog products)
// ---------------------------------------------------------------------------

const products = /* @__PURE__ */ over(ProductNS.Products, (request) => {
  const retrieve = (id: string) =>
    request(getProduct, { product_id: id }, decodeProduct, ["product", id]);
  return {
    create: (params) =>
      withRequestId(params.idempotencyKey, (payPalRequestId) =>
        request(
          createProduct,
          omitUndefined({
            payPalRequestId,
            name: params.name,
            description: params.description,
            type: "SERVICE",
            category: "SOFTWARE",
          }),
          decodeProduct,
        ),
      ),
    retrieve,
    update: (id, params) =>
      // PayPal patches a product, then returns 204; re-read to map the result.
      params.description === undefined
        ? notSupported("updating a product without a description")
        : request(
            patchProduct,
            {
              product_id: id,
              body: [{ op: "replace", path: "/description", value: params.description }],
            },
            Effect.succeed,
            ["product", id],
          ).pipe(Effect.andThen(retrieve(id))),
    del: () => notSupported("deleting products"),
    list: (params) =>
      request(listProducts, omitUndefined({ page_size: params?.limit }), decodeProductPage),
  };
});

/**
 * PayPal Catalog Products as the {@link ProductNS.Products} capability. `del`
 * fails with {@link PaymentInvalidRequestError} (PayPal cannot delete a
 * product), and so does an `update` without a `description`.
 */
export const productsLayer: Layer.Layer<ProductNS.Products, never, Requirements> =
  /* @__PURE__ */ Layer.provide(products, clientLayerFromContext);

// ---------------------------------------------------------------------------
// Prices (billing plans)
// ---------------------------------------------------------------------------

const prices = /* @__PURE__ */ over(PriceNS.Prices, (request) => {
  const retrieve = (id: string) => request(getPlan, { id }, decodePrice, ["plan", id]);
  return {
    create: (params) => {
      // PayPal plans are inherently recurring.
      if (!params.recurring) {
        return notSupported("one-time prices (plans must be recurring)");
      }
      const recurring = params.recurring;
      return toMajorString(params.unitAmount, params.currency, "unitAmount").pipe(
        Effect.flatMap((value) =>
          withRequestId(params.idempotencyKey, (payPalRequestId) =>
            request(
              createPlan,
              omitUndefined({
                payPalRequestId,
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
                      fixed_price: { currency_code: params.currency.toUpperCase(), value },
                    },
                  },
                ],
                payment_preferences: { auto_bill_outstanding: true },
              }),
              decodePrice,
            ),
          ),
        ),
      );
    },
    retrieve,
    update: (id, params) => {
      // The only neutral field PayPal can act on is `active`, via
      // activate/deactivate; then re-read the plan to map the result.
      if (params.active === undefined) {
        return notSupported("updating a plan other than activating it");
      }
      return request(params.active ? activatePlan : deactivatePlan, { id }, Effect.succeed, [
        "plan",
        id,
      ]).pipe(Effect.andThen(retrieve(id)));
    },
    list: (params) =>
      request(
        listPlans,
        omitUndefined({ page_size: params?.limit, product_id: params?.product }),
        decodePricePage,
      ),
  };
});

/**
 * PayPal Billing Plans as the {@link PriceNS.Prices} capability. A one-time
 * price fails `create` with {@link PaymentInvalidRequestError} (plans are
 * recurring only), and `update` can only toggle `active` (activate /
 * deactivate); any other update fails the same way.
 */
export const pricesLayer: Layer.Layer<PriceNS.Prices, never, Requirements> =
  /* @__PURE__ */ Layer.provide(prices, clientLayerFromContext);

// ---------------------------------------------------------------------------
// PaymentIntents (orders)
// ---------------------------------------------------------------------------

const paymentIntents = /* @__PURE__ */ over(PaymentIntentNS.PaymentIntents, (request) => ({
  create: (params) =>
    toMajorString(params.amount, params.currency, "amount").pipe(
      Effect.flatMap((value) =>
        withRequestId(params.idempotencyKey, (payPalRequestId) =>
          request(
            createOrder,
            omitUndefined({
              payPalRequestId,
              intent: "CAPTURE",
              purchase_units: [
                omitUndefined({
                  amount: { currency_code: params.currency.toUpperCase(), value },
                  description: params.description,
                  custom_id: params.customer,
                }),
              ],
            }),
            decodePaymentIntent,
          ),
        ),
      ),
    ),
  retrieve: (id) => request(getOrder, { id }, decodePaymentIntent, ["order", id]),
  update: () => notSupported("updating orders"),
  // Confirming a neutral payment intent maps onto capturing a PayPal order.
  confirm: (id, params) =>
    withRequestId(params?.idempotencyKey, (payPalRequestId) =>
      request(captureOrder, omitUndefined({ id, payPalRequestId }), decodePaymentIntent, [
        "order",
        id,
      ]),
    ),
  cancel: () => notSupported("canceling orders"),
  list: () => notSupported("listing orders"),
}));

/**
 * PayPal Orders as the {@link PaymentIntentNS.PaymentIntents} capability;
 * `confirm` captures the order. `update`, `cancel` and `list` fail with
 * {@link PaymentInvalidRequestError}.
 */
export const paymentIntentsLayer: Layer.Layer<PaymentIntentNS.PaymentIntents, never, Requirements> =
  /* @__PURE__ */ Layer.provide(paymentIntents, clientLayerFromContext);

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

const subscriptions = /* @__PURE__ */ over(SubscriptionNS.Subscriptions, (request) => {
  const retrieve = (id: string) =>
    request(getSubscription, { id }, decodeSubscription, ["subscription", id]);
  return {
    // PayPal subscriptions bill against a single plan; the first neutral item's
    // price is used as the plan id, and the customer id is stored in custom_id.
    create: (params) => {
      const item = params.items[0];
      if (item === undefined) {
        return Effect.fail(
          new PaymentInvalidRequestError({
            message: "A PayPal subscription needs an item, whose price is its plan",
            param: "items",
          }),
        );
      }
      return withRequestId(params.idempotencyKey, (payPalRequestId) =>
        request(
          createSubscription,
          omitUndefined({
            payPalRequestId,
            plan_id: item.price,
            quantity: item.quantity ? String(item.quantity) : undefined,
            custom_id: params.customer,
          }),
          decodeSubscription,
        ),
      );
    },
    retrieve,
    update: () => notSupported("updating subscriptions"),
    cancel: (id) =>
      request(cancelSubscription, { id, reason: "Canceled via effect-payments" }, Effect.succeed, [
        "subscription",
        id,
      ]).pipe(Effect.andThen(retrieve(id))),
    list: () => notSupported("listing subscriptions"),
  };
});

/**
 * PayPal Subscriptions as the {@link SubscriptionNS.Subscriptions} capability.
 * `create` uses the first item's price as the plan (and fails with
 * {@link PaymentInvalidRequestError} without one); `update` and `list` fail
 * with {@link PaymentInvalidRequestError}.
 */
export const subscriptionsLayer: Layer.Layer<SubscriptionNS.Subscriptions, never, Requirements> =
  /* @__PURE__ */ Layer.provide(subscriptions, clientLayerFromContext);

// ---------------------------------------------------------------------------
// Refunds (capture refunds)
// ---------------------------------------------------------------------------

const refunds = /* @__PURE__ */ over(RefundNS.Refunds, (request) => ({
  create: (params) =>
    Effect.gen(function* () {
      // Refuse a bad key or partial amount before any lookup or refund is sent.
      const payPalRequestId = yield* IdempotencyKeyNS.validate(params.idempotencyKey);
      if (params.amount != null) yield* checkMinorUnits(params.amount, "amount");
      // PayPal refunds a capture. Accept a capture id directly (`charge`)
      // or resolve the first capture of an order (`paymentIntent`).
      let captureId = params.charge ?? null;
      if (!captureId && params.paymentIntent) {
        captureId = yield* request(getOrder, { id: params.paymentIntent }, decodeOrderCaptureId);
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
        const currency = yield* request(
          getCapture,
          { capture_id: captureId },
          decodeCaptureCurrency,
        );
        amount = {
          currency_code: currency,
          value: yield* toMajorString(params.amount, currency, "amount"),
        };
      }

      return yield* request(
        refundCapture,
        omitUndefined({ capture_id: captureId, payPalRequestId, amount }),
        decodeRefund,
      );
    }),
  retrieve: (id) => request(getRefund, { refund_id: id }, decodeRefund, ["refund", id]),
  update: () => notSupported("updating refunds"),
  list: () => notSupported("listing refunds"),
}));

/**
 * PayPal capture refunds as the {@link RefundNS.Refunds} capability: refund a
 * `charge` (a capture id) or a captured `paymentIntent`. `create` with no
 * capture to refund, `update` and `list` fail with
 * {@link PaymentInvalidRequestError}.
 */
export const refundsLayer: Layer.Layer<RefundNS.Refunds, never, Requirements> =
  /* @__PURE__ */ Layer.provide(refunds, clientLayerFromContext);

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
  /* @__PURE__ */ StubNS.checkoutSessions(/* @__PURE__ */ notSupported("hosted checkout sessions"));

/**
 * The {@link BillingPortalNS.BillingPortalSessions} capability for PayPal:
 * every call fails with {@link PaymentInvalidRequestError}, because this
 * provider has no hosted billing portal. Like {@link checkoutSessionsLayer}, it
 * is not part of {@link capabilities}.
 */
export const billingPortalSessionsLayer: Layer.Layer<BillingPortalNS.BillingPortalSessions> =
  /* @__PURE__ */ StubNS.billingPortalSessions(
    /* @__PURE__ */ notSupported("billing portal sessions"),
  );

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------

/** Every capability PayPal implements, over one client. */
const every = /* @__PURE__ */ Layer.mergeAll(
  products,
  prices,
  paymentIntents,
  subscriptions,
  refunds,
);

/**
 * The capabilities PayPal implements (`Products`, `Prices`, `PaymentIntents`,
 * `Subscriptions`, `Refunds`), over Distilled's `Credentials` and an
 * `HttpClient` in context: the credentials' access token is sent as it is,
 * with no login and no refresh, and each request times out after 80 s. Use
 * {@link layer} or {@link layerFromEnv} to log in with client credentials.
 */
export const capabilities: Layer.Layer<
  | ProductNS.Products
  | PriceNS.Prices
  | PaymentIntentNS.PaymentIntents
  | SubscriptionNS.Subscriptions
  | RefundNS.Refunds,
  never,
  Requirements
> = /* @__PURE__ */ Layer.provide(every, clientLayerFromContext);

/**
 * The PayPal capabilities in one layer, built from configuration: every call
 * authenticates with the access token of the OAuth client-credentials login
 * (cached, refreshed before expiry, and forgotten after a 401), at the
 * configured environment's endpoint or `baseUrl`. Fails with
 * `PaymentConfigError` for a missing id or secret, a bad `baseUrl` or a bad
 * timeout. Requires an `HttpClient` (`FetchHttpClient.layer`).
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Product from "@thomasfosterau/effect-payments/Product";
 * import * as PayPalPayments from "@thomasfosterau/effect-payments-paypal/PayPalPayments";
 *
 * const program = Product.create({ name: "Premium" });
 *
 * const layer = PayPalPayments.layer({
 *   clientId: "...",
 *   clientSecret: Redacted.make("..."),
 * }).pipe(Layer.provide(FetchHttpClient.layer));
 * // Calls PayPal when invoked, so it needs real credentials.
 * const run = () => Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */
export const layer = (
  config: PayPalConfig,
): Layer.Layer<Layer.Success<typeof capabilities>, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.provide(every, clientLayer(config));

/**
 * The PayPal capabilities in one layer, with the configuration read from
 * environment variables (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, the
 * required `PAYPAL_ENV` of `live` or `sandbox`, and the optional
 * `PAYPAL_BASE_URL` override, which wins over `PAYPAL_ENV`'s endpoint). A
 * missing or misspelt `PAYPAL_ENV` fails with `PaymentConfigError` instead of
 * selecting live, and an empty variable counts as unset (Effect rc.118 reads
 * an empty string as missing). Requires an
 * `HttpClient` (`FetchHttpClient.layer`).
 */
export const layerFromEnv = (
  clientIdVar = "PAYPAL_CLIENT_ID",
  clientSecretVar = "PAYPAL_CLIENT_SECRET",
): Layer.Layer<Layer.Success<typeof capabilities>, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.provide(every, clientLayerFromEnv(clientIdVar, clientSecretVar));
