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
import dahliaCheckoutSession from "./fixtures/dahlia/checkout-session.json" with { type: "json" };
import dahliaSubscription from "./fixtures/dahlia/subscription.json" with { type: "json" };
import basilSubscription from "./fixtures/basil/subscription.json" with { type: "json" };

/**
 * Responses at the API version every request now pins
 * (`DISTILLED_API_VERSION`, `2026-07-29.dahlia`, #146): the fixtures under
 * `fixtures/dahlia/` are the basil ones with the members dahlia adds, and
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

describe("dahlia fixtures", () => {
  it("the subscription is dahlia-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.Subscription, dahliaSubscription)).not.toThrow();
  });

  it("the checkout session is dahlia-shaped: Distilled's schema decodes it strictly", () => {
    expect(() => strictly(Distilled.CheckoutSession, dahliaCheckoutSession)).not.toThrow();
  });

  it("the basil subscription is not: the check would catch a stale fixture", () => {
    expect(() => strictly(Distilled.Subscription, basilSubscription)).toThrow();
  });
});

describe("the default layer decodes dahlia responses", () => {
  it("maps a dahlia subscription", async () => {
    const { result, calls } = onDefaultLayer(
      Subscription.retrieve(dahliaSubscription.id),
      dahliaSubscription,
    );
    const subscription = await result;
    expect(subscription).toBeInstanceOf(Subscription.Subscription);
    expect(subscription).toMatchObject({
      id: dahliaSubscription.id,
      customerId: dahliaSubscription.customer,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: dahliaSubscription.items.data[0]?.current_period_end,
    });
    expect(subscription.items.map((item) => item.priceId)).toEqual([
      dahliaSubscription.items.data[0]?.price.id,
    ]);
    expect(calls[0]?.headers.get("stripe-version")).toBe(StripePayments.DISTILLED_API_VERSION);
  });

  it("maps a dahlia checkout session", async () => {
    const { result, calls } = onDefaultLayer(
      CheckoutSession.create({
        mode: "subscription",
        customer: "cus_QxAbCdEfGhIjKl",
        lineItems: [{ price: "price_monthly" }],
        successUrl: "https://example.test/success",
        cancelUrl: "https://example.test/cancel",
      }),
      dahliaCheckoutSession,
    );
    const session = await result;
    expect(session).toBeInstanceOf(CheckoutSession.CheckoutSession);
    expect(session).toMatchObject({ id: dahliaCheckoutSession.id, url: dahliaCheckoutSession.url });
    expect(calls[0]?.headers.get("stripe-version")).toBe(StripePayments.DISTILLED_API_VERSION);
  });

  it("returns a dahlia subscription from the resource module as sent, under strict validation too", async () => {
    const { http } = stubFetch(() => jsonResponse(200, dahliaSubscription));
    const subscription = await Effect.runPromise(
      StripeSubscription.retrieve(dahliaSubscription.id).pipe(
        Effect.provide(StripeHttp.layer(config)),
        Effect.provide(http),
        Effect.provide(strictValidation),
      ),
    );
    expect(subscription).toEqual(dahliaSubscription);
  });
});
