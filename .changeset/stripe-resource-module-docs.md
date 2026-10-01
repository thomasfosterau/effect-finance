---
"@thomasfosterau/effect-payments-stripe": patch
---

Rewrite the doc comments of the raw Stripe resource modules. Each module now opens with its endpoint and says that its results are typed with the `stripe` package's declarations and are not decoded (and, where one exists, points at the neutral capability); each operation names its HTTP method and path. The 44 near-identical per-module examples are removed; the entry point keeps one runnable example.
