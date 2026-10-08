import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as Customer from "../src/Customer.ts";
import type { StripeHttp } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";
import customer from "./fixtures/basil/customer.json" with { type: "json" };

const run = <A>(effect: Effect.Effect<A, unknown, StripeHttp>, respond: () => unknown) => {
  const http = fakeStripeHttp(respond);
  return { http, exit: Effect.runPromiseExit(Effect.provide(effect, http.layer)) };
};

/** The failures of an exit that must have failed, as values the test can inspect. */
const failuresOf = (exit: Exit.Exit<unknown, unknown>): ReadonlyArray<unknown> =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : reason))
    : [];

const deleted = { id: customer.id, object: "customer", deleted: true };

/** A list page of `data`, as Stripe answers `GET /v1/customers`. */
const page = (data: ReadonlyArray<unknown>) => ({
  object: "list",
  url: "/v1/customers",
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
  [
    "create",
    Customer.create({ email: "jane@example.com" }),
    { ...customer, created: "yesterday" },
    "customer",
  ],
  [
    "retrieve",
    Customer.retrieve("cus_QxAbCdEfGhIjKl"),
    { ...customer, created: "yesterday" },
    "customer",
  ],
  [
    "update",
    Customer.update("cus_QxAbCdEfGhIjKl", { name: "J" }),
    { ...customer, created: "yesterday" },
    "customer",
  ],
  // A delete answered with the live customer is not a deletion.
  ["del", Customer.del("cus_QxAbCdEfGhIjKl"), customer, "deleted customer"],
  ["list", Customer.list(), page([{}]), "customer list"],
];

describe("Customer (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil customer", async () => {
    const { http, exit } = run(
      Customer.create({ email: "jane@example.com", name: "Jane Smith" }),
      () => customer,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.id).toBe("cus_QxAbCdEfGhIjKl");
    expect(result.value.email).toBe("jane@example.com");
    expect(result.value.address?.country).toBe("AU");
    expect(result.value.tax_exempt).toBe("none");
    expect(result.value.invoice_settings?.default_payment_method).toBe(
      "pm_1SABcDEfGhIjKlMnOpQrStUv",
    );
    expect(http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/customers",
      params: { email: "jane@example.com", name: "Jane Smith" },
    });
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
        Object.entries(customer).filter(([key]) => key !== "livemode"),
      ),
      "a wrongly typed field": { ...customer, created: "yesterday" },
      "a non-object body": "<html>bad gateway</html>",
    };
    for (const [label, body] of Object.entries(cases)) {
      const { exit } = run(Customer.update("cus_QxAbCdEfGhIjKl", { name: "J" }), () => body);
      const result = await exit;
      expect(Exit.isFailure(result), label).toBe(true);
      const [failure] = failuresOf(result);
      expect(failure, label).toBeInstanceOf(PaymentProviderError);
      expect(failure).toMatchObject({
        provider: "stripe",
        message: "Stripe returned a malformed customer response",
      });
    }
  });

  it("retrieves a live or a deleted customer, and deletes to a deleted one", async () => {
    const live = await run(Customer.retrieve("cus_QxAbCdEfGhIjKl"), () => customer).exit;
    expect(Exit.isSuccess(live) && "created" in live.value).toBe(true);

    const gone = run(Customer.retrieve("cus_QxAbCdEfGhIjKl"), () => deleted);
    const goneResult = await gone.exit;
    expect(Exit.isSuccess(goneResult) && goneResult.value).toMatchObject({ deleted: true });
    expect(gone.http.calls[0]).toMatchObject({
      method: "GET",
      path: "/v1/customers/cus_QxAbCdEfGhIjKl",
    });

    const del = run(Customer.del("cus_a/b"), () => deleted);
    expect(Exit.isSuccess(await del.exit)).toBe(true);
    expect(del.http.calls[0]).toMatchObject({ method: "DELETE", path: "/v1/customers/cus_a%2Fb" });
  });

  it("decodes an expanded field as an open object and a later enumeration value as Other", async () => {
    const { exit } = run(
      Customer.retrieve("cus_QxAbCdEfGhIjKl", { expand: ["test_clock"] }),
      () => ({
        ...customer,
        test_clock: { id: "clock_1", object: "test_helpers.test_clock" },
        tax_exempt: "partial",
      }),
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result) || !("created" in result.value)) return;
    expect(result.value.test_clock).toMatchObject({ id: "clock_1" });
    expect(result.value.tax_exempt).toEqual({ _tag: "Other", raw: "partial" });
  });

  it("decodes a list page", async () => {
    const list = run(Customer.list({ limit: 1, created: { gte: 1759190000 } }), () =>
      page([customer]),
    );
    const result = await list.exit;
    expect(Exit.isSuccess(result) && result.value.data[0]?.id).toBe(customer.id);
    expect(list.http.calls[0]).toMatchObject({ method: "GET", path: "/v1/customers" });
  });

  it("accepts an optional parameter an exactOptionalPropertyTypes caller forwards as undefined", async () => {
    const email: string | undefined = undefined;
    const { http, exit } = run(
      Customer.create({ email, address: { city: "Brisbane", line1: undefined } }),
      () => customer,
    );
    expect(Exit.isSuccess(await exit)).toBe(true);
    expect(http.calls).toHaveLength(1);
  });

  it("exposes the generated schemas", () => {
    expect(Schema.decodeUnknownSync(Customer.Customer)(customer).object).toBe("customer");
    expect(Schema.decodeUnknownSync(Customer.DeletedCustomer)(deleted).deleted).toBe(true);
  });
});
