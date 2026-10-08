import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as Subscription from "../src/Subscription.ts";
import type { StripeHttp } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";
import subscription from "./fixtures/basil/subscription.json" with { type: "json" };

const run = <A>(effect: Effect.Effect<A, unknown, StripeHttp>, respond: () => unknown) => {
  const http = fakeStripeHttp(respond);
  return { http, exit: Effect.runPromiseExit(Effect.provide(effect, http.layer)) };
};

/** The failures of an exit that must have failed, as values the test can inspect. */
const failuresOf = (exit: Exit.Exit<unknown, unknown>): ReadonlyArray<unknown> =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : reason))
    : [];

/** One operation of the module: its name, a call, what it decodes and a malformed answer. */
type Operation = readonly [
  name: string,
  call: () => Effect.Effect<unknown, unknown, StripeHttp>,
  what: string,
  body: unknown,
];

const page = (data: ReadonlyArray<unknown>) => ({
  object: "list",
  url: "/v1/subscriptions",
  has_more: false,
  data,
});

/** A subscription whose `status` is not a string: well-formed JSON, wrong shape. */
const malformed = { ...subscription, status: 42 };

describe("Subscription (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil subscription", async () => {
    const { http, exit } = run(
      Subscription.create({
        customer: "cus_QxAbCdEfGhIjKl",
        items: [{ price: "price_1SABcDEfGhIjKlMnOpQrStUv", quantity: 1 }],
        payment_behavior: "default_incomplete",
      }),
      () => subscription,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.id).toBe("sub_1SABcDEfGhIjKlMnOpQrStUv");
    expect(result.value.status).toBe("active");
    expect(result.value.customer).toBe("cus_QxAbCdEfGhIjKl");
    expect(result.value.latest_invoice).toBe("in_1SABcDEfGhIjKlMnOpQrStUv");
    const [item] = result.value.items.data;
    expect(item?.current_period_end).toBe(1761868400);
    // A subscription item carries its price in full, not as an id.
    expect(item?.price.unit_amount).toBe(1500);
    expect(http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/subscriptions",
      params: { customer: "cus_QxAbCdEfGhIjKl" },
    });
  });

  it.each<Operation>([
    ["create", () => Subscription.create({ customer: "cus_1" }), "subscription", malformed],
    ["retrieve", () => Subscription.retrieve("sub_1"), "subscription", malformed],
    [
      "update",
      () => Subscription.update("sub_1", { cancel_at_period_end: true }),
      "subscription",
      malformed,
    ],
    ["cancel", () => Subscription.cancel("sub_1"), "subscription", malformed],
    ["list", () => Subscription.list(), "subscription list", page([malformed])],
  ])(
    "%s fails with PaymentProviderError on a malformed 2xx body",
    async (_name, operation, what, body) => {
      const [failure] = failuresOf(await run(operation(), () => body).exit);
      expect(failure).toBeInstanceOf(PaymentProviderError);
      expect(failure).toMatchObject({
        provider: "stripe",
        message: `Stripe returned a malformed ${what} response`,
      });
    },
  );

  it("fails with PaymentProviderError on each kind of malformed body", async () => {
    const cases = {
      "a missing required field": Object.fromEntries(
        Object.entries(subscription).filter(([key]) => key !== "items"),
      ),
      "a wrongly typed field": { ...subscription, created: "yesterday" },
      "a non-object body": "<html>bad gateway</html>",
    };
    for (const [label, body] of Object.entries(cases)) {
      const [failure] = failuresOf(await run(Subscription.retrieve("sub_1"), () => body).exit);
      expect(failure, label).toBeInstanceOf(PaymentProviderError);
    }
  });

  it("decodes an expanded field as an open object and a later enumeration value as Other", async () => {
    const { exit } = run(
      Subscription.retrieve("sub_1SABcDEfGhIjKlMnOpQrStUv", { expand: ["latest_invoice"] }),
      () => ({
        ...subscription,
        latest_invoice: { id: "in_1", object: "invoice", status: "open" },
        status: "suspended",
      }),
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.latest_invoice).toMatchObject({ id: "in_1" });
    expect(result.value.status).toEqual({ _tag: "Other", raw: "suspended" });
    // A known value stays a bare string, and the `object` discriminator stays closed.
    expect(result.value.collection_method).toBe("charge_automatically");
    const [failure] = failuresOf(
      await run(Subscription.retrieve("sub_1"), () => ({ ...subscription, object: "invoice" }))
        .exit,
    );
    expect(failure).toBeInstanceOf(PaymentProviderError);
  });

  it("cancels with DELETE and its params, answered with the canceled subscription", async () => {
    const canceled = { ...subscription, status: "canceled", canceled_at: 1759200000 };
    const { http, exit } = run(
      Subscription.cancel("sub_a/b", { invoice_now: true, prorate: true }),
      () => canceled,
    );
    const result = await exit;
    expect(Exit.isSuccess(result) && result.value.status).toBe("canceled");
    expect(http.calls[0]).toMatchObject({
      method: "DELETE",
      path: "/v1/subscriptions/sub_a%2Fb",
      params: { invoice_now: true, prorate: true },
    });
  });

  it("decodes a list page, with a deepObject filter as a flat bracketed key", async () => {
    const list = run(
      Subscription.list({
        "automatic_tax[enabled]": false,
        status: "active",
        current_period_end: { gte: 1759190000 },
      }),
      () => page([subscription]),
    );
    const result = await list.exit;
    expect(Exit.isSuccess(result) && result.value.data[0]?.id).toBe(subscription.id);
    expect(list.http.calls[0]).toMatchObject({
      method: "GET",
      path: "/v1/subscriptions",
      params: { "automatic_tax[enabled]": false, status: "active" },
    });
  });

  it("exposes the generated schemas", () => {
    expect(Schema.decodeUnknownSync(Subscription.Subscription)(subscription).object).toBe(
      "subscription",
    );
    expect(Schema.decodeUnknownSync(Subscription.SubscriptionList)(page([])).data).toEqual([]);
  });
});
