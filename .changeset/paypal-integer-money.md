---
"@thomasfosterau/effect-payments-paypal": patch
---

Convert PayPal money with integer arithmetic and PayPal's own currency table.

- Response amounts are parsed without a float: a value with more decimals than its currency allows (e.g. `"10.005"` USD), or beyond the safe-integer range in minor units, fails the decode with `PaymentProviderError`, never silently rounded, and large amounts are exact.
- `HUF` and `TWD` (like `JPY`) are formatted without decimals, as PayPal requires; three-decimal currencies such as `KWD` keep three.
- A request amount that is not a safe integer (e.g. `10.5` minor units) fails with `PaymentInvalidRequestError` before anything is sent.
