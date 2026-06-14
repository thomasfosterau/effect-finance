---
"@thomasfosterau/effect-payments-paypal": minor
---

Add `@thomasfosterau/effect-payments-paypal`, a PayPal implementation of the
vendor-neutral payments core.

It implements the `Products`, `Prices` (billing plans), `PaymentIntents`
(orders), `Subscriptions` and `Refunds` capabilities on top of PayPal's REST
APIs (`PayPalPayments.layer` / `layerFromEnv`), including the OAuth
client-credentials handshake, neutral error mapping, and conversion between the
core's minor-unit amounts and PayPal's major-unit decimal strings. PayPal has no
first-class customer resource, so — unlike the Airwallex provider — it does not
implement `Customers`, demonstrating that providers can cover different subsets
of the neutral capabilities.
