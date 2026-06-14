import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as Price from "@thomasfosterau/effect-payments/Price";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";
import { PayPalClient, type PayPalRequest } from "../src/PayPal.js";
import * as PayPalPayments from "../src/PayPalPayments.js";

/**
 * A fake PayPal client: records every request and returns whatever `responder`
 * produces, so we can assert both the neutral mapping and the request bodies the
 * layers build — without any network.
 */
const makeFakeClient = (responder: (req: PayPalRequest) => unknown) => {
  const calls: PayPalRequest[] = [];
  const client = PayPalClient.of({
    request: <A>(req: PayPalRequest) => {
      calls.push(req);
      return Effect.succeed(responder(req) as A);
    },
  });
  return { client, calls };
};

const provide = (client: typeof PayPalClient.Service) =>
  Layer.provide(PayPalPayments.capabilities, Layer.succeed(PayPalClient, client));

describe("PayPalPayments capabilities", () => {
  it("maps a catalog product", async () => {
    const { client } = makeFakeClient(() => ({
      id: "PROD-1",
      name: "Premium",
      description: "Premium plan",
      create_time: "2026-01-01T00:00:00Z",
    }));

    const product = await Effect.runPromise(
      Product.create({ name: "Premium" }).pipe(Effect.provide(provide(client)))
    );
    expect(product).toBeInstanceOf(Product.Product);
    expect(product.id).toBe("PROD-1");
    expect(product.active).toBe(true);
    expect(product.created).toBe(Math.floor(Date.parse("2026-01-01T00:00:00Z") / 1000));
  });

  it("maps a billing plan to a price, formatting the amount as a decimal string", async () => {
    const { client, calls } = makeFakeClient((req) => ({
      id: "P-1",
      product_id: "PROD-1",
      status: "ACTIVE",
      billing_cycles: [
        {
          tenure_type: "REGULAR",
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          pricing_scheme: {
            fixed_price: (req.body as { billing_cycles: { pricing_scheme: { fixed_price: unknown } }[] })
              .billing_cycles[0].pricing_scheme.fixed_price,
          },
        },
      ],
      create_time: "2026-01-01T00:00:00Z",
    }));

    const price = await Effect.runPromise(
      Price.create({
        product: "PROD-1",
        currency: "usd",
        unitAmount: 1000,
        recurring: { interval: "month" },
      }).pipe(Effect.provide(provide(client)))
    );

    // 1000 minor units -> "10.00" major-unit string on the request...
    const body = calls[0].body as {
      billing_cycles: { pricing_scheme: { fixed_price: { value: string } } }[];
    };
    expect(body.billing_cycles[0].pricing_scheme.fixed_price.value).toBe("10.00");
    // ...and back to 1000 minor units on the response.
    expect(price.unitAmount).toBe(1000);
    expect(price.type).toBe("recurring");
    expect(price.recurring?.interval).toBe("month");
    expect(price.active).toBe(true);
  });

  it("rejects one-time prices (PayPal plans are recurring)", async () => {
    const { client } = makeFakeClient(() => ({}));
    const error = await Effect.runPromise(
      Price.create({ product: "PROD-1", currency: "usd", unitAmount: 1000 }).pipe(
        Effect.provide(provide(client)),
        Effect.flip
      )
    );
    expect(error).toBeInstanceOf(PaymentInvalidRequestError);
  });

  it("maps an order to a payment intent and converts the amount", async () => {
    const { client, calls } = makeFakeClient((req) => ({
      id: "ORD-1",
      status: "COMPLETED",
      purchase_units: [
        {
          amount: (req.body as { purchase_units: { amount: unknown }[] })
            .purchase_units[0].amount,
          custom_id: "cus_x",
        },
      ],
      create_time: "2026-01-02T00:00:00Z",
    }));

    const intent = await Effect.runPromise(
      PaymentIntent.create({
        amount: 2000,
        currency: "usd",
        customer: "cus_x",
      }).pipe(Effect.provide(provide(client)))
    );

    const body = calls[0].body as {
      purchase_units: { amount: { value: string } }[];
    };
    expect(body.purchase_units[0].amount.value).toBe("20.00");
    expect(intent.amount).toBe(2000);
    expect(intent.status).toBe("succeeded");
    expect(intent.customerId).toBe("cus_x");
  });

  it("captures an order when a payment intent is confirmed", async () => {
    const { client, calls } = makeFakeClient(() => ({
      id: "ORD-1",
      status: "COMPLETED",
      purchase_units: [{ amount: { currency_code: "USD", value: "20.00" } }],
    }));

    const intent = await Effect.runPromise(
      PaymentIntent.confirm("ORD-1").pipe(Effect.provide(provide(client)))
    );
    expect(calls[0].method).toBe("POST");
    expect(calls[0].path).toBe("/v2/checkout/orders/ORD-1/capture");
    expect(intent.status).toBe("succeeded");
  });

  it("maps a subscription, using the first item's price as the plan", async () => {
    const { client, calls } = makeFakeClient(() => ({
      id: "SUB-1",
      status: "ACTIVE",
      plan_id: "P-1",
      custom_id: "cus_x",
      quantity: "2",
      start_time: "2026-01-01T00:00:00Z",
      billing_info: { next_billing_time: "2026-02-01T00:00:00Z" },
      create_time: "2026-01-01T00:00:00Z",
    }));

    const subscription = await Effect.runPromise(
      Subscription.create({
        customer: "cus_x",
        items: [{ price: "P-1", quantity: 2 }],
      }).pipe(Effect.provide(provide(client)))
    );

    expect(calls[0].body).toMatchObject({
      plan_id: "P-1",
      quantity: "2",
      custom_id: "cus_x",
    });
    expect(subscription.status).toBe("active");
    expect(subscription.items[0].priceId).toBe("P-1");
    expect(subscription.items[0].quantity).toBe(2);
    expect(subscription.customerId).toBe("cus_x");
    expect(subscription.currentPeriodEnd).toBe(
      Math.floor(Date.parse("2026-02-01T00:00:00Z") / 1000)
    );
  });

  it("refunds a capture, resolving the currency for a partial amount", async () => {
    const { client, calls } = makeFakeClient((req) => {
      if (req.method === "GET") {
        return { id: "CAP-1", amount: { currency_code: "USD", value: "20.00" } };
      }
      return {
        id: "REF-1",
        status: "COMPLETED",
        amount: (req.body as { amount: { currency_code: string; value: string } })
          .amount,
      };
    });

    const refund = await Effect.runPromise(
      Refund.create({ charge: "CAP-1", amount: 500 }).pipe(
        Effect.provide(provide(client))
      )
    );

    // Looked up the capture (GET) to learn the currency, then posted the refund.
    expect(calls[0]).toMatchObject({
      method: "GET",
      path: "/v2/payments/captures/CAP-1",
    });
    expect(calls[1].path).toBe("/v2/payments/captures/CAP-1/refund");
    expect((calls[1].body as { amount: { value: string } }).amount.value).toBe("5.00");
    expect(refund.amount).toBe(500);
    expect(refund.status).toBe("succeeded");
  });

  it("resolves the capture id from an order when refunding a payment intent", async () => {
    const { client, calls } = makeFakeClient((req) => {
      if (req.path.startsWith("/v2/checkout/orders/")) {
        return {
          id: "ORD-1",
          status: "COMPLETED",
          purchase_units: [{ payments: { captures: [{ id: "CAP-2" }] } }],
        };
      }
      return { id: "REF-2", status: "PENDING", amount: { currency_code: "USD", value: "20.00" } };
    });

    const refund = await Effect.runPromise(
      Refund.create({ paymentIntent: "ORD-1" }).pipe(Effect.provide(provide(client)))
    );

    expect(calls[0].path).toBe("/v2/checkout/orders/ORD-1");
    expect(calls[1].path).toBe("/v2/payments/captures/CAP-2/refund");
    expect(refund.status).toBe("pending");
  });

  it("fails neutrally for operations PayPal does not support", async () => {
    const { client } = makeFakeClient(() => ({}));

    const listError = await Effect.runPromise(
      Subscription.list().pipe(Effect.provide(provide(client)), Effect.flip)
    );
    expect(listError).toBeInstanceOf(PaymentInvalidRequestError);

    const cancelError = await Effect.runPromise(
      PaymentIntent.cancel("ORD-1").pipe(Effect.provide(provide(client)), Effect.flip)
    );
    expect(cancelError).toBeInstanceOf(PaymentInvalidRequestError);
  });
});
