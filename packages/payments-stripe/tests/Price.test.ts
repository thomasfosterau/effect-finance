import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as Price from "../src/Price.ts";
import type { StripeHttp } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";
import price from "./fixtures/basil/price.json" with { type: "json" };

const run = <A>(effect: Effect.Effect<A, unknown, StripeHttp>, respond: () => unknown) => {
  const http = fakeStripeHttp(respond);
  return { http, exit: Effect.runPromiseExit(Effect.provide(effect, http.layer)) };
};

/** The failures of an exit that must have failed, as values the test can inspect. */
const failuresOf = (exit: Exit.Exit<unknown, unknown>): ReadonlyArray<unknown> =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : reason))
    : [];

describe("Price (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil price", async () => {
    const { http, exit } = run(
      Price.create({
        currency: "aud",
        unit_amount: 1500,
        product: "prod_SxAbCdEfGhIjKl",
        recurring: { interval: "month" },
      }),
      () => price,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.id).toBe("price_1SABcDEfGhIjKlMnOpQrStUv");
    expect(result.value.type).toBe("recurring");
    expect(result.value.unit_amount).toBe(1500);
    expect(result.value.recurring?.interval).toBe("month");
    expect(result.value.product).toBe("prod_SxAbCdEfGhIjKl");
    expect(http.calls[0]).toMatchObject({ method: "POST", path: "/v1/prices" });
  });

  it("fails with PaymentProviderError on a malformed 2xx body", async () => {
    const cases = {
      "a missing required field": Object.fromEntries(
        Object.entries(price).filter(([key]) => key !== "currency"),
      ),
      "a wrongly typed field": { ...price, unit_amount: "1500" },
      "a non-object body": "<html>bad gateway</html>",
    };
    for (const [label, body] of Object.entries(cases)) {
      const { exit } = run(Price.update("price_1", { active: false }), () => body);
      const result = await exit;
      expect(Exit.isFailure(result), label).toBe(true);
      const [failure] = failuresOf(result);
      expect(failure, label).toBeInstanceOf(PaymentProviderError);
      expect(failure).toMatchObject({
        provider: "stripe",
        message: "Stripe returned a malformed price response",
      });
    }
  });

  it("decodes an enumeration value Stripe adds later as Other, and an expanded product", async () => {
    const { exit } = run(Price.retrieve("price_1", { expand: ["product"] }), () => ({
      ...price,
      type: "metered_plus",
      recurring: { ...price.recurring, interval: "fortnight" },
      product: { id: "prod_SxAbCdEfGhIjKl", object: "product", name: "Premium" },
    }));
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.type).toEqual({ _tag: "Other", raw: "metered_plus" });
    expect(result.value.recurring?.interval).toEqual({ _tag: "Other", raw: "fortnight" });
    expect(result.value.product).toMatchObject({ name: "Premium" });
    // A known value stays a bare string, and the `object` discriminator stays closed.
    expect(result.value.billing_scheme).toBe("per_unit");
    const [failure] = failuresOf(
      await run(Price.retrieve("price_1"), () => ({ ...price, object: "plan" })).exit,
    );
    expect(failure).toBeInstanceOf(PaymentProviderError);
  });

  it("decodes a list page and addresses a price by encoded id", async () => {
    const list = run(Price.list({ "recurring[interval]": "month", type: "recurring" }), () => ({
      object: "list",
      url: "/v1/prices",
      has_more: false,
      data: [price],
    }));
    const page = await list.exit;
    expect(Exit.isSuccess(page) && page.value.data[0]?.id).toBe(price.id);
    expect(list.http.calls[0]).toMatchObject({
      method: "GET",
      path: "/v1/prices",
      params: { "recurring[interval]": "month" },
    });

    const retrieve = run(Price.retrieve("price_a/b"), () => price);
    expect(Exit.isSuccess(await retrieve.exit)).toBe(true);
    expect(retrieve.http.calls[0]).toMatchObject({ method: "GET", path: "/v1/prices/price_a%2Fb" });

    const [failure] = failuresOf(
      await run(Price.list(), () => ({ object: "list", url: "/", has_more: false, data: [{}] }))
        .exit,
    );
    expect(failure).toMatchObject({ message: "Stripe returned a malformed price list response" });
  });

  it("exposes the generated schema", () => {
    expect(Schema.decodeUnknownSync(Price.Price)(price).object).toBe("price");
  });
});
