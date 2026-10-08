import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as Invoice from "../src/Invoice.ts";
import type { StripeHttp } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";
import invoice from "./fixtures/basil/invoice.json" with { type: "json" };

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
  url: "/v1/invoices",
  has_more: false,
  data,
});

const deleted = { id: invoice.id, object: "invoice", deleted: true };

/** An invoice whose `total` is a string: well-formed JSON, wrong shape. */
const malformed = { ...invoice, total: "15.00" };

describe("Invoice (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil invoice", async () => {
    const { http, exit } = run(
      Invoice.create({ customer: "cus_QxAbCdEfGhIjKl", auto_advance: false }),
      () => invoice,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.id).toBe("in_1SABcDEfGhIjKlMnOpQrStUv");
    expect(result.value.status).toBe("paid");
    expect(result.value.billing_reason).toBe("subscription_create");
    expect(result.value.amount_paid).toBe(1500);
    expect(result.value.parent?.subscription_details?.subscription).toBe(
      "sub_1SABcDEfGhIjKlMnOpQrStUv",
    );
    const [line] = result.value.lines.data;
    expect(line?.pricing?.price_details?.price).toBe("price_1SABcDEfGhIjKlMnOpQrStUv");
    expect(line?.period.end).toBe(1761868400);
    expect(http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/invoices",
      params: { customer: "cus_QxAbCdEfGhIjKl", auto_advance: false },
    });
  });

  it.each<Operation>([
    ["create", () => Invoice.create({ customer: "cus_1" }), "invoice", malformed],
    ["retrieve", () => Invoice.retrieve("in_1"), "invoice", malformed],
    ["update", () => Invoice.update("in_1", { description: "Thanks" }), "invoice", malformed],
    // A delete answered with the live invoice is not a deletion.
    ["del", () => Invoice.del("in_1"), "deleted invoice", invoice],
    ["list", () => Invoice.list(), "invoice list", page([malformed])],
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
        Object.entries(invoice).filter(([key]) => key !== "lines"),
      ),
      "a wrongly typed field": malformed,
      "a non-object body": "<html>bad gateway</html>",
    };
    for (const [label, body] of Object.entries(cases)) {
      const [failure] = failuresOf(await run(Invoice.retrieve("in_1"), () => body).exit);
      expect(failure, label).toBeInstanceOf(PaymentProviderError);
    }
  });

  it("decodes an expanded field as an open object and a later enumeration value as Other", async () => {
    const { exit } = run(Invoice.retrieve("in_1", { expand: ["customer"] }), () => ({
      ...invoice,
      customer: { id: "cus_QxAbCdEfGhIjKl", object: "customer", email: "jane@example.com" },
      status: "settling",
      billing_reason: "subscription_renewal",
    }));
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.customer).toMatchObject({ email: "jane@example.com" });
    expect(result.value.status).toEqual({ _tag: "Other", raw: "settling" });
    expect(result.value.billing_reason).toEqual({ _tag: "Other", raw: "subscription_renewal" });
  });

  it("decodes a finalization error with the payment intent it carries as an open object", async () => {
    const { exit } = run(Invoice.retrieve("in_1"), () => ({
      ...invoice,
      status: "draft",
      last_finalization_error: {
        type: "invalid_request_error",
        code: "customer_tax_location_invalid",
        message: "The customer's location is not recognised.",
        payment_intent: { id: "pi_1", object: "payment_intent", status: "requires_payment_method" },
      },
    }));
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.last_finalization_error?.type).toBe("invalid_request_error");
    expect(result.value.last_finalization_error?.payment_intent).toMatchObject({ id: "pi_1" });
  });

  it("deletes a draft to a deleted invoice, by encoded id", async () => {
    const del = run(Invoice.del("in_a/b"), () => deleted);
    const result = await del.exit;
    expect(Exit.isSuccess(result) && result.value.deleted).toBe(true);
    expect(del.http.calls[0]).toMatchObject({ method: "DELETE", path: "/v1/invoices/in_a%2Fb" });
  });

  it("decodes a list page", async () => {
    const list = run(
      Invoice.list({ customer: "cus_QxAbCdEfGhIjKl", status: "paid", due_date: { lt: 1 } }),
      () => page([invoice]),
    );
    const result = await list.exit;
    expect(Exit.isSuccess(result) && result.value.data[0]?.id).toBe(invoice.id);
    expect(list.http.calls[0]).toMatchObject({
      method: "GET",
      path: "/v1/invoices",
      params: { customer: "cus_QxAbCdEfGhIjKl", status: "paid" },
    });
  });

  it("exposes the generated schemas", () => {
    expect(Schema.decodeUnknownSync(Invoice.Invoice)(invoice).object).toBe("invoice");
    expect(Schema.decodeUnknownSync(Invoice.DeletedInvoice)(deleted).deleted).toBe(true);
    expect(Schema.decodeUnknownSync(Invoice.InvoiceList)(page([])).data).toEqual([]);
  });
});
