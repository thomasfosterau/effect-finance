import { describe, it, expect } from "vite-plus/test";
import { Effect, Layer, Redacted } from "effect";
import * as CheckoutSession from "@thomasfosterau/effect-payments/CheckoutSession";
import * as BillingPortal from "@thomasfosterau/effect-payments/BillingPortal";
import { PaymentInvalidRequestError, PaymentProviderError } from "@thomasfosterau/effect-payments";
import type { StripeRequest } from "../src/StripeHttp.ts";
import * as StripePayments from "../src/StripePayments.ts";
import { fakeStripeHttp, jsonResponse, stubFetch, withTestClock } from "./support.ts";

/**
 * The hosted-page capabilities (#40): Checkout and the Billing Portal. The
 * behavioural spec is gardeneria's `createCheckoutSession` → URL and
 * `createPortalSession`: a price id (never an amount) with quantity 1, the
 * account id carried as subscription metadata, the return URL forwarded, and a
 * 2xx with no URL a failure rather than an invented redirect.
 */

const checkout: CheckoutSession.CreateParams = {
  mode: "subscription",
  customer: "cus_1",
  lineItems: [{ price: "price_monthly" }],
  successUrl: "https://example.test/account/billing?checkout=success",
  cancelUrl: "https://example.test/pricing",
  subscriptionMetadata: { user_id: "user-1" },
};

const portal: BillingPortal.CreateParams = {
  customer: "cus_1",
  returnUrl: "https://example.test/account/billing",
};

const keyOf = (request: StripeRequest) => `${request.method} ${request.path}`;

/** Run `effect` against the capabilities over a fake transport answering from `answers`. */
const run = <A, E>(
  effect: Effect.Effect<A, E, Layer.Success<typeof StripePayments.capabilities>>,
  answers: Record<string, unknown>,
) => {
  const fake = fakeStripeHttp((request) => answers[keyOf(request)]);
  return {
    calls: fake.calls,
    result: Effect.runPromise(
      effect.pipe(Effect.provide(StripePayments.capabilities), Effect.provide(fake.layer)),
    ),
  };
};

describe("StripePayments checkoutSessionsLayer", () => {
  it("creates a hosted Checkout session and returns its URL", async () => {
    const { result, calls } = run(CheckoutSession.create(checkout), {
      "POST /v1/checkout/sessions": {
        id: "cs_1",
        object: "checkout.session",
        url: "https://checkout.stripe.com/c/pay/cs_1",
      },
    });
    const session = await result;
    expect(session).toBeInstanceOf(CheckoutSession.CheckoutSession);
    expect(session.id).toBe("cs_1");
    expect(session.url).toBe("https://checkout.stripe.com/c/pay/cs_1");
    expect(calls[0]).toEqual({
      method: "POST",
      path: "/v1/checkout/sessions",
      params: {
        mode: "subscription",
        customer: "cus_1",
        line_items: [{ price: "price_monthly", quantity: 1 }],
        success_url: "https://example.test/account/billing?checkout=success",
        cancel_url: "https://example.test/pricing",
        metadata: undefined,
        subscription_data: { metadata: { user_id: "user-1" } },
      },
    });
  });

  it("forwards explicit quantities and session metadata, and omits subscription data when absent", async () => {
    const { result, calls } = run(
      CheckoutSession.create({
        mode: "payment",
        lineItems: [{ price: "price_a", quantity: 3 }, { price: "price_b" }],
        successUrl: "https://example.test/ok",
        cancelUrl: "https://example.test/no",
        metadata: { order: "o-1" },
      }),
      { "POST /v1/checkout/sessions": { id: "cs_2", url: "https://checkout.stripe.com/cs_2" } },
    );
    await result;
    expect(calls[0]?.params).toMatchObject({
      mode: "payment",
      customer: undefined,
      line_items: [
        { price: "price_a", quantity: 3 },
        { price: "price_b", quantity: 1 },
      ],
      metadata: { order: "o-1" },
      subscription_data: undefined,
    });
  });

  it.each([{ id: "cs_1" }, { id: "cs_1", url: null }])(
    "fails rather than inventing a URL when a 2xx carries none (%o)",
    async (body) => {
      const error = await run(Effect.flip(CheckoutSession.create(checkout)), {
        "POST /v1/checkout/sessions": body,
      }).result;
      expect(error).toBeInstanceOf(PaymentProviderError);
      expect(error.message).toBe("Stripe returned a malformed checkout session response");
    },
  );

  it("passes a Stripe rejection through the neutral channel", async () => {
    const error = await run(Effect.flip(CheckoutSession.create(checkout)), {
      "POST /v1/checkout/sessions": Effect.fail(
        new PaymentInvalidRequestError({ message: "No such price: 'price_monthly'" }),
      ),
    }).result;
    expect(error).toBeInstanceOf(PaymentInvalidRequestError);
    expect(error.message).toContain("No such price");
  });
});

describe("StripePayments billingPortalSessionsLayer", () => {
  it("creates a portal session for the customer and returns its URL", async () => {
    const { result, calls } = run(BillingPortal.create(portal), {
      "POST /v1/billing_portal/sessions": {
        id: "bps_1",
        object: "billing_portal.session",
        url: "https://billing.stripe.com/p/session/bps_1",
      },
    });
    const session = await result;
    expect(session).toBeInstanceOf(BillingPortal.BillingPortalSession);
    expect(session.id).toBe("bps_1");
    expect(session.url).toBe("https://billing.stripe.com/p/session/bps_1");
    expect(calls[0]).toEqual({
      method: "POST",
      path: "/v1/billing_portal/sessions",
      params: { customer: "cus_1", return_url: "https://example.test/account/billing" },
    });
  });

  it("fails rather than inventing a URL when a 2xx carries none", async () => {
    const error = await run(Effect.flip(BillingPortal.create(portal)), {
      "POST /v1/billing_portal/sessions": { id: "bps_1" },
    }).result;
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error.message).toBe("Stripe returned a malformed billing portal session response");
  });
});

describe("hosted sessions over the fetch transport", () => {
  /** `StripePayments.layer` over a stubbed `fetch` answering `body` to every request. */
  const wire = (body: unknown) => {
    const { http, calls } = stubFetch(() => jsonResponse(200, body));
    const layer = StripePayments.layer({ apiKey: Redacted.make("sk_test_not_real") }).pipe(
      Layer.provide(http),
    );
    return { layer, calls };
  };

  it("form-encodes a checkout the way Stripe expects, with no amount", async () => {
    const { layer, calls } = wire({ id: "cs_1", url: "https://checkout.stripe.com/cs_1" });
    const session = await Effect.runPromise(
      withTestClock(CheckoutSession.create(checkout).pipe(Effect.provide(layer))),
    );
    expect(session.url).toBe("https://checkout.stripe.com/cs_1");
    const call = calls[0];
    expect(call?.method).toBe("POST");
    expect(call?.url.href).toBe("https://api.stripe.com/v1/checkout/sessions");
    const form = new URLSearchParams(call?.body);
    expect(form.get("mode")).toBe("subscription");
    expect(form.get("customer")).toBe("cus_1");
    expect(form.get("line_items[0][price]")).toBe("price_monthly");
    expect(form.get("line_items[0][quantity]")).toBe("1");
    expect(form.get("success_url")).toBe(checkout.successUrl);
    expect(form.get("cancel_url")).toBe(checkout.cancelUrl);
    expect(form.get("subscription_data[metadata][user_id]")).toBe("user-1");
    expect([...form.keys()].some((key) => key.includes("amount"))).toBe(false);
  });

  it("form-encodes a portal session", async () => {
    const { layer, calls } = wire({ id: "bps_1", url: "https://billing.stripe.com/bps_1" });
    const session = await Effect.runPromise(
      withTestClock(BillingPortal.create(portal).pipe(Effect.provide(layer))),
    );
    expect(session.url).toBe("https://billing.stripe.com/bps_1");
    expect(calls[0]?.url.href).toBe("https://api.stripe.com/v1/billing_portal/sessions");
    const form = new URLSearchParams(calls[0]?.body);
    expect(form.get("customer")).toBe("cus_1");
    expect(form.get("return_url")).toBe(portal.returnUrl);
  });
});
