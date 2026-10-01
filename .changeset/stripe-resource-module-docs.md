---
"@thomasfosterau/effect-payments-stripe": patch
---

Rewrite the doc comments of the raw Stripe resource modules. Each module now opens with its endpoint, says that its results are typed with the `stripe` package's declarations and are not decoded (and, where one exists, points at the neutral capability), and names the layer to provide (`StripeHttp.layer` with `FetchHttpClient.layer`, or `Stripe.layer`); each operation names its HTTP method and path. The 44 near-identical per-module examples are replaced by one runnable example on `Customer`.
