/**
 * A consumer's view of all four packages, imported through their EMITTED
 * declarations (`paths` in tsconfig.json points the package names at
 * `dist/*.d.ts`). Each block exercises the types a real consumer depends on,
 * so a declaration that degrades to `any` — or a subpath export whose `.d.ts`
 * the bundler dropped — fails here rather than in an application. Never
 * executed; type-checked only.
 */

import { type Effect, type Layer, Redacted } from "effect";
import type { HttpClient } from "effect/http";
import type Stripe from "stripe";
import {
  money,
  type Money,
  type Page,
  type PaymentConfigError,
  type PaymentsError,
  type PaymentsUnavailable,
  type SignatureVerificationError,
} from "@thomasfosterau/effect-payments";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import type * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import type * as Price from "@thomasfosterau/effect-payments/Price";
import type * as Product from "@thomasfosterau/effect-payments/Product";
import type * as Refund from "@thomasfosterau/effect-payments/Refund";
import type * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as CheckoutSession from "@thomasfosterau/effect-payments/CheckoutSession";
import * as BillingPortal from "@thomasfosterau/effect-payments/BillingPortal";
import * as Stub from "@thomasfosterau/effect-payments/Stub";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";
import * as StripeCustomer from "@thomasfosterau/effect-payments-stripe/Customer";
import * as StripeCheckoutSession from "@thomasfosterau/effect-payments-stripe/CheckoutSession";
import * as StripeBillingPortalSession from "@thomasfosterau/effect-payments-stripe/BillingPortal.Session";
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
import * as StripeSdk from "@thomasfosterau/effect-payments-stripe/Stripe";
import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
export const checkout = CheckoutSession.create({
  mode: "subscription",
  customer: "cus_123",
  lineItems: [{ price: "price_123" }],
  successUrl: "https://example.com/ok",
  cancelUrl: "https://example.com/cancel",
});
export const portal = BillingPortal.create({
  customer: "cus_123",
  returnUrl: "https://example.com/account",
});

// ── providers ─────────────────────────────────────────────────────────────

export const stripeLayer = StripePayments.layer({ apiKey: Redacted.make("sk_test_123") });
export const stripeConfigLayer = StripePayments.layerConfig({ envVar: "BILLING_STRIPE_KEY" });
export const stripeHttpConfigLayer = StripeHttp.layerConfig();
export const unavailableLayer = Stub.unavailable("stripe");
export const stripeHttpLayer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_123") });
export const stripeSdkLayer = StripeSdk.layer({ apiKey: Redacted.make("sk_test_123") });
export const paypalLayer = PayPalPayments.layer({
  clientId: "id",
  clientSecret: Redacted.make("secret"),
});
export const airwallexLayer = AirwallexPayments.layer({
  clientId: "id",
  apiKey: Redacted.make("key"),
});
export const stripeCustomer = StripeCustomer.retrieve("cus_123");
export const stripeCheckoutSession = StripeCheckoutSession.create({
  mode: "payment",
  line_items: [{ price: "price_123", quantity: 1 }],
  success_url: "https://example.com/success",
});
export const stripePortalSession = StripeBillingPortalSession.create({
  customer: "cus_123",
  return_url: "https://example.com/account",
});
export const event = Webhook.constructEvent("{}", "t=1,v1=sig", "whsec_123");

/**
 * Every compile-time assertion, exported so `noUnusedLocals` keeps them and a
 * failing one names itself in the error.
 */
export type Checks = [
  /** _createSucceeds */ Assert<Equals<Effect.Success<typeof created>, Customer.Customer>>,
  /** _createFails */ Assert<Equals<Effect.Error<typeof created>, PaymentsError>>,
  /** _createRequires */ Assert<Equals<Effect.Services<typeof created>, Customer.Customers>>,
  /** _listPages */ Assert<Equals<Effect.Success<typeof listed>, Page<Customer.Customer>>>,
  /** _stripeProvides */ Assert<
    Equals<
      Layer.Success<typeof stripeLayer>,
      | Customer.Customers
      | Product.Products
      | Price.Prices
      | PaymentIntent.PaymentIntents
      | Subscription.Subscriptions
      | Refund.Refunds
      | CheckoutSession.CheckoutSessions
      | BillingPortal.BillingPortalSessions
    >
  >,
  /** _stripeFailsWithConfig */ Assert<Equals<Layer.Error<typeof stripeLayer>, PaymentConfigError>>,
  /** _paypalProvidesRefunds */ Assert<
    Refund.Refunds extends Layer.Success<typeof paypalLayer> ? true : false
  >,
  /** _paypalHasNoCustomers */ Assert<
    Customer.Customers extends Layer.Success<typeof paypalLayer> ? false : true
  >,
  /** _airwallexProvidesCustomers */ Assert<
    Customer.Customers extends Layer.Success<typeof airwallexLayer> ? true : false
  >,
  /** _checkoutSucceeds */ Assert<
    Equals<Effect.Success<typeof checkout>, CheckoutSession.CheckoutSession>
  >,
  /** _checkoutRequires */ Assert<
    Equals<Effect.Services<typeof checkout>, CheckoutSession.CheckoutSessions>
  >,
  /** _portalSucceeds */ Assert<
    Equals<Effect.Success<typeof portal>, BillingPortal.BillingPortalSession>
  >,
  /** _checkoutFails */ Assert<Equals<Effect.Error<typeof checkout>, PaymentsError>>,
  /** _portalFails */ Assert<Equals<Effect.Error<typeof portal>, PaymentsError>>,
  /** _paypalHasNoCheckoutByDefault */ Assert<
    CheckoutSession.CheckoutSessions extends Layer.Success<typeof paypalLayer> ? false : true
  >,
  /** _paypalCheckoutStub */ Assert<
    Equals<
      Layer.Success<typeof PayPalPayments.checkoutSessionsLayer>,
      CheckoutSession.CheckoutSessions
    >
  >,
  /** _airwallexPortalStub */ Assert<
    Equals<
      Layer.Success<typeof AirwallexPayments.billingPortalSessionsLayer>,
      BillingPortal.BillingPortalSessions
    >
  >,
  /** _stripeResourceRequiresTransport */ Assert<
    Equals<Effect.Services<typeof stripeCustomer>, StripeHttp.StripeHttp>
  >,
  /** _stripeCustomerIsGenerated */ Assert<
    Equals<
      Effect.Success<typeof stripeCustomer>,
      StripeCustomer.Customer | StripeCustomer.DeletedCustomer
    >
  >,
  /** _stripeCheckoutIsGenerated */ Assert<
    Equals<Effect.Success<typeof stripeCheckoutSession>, StripeCheckoutSession.Session>
  >,
  /** _stripeCheckoutRequiresTransport */ Assert<
    Equals<Effect.Services<typeof stripeCheckoutSession>, StripeHttp.StripeHttp>
  >,
  /** _stripePortalIsGenerated */ Assert<
    Equals<Effect.Success<typeof stripePortalSession>, StripeBillingPortalSession.Session>
  >,
  /** _stripePortalUrlIsRequired */ Assert<
    Equals<StripeBillingPortalSession.Session["url"], string>
  >,
  /** _stripeHttpNeedsHttpClient */ Assert<
    Equals<Layer.Services<typeof stripeHttpLayer>, HttpClient.HttpClient>
  >,
  /** _stripeSdkProvidesTransport */ Assert<
    Equals<Layer.Success<typeof stripeSdkLayer>, StripeHttp.StripeHttp | StripeSdk.StripeService>
  >,
  /** _stripeSdkNeedsNothing */ Assert<Equals<Layer.Services<typeof stripeSdkLayer>, never>>,
  /** _webhookEvent */ Assert<Equals<Effect.Success<typeof event>, Stripe.Event>>,
  /** _stripeNeedsHttpClient */ Assert<
    Equals<Layer.Services<typeof stripeLayer>, HttpClient.HttpClient>
  >,
  /** _paypalNeedsHttpClient */ Assert<
    Equals<Layer.Services<typeof paypalLayer>, HttpClient.HttpClient>
  >,
  /** _airwallexNeedsHttpClient */ Assert<
    Equals<Layer.Services<typeof airwallexLayer>, HttpClient.HttpClient>
  >,
  /** _paypalFailsWithConfig */ Assert<Equals<Layer.Error<typeof paypalLayer>, PaymentConfigError>>,
  /** _unavailableIsPaymentsError */ Assert<
    PaymentsUnavailable extends PaymentsError ? true : false
  >,
  /** _stripeConfigProvidesEverything */ Assert<
    Equals<Layer.Success<typeof stripeConfigLayer>, Layer.Success<typeof stripeLayer>>
  >,
  /** _stripeConfigNeverFailsToBuild */ Assert<
    Equals<Layer.Error<typeof stripeConfigLayer>, never>
  >,
  /** _stripeConfigNeedsHttpClient */ Assert<
    Equals<Layer.Services<typeof stripeConfigLayer>, HttpClient.HttpClient>
  >,
  /** _stripeHttpConfigNeverFailsToBuild */ Assert<
    Equals<Layer.Error<typeof stripeHttpConfigLayer>, never>
  >,
  /** _stubProvidesEverything */ Assert<
    Equals<Layer.Success<typeof unavailableLayer>, Layer.Success<typeof stripeLayer>>
  >,
  /** _stubNeedsNothing */ Assert<Equals<Layer.Services<typeof unavailableLayer>, never>>,
  /** _webhookFails */ Assert<Equals<Effect.Error<typeof event>, SignatureVerificationError>>,
];
