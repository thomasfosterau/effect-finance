import { Effect, Console } from "effect";
import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
import * as Customer from "@thomasfosterau/effect-stripe/Customer";
import * as PaymentIntent from "@thomasfosterau/effect-stripe/PaymentIntent";

/**
 * Example: Create a customer and a payment intent
 *
 * This example demonstrates how to:
 * 1. Create a Stripe service layer
 * 2. Create a customer using the Customer resource
 * 3. Create a payment intent for that customer using the PaymentIntent resource
 * 4. Handle errors using Effect's error channel
 */

const program = Effect.gen(function* () {
  yield* Console.log("Creating customer...");

  // Create a customer
  const customer = yield* Customer.create({
    email: "customer@example.com",
    name: "John Doe",
    metadata: {
      userId: "user_123",
    },
  });

  yield* Console.log(`Customer created: ${customer.id}`);

  // Create a payment intent for the customer
  yield* Console.log("Creating payment intent...");

  const paymentIntent = yield* PaymentIntent.create({
    amount: 2000, // $20.00
    currency: "usd",
    customer: customer.id,
    payment_method_types: ["card"],
    metadata: {
      orderId: "order_456",
    },
  });

  yield* Console.log(`Payment intent created: ${paymentIntent.id}`);
  yield* Console.log(`Status: ${paymentIntent.status}`);
  yield* Console.log(`Amount: $${paymentIntent.amount / 100}`);

  return { customer, paymentIntent };
}).pipe(
  // Handle specific Stripe errors
  Effect.catchTag("StripeAuthenticationError", (error) =>
    Effect.gen(function* () {
      yield* Console.error("Authentication failed:", error.message);
      yield* Console.error("Please check your API key");
      yield* Effect.fail(error);
    })
  ),
  Effect.catchTag("StripeApiError", (error) =>
    Effect.gen(function* () {
      yield* Console.error("Stripe API error:", error.message);
      yield* Console.error("Error type:", error.type);
      yield* Effect.fail(error);
    })
  )
);

// Create the Stripe layer
// In a real application, you would use an environment variable:
// const layer = Stripe.layerFromEnv();
const layer = Stripe.layer({
  apiKey: process.env.STRIPE_API_KEY || "sk_test_...",
});

// Run the program
const runnable = program.pipe(Effect.provide(layer));

Effect.runPromise(runnable)
  .then((result) => {
    console.log("\nSuccess!");
    console.log("Customer ID:", result.customer.id);
    console.log("Payment Intent ID:", result.paymentIntent.id);
  })
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  });
