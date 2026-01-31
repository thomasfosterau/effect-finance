import { Effect, Console } from "effect";
import {
  makeStripeLayer,
  StripeService,
} from "@thomasfosterau/effect-stripe";

/**
 * Example: Create a subscription
 *
 * This example demonstrates how to:
 * 1. Create a customer
 * 2. Create a product
 * 3. Create a price for the product
 * 4. Create a subscription for the customer
 */

const program = Effect.gen(function* () {
  const stripe = yield* StripeService;

  // Step 1: Create a customer
  yield* Console.log("Creating customer...");
  const customer = yield* stripe.customers.create({
    email: "subscriber@example.com",
    name: "Jane Smith",
  });
  yield* Console.log(`Customer created: ${customer.id}`);

  // Step 2: Create a product
  yield* Console.log("Creating product...");
  const product = yield* stripe.products.create({
    name: "Premium Subscription",
    description: "Monthly premium subscription",
  });
  yield* Console.log(`Product created: ${product.id}`);

  // Step 3: Create a price
  yield* Console.log("Creating price...");
  const price = yield* stripe.prices.create({
    product: product.id,
    unit_amount: 1999, // $19.99
    currency: "usd",
    recurring: {
      interval: "month",
    },
  });
  yield* Console.log(`Price created: ${price.id}`);

  // Step 4: Create a subscription
  yield* Console.log("Creating subscription...");
  const subscription = yield* stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });
  yield* Console.log(`Subscription created: ${subscription.id}`);
  yield* Console.log(`Status: ${subscription.status}`);

  return { customer, product, price, subscription };
});

// Create and run the program
const layer = makeStripeLayer({
  apiKey: process.env.STRIPE_API_KEY || "sk_test_...",
});

Effect.runPromise(program.pipe(Effect.provide(layer)))
  .then((result) => {
    console.log("\nSubscription created successfully!");
    console.log("Customer:", result.customer.id);
    console.log("Product:", result.product.id);
    console.log("Price:", result.price.id);
    console.log("Subscription:", result.subscription.id);
  })
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  });
