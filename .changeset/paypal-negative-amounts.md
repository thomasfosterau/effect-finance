---
"@thomasfosterau/effect-payments-paypal": patch
---

Refuse a negative request amount (a price's `unitAmount`, an order's or a partial refund's `amount`) with `PaymentInvalidRequestError` before anything is sent to PayPal.
