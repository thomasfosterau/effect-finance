---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Add `@thomasfosterau/effect-payments/internal`, a documented subpath that is internal and exempt from semver, holding the helpers the PayPal and Airwallex providers share: `shareLogin` and the vendor-neutral integer money core (`exponentFrom`, `scaleToMinor`, `parseDecimal`, `decimalText`, `formatDecimal`, `checkMinorUnits`). It is not public API and application code should not import it.

The PayPal and Airwallex providers import these helpers from it rather than carrying copies of their own.
