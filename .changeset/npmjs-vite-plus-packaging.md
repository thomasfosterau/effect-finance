---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Publish to npmjs (via OIDC trusted publishing) instead of GitHub Packages, so installing no longer needs a `@thomasfosterau:registry` override or a GitHub token. Each subpath export now ships as a bundled ESM module with its own declaration file (`vp pack`), and the packages declare `"sideEffects": false` and `engines.node >= 22`.

Optional fields on this package family's own parameter and error types are now typed `?: T | undefined` (the Distilled types the Stripe resource modules re-export are not; see their changeset), so a consumer compiling with `exactOptionalPropertyTypes` can forward an optional value of its own.
