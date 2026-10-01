import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as CheckoutSession from "../src/CheckoutSession.ts";
import { fakeStripeHttp } from "./support.ts";
import checkoutSession from "./fixtures/basil/checkout-session.json" with { type: "json" };

const run = <A>(
  effect: Effect.Effect<A, unknown, import("../src/StripeHttp.ts").StripeHttp>,
  respond: () => unknown,
) => {
  const http = fakeStripeHttp(respond);
  return { http, exit: Effect.runPromiseExit(Effect.provide(effect, http.layer)) };
};

/** The failure of an exit that must have failed, as a value the test can inspect. */
const failureOf = (exit: Exit.Exit<unknown, unknown>): unknown =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : reason))
    : undefined;

describe("CheckoutSession (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil session", async () => {
    const { http, exit } = run(
      CheckoutSession.create({
        mode: "subscription",
        success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://example.com/cancel",
        customer: "cus_QxAbCdEfGhIjKl",
        line_items: [{ price: "price_123", quantity: 1 }],
      }),
      () => checkoutSession,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.id).toBe("cs_test_a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ");
    expect(result.value.mode).toBe("subscription");
    expect(result.value.payment_status).toBe("unpaid");
    expect(result.value.url).toContain("https://checkout.stripe.com/");
    expect(result.value.metadata).toEqual({ order_id: "6735" });
    expect(http.calls).toHaveLength(1);
    expect(http.calls[0]).toMatchObject({ method: "POST", path: "/v1/checkout/sessions" });
  });

  it("decodes an expanded field as an open object and keeps fields the spec does not name", async () => {
    const expanded = {
      ...checkoutSession,
      customer: { id: "cus_QxAbCdEfGhIjKl", object: "customer", email: "jane@example.com" },
      a_field_added_after_the_pin: { nested: [1, 2, 3] },
    };
    const { exit } = run(
      CheckoutSession.retrieve("cs_test_123", { expand: ["customer"] }),
      () => expanded,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.customer).toMatchObject({ id: "cus_QxAbCdEfGhIjKl" });
    expect(result.value["a_field_added_after_the_pin"]).toEqual({ nested: [1, 2, 3] });
  });

  it("fails with PaymentProviderError on a malformed 2xx body", async () => {
    const cases = {
      "a missing required field": Object.fromEntries(
        Object.entries(checkoutSession).filter(([key]) => key !== "livemode"),
      ),
      "a wrongly typed field": { ...checkoutSession, expires_at: "soon" },
      "a value outside an enumeration": { ...checkoutSession, payment_status: "maybe" },
      "a non-object body": "<html>bad gateway</html>",
    };
    for (const [label, body] of Object.entries(cases)) {
      const { exit } = run(CheckoutSession.create({ mode: "payment" }), () => body);
      const result = await exit;
      expect(Exit.isFailure(result), label).toBe(true);
      const [failure] = failureOf(result) as ReadonlyArray<unknown>;
      expect(failure, label).toBeInstanceOf(PaymentProviderError);
      expect(failure).toMatchObject({
        provider: "stripe",
        message: "Stripe returned a malformed checkout session response",
      });
    }
  });

  it("decodes a list page and addresses expire and retrieve by encoded id", async () => {
    const list = run(CheckoutSession.list({ limit: 1 }), () => ({
      object: "list",
      url: "/v1/checkout/sessions",
      has_more: false,
      data: [checkoutSession],
    }));
    const page = await list.exit;
    expect(Exit.isSuccess(page) && page.value.data[0]?.id).toBe(checkoutSession.id);
    expect(list.http.calls[0]).toMatchObject({ method: "GET", path: "/v1/checkout/sessions" });

    const expire = run(CheckoutSession.expire("cs_test_a/b"), () => ({
      ...checkoutSession,
      status: "expired",
    }));
    const expired = await expire.exit;
    expect(Exit.isSuccess(expired) && expired.value.status).toBe("expired");
    expect(expire.http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/checkout/sessions/cs_test_a%2Fb/expire",
    });

    const badList = run(CheckoutSession.list(), () => ({
      object: "list",
      data: [{}],
      has_more: false,
      url: "/",
    }));
    expect(Exit.isFailure(await badList.exit)).toBe(true);
  });

  it("exposes the generated schema for the session", () => {
    expect(Schema.decodeUnknownSync(CheckoutSession.Session)(checkoutSession).object).toBe(
      "checkout.session",
    );
  });
});
