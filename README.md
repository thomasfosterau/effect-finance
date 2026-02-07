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
- 📦 **Tree-shakeable** - ESM-only package with subpath exports
- ✅ **Well-tested** - Growing test suite for core functionality
- 🎨 **Resource-centric** - Idiomatic Effect API design

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

```bash
bun add @thomasfosterau/effect-stripe effect stripe
```

## Quick Start

```typescript
import { Effect } from "effect";
import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
import * as Product from "@thomasfosterau/effect-stripe/Product";

// Create a function that returns an Effect
const createProduct = (name: string) => Product.create({ name });

// Use it in a program
const program = Effect.gen(function* () {
  const product = yield* createProduct("Premium Plan");
  return product;
});

// Create the Stripe layer and run
const layer = Stripe.layer({ apiKey: "sk_test_..." });
const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## API Design

This library follows Effect's conventions with a **resource-centric API**. Instead of accessing resources through a service object, you import and use resource modules directly:

```typescript
// ✅ Effect-like (resource-centric)
import * as Product from "@thomasfosterau/effect-stripe/Product";
const product = yield* Product.create({ name: "My Product" });

// ❌ Not Effect-like (service-centric)
const stripe = yield* StripeService;
const product = yield* stripe.products.create({ name: "My Product" });
```

## Usage

### Creating the Stripe Layer

The `Stripe` module provides functions to create Effect Layers:

#### From Configuration Object

```typescript
import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";

const layer = Stripe.layer({
  apiKey: "sk_test_...",
  maxNetworkRetries: 3,
  timeout: 10000,
});
```

#### From Environment Variable

```typescript
import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";

// Uses STRIPE_API_KEY environment variable by default
const layer = Stripe.layerFromEnv();

// Or specify a custom environment variable
const layer = Stripe.layerFromEnv("MY_STRIPE_KEY");
```

### Working with Resources

Each Stripe resource has its own module with standard CRUD operations:

#### Products

```typescript
import { Effect } from "effect";
import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
import * as Product from "@thomasfosterau/effect-stripe/Product";

const program = Effect.gen(function* () {
  // Create a product
  const product = yield* Product.create({
    name: "Premium Subscription",
    description: "Monthly premium plan",
  });

  // Retrieve a product
  const retrieved = yield* Product.retrieve(product.id);

  // Update a product
  const updated = yield* Product.update(product.id, {
    description: "Updated description",
  });

  // List products
  const products = yield* Product.list({ limit: 10 });

  // Delete a product
  const deleted = yield* Product.del(product.id);

  return { product, retrieved, updated, products, deleted };
});

const layer = Stripe.layer({ apiKey: "sk_test_..." });
await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

#### Customers

```typescript
import * as Customer from "@thomasfosterau/effect-stripe/Customer";

const program = Effect.gen(function* () {
  const customer = yield* Customer.create({
    email: "customer@example.com",
    name: "John Doe",
  });

  const updated = yield* Customer.update(customer.id, {
    name: "Jane Doe",
  });

  const customers = yield* Customer.list({ limit: 10 });

  return { customer, updated, customers };
});
```

#### Payment Intents

```typescript
import * as PaymentIntent from "@thomasfosterau/effect-stripe/PaymentIntent";

const program = Effect.gen(function* () {
  const intent = yield* PaymentIntent.create({
    amount: 2000,
    currency: "usd",
  });

  const confirmed = yield* PaymentIntent.confirm(intent.id);

  return { intent, confirmed };
});
```

#### Subscriptions

```typescript
import * as Subscription from "@thomasfosterau/effect-stripe/Subscription";

const program = Effect.gen(function* () {
  const subscription = yield* Subscription.create({
    customer: "cus_123",
    items: [{ price: "price_123" }],
  });

  const updated = yield* Subscription.update(subscription.id, {
    metadata: { plan: "premium" },
  });

  return { subscription, updated };
});
```

#### Prices

```typescript
import * as Price from "@thomasfosterau/effect-stripe/Price";

const program = Effect.gen(function* () {
  const price = yield* Price.create({
    product: "prod_123",
    unit_amount: 1999,
    currency: "usd",
  });

  return price;
});
```

### Error Handling

The library provides specific error types for different Stripe scenarios:

```typescript
import { Effect } from "effect";
import * as Customer from "@thomasfosterau/effect-stripe/Customer";
import {
  StripeApiError,
  StripeAuthenticationError,
  StripeRateLimitError,
} from "@thomasfosterau/effect-stripe";

const program = Effect.gen(function* () {
  const customer = yield* Customer.create({
    email: "customer@example.com",
  });
  return customer;
}).pipe(
  Effect.catchTag("StripeAuthenticationError", (error) => {
    console.error("Authentication failed:", error.message);
    return Effect.fail(new Error("Invalid API key"));
  }),
  Effect.catchTag("StripeRateLimitError", (error) => {
    console.error("Rate limit exceeded:", error.message);
    return Effect.fail(new Error("Too many requests"));
  }),
  Effect.catchTag("StripeApiError", (error) => {
    console.error("API error:", error.message);
    return Effect.fail(new Error("Stripe API error"));
  })
);
```

### Composing Operations

Use Effect's combinators to build complex workflows:

```typescript
import { Effect, pipe } from "effect";
import * as Customer from "@thomasfosterau/effect-stripe/Customer";
import * as Subscription from "@thomasfosterau/effect-stripe/Subscription";

const createCustomerWithSubscription = (email: string, priceId: string) =>
  Effect.gen(function* () {
    const customer = yield* Customer.create({ email });
    const subscription = yield* Subscription.create({
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

### Modules

- **`Stripe`** - Layer creation and configuration
  - `make(config)` - Create a Stripe client
  - `layer(config)` - Create a Stripe layer from configuration
  - `layerFromEnv(envVar?)` - Create a Stripe layer from environment variable

### Resources

Each resource module provides standard CRUD operations:

- **`Customer`** - `create, retrieve, update, del, list`
- **`Product`** - `create, retrieve, update, del, list`
- **`Price`** - `create, retrieve, update, list`
- **`PaymentIntent`** - `create, retrieve, update, confirm, cancel, list`
- **`Subscription`** - `create, retrieve, update, cancel, list`

All operations return `Effect<T, StripeError, Stripe.StripeService>`.

### Error Types

- **`StripeError`** - Union of all Stripe errors
- **`StripeApiError`** - Stripe API returned an error
- **`StripeConfigError`** - Configuration is invalid
- **`StripeNetworkError`** - Network error occurred
- **`StripeAuthenticationError`** - Authentication failed
- **`StripeRateLimitError`** - Rate limit exceeded
- **`StripeInvalidRequestError`** - Request parameters are invalid

## Development

```bash
# Install dependencies
bun install

# Build the library
bun run build

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Lint
bun run lint

# Format
bun run format

# Type check
bun run typecheck
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Thomas Foster

## Acknowledgments

Built with:
- [Effect](https://effect.website/) - The Effect TypeScript framework
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node) - Official Stripe SDK
