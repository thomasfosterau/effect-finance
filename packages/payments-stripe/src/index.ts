/**
 * `@thomasfosterau/effect-payments-stripe`
 *
 * The Stripe implementation of the vendor-neutral
 * `@thomasfosterau/effect-payments` core. It provides:
 *
 * - **`StripePayments`** — `Layer`s that implement every neutral capability
 *   (including `CheckoutSessions` and `BillingPortalSessions`) over
 *   Distilled's Stripe operations (`@distilled.cloud/stripe`), with a pinned
 *   `Stripe-Version`, the SDK's retry policy and Stripe's failures mapped onto
 *   the neutral errors, plus the `layer` / `layerFromEnv` / `layerConfig`
 *   bundles that build every capability from configuration.
 * - **`StripeHttp`** — the client the resource modules run on: Distilled's
 *   operations under the same request policy as the capabilities, over
 *   `effect/http`'s `HttpClient`, with no Node API and no SDK.
 * - **Raw resource modules** (`Customer`, `Invoice`, `Charge`, `Treasury`, …) —
 *   the Stripe escape hatch for what the neutral capabilities do not cover:
 *   every Distilled operation on each resource, typed with Distilled's
 *   declarations and wrapped with the pinned `Stripe-Version` and
 *   {@link RequestOptions}.
 * - **`Webhook`** — the WebCrypto webhook verifier, and the SDK-based one for
 *   a program that provides its own `stripe` client.
 *
 * This entry point re-exports every resource module, so its declarations
 * reach Distilled's whole operations module (about 7.5 MB); a program that
 * needs one resource imports its subpath (or only `StripePayments`, whose
 * declarations stay small).
 *
 * This is the payments analogue of Effect's AI modules: one abstraction, one
 * package per provider, with provider-specific APIs still exposed.
 *
 * See `StripePayments.layer` for an example of running a neutral program on Stripe.
 *
 * @module
 */

// Re-export the vendor-neutral core for convenience (capabilities, entities,
// and the neutral error channel).
export * as Payments from "@thomasfosterau/effect-payments";

// The neutral capability implementations + the raw modules' client.
export * as StripeHttp from "./StripeHttp.js";
export * as StripePayments from "./StripePayments.js";

// Raw Stripe resource modules (provider-specific escape hatch).
export * as Customer from "./Customer.js";
export * as Product from "./Product.js";
export * as Price from "./Price.js";
export * as PaymentIntent from "./PaymentIntent.js";
export * as Subscription from "./Subscription.js";
export * as Treasury from "./Treasury.js";
export * as Balance from "./Balance.js";
export * as Event from "./Event.js";
export * as WebhookEndpoint from "./WebhookEndpoint.js";
export * as Review from "./Review.js";
export * as CountrySpec from "./CountrySpec.js";
export * as IssuingCard from "./Issuing.Card.js";
export * as IssuingCardholder from "./Issuing.Cardholder.js";
export * as IssuingAuthorization from "./Issuing.Authorization.js";
export * as IssuingTransaction from "./Issuing.Transaction.js";
export * as IssuingDispute from "./Issuing.Dispute.js";
export * as IdentityVerificationSession from "./Identity.VerificationSession.js";
export * as IdentityVerificationReport from "./Identity.VerificationReport.js";
export * as TerminalReader from "./Terminal.Reader.js";
export * as TerminalLocation from "./Terminal.Location.js";
export * as TerminalConnectionToken from "./Terminal.ConnectionToken.js";
export * as Account from "./Account.js";
export * as AccountLink from "./AccountLink.js";
export * as Person from "./Person.js";
export * as ExternalAccount from "./ExternalAccount.js";
export * as Transfer from "./Transfer.js";
export * as Topup from "./Topup.js";
export * as PaymentMethod from "./PaymentMethod.js";
export * as Invoice from "./Invoice.js";
export * as Charge from "./Charge.js";
export * as Refund from "./Refund.js";
export * as BalanceTransaction from "./BalanceTransaction.js";
export * as SetupIntent from "./SetupIntent.js";
export * as Payout from "./Payout.js";
export * as Dispute from "./Dispute.js";
export * as File from "./File.js";
export * as TaxRate from "./TaxRate.js";
export * as PromotionCode from "./PromotionCode.js";
export * as Coupon from "./Coupon.js";
export * as CheckoutSession from "./CheckoutSession.js";
export * as BillingPortalSession from "./BillingPortal.Session.js";
export * as SubscriptionSchedule from "./SubscriptionSchedule.js";
export * as Webhook from "./Webhook.js";

/** Every failure of a Stripe call: the neutral `PaymentsError` channel. */
export type { PaymentsError as StripeErrors } from "@thomasfosterau/effect-payments";
export type { RequestOptions, StripeHttpConfig } from "./StripeHttp.js";
