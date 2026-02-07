/**
 * @effect-stripe
 *
 * An Effect wrapper around the Stripe API that provides:
 * - Type-safe error handling using Effect's error types
 * - Composable operations using Effect's combinators
 * - Resource-safe API client management
 * - Integration with Effect's ecosystem
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 * import * as Product from "@thomasfosterau/effect-stripe/Product";
 *
 * const createProduct = (name: string) => Product.create({ name });
 *
 * const program = Effect.gen(function* () {
 *   const product = yield* createProduct("Premium Plan");
 *   return product;
 * });
 *
 * // Run the program with the Stripe layer
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 *
 * @module
 */

export * from "./errors.js";
export * as Stripe from "./Stripe.js";
export * as Customer from "./Customer.js";
export * as Product from "./Product.js";
export * as Price from "./Price.js";
export * as PaymentIntent from "./PaymentIntent.js";
export * as Subscription from "./Subscription.js";
export * as Balance from "./Balance.js";
export * as Event from "./Event.js";
export * as WebhookEndpoint from "./WebhookEndpoint.js";
export * as Review from "./Review.js";
export * as CountrySpec from "./CountrySpec.js";
export type { StripeError as StripeErrors } from "./internal/index.js";
export type { StripeConfig } from "./Stripe.js";
