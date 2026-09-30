---
"@thomasfosterau/effect-payments-airwallex": patch
---

Never send a request amount the response parser would refuse. A payment intent or partial-refund `amount` whose major-unit number does not read back as the same minor units (amounts from about 2^45 major units, roughly $35 trillion, in two-decimal currencies, from 2^42 in three-decimal ones, and even integers from 2^52 in zero-decimal ones) now fails with `PaymentInvalidRequestError` before anything is sent. Previously Airwallex created the intent and decoding its echo failed with `PaymentProviderError`, and a retry duplicated it.
