import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as Product from "../src/Product.ts";
import type { StripeHttp } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";
import product from "./fixtures/basil/product.json" with { type: "json" };

const run = <A>(effect: Effect.Effect<A, unknown, StripeHttp>, respond: () => unknown) => {
  const http = fakeStripeHttp(respond);
  return { http, exit: Effect.runPromiseExit(Effect.provide(effect, http.layer)) };
};

/** The failures of an exit that must have failed, as values the test can inspect. */
const failuresOf = (exit: Exit.Exit<unknown, unknown>): ReadonlyArray<unknown> =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : reason))
    : [];

/** A list page of `data`, as Stripe answers `GET /v1/products`. */
const page = (data: ReadonlyArray<unknown>) => ({
  object: "list",
  url: "/v1/products",
  has_more: false,
  data,
});

/**
 * Every operation the module exports, each with a 2xx body it must refuse and
 * the response it names: removing any one decode fails its row.
 */
const malformedByOperation: ReadonlyArray<
  readonly [string, Effect.Effect<unknown, unknown, StripeHttp>, unknown, string]
> = [
  ["create", Product.create({ name: "Premium" }), { ...product, active: "yes" }, "product"],
  ["retrieve", Product.retrieve("prod_SxAbCdEfGhIjKl"), { ...product, active: "yes" }, "product"],
  [
    "update",
    Product.update("prod_SxAbCdEfGhIjKl", { active: false }),
    { ...product, active: "yes" },
    "product",
  ],
  // A delete answered with the live product is not a deletion.
  ["del", Product.del("prod_SxAbCdEfGhIjKl"), product, "deleted product"],
  ["list", Product.list(), page([{}]), "product list"],
];

describe("Product (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil product", async () => {
    const { http, exit } = run(
      Product.create({ name: "Premium", marketing_features: [{ name: "Priority support" }] }),
      () => product,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.id).toBe("prod_SxAbCdEfGhIjKl");
    expect(result.value.name).toBe("Premium");
    expect(result.value.default_price).toBe("price_1SABcDEfGhIjKlMnOpQrStUv");
    expect(result.value.marketing_features).toEqual([{ name: "Priority support" }]);
    // A field the pinned spec no longer names (`type`) is kept, not refused.
    expect(result.value["type"]).toBe("service");
    expect(http.calls[0]).toMatchObject({ method: "POST", path: "/v1/products" });
  });

  it.each(malformedByOperation)(
    "%s fails with PaymentProviderError on a malformed 2xx body",
    async (_operation, effect, body, what) => {
      const result = await run(effect, () => body).exit;
      expect(Exit.isFailure(result)).toBe(true);
      const [failure] = failuresOf(result);
      expect(failure).toBeInstanceOf(PaymentProviderError);
      expect(failure).toMatchObject({
        provider: "stripe",
        message: `Stripe returned a malformed ${what} response`,
      });
    },
  );

  it("fails with PaymentProviderError on each kind of malformed 2xx body", async () => {
    const cases = {
      "a missing required field": Object.fromEntries(
        Object.entries(product).filter(([key]) => key !== "name"),
      ),
      "a wrongly typed field": { ...product, active: "yes" },
      "a non-object body": "<html>bad gateway</html>",
    };
    for (const [label, body] of Object.entries(cases)) {
      const { exit } = run(Product.retrieve("prod_SxAbCdEfGhIjKl"), () => body);
      const result = await exit;
      expect(Exit.isFailure(result), label).toBe(true);
      const [failure] = failuresOf(result);
      expect(failure, label).toBeInstanceOf(PaymentProviderError);
      expect(failure).toMatchObject({
        provider: "stripe",
        message: "Stripe returned a malformed product response",
      });
    }
  });

  it("decodes an expanded default price as an open object", async () => {
    const { exit } = run(
      Product.update("prod_SxAbCdEfGhIjKl", { active: false, description: "" }),
      () => ({ ...product, active: false, default_price: { id: "price_1", object: "price" } }),
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.default_price).toMatchObject({ id: "price_1" });
  });

  it("deletes, lists and addresses a product by encoded id", async () => {
    const deleted = { id: product.id, object: "product", deleted: true };
    const del = run(Product.del("prod_a/b"), () => deleted);
    const delResult = await del.exit;
    expect(Exit.isSuccess(delResult) && delResult.value.deleted).toBe(true);
    expect(del.http.calls[0]).toMatchObject({ method: "DELETE", path: "/v1/products/prod_a%2Fb" });

    const list = run(Product.list({ active: true, limit: 1 }), () => page([product]));
    const listed = await list.exit;
    expect(Exit.isSuccess(listed) && listed.value.data[0]?.id).toBe(product.id);
    expect(list.http.calls[0]).toMatchObject({ method: "GET", path: "/v1/products" });
  });

  it("exposes the generated schema", () => {
    expect(Schema.decodeUnknownSync(Product.Product)(product).object).toBe("product");
  });
});
