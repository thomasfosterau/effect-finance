import { describe, it, expect } from "vite-plus/test";
import { Effect, Redacted, Schema } from "effect";
import { strict as strictValidation } from "@distilled.cloud/core/response-validation";
import * as Distilled from "@distilled.cloud/stripe/stripe";
import * as CheckoutSession from "@thomasfosterau/effect-payments/CheckoutSession";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as StripeSubscription from "../src/Subscription.ts";
import * as StripeHttp from "../src/StripeHttp.ts";
import * as StripePayments from "../src/StripePayments.ts";
import { jsonResponse, stubFetch, TEST_KEY } from "./support.ts";
import endiveCheckoutSession from "./fixtures/endive/checkout-session.json" with { type: "json" };
import endivePaymentIntent from "./fixtures/endive/payment-intent.json" with { type: "json" };
import endiveProduct from "./fixtures/endive/product.json" with { type: "json" };
import endiveSubscription from "./fixtures/endive/subscription.json" with { type: "json" };
import basilProduct from "./fixtures/basil/product.json" with { type: "json" };
import basilSubscription from "./fixtures/basil/subscription.json" with { type: "json" };

/**
 * Responses at the API version every request now pins
 * (`DISTILLED_API_VERSION`, `2026-09-30.endive`, #146): the fixtures under
 * `fixtures/endive/` are the basil ones with the members endive's schemas
 * require added (among them the subscription's
 * `cancellation_details.feedback_option`, `items.data[].current_trial` and
 * `trial_settings.end_behavior.billing_cycle_anchor`, and the checkout
 * session's `allowed_payment_method_types`, all nullable; the product's
 * `tax_details`), or, for the payment intent, which has no basil fixture,
 * an endive response with every member Distilled's schema requires
 * (`allowed_payment_method_types` and `payment_record` among them), and
 * Distilled's own schemas decode them strictly, so they are the shape Stripe
 * answers the default layer with. The capability layers decode them, and a
 * resource module returns them as sent.
 */

const config = { apiKey: Redacted.make(TEST_KEY) };

/** Run `effect` on the default `StripePayments.layer`, answered with `body`. */
const onDefaultLayer = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    | Subscription.Subscriptions
    | CheckoutSession.CheckoutSessions
    | PaymentIntent.PaymentIntents
    | Product.Products
  >,
  body: unknown,
) => {
  const { http, calls } = stubFetch(() => jsonResponse(200, body));
  const result = Effect.runPromise(
    effect.pipe(Effect.provide(StripePayments.layer(config)), Effect.provide(http)),
  );
  return { result, calls };
};

/**
 * Decode `body` with one of Distilled's schemas, strictly. Distilled declares
 * them `Schema.Schema<T>`, which leaves the decoding services open; its
 * schemas need none.
 */
const strictly = (schema: Schema.Schema<unknown>, body: unknown): unknown =>
  // SAFETY: Distilled's generated schemas are plain structs, unions and
  // suspensions over `effect/Schema` built-ins, which need no services.
  Schema.decodeUnknownSync(schema as unknown as Schema.Codec<unknown, unknown>)(body);

/** `fixture` without its `member`: the mutation the strict check must catch. */
const without = (fixture: Readonly<Record<string, unknown>>, member: string) =>
  Object.fromEntries(Object.entries(fixture).filter(([key]) => key !== member));

describe("endive fixtures", () => {
  it("the subscription is endive-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.Subscription, endiveSubscription)).not.toThrow();
  });

  it("the checkout session is endive-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.CheckoutSession, endiveCheckoutSession)).not.toThrow();
  });

  it("the payment intent is endive-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.PaymentIntent, endivePaymentIntent)).not.toThrow();
  });

  it("the product is endive-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.Product, endiveProduct)).not.toThrow();
  });

  it("the basil subscription is not: the check would catch a stale fixture", () => {
    expect(() => strictly(Distilled.Subscription, basilSubscription)).toThrow();
  });

  it("the basil product is not: it lacks endive's `tax_details`", () => {
    expect(() => strictly(Distilled.Product, basilProduct)).toThrow(
      /Missing key[\s\S]*tax_details/,
    );
    expect(() => strictly(Distilled.Product, without(endiveProduct, "tax_details"))).toThrow(
      /Missing key[\s\S]*tax_details/,
    );
  });

  it.each(["allowed_payment_method_types", "payment_record"])(
    "a payment intent without endive's `%s` is not",
    (member) => {
      expect(() => strictly(Distilled.PaymentIntent, without(endivePaymentIntent, member))).toThrow(
        new RegExp(`Missing key[\\s\\S]*${member}`),
      );
    },
  );
});

describe("the default layer decodes endive responses", () => {
  it("maps an endive subscription", async () => {
    const { result, calls } = onDefaultLayer(
      Subscription.retrieve(endiveSubscription.id),
      endiveSubscription,
    );
    const subscription = await result;
    expect(subscription).toBeInstanceOf(Subscription.Subscription);
    expect(subscription).toMatchObject({
      id: endiveSubscription.id,
      customerId: endiveSubscription.customer,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: endiveSubscription.items.data[0]?.current_period_end,
    });
    expect(subscription.items.map((item) => item.priceId)).toEqual([
      endiveSubscription.items.data[0]?.price.id,
    ]);
    expect(calls[0]?.headers.get("stripe-version")).toBe(StripePayments.DISTILLED_API_VERSION);
  });

  it("maps an endive checkout session", async () => {
    const { result, calls } = onDefaultLayer(
      CheckoutSession.create({
        mode: "subscription",
        customer: "cus_QxAbCdEfGhIjKl",
        lineItems: [{ price: "price_monthly" }],
        successUrl: "https://example.test/success",
        cancelUrl: "https://example.test/cancel",
      }),
      endiveCheckoutSession,
    );
    const session = await result;
    expect(session).toBeInstanceOf(CheckoutSession.CheckoutSession);
    expect(session).toMatchObject({ id: endiveCheckoutSession.id, url: endiveCheckoutSession.url });
    expect(calls[0]?.headers.get("stripe-version")).toBe(StripePayments.DISTILLED_API_VERSION);
  });

  it("maps an endive payment intent", async () => {
    const { result, calls } = onDefaultLayer(
      PaymentIntent.retrieve(endivePaymentIntent.id),
      endivePaymentIntent,
    );
    const intent = await result;
    expect(intent).toBeInstanceOf(PaymentIntent.PaymentIntent);
    expect(intent).toMatchObject({
      id: endivePaymentIntent.id,
      amount: endivePaymentIntent.amount,
      currency: endivePaymentIntent.currency,
      status: "succeeded",
      customerId: endivePaymentIntent.customer,
      paymentMethodId: endivePaymentIntent.payment_method,
      clientSecret: endivePaymentIntent.client_secret,
      description: endivePaymentIntent.description,
      metadata: endivePaymentIntent.metadata,
      created: endivePaymentIntent.created,
    });
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.url.pathname).toBe(`/v1/payment_intents/${endivePaymentIntent.id}`);
    expect(calls[0]?.headers.get("stripe-version")).toBe(StripePayments.DISTILLED_API_VERSION);
  });

  it("maps an endive product", async () => {
    const { result, calls } = onDefaultLayer(Product.retrieve(endiveProduct.id), endiveProduct);
    const product = await result;
    expect(product).toBeInstanceOf(Product.Product);
    expect(product).toMatchObject({
      id: endiveProduct.id,
      name: endiveProduct.name,
      description: endiveProduct.description,
      active: true,
      metadata: endiveProduct.metadata,
      created: endiveProduct.created,
    });
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.url.pathname).toBe(`/v1/products/${endiveProduct.id}`);
    expect(calls[0]?.headers.get("stripe-version")).toBe(StripePayments.DISTILLED_API_VERSION);
  });

  it("returns an endive subscription from the resource module as sent, under strict validation too", async () => {
    const { http } = stubFetch(() => jsonResponse(200, endiveSubscription));
    const subscription = await Effect.runPromise(
      StripeSubscription.retrieve(endiveSubscription.id).pipe(
        Effect.provide(StripeHttp.layer(config)),
        Effect.provide(http),
        Effect.provide(strictValidation),
      ),
    );
    expect(subscription).toEqual(endiveSubscription);
  });
});
