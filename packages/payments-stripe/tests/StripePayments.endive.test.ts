import { describe, it, expect } from "vite-plus/test";
import { Effect, Redacted, Schema } from "effect";
import { strict as strictValidation } from "@distilled.cloud/core/response-validation";
import * as Distilled from "@distilled.cloud/stripe/stripe";
import * as CheckoutSession from "@thomasfosterau/effect-payments/CheckoutSession";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as StripeSubscription from "../src/Subscription.ts";
import * as StripeHttp from "../src/StripeHttp.ts";
import * as StripePayments from "../src/StripePayments.ts";
import { jsonResponse, stubFetch, TEST_KEY } from "./support.ts";
import endiveCheckoutSession from "./fixtures/endive/checkout-session.json" with { type: "json" };
import endiveSubscription from "./fixtures/endive/subscription.json" with { type: "json" };
import basilSubscription from "./fixtures/basil/subscription.json" with { type: "json" };

/**
 * Responses at the API version every request now pins
 * (`DISTILLED_API_VERSION`, `2026-09-30.endive`, #146): the fixtures under
 * `fixtures/endive/` are the basil ones with the members dahlia and endive
 * add (endive: the subscription's `cancellation_details.feedback_option`,
 * `items.data[].current_trial` and
 * `trial_settings.end_behavior.billing_cycle_anchor`, the checkout session's
 * `allowed_payment_method_types`, all nullable), and
 * Distilled's own schemas decode them strictly, so they are the shape Stripe
 * answers the default layer with. The capability layers decode them, and a
 * resource module returns them as sent.
 */

const config = { apiKey: Redacted.make(TEST_KEY) };

/** Run `effect` on the default `StripePayments.layer`, answered with `body`. */
const onDefaultLayer = <A, E>(
  effect: Effect.Effect<A, E, Subscription.Subscriptions | CheckoutSession.CheckoutSessions>,
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

describe("endive fixtures", () => {
  it("the subscription is endive-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.Subscription, endiveSubscription)).not.toThrow();
  });

  it("the checkout session is endive-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.CheckoutSession, endiveCheckoutSession)).not.toThrow();
  });

  it("the basil subscription is not: the check would catch a stale fixture", () => {
    expect(() => strictly(Distilled.Subscription, basilSubscription)).toThrow();
  });
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
