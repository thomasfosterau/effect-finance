---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Add `@thomasfosterau/effect-payments/internal`, a documented subpath that is internal and exempt from semver, holding the helpers the Stripe, PayPal and Airwallex providers share. It is not public API and application code should not import it. It holds:

- `shareLogin`, one in-flight token login shared by every waiting caller;
- the vendor-neutral integer money core (`exponentFrom`, `scaleToMinor`, `parseDecimal`, `decimalText`, `formatDecimal`, `checkMinorUnits`);
- the token-login plumbing of an OAuth-style provider (`tokenCache`, `send`, `networkError`, `timedOut`, `timeoutOf`, `isAbsoluteHttpUrl`, `isOk`);
- the request helpers of a provider built over a generated operation client (`omitUndefined`, `checkId`, `stringField`, `observeResponses`, `rejectedError`).

None of them names a vendor or a client library. The Stripe, PayPal and Airwallex providers import these helpers from it rather than carrying copies of their own.
