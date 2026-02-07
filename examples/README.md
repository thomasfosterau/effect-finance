# Examples

This directory contains examples demonstrating how to use the effect-stripe library.

## Running Examples

Before running the examples, make sure you have:

1. Installed dependencies:
   ```bash
   bun install
   ```

2. Set your Stripe API key:
   ```bash
   export STRIPE_API_KEY=sk_test_your_key_here
   ```

3. Run an example using Bun:
   ```bash
   bun examples/basic.ts
   ```

## Available Examples

### basic.ts
Demonstrates basic usage:
- Creating a customer
- Creating a payment intent
- Error handling

### subscription.ts
Demonstrates subscription workflow:
- Creating a customer
- Creating a product and price
- Creating a subscription

## Note

These examples use test mode Stripe API keys. Make sure to use test keys (starting with `sk_test_`) and not live keys.
