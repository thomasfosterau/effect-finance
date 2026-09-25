/**
 * A consumer's view of all four packages, imported through their EMITTED
 * declarations (`paths` in tsconfig.json points the package names at
 * `dist/*.d.ts`). Each block exercises the types a real consumer depends on,
 * so a declaration that degrades to `any` — or a subpath export whose `.d.ts`
 * the bundler dropped — fails here rather than in an application. Never
 * executed; type-checked only.
 */

import type { Effect, Layer } from "effect";
import type Stripe from "stripe";
import {
  money,
  type Money,
  type Page,
  type PaymentConfigError,
  type PaymentsError,
  type SignatureVerificationError,
} from "@thomasfosterau/effect-payments";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import type * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import type * as Price from "@thomasfosterau/effect-payments/Price";
import type * as Product from "@thomasfosterau/effect-payments/Product";
import type * as Refund from "@thomasfosterau/effect-payments/Refund";
import type * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";
import * as StripeCustomer from "@thomasfosterau/effect-payments-stripe/Customer";
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
import type { StripeService } from "@thomasfosterau/effect-payments-stripe/Stripe";
import * as PayPalPayments from "@thomasfosterau/effect-payments-paypal/PayPalPayments";
import * as AirwallexPayments from "@thomasfosterau/effect-payments-airwallex/AirwallexPayments";

/** A compile-time assertion: `T` must be exactly `true`. */
type Assert<T extends true> = T;
type Equals<A, B> =
  (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;

// ── core ──────────────────────────────────────────────────────────────────

export const created = Customer.create({ email: "reader@example.com" });
export const listed = Customer.list({ limit: 10 });
export const price: Money = money(2000, "usd");

// ── providers ─────────────────────────────────────────────────────────────

export const stripeLayer = StripePayments.layer({ apiKey: "sk_test_123" });
export const paypalLayer = PayPalPayments.layer({ clientId: "id", clientSecret: "secret" });
export const airwallexLayer = AirwallexPayments.layer({ clientId: "id", apiKey: "key" });
export const stripeCustomer = StripeCustomer.retrieve("cus_123");
export const event = Webhook.constructEvent("{}", "t=1,v1=sig", "whsec_123");

/**
 * Every compile-time assertion, exported so `noUnusedLocals` keeps them and a
 * failing one names itself in the error.
 */
export type Checks = [
  /** _createSucceeds */ Assert<Equals<Effect.Effect.Success<typeof created>, Customer.Customer>>,
  /** _createFails */ Assert<Equals<Effect.Effect.Error<typeof created>, PaymentsError>>,
  /** _createRequires */ Assert<Equals<Effect.Effect.Context<typeof created>, Customer.Customers>>,
  /** _listPages */ Assert<Equals<Effect.Effect.Success<typeof listed>, Page<Customer.Customer>>>,
  /** _stripeProvides */ Assert<
    Equals<
      Layer.Layer.Success<typeof stripeLayer>,
      | Customer.Customers
      | Product.Products
      | Price.Prices
      | PaymentIntent.PaymentIntents
      | Subscription.Subscriptions
      | Refund.Refunds
    >
  >,
  /** _stripeFailsWithConfig */ Assert<
    Equals<Layer.Layer.Error<typeof stripeLayer>, PaymentConfigError>
  >,
  /** _paypalProvidesRefunds */ Assert<
    Refund.Refunds extends Layer.Layer.Success<typeof paypalLayer> ? true : false
  >,
  /** _paypalHasNoCustomers */ Assert<
    Customer.Customers extends Layer.Layer.Success<typeof paypalLayer> ? false : true
  >,
  /** _airwallexProvidesCustomers */ Assert<
    Customer.Customers extends Layer.Layer.Success<typeof airwallexLayer> ? true : false
  >,
  /** _stripeResourceRequiresClient */ Assert<
    Equals<Effect.Effect.Context<typeof stripeCustomer>, StripeService>
  >,
  /** _webhookEvent */ Assert<Equals<Effect.Effect.Success<typeof event>, Stripe.Event>>,
  /** _webhookFails */ Assert<
    Equals<Effect.Effect.Error<typeof event>, SignatureVerificationError>
  >,
];
