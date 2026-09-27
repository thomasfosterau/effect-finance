---
"@thomasfosterau/effect-payments-airwallex": patch
---

Convert money exactly instead of through floats. A response amount is read from its exact decimal form (exponent notation included) with integer arithmetic; one with more decimals than its currency allows (e.g. `10.005` USD), or beyond the safe-integer range in minor units, now fails with `PaymentProviderError` instead of being silently rounded, and a large amount such as `45035996273704.95` USD decodes to exactly `4503599627370495` minor units. A request amount (a payment intent's or a partial refund's `amount`) that is negative, not a safe integer, or has no JSON number carrying it exactly now fails with `PaymentInvalidRequestError` before anything is sent.
