/**
 * Example: Handling Stripe Webhooks with effect-stripe
 *
 * This example demonstrates how to:
 * - Verify webhook signatures
 * - Handle different event types
 * - Use Effect for composable error handling
 * - Process webhook events safely
 */

import { Effect } from "effect";
import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
import * as Customer from "@thomasfosterau/effect-payments-stripe/Customer";
import { SignatureVerificationError } from "@thomasfosterau/effect-payments";

/**
 * Handle a webhook event based on its type
 */
const handleEvent = (event: import("stripe").Stripe.Event) =>
  Effect.gen(function* () {
    console.log(`Received event: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        console.log(
          `PaymentIntent ${paymentIntent.id} succeeded for ${paymentIntent.amount} ${paymentIntent.currency}`,
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        console.log(
          `PaymentIntent ${paymentIntent.id} failed: ${paymentIntent.last_payment_error?.message}`,
        );
        break;
      }

      case "customer.created": {
        const customer = event.data.object as any;
        console.log(`New customer created: ${customer.id} (${customer.email})`);
        break;
      }

      case "customer.updated": {
        const customer = event.data.object as any;
        console.log(`Customer updated: ${customer.id}`);
        break;
      }

      case "customer.deleted": {
        const customer = event.data.object as any;
        console.log(`Customer deleted: ${customer.id}`);
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as any;
        console.log(`Charge ${charge.id} succeeded for ${charge.amount} ${charge.currency}`);
        break;
      }

      case "charge.failed": {
        const charge = event.data.object as any;
        console.log(`Charge ${charge.id} failed: ${charge.failure_message}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        console.log(`Invoice ${invoice.id} paid for ${invoice.amount_paid} ${invoice.currency}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        console.log(`Invoice ${invoice.id} payment failed`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log(`Checkout session ${session.id} completed`);

        // You can fetch the full customer details if needed
        if (session.customer) {
          const customer = yield* Customer.retrieve(session.customer as string);
          if (!("deleted" in customer)) {
            console.log(`Customer email: ${customer.email}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return event;
  });

/**
 * Process a webhook request
 *
 * This would typically be called from an HTTP endpoint handler
 * (e.g., Express, Fastify, Next.js API route, etc.)
 */
const processWebhook = (payload: string | Buffer, signature: string, webhookSecret: string) =>
  Effect.gen(function* () {
    // Verify the webhook signature and construct the event
    const event = yield* Webhook.constructEvent(payload, signature, webhookSecret);

    // Handle the event based on its type
    yield* handleEvent(event);

    return { received: true };
  });

/**
 * Example: Express-style webhook endpoint
 */
const expressExample = () => {
  console.log("\n=== Express Webhook Handler Example ===\n");

  // Simulated Express request
  const simulatedRequest = {
    body: JSON.stringify({
      id: "evt_test_webhook",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_12345",
          amount: 2000,
          currency: "usd",
        },
      },
    }),
    headers: {
      "stripe-signature": "",
    },
  };

  const webhookSecret = "whsec_test_secret";
  const layer = Stripe.layer({ apiKey: "sk_test_..." });

  // Generate a test signature
  const setupProgram = Effect.gen(function* () {
    const signature = yield* Webhook.generateTestHeaderString(simulatedRequest.body, webhookSecret);
    simulatedRequest.headers["stripe-signature"] = signature;
  });

  // Process the webhook
  const webhookProgram = processWebhook(
    simulatedRequest.body,
    simulatedRequest.headers["stripe-signature"],
    webhookSecret,
  );

  // Run the program with error handling
  const program = Effect.gen(function* () {
    yield* setupProgram;
    return yield* webhookProgram;
  }).pipe(
    Effect.catchTag("SignatureVerificationError", (error) => {
      console.error("Webhook signature verification failed:", error.message);
      return Effect.succeed({ error: "Invalid signature" });
    }),
    Effect.catchAll((error) => {
      console.error("Webhook processing failed:", error);
      return Effect.succeed({ error: "Processing failed" });
    }),
  );

  Effect.runPromise(program.pipe(Effect.provide(layer)))
    .then((result) => {
      console.log("Webhook processed successfully:", result);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
    });
};

/**
 * Example: Testing webhook signatures
 */
const testingExample = () => {
  console.log("\n=== Testing Webhook Signatures Example ===\n");

  const webhookSecret = "whsec_test_secret";
  const layer = Stripe.layer({ apiKey: "sk_test_..." });

  const testPayload = JSON.stringify({
    id: "evt_test",
    type: "customer.created",
    data: {
      object: {
        id: "cus_test_12345",
        email: "test@example.com",
      },
    },
  });

  const program = Effect.gen(function* () {
    // Generate a test signature
    const signature = yield* Webhook.generateTestHeaderString(testPayload, webhookSecret);
    console.log("Generated signature:", signature);

    // Verify the signature
    const event = yield* Webhook.constructEvent(testPayload, signature, webhookSecret);
    console.log("Event verified:", event.type);

    // Try with wrong secret (should fail)
    const wrongSecret = "whsec_wrong_secret";
    const failedAttempt = yield* Effect.flip(
      Webhook.constructEvent(testPayload, signature, wrongSecret),
    );

    if (failedAttempt instanceof SignatureVerificationError) {
      console.log("Signature verification failed as expected");
    }

    return event;
  });

  Effect.runPromise(program.pipe(Effect.provide(layer)))
    .then(() => {
      console.log("Test completed successfully");
    })
    .catch((error) => {
      console.error("Test failed:", error);
    });
};

/**
 * Example: Async webhook verification
 */
const asyncExample = () => {
  console.log("\n=== Async Webhook Verification Example ===\n");

  const webhookSecret = "whsec_test_secret";
  const layer = Stripe.layer({ apiKey: "sk_test_..." });

  const testPayload = JSON.stringify({
    id: "evt_test_async",
    type: "invoice.payment_succeeded",
    data: {
      object: {
        id: "in_test_12345",
        amount_paid: 5000,
        currency: "usd",
      },
    },
  });

  const program = Effect.gen(function* () {
    // Generate signature using async method
    const signature = yield* Webhook.generateTestHeaderStringAsync(testPayload, webhookSecret);

    // Verify using async method
    const event = yield* Webhook.constructEventAsync(testPayload, signature, webhookSecret);

    yield* handleEvent(event);

    return event;
  });

  Effect.runPromise(program.pipe(Effect.provide(layer)))
    .then(() => {
      console.log("Async webhook verification completed");
    })
    .catch((error) => {
      console.error("Async verification failed:", error);
    });
};

/**
 * Example: Webhook with custom tolerance
 */
const toleranceExample = () => {
  console.log("\n=== Webhook Tolerance Example ===\n");

  const webhookSecret = "whsec_test_secret";
  const layer = Stripe.layer({ apiKey: "sk_test_..." });

  const testPayload = JSON.stringify({
    id: "evt_test_tolerance",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_test_12345",
        amount: 1000,
        currency: "usd",
      },
    },
  });

  const program = Effect.gen(function* () {
    // Generate signature with old timestamp
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const signature = yield* Webhook.generateTestHeaderString(
      testPayload,
      webhookSecret,
      oldTimestamp,
    );

    // This should fail with default tolerance (300 seconds)
    const failedAttempt = yield* Effect.flip(
      Webhook.constructEvent(testPayload, signature, webhookSecret),
    );

    if (failedAttempt instanceof SignatureVerificationError) {
      console.log("Old signature rejected with default tolerance (as expected)");
    }

    // This should succeed with extended tolerance
    const event = yield* Webhook.constructEvent(
      testPayload,
      signature,
      webhookSecret,
      1200, // 20 minutes
    );

    console.log("Old signature accepted with extended tolerance:", event.type);

    return event;
  });

  Effect.runPromise(program.pipe(Effect.provide(layer)))
    .then(() => {
      console.log("Tolerance test completed");
    })
    .catch((error) => {
      console.error("Tolerance test failed:", error);
    });
};

// Run all examples
console.log("=== Stripe Webhook Examples ===");
expressExample();
setTimeout(() => testingExample(), 100);
setTimeout(() => asyncExample(), 200);
setTimeout(() => toleranceExample(), 300);
