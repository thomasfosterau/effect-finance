import { describe, it, expect } from "vite-plus/test";
import { Effect, Layer } from "effect";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";
import { AirwallexClient, type AirwallexRequest } from "../src/Airwallex.ts";
import * as AirwallexPayments from "../src/AirwallexPayments.ts";

/**
 * A fake Airwallex client. It records every request and returns whatever the
 * provided responder produces, so we can assert both the neutral mapping and
 * the request bodies the layers build — without any network.
 */
const makeFakeClient = (responder: (req: AirwallexRequest) => unknown) => {
  const calls: AirwallexRequest[] = [];
  const client = AirwallexClient.of({
    request: <A>(req: AirwallexRequest) => {
      calls.push(req);
      return Effect.succeed(responder(req) as A);
    },
  });
  return { client, calls };
};

const provide = (client: typeof AirwallexClient.Service) =>
  Layer.provide(AirwallexPayments.capabilities, Layer.succeed(AirwallexClient, client));

describe("AirwallexPayments capabilities", () => {
  it("maps a created customer, composing the name from first/last", async () => {
    const { client, calls } = makeFakeClient(() => ({
      id: "cus_aw",
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Smith",
      phone_number: "+15555550123",
      metadata: { tier: "pro" },
      created_at: "2026-01-01T00:00:00Z",
    }));

    const customer = await Effect.runPromise(
      Customer.create({ email: "jane@example.com", name: "Jane Smith" }).pipe(
        Effect.provide(provide(client)),
      ),
    );

    expect(customer).toBeInstanceOf(Customer.Customer);
    expect(customer.id).toBe("cus_aw");
    expect(customer.name).toBe("Jane Smith");
    expect(customer.phone).toBe("+15555550123");
    expect(customer.created).toBe(Math.floor(Date.parse("2026-01-01T00:00:00Z") / 1000));
    // Neutral `name` is sent as Airwallex `first_name`.
    expect(calls[0].body).toMatchObject({ first_name: "Jane Smith" });
  });

  it("converts minor units to major units on the way out, and back on the way in", async () => {
    const { client, calls } = makeFakeClient((req) => ({
      id: "int_aw",
      amount: (req.body as { amount: number }).amount,
      currency: "USD",
      status: "SUCCEEDED",
      customer_id: "cus_aw",
      created_at: "2026-01-02T00:00:00Z",
    }));

    const intent = await Effect.runPromise(
      PaymentIntent.create({ amount: 2000, currency: "usd" }).pipe(Effect.provide(provide(client))),
    );

    // 2000 minor units -> 20.00 major units on the request...
    expect(calls[0].body).toMatchObject({ amount: 20, currency: "usd" });
    // ...and 20.00 major units -> 2000 minor units on the response.
    expect(intent.amount).toBe(2000);
    expect(intent.status).toBe("succeeded");
    expect(intent.currency).toBe("usd");
  });

  it("treats zero-decimal currencies (JPY) as 1:1", async () => {
    const { client, calls } = makeFakeClient((req) => ({
      id: "int_jpy",
      amount: (req.body as { amount: number }).amount,
      currency: "JPY",
      status: "REQUIRES_PAYMENT_METHOD",
      created_at: "2026-01-02T00:00:00Z",
    }));

    const intent = await Effect.runPromise(
      PaymentIntent.create({ amount: 2000, currency: "jpy" }).pipe(Effect.provide(provide(client))),
    );

    expect(calls[0].body).toMatchObject({ amount: 2000 });
    expect(intent.amount).toBe(2000);
    expect(intent.status).toBe("requires_payment_method");
  });

  it("resolves the currency from the payment intent for a partial refund", async () => {
    const { client, calls } = makeFakeClient((req) => {
      if (req.method === "GET") {
        return { id: "int_aw", amount: 20, currency: "USD", status: "SUCCEEDED" };
      }
      return {
        id: "ref_aw",
        amount: (req.body as { amount: number }).amount,
        currency: "USD",
        status: "RECEIVED",
        payment_intent_id: "int_aw",
      };
    });

    const refund = await Effect.runPromise(
      Refund.create({ paymentIntent: "int_aw", amount: 500 }).pipe(Effect.provide(provide(client))),
    );

    // The layer looked up the intent (GET) then posted the refund (POST).
    expect(calls[0].method).toBe("GET");
    expect(calls[1].method).toBe("POST");
    // 500 minor units -> 5.00 major units in the request body.
    expect(calls[1].body).toMatchObject({ amount: 5, payment_intent_id: "int_aw" });
    expect(refund.amount).toBe(500);
    expect(refund.status).toBe("pending"); // RECEIVED -> pending
    expect(refund.paymentIntentId).toBe("int_aw");
  });

  it("fails neutrally for operations Airwallex does not support", async () => {
    const { client } = makeFakeClient(() => ({}));

    const delError = await Effect.runPromise(
      Customer.del("cus_aw").pipe(Effect.provide(provide(client)), Effect.flip),
    );
    expect(delError).toBeInstanceOf(PaymentInvalidRequestError);
    expect(delError.message).toContain("does not support");

    const updateError = await Effect.runPromise(
      PaymentIntent.update("int_aw", {}).pipe(Effect.provide(provide(client)), Effect.flip),
    );
    expect(updateError).toBeInstanceOf(PaymentInvalidRequestError);
  });
});
