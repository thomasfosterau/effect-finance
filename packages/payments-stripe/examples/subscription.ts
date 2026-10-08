import { Console, Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as Price from "@thomasfosterau/effect-payments/Price";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

/**
 * Example: Create a subscription using the vendor-neutral core.
 *
 * 1. Create a customer
 * 2. Create a product
 * 3. Create a recurring price for the product
 * 4. Create a subscription for the customer
 */

const program = Effect.gen(function* () {
  yield* Console.log("Creating customer...");
  const customer = yield* Customer.create({
    email: "subscriber@example.com",
    name: "Jane Smith",
  });
  yield* Console.log(`Customer created: ${customer.id}`);

  yield* Console.log("Creating product...");
  const product = yield* Product.create({
    name: "Premium Subscription",
    description: "Monthly premium subscription",
  });
  yield* Console.log(`Product created: ${product.id}`);

  yield* Console.log("Creating price...");
  const price = yield* Price.create({
    product: product.id,
    unitAmount: 1999, // $19.99 in minor units
    currency: "usd",
    recurring: { interval: "month" },
  });
  yield* Console.log(`Price created: ${price.id}`);

  yield* Console.log("Creating subscription...");
  const subscription = yield* Subscription.create({
    customer: customer.id,
    items: [{ price: price.id }],
  });
  yield* Console.log(`Subscription created: ${subscription.id}`);
  yield* Console.log(`Status: ${subscription.status}`);

  return { customer, product, price, subscription };
});

// The key comes from STRIPE_API_KEY, read through `Config` as a `Redacted`;
// the capabilities need an `HttpClient`.
const layer = StripePayments.layerFromEnv().pipe(Layer.provide(FetchHttpClient.layer));

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
