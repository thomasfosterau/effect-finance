---
"@thomasfosterau/effect-payments-airwallex": patch
---

Convert money with integer arithmetic instead of float multiplication.

- **Response amounts.** A response amount is read from the shortest decimal form of the double `JSON.parse` produced (exponent notation included). It now fails with `PaymentProviderError` instead of being silently rounded in three cases:
  - it has more decimals than its currency allows (e.g. `10.005` USD);
  - it is beyond the safe-integer range in minor units;
  - its double is ambiguous, because a different amount (or one with excess decimals) parses to the same double. For two-decimal currencies this affects some amounts at or above 2^45 major units, e.g. `45035996273704.95` USD, which used to decode as `4503599627370496`.

  Excess digits finer than a double can resolve (e.g. `0.30000000000000001`) cannot be detected.

- **Request amounts.** A request amount (a payment intent's or a partial refund's `amount`) now fails with `PaymentInvalidRequestError` before anything is sent when it is negative, not a safe integer, or has no JSON number carrying it exactly. A partial refund checks its amount before looking up the payment intent's currency.
