---
"@thomasfosterau/effect-payments": patch
---

`Price.CreateParams.recurring` is declared `?: … | undefined`, like every other optional parameter in the core, so a consumer compiling with `exactOptionalPropertyTypes` can forward a schedule that may be `undefined` (`Price.create({ …, recurring })`) (#95). An explicit `undefined` behaves exactly like an omitted `recurring`: a one-time price on Stripe, and `PaymentInvalidRequestError` on PayPal, which only creates recurring plans.
