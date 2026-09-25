---
"@thomasfosterau/effect-payments-airwallex": minor
---

Add `@thomasfosterau/effect-payments-airwallex`, an Airwallex implementation of the vendor-neutral payments core.

It implements the `Customers`, `PaymentIntents` and `Refunds` capabilities on top of Airwallex's payment-acceptance API (`AirwallexPayments.layer` / `layerFromEnv`), including the token handshake, neutral error mapping, and conversion between the core's minor-unit amounts and Airwallex's major-unit decimals. Because each capability is an independent service, Airwallex provides only the capabilities it supports — a program that uses just customers, payment intents and refunds runs unchanged on either Stripe or Airwallex.
