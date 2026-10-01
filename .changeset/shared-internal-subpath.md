---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Add `@thomasfosterau/effect-payments/internal`, a documented subpath that is internal and exempt from semver, and move the helpers the PayPal and Airwallex providers duplicated into it: `shareLogin` and the vendor-neutral integer money core (`exponentFrom`, `scaleToMinor`, `parseDecimal`, `decimalText`, `formatDecimal`, `checkMinorUnits`). It is not public API and application code should not import it.

The PayPal and Airwallex providers now import these helpers instead of carrying their own copies. This is an internal refactor with no change in behaviour.
