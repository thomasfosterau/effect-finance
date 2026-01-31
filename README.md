# effect-stripe

An Effect wrapper around the Stripe API that provides type-safe error handling, composable operations, and seamless integration with the Effect ecosystem.

[![CI](https://github.com/thomasfosterau/effect-stripe/actions/workflows/ci.yml/badge.svg)](https://github.com/thomasfosterau/effect-stripe/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@thomasfosterau/effect-stripe.svg)](https://www.npmjs.com/package/@thomasfosterau/effect-stripe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Type-safe** - Full TypeScript support with Effect's type system
- 🛡️ **Error Handling** - Comprehensive error types using Effect's error channel
- 🔄 **Composable** - Use Effect's combinators to build complex workflows
- 🚀 **Resource-safe** - Manage Stripe client lifecycle with Effect Layers
- 📦 **Tree-shakeable** - ESM-only package with minimal bundle size
- ✅ **Well-tested** - Comprehensive test coverage

## Installation

```bash
npm install @thomasfosterau/effect-stripe effect stripe
```

```bash
pnpm add @thomasfosterau/effect-stripe effect stripe
```

```bash
yarn add @thomasfosterau/effect-stripe effect stripe
```

## Quick Start

```typescript
import { Effect } from "effect";
import { makeStripeLayer, StripeService } from "@thomasfosterau/effect-stripe";

// Create a program that uses the Stripe service
const program = Effect.gen(function* () {
  const stripe = yield* StripeService;

  // Create a customer
  const customer = yield* stripe.customers.create({
    email: "customer@example.com",
    name: "John Doe",
  });

  // Create a payment intent
  const paymentIntent = yield* stripe.paymentIntents.create({
    amount: 2000,
    currency: "usd",
    customer: customer.id,
  });

  return { customer, paymentIntent };
});

// Create the Stripe layer
const layer = makeStripeLayer({ apiKey: "sk_test_..." });

// Run the program
const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## Usage

### Creating the Stripe Layer

You can create a Stripe layer in two ways:

#### From Configuration Object

```typescript
import { makeStripeLayer } from "@thomasfosterau/effect-stripe";

const layer = makeStripeLayer({
  apiKey: "sk_test_...",
  maxNetworkRetries: 3,
  timeout: 10000,
});
```

#### From Environment Variable

```typescript
import { makeStripeLayerFromEnv } from "@thomasfosterau/effect-stripe";

// Uses STRIPE_API_KEY environment variable by default
const layer = makeStripeLayerFromEnv();

// Or specify a custom environment variable
const layer = makeStripeLayerFromEnv("MY_STRIPE_KEY");
```

### Working with Customers

```typescript
import { Effect } from "effect";
import { StripeService } from "@thomasfosterau/effect-stripe";

const program = Effect.gen(function* () {
  const stripe = yield* StripeService;

  // Create a customer
  const customer = yield* stripe.customers.create({
    email: "customer@example.com",
    name: "John Doe",
    metadata: { userId: "123" },
  });

  // Retrieve a customer
  const retrieved = yield* stripe.customers.retrieve(customer.id);

  // Update a customer
  const updated = yield* stripe.customers.update(customer.id, {
    name: "Jane Doe",
  });

  // List customers
  const customers = yield* stripe.customers.list({ limit: 10 });

  // Delete a customer
  const deleted = yield* stripe.customers.del(customer.id);

  return { customer, retrieved, updated, customers, deleted };
});
```

### Working with Payment Intents

```typescript
import { Effect } from "effect";
import { StripeService } from "@thomasfosterau/effect-stripe";

const program = Effect.gen(function* () {
  const stripe = yield* StripeService;

  // Create a payment intent
  const paymentIntent = yield* stripe.paymentIntents.create({
    amount: 2000,
    currency: "usd",
    payment_method_types: ["card"],
  });

  // Retrieve a payment intent
  const retrieved = yield* stripe.paymentIntents.retrieve(paymentIntent.id);

  // Update a payment intent
  const updated = yield* stripe.paymentIntents.update(paymentIntent.id, {
    metadata: { orderId: "456" },
  });

  // Confirm a payment intent
  const confirmed = yield* stripe.paymentIntents.confirm(paymentIntent.id);

  // Cancel a payment intent
  const canceled = yield* stripe.paymentIntents.cancel(paymentIntent.id);

  return { paymentIntent, retrieved, updated, confirmed, canceled };
});
```

### Working with Subscriptions

```typescript
import { Effect } from "effect";
import { StripeService } from "@thomasfosterau/effect-stripe";

const program = Effect.gen(function* () {
  const stripe = yield* StripeService;

  // Create a subscription
  const subscription = yield* stripe.subscriptions.create({
    customer: "cus_123",
    items: [{ price: "price_123" }],
  });

  // Retrieve a subscription
  const retrieved = yield* stripe.subscriptions.retrieve(subscription.id);

  // Update a subscription
  const updated = yield* stripe.subscriptions.update(subscription.id, {
    metadata: { plan: "premium" },
  });

  // Cancel a subscription
  const canceled = yield* stripe.subscriptions.cancel(subscription.id);

  return { subscription, retrieved, updated, canceled };
});
```

### Error Handling

The library provides specific error types for different Stripe error scenarios:

```typescript
import { Effect } from "effect";
import {
  StripeService,
  StripeApiError,
  StripeAuthenticationError,
  StripeRateLimitError,
  StripeInvalidRequestError,
} from "@thomasfosterau/effect-stripe";

const program = Effect.gen(function* () {
  const stripe = yield* StripeService;

  const customer = yield* stripe.customers.create({
    email: "customer@example.com",
  });

  return customer;
}).pipe(
  // Handle specific error types
  Effect.catchTag("StripeAuthenticationError", (error) => {
    console.error("Authentication failed:", error.message);
    return Effect.fail(new Error("Invalid API key"));
  }),
  Effect.catchTag("StripeRateLimitError", (error) => {
    console.error("Rate limit exceeded:", error.message);
    return Effect.fail(new Error("Too many requests"));
  }),
  Effect.catchTag("StripeInvalidRequestError", (error) => {
    console.error("Invalid request:", error.message, error.param);
    return Effect.fail(new Error("Invalid parameters"));
  }),
  Effect.catchTag("StripeApiError", (error) => {
    console.error("API error:", error.message, error.type);
    return Effect.fail(new Error("Stripe API error"));
  })
);
```

### Composing Operations

Use Effect's combinators to build complex workflows:

```typescript
import { Effect, pipe } from "effect";
import { StripeService } from "@thomasfosterau/effect-stripe";

const createCustomerWithSubscription = (
  email: string,
  priceId: string
) =>
  Effect.gen(function* () {
    const stripe = yield* StripeService;

    // Create customer and subscription sequentially
    const customer = yield* stripe.customers.create({ email });
    const subscription = yield* stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
    });

    return { customer, subscription };
  });

// Use with retry and timeout
const program = pipe(
  createCustomerWithSubscription("customer@example.com", "price_123"),
  Effect.retry({ times: 3 }),
  Effect.timeout("30 seconds")
);
```

## API Reference

### Services

- **`StripeService`** - The main service tag for accessing Stripe functionality
- **`makeStripeLayer(config)`** - Create a Stripe layer from configuration
- **`makeStripeLayerFromEnv(envVar?)`** - Create a Stripe layer from environment variable

### Resources

The library currently supports the following Stripe resources:

- **Customers** - `customers.{create, retrieve, update, del, list}`
- **Payment Intents** - `paymentIntents.{create, retrieve, update, confirm, cancel, list}`
- **Subscriptions** - `subscriptions.{create, retrieve, update, cancel, list}`
- **Prices** - `prices.{create, retrieve, update, list}`
- **Products** - `products.{create, retrieve, update, del, list}`

### Error Types

- **`StripeError`** - Base error for all Stripe errors
- **`StripeApiError`** - Stripe API returned an error
- **`StripeConfigError`** - Configuration is invalid
- **`StripeNetworkError`** - Network error occurred
- **`StripeAuthenticationError`** - Authentication failed
- **`StripeRateLimitError`** - Rate limit exceeded
- **`StripeInvalidRequestError`** - Request parameters are invalid

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm typecheck
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Thomas Foster

## Acknowledgments

Built with:
- [Effect](https://effect.website/) - The Effect TypeScript framework
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node) - Official Stripe SDK
