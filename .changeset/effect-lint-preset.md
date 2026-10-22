---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Rewrite the internals to the Effect oxlint preset's idioms (subpath `effect/<Module>` imports, `Effect.fn`, `Match`, `Schema.fromJsonString`, `effect/Array` / `effect/Record` helpers). Behaviour is unchanged except at these edges:

- PayPal and Airwallex parse vendor timestamps with `DateTime` through the shared `epochSecondsOf` in `./internal`. A timestamp without a zone is read as UTC rather than in the host's local zone; both vendors send zoned timestamps.
- `./internal`'s `exponentFrom` takes two `HashSet`s instead of native `ReadonlySet`s (`./internal` is exempt from semver).
- The provider logins (`PayPal.login`, `Airwallex.login`), `StripeHttp.layerFromEnv` and Airwallex's `Refunds.create` run inside named tracing spans.
- On the SDK-based Stripe `Webhook.constructEvent*` path, a thrown non-`Error` value that carries a string `message` reports that message instead of `String(value)`.
