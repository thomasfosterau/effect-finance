import { describe, it, expect } from "vite-plus/test";
import { Effect, Layer } from "effect";
import type Stripe from "stripe";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as Price from "@thomasfosterau/effect-payments/Price";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import { StripeService } from "../src/Stripe.ts";
import * as StripePayments from "../src/StripePayments.ts";

/**
 * A minimal fake Stripe client. Each method records the args it was called with
 * and returns a canned Stripe-shaped object so we can assert the neutral mapping
 * without touching the network.
 */
const makeFakeStripe = () => {
  const calls: Record<string, unknown> = {};

  const fake = {
    customers: {
      create: async (params: unknown) => {
        calls.customerCreate = params;
        return {
          id: "cus_1",
          email: "jane@example.com",
          name: "Jane",
          phone: null,
          description: null,
          metadata: { tier: "pro" },
          created: 1700000000,
          livemode: false,
        };
      },
      retrieve: async (id: string) => ({
        id,
        email: null,
        name: null,
        phone: null,
        description: null,
        metadata: {},
        created: 1,
        livemode: true,
      }),
      del: async (id: string) => ({ id, object: "customer", deleted: true }),
      list: async (params: unknown) => {
        calls.customerList = params;
        return {
          object: "list",
          has_more: true,
          data: [
            {
              id: "cus_2",
              email: null,
              name: null,
              phone: null,
              description: null,
              metadata: {},
              created: 2,
              livemode: false,
            },
          ],
        };
      },
    },
    products: {
      create: async (params: unknown) => {
        calls.productCreate = params;
        return {
          id: "prod_1",
          name: "Pro Plan",
          description: "desc",
          active: true,
          metadata: {},
          created: 3,
        };
      },
    },
    prices: {
      create: async (params: unknown) => {
        calls.priceCreate = params;
        return {
          id: "price_1",
          product: "prod_1",
          active: true,
          currency: "usd",
          unit_amount: 1999,
          type: "recurring",
          recurring: { interval: "month", interval_count: 3 },
          metadata: {},
          created: 4,
        };
      },
    },
    paymentIntents: {
      create: async (params: unknown) => {
        calls.paymentIntentCreate = params;
        return {
          id: "pi_1",
          amount: 2000,
          currency: "usd",
          status: "requires_confirmation",
          customer: "cus_1",
          payment_method: { id: "pm_1" },
          client_secret: "pi_1_secret",
          description: null,
          metadata: {},
          created: 5,
        };
      },
    },
    subscriptions: {
      create: async (params: unknown) => {
        calls.subscriptionCreate = params;
        return {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          items: {
            object: "list",
            data: [{ id: "si_1", price: { id: "price_1" }, quantity: 2 }],
          },
          current_period_start: 100,
          current_period_end: 200,
          cancel_at_period_end: false,
          metadata: {},
          created: 6,
        };
      },
    },
    refunds: {
      create: async (params: unknown) => {
        calls.refundCreate = params;
        return {
          id: "re_1",
          amount: 500,
          currency: "usd",
          status: "succeeded",
          payment_intent: "pi_1",
          charge: null,
          reason: "requested_by_customer",
          metadata: {},
          created: 7,
        };
      },
    },
  };

  return { fake: fake as unknown as Stripe, calls };
};

const provide = (stripe: Stripe) =>
  Layer.provide(StripePayments.capabilities, Layer.succeed(StripeService, stripe));

describe("StripePayments capabilities", () => {
  it("maps a created customer to the neutral entity", async () => {
    const { fake, calls } = makeFakeStripe();
    const result = await Effect.runPromise(
      Customer.create({ email: "jane@example.com", metadata: { tier: "pro" } }).pipe(
        Effect.provide(provide(fake)),
      ),
    );
    expect(result).toBeInstanceOf(Customer.Customer);
    expect(result.id).toBe("cus_1");
    expect(result.email).toBe("jane@example.com");
    expect(result.metadata.tier).toBe("pro");
    // Neutral params translated to Stripe's snake_case shape.
    expect(calls.customerCreate).toMatchObject({ email: "jane@example.com" });
  });

  it("maps a deleted customer", async () => {
    const { fake } = makeFakeStripe();
    const result = await Effect.runPromise(
      Customer.del("cus_1").pipe(Effect.provide(provide(fake))),
    );
    expect(result).toEqual({ id: "cus_1", deleted: true });
  });

  it("maps a customer list into a neutral page and forwards the cursor", async () => {
    const { fake, calls } = makeFakeStripe();
    const page = await Effect.runPromise(
      Customer.list({ limit: 1, startingAfter: "cus_0" }).pipe(Effect.provide(provide(fake))),
    );
    expect(page.hasMore).toBe(true);
    expect(page.data).toHaveLength(1);
    expect(page.data[0].id).toBe("cus_2");
    expect(calls.customerList).toMatchObject({
      limit: 1,
      starting_after: "cus_0",
    });
  });

  it("maps a product", async () => {
    const { fake } = makeFakeStripe();
    const product = await Effect.runPromise(
      Product.create({ name: "Pro Plan" }).pipe(Effect.provide(provide(fake))),
    );
    expect(product.id).toBe("prod_1");
    expect(product.name).toBe("Pro Plan");
  });

  it("maps a recurring price, including the schedule", async () => {
    const { fake, calls } = makeFakeStripe();
    const price = await Effect.runPromise(
      Price.create({
        product: "prod_1",
        currency: "usd",
        unitAmount: 1999,
        recurring: { interval: "month", intervalCount: 3 },
      }).pipe(Effect.provide(provide(fake))),
    );
    expect(price.unitAmount).toBe(1999);
    expect(price.type).toBe("recurring");
    expect(price.recurring?.interval).toBe("month");
    expect(price.recurring?.intervalCount).toBe(3);
    expect(calls.priceCreate).toMatchObject({
      product: "prod_1",
      unit_amount: 1999,
      recurring: { interval: "month", interval_count: 3 },
    });
  });

  it("maps a payment intent and resolves expanded references to ids", async () => {
    const { fake } = makeFakeStripe();
    const intent = await Effect.runPromise(
      PaymentIntent.create({ amount: 2000, currency: "usd" }).pipe(Effect.provide(provide(fake))),
    );
    expect(intent.status).toBe("requires_confirmation");
    expect(intent.customerId).toBe("cus_1");
    expect(intent.paymentMethodId).toBe("pm_1");
    expect(intent.clientSecret).toBe("pi_1_secret");
  });

  it("maps a subscription, flattening items and periods", async () => {
    const { fake } = makeFakeStripe();
    const subscription = await Effect.runPromise(
      Subscription.create({
        customer: "cus_1",
        items: [{ price: "price_1", quantity: 2 }],
      }).pipe(Effect.provide(provide(fake))),
    );
    expect(subscription.status).toBe("active");
    expect(subscription.items).toHaveLength(1);
    expect(subscription.items[0].priceId).toBe("price_1");
    expect(subscription.items[0].quantity).toBe(2);
    expect(subscription.currentPeriodStart).toBe(100);
    expect(subscription.currentPeriodEnd).toBe(200);
  });

  it("maps a refund", async () => {
    const { fake } = makeFakeStripe();
    const refund = await Effect.runPromise(
      Refund.create({ paymentIntent: "pi_1", amount: 500 }).pipe(Effect.provide(provide(fake))),
    );
    expect(refund.status).toBe("succeeded");
    expect(refund.paymentIntentId).toBe("pi_1");
    expect(refund.chargeId).toBeNull();
  });

  it("translates a thrown Stripe error into the neutral channel", async () => {
    const failing = {
      customers: {
        create: async () => {
          throw new Error("network down");
        },
      },
    } as unknown as Stripe;

    const error = await Effect.runPromise(
      Customer.create({ email: "x@example.com" }).pipe(
        Effect.provide(provide(failing)),
        Effect.flip,
      ),
    );
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error.message).toBe("network down");
  });
});
