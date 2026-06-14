---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
---

Split the library into a vendor-neutral payments core and a Stripe
implementation, modelled on Effect's AI packages (`@effect/ai` +
`@effect/ai-openai`).

- **`@thomasfosterau/effect-payments`** — a new, vendor-neutral core. It
  defines provider-agnostic capabilities (`Customers`, `Products`, `Prices`,
  `PaymentIntents`, `Subscriptions`, `Refunds`), neutral domain entities
  (`Customer`, `Product`, `Price`, `PaymentIntent`, `Subscription`, `Refund`,
  `Money`) and a neutral error channel (`PaymentsError`). Programs written
  against the core run on any provider.

- **`@thomasfosterau/effect-payments-stripe`** — the Stripe implementation
  (formerly `@thomasfosterau/effect-stripe`). It supplies `Layer`s that
  implement the neutral capabilities on top of the Stripe SDK
  (`StripePayments.layer` / `layerFromEnv`), and continues to expose the full
  set of Stripe-specific resource modules as a provider escape hatch.
