---
"@thomasfosterau/effect-payments-airwallex": patch
---

Convert money with integer arithmetic, never float multiplication.

- **Response amounts.** A response amount is read from the shortest decimal form of the double `JSON.parse` produced (exponent notation included). It fails with `PaymentProviderError`, never silently rounded, in three cases:
  - it has more decimals than its currency allows (e.g. `10.005` USD);
  - it is beyond the safe-integer range in minor units;
  - its double is ambiguous, because a different amount (or one with excess decimals) parses to the same double. For two-decimal currencies this affects some amounts at or above 2^45 major units, e.g. `45035996273704.95` USD.

  Guarantee: an accepted amount is the wire value rounded to the nearest minor unit, and exact when the wire text has at most `exponent` decimals. Excess digits are not always caught: `10721136062241.369` shares a double with `.37` and is accepted as `.37`, and digits finer than a double can resolve (e.g. `0.30000000000000001`) cannot be detected. Rejection starts at about 2^45 major units for two-decimal currencies, 2^42 for three-decimal ones and 2^52 (even integers) for zero-decimal ones.

- **Request amounts.** A request amount (a payment intent's or a partial refund's `amount`) fails with `PaymentInvalidRequestError` before anything is sent when it is negative, not a safe integer, or has no JSON number carrying it exactly. A partial refund checks its amount before looking up the payment intent's currency.
