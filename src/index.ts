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
 * import { makeStripeLayer, StripeService } from "@thomasfosterau/effect-stripe";
 *
 * const program = Effect.gen(function* () {
 *   const stripe = yield* StripeService;
 *
 *   // Create a customer
 *   const customer = yield* stripe.customers.create({
 *     email: "customer@example.com",
 *     name: "John Doe",
 *   });
 *
 *   // Create a payment intent
 *   const paymentIntent = yield* stripe.paymentIntents.create({
 *     amount: 2000,
 *     currency: "usd",
 *     customer: customer.id,
 *   });
 *
 *   return { customer, paymentIntent };
 * });
 *
 * // Run the program with the Stripe layer
 * const layer = makeStripeLayer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 *
 * @module
 */

export * from "./errors.js";
export * from "./stripe.js";
export type { StripeConfig } from "./stripe.js";
