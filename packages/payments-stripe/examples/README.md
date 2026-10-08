# Examples

These examples demonstrate `@thomasfosterau/effect-payments` (the vendor-neutral core) running on the `@thomasfosterau/effect-payments-stripe` provider.

## Running Examples

1. Install dependencies and build the packages from the repository root (the examples import the packages by name, which resolves to their built `dist/`):

   ```bash
   pnpm install
   vp run -r build
   ```

2. Set your Stripe API key (`basic.ts` and `subscription.ts` call the Stripe test-mode API; `webhooks.ts` runs offline and needs no key):

   ```bash
   export STRIPE_API_KEY=sk_test_your_key_here
   ```

3. Run an example with Node (22.18 or later strips the TypeScript types natively):

   ```bash
   node packages/payments-stripe/examples/basic.ts
   ```

## Available Examples

### basic.ts

Vendor-neutral usage: the program imports only from `@thomasfosterau/effect-payments` and selects Stripe at the edge with `StripePayments.layer`. Covers creating a customer, creating a payment intent, and handling neutral errors.

### subscription.ts

Vendor-neutral subscription workflow: create a customer, a product, a recurring price, and a subscription — all through the neutral core.

### webhooks.ts

Stripe-specific: a web-standard `Request` → `Response` webhook endpoint on the default, Workers-safe WebCrypto `Webhook.verify`. It verifies the raw body bytes against the `Stripe-Signature` header (`Webhook.SIGNATURE_HEADER`), reads the signing secret as a `Redacted` through `Config` (`STRIPE_WEBHOOK_SECRET`), answers every `SignatureVerificationError` with a bare 400, and narrows verified events to the handled types with `Webhook.decodeHandledEvent`, acknowledging the rest. Its demo signs test deliveries with `Webhook.signatureHeader` (a valid one, an unhandled type, a tampered body, a missing header, the wrong secret, a stale timestamp), so it needs neither a Stripe API key nor the network, and the optional `stripe` peer is not used. The SDK-based `Webhook.constructEvent` / `constructEventAsync` remain as an alternative that needs `stripe` and `Stripe.layer`.

## Note

These examples use Stripe test mode. Use test keys (starting with `sk_test_`), not live keys.
