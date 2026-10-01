import { describe, expect, expectTypeOf, it } from "vite-plus/test";
import { Effect, Schema } from "effect";
import * as IdempotencyKey from "@thomasfosterau/effect-payments/IdempotencyKey";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as CheckoutSession from "@thomasfosterau/effect-payments/CheckoutSession";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Price from "@thomasfosterau/effect-payments/Price";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as BillingPortal from "@thomasfosterau/effect-payments/BillingPortal";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";

const decodes = Schema.is(IdempotencyKey.IdempotencyKey);

describe("IdempotencyKey", () => {
  it("generates a valid, distinct key each time it runs", () => {
    const keys = Array.from({ length: 50 }, () => Effect.runSync(IdempotencyKey.generate));
    for (const key of keys) {
      expect(key).toMatch(/^[0-9a-f-]{36}$/);
      expect(decodes(key)).toBe(true);
    }
    expect(new Set(keys).size).toBe(50);
  });

  it("accepts 1 to 64 characters of A-Z a-z 0-9 _ -", () => {
    for (const ok of ["a", "order_42", "Order-42", "x".repeat(64), "0123456789_-ABCxyz"]) {
      expect(decodes(ok)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    for (const bad of [
      "",
      "x".repeat(65),
      "has space",
      "slash/slash",
      "dot.dot",
      "naïve",
      "a\nb",
    ]) {
      expect(decodes(bad)).toBe(false);
    }
  });

  it("validate passes none through, passes a good key, and refuses a bad one", async () => {
    expect(await Effect.runPromise(IdempotencyKey.validate(undefined))).toBeUndefined();
    expect(await Effect.runPromise(IdempotencyKey.validate("order-42"))).toBe("order-42");
    for (const bad of ["", "x".repeat(65), "bad key"]) {
      const error = await Effect.runPromise(Effect.flip(IdempotencyKey.validate(bad)));
      expect(error).toBeInstanceOf(PaymentInvalidRequestError);
      expect(error).toMatchObject({ param: "idempotencyKey" });
      // The refused value is not echoed back.
      if (bad !== "") expect(error.message).not.toContain(bad);
    }
  });

  it("make throws on a bad shape", () => {
    expect(() => IdempotencyKey.IdempotencyKey.make("bad key")).toThrow();
  });
});

describe("where the neutral key is accepted (type level)", () => {
  type Key = IdempotencyKey.IdempotencyKey | undefined;

  it("is an optional branded key on every create and confirm operation", () => {
    expectTypeOf<Customer.CreateParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    expectTypeOf<Product.CreateParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    expectTypeOf<Price.CreateParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    expectTypeOf<PaymentIntent.CreateParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    expectTypeOf<PaymentIntent.ConfirmParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    expectTypeOf<Subscription.CreateParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    expectTypeOf<Refund.CreateParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    expectTypeOf<CheckoutSession.CreateParams["idempotencyKey"]>().toEqualTypeOf<Key>();
    // Optional: a call without a key compiles.
    expectTypeOf<{ email: string }>().toExtend<Customer.CreateParams>();
    expectTypeOf<Record<never, never>>().toExtend<PaymentIntent.ConfirmParams>();
  });

  it("is not a plain string", () => {
    expectTypeOf<string>().not.toExtend<IdempotencyKey.IdempotencyKey>();
    expectTypeOf<{ idempotencyKey: string }>().not.toExtend<Customer.CreateParams>();
  });

  it("is not accepted by the cancel operations", () => {
    // `Subscription.cancel` and `PaymentIntent.cancel` take the id and nothing else:
    // PayPal cannot honour a key there, and a dropped key is worse than none.
    expectTypeOf(Subscription.cancel).parameters.toEqualTypeOf<[id: string]>();
    expectTypeOf(PaymentIntent.cancel).parameters.toEqualTypeOf<[id: string]>();
    expectTypeOf<Subscription.Subscriptions["Service"]["cancel"]>().parameters.toEqualTypeOf<
      [id: string]
    >();
    expectTypeOf<PaymentIntent.PaymentIntents["Service"]["cancel"]>().parameters.toEqualTypeOf<
      [id: string]
    >();
  });

  it("is not accepted by updates, which are set-semantics and repeatable", () => {
    expectTypeOf<"idempotencyKey">().not.toExtend<keyof Customer.UpdateParams>();
    expectTypeOf<"idempotencyKey">().not.toExtend<keyof Product.UpdateParams>();
    expectTypeOf<"idempotencyKey">().not.toExtend<keyof Price.UpdateParams>();
    expectTypeOf<"idempotencyKey">().not.toExtend<keyof PaymentIntent.UpdateParams>();
    expectTypeOf<"idempotencyKey">().not.toExtend<keyof Subscription.UpdateParams>();
    expectTypeOf<"idempotencyKey">().not.toExtend<keyof Refund.UpdateParams>();
  });

  it("is not accepted by the billing portal, which is not a repeat-sensitive write", () => {
    expectTypeOf<"idempotencyKey">().not.toExtend<keyof BillingPortal.CreateParams>();
  });
});
