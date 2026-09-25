/**
 * `@thomasfosterau/effect-payments-stripe`
 *
 * The Stripe implementation of the vendor-neutral
 * `@thomasfosterau/effect-payments` core. It provides:
 *
 * - **`StripeHttp`** — the fetch-only transport over `effect/unstable/http`'s
 *   `HttpClient` (form-encoded bodies, pinned `Stripe-Version`, `Redacted`
 *   key), which runs in a Cloudflare Worker with no Node API and no SDK.
 * - **`StripePayments`** — `Layer`s that implement the neutral capabilities
 *   (`Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`,
 *   `Refunds`) over that transport, plus `layer`/`layerFromEnv` that bundle
 *   the transport and every capability together.
 * - **Raw resource modules** (`Customer`, `Product`, `Charge`, `Treasury`, …) —
 *   the full-fidelity Stripe escape hatch, typed with the `stripe` package's
 *   declarations, for the many resources that have no vendor-neutral
 *   equivalent.
 *
 * The official SDK is an optional alternative transport, imported from its
 * own subpath (`@thomasfosterau/effect-payments-stripe/Stripe`) and never
 * loaded by this entry point.
 *
 * This mirrors Effect's AI packages: `@effect/ai` defines the abstraction and
 * `@effect/ai-openai` implements it while still exposing provider-specific APIs.
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Customer from "@thomasfosterau/effect-payments/Customer";
 * import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";
 *
 * const program = Customer.create({ email: "jane@example.com" });
 *
 * const layer = StripePayments.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const customer = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 *
 * @module
 */

// Re-export the vendor-neutral core for convenience (capabilities, entities,
// and the neutral error channel).
export * as Payments from "@thomasfosterau/effect-payments";

// The fetch-only transport + neutral capability implementations. The SDK
// transport (`./Stripe`) is deliberately not re-exported here: it loads the
// optional `stripe` peer, and this entry point must load without it.
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
export * as SubscriptionSchedule from "./SubscriptionSchedule.js";
export * as Webhook from "./Webhook.js";

export type { StripeError as StripeErrors } from "./internal/index.js";
export type { StripeHttpConfig } from "./StripeHttp.js";
