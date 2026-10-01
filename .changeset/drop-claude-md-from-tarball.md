---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Stop shipping the repository-internal `CLAUDE.md` in the npm tarball. It describes this repository's source layout and tests, which mean nothing to a consumer; the package README is the consumer-facing reference.
