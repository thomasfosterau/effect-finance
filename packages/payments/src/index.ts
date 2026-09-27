/**
 * `@thomasfosterau/effect-payments`
 *
 * A vendor-neutral payments core for Effect. It defines:
 *
 * - **Capabilities** — abstract services (`Customers`, `Products`, `Prices`,
 *   `PaymentIntents`, `Subscriptions`, `Refunds`, `CheckoutSessions`,
 *   `BillingPortalSessions`) that programs depend on.
 * - **Domain types** — provider-agnostic entities (`Customer`, `Product`,
 *   `Price`, `PaymentIntent`, `Subscription`, `Refund`, `Money`).
 * - **Errors** — a neutral error channel (`PaymentsError` and friends).
 *
 * A concrete provider package (e.g.
 * `@thomasfosterau/effect-payments-stripe`) supplies `Layer`s that implement
 * these capabilities. Programs written against this core can therefore run on
 * any provider without modification — the payments analogue of Effect's AI
 * package, where `@effect/ai` defines the abstraction and `@effect/ai-openai`
 * supplies an implementation.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Customer from "@thomasfosterau/effect-payments/Customer";
 * import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
 *
 * const onboard = (email: string, priceId: string) =>
 *   Effect.gen(function* () {
 *     const customer = yield* Customer.create({ email });
 *     const subscription = yield* Subscription.create({
 *       customer: customer.id,
 *       items: [{ price: priceId }],
 *     });
 *     return { customer, subscription };
 *   });
 * ```
 *
 * @module
 */

export * from "./PaymentsError.js";
export * from "./Page.js";
export { Money, Metadata, make as money } from "./Money.js";

export * as Customer from "./Customer.js";
export * as Product from "./Product.js";
export * as Price from "./Price.js";
export * as PaymentIntent from "./PaymentIntent.js";
export * as Subscription from "./Subscription.js";
export * as Refund from "./Refund.js";
export * as CheckoutSession from "./CheckoutSession.js";
export * as BillingPortal from "./BillingPortal.js";
