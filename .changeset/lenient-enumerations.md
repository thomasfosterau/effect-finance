---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

Lenient decoding of provider enumerations: a status or type value the neutral model does not cover no longer fails a whole object or list page, and no longer collapses silently onto a neutral fallback. It decodes to `Other` carrying the exact raw string the provider sent.

- **Core:** a new `Enumeration` subpath (`@thomasfosterau/effect-payments/Enumeration`, also `Enumeration` from the root) with the shared catch-all `Other` (`{ _tag: "Other", raw: string }`), `other(raw)`, `isOther`, `lenient`, `parse` and `fromWire`. `PaymentStatus`, `SubscriptionStatus`, `RefundStatus`, `Price.type` (the new `PriceType`) and `RecurringInterval` are now `Known | Other`; the known literals are unchanged bare strings and are exported as `KnownPaymentStatus`, `KnownSubscriptionStatus`, `KnownRefundStatus`, `KnownPriceType` and `KnownRecurringInterval`.
- **Breaking type change (pre-1.0, so `minor`):** the widened types break consumers that match a status, price type or interval exhaustively (`Match.exhaustive`, a `switch` with a `never` default, a `Record<PaymentStatus, …>`): add a case for `Other` with `Enumeration.isOther(status)` (a bare `status._tag` check does not type-check, since the known members are plain strings). Code that compares against a known literal (`status === "succeeded"`) is unaffected. Request inputs that name a value (`Subscription.ListParams.status`, `Price.CreateParams.recurring.interval`) now take the `Known*` type, since only a known value can be requested.
- **Stripe:** payment intent `status`, subscription `status`, refund `status`, price `type` and recurring `interval` decode leniently. Previously one unrecognised value failed the call with `PaymentProviderError`, and in a list it failed the whole page.
- **PayPal / Airwallex:** an unrecognised order, subscription or refund status (and PayPal billing interval unit) becomes `Other` instead of the old silent fallback (`processing` / `incomplete` / `pending` / `month`). Recognised values map as before; a value that used to fall through to the fallback now surfaces as `Other`, so a caller who depended on the fallback must handle `Other`.
