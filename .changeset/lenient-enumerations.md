---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

Lenient decoding of provider enumerations: a status or type value the neutral model does not cover never fails a whole object or list page, and never collapses silently onto a neutral fallback. It decodes to `Other` carrying the exact raw string the provider sent.

- **Core:** a new `Enumeration` subpath (`@thomasfosterau/effect-payments/Enumeration`, also `Enumeration` from the root) with the shared catch-all `Other` (`{ _tag: "Other", raw: string }`), `other(raw)`, `isOther`, `lenient`, `parse` and `fromWire`. `PaymentStatus`, `SubscriptionStatus`, `RefundStatus`, `Price.type` (`PriceType`) and `RecurringInterval` are `Known | Other`; the known literals are bare strings, exported as `KnownPaymentStatus`, `KnownSubscriptionStatus`, `KnownRefundStatus`, `KnownPriceType` and `KnownRecurringInterval`.
- **Matching:** an exhaustive match over a status, price type or interval (`Match.exhaustive`, a `switch` with a `never` default, a `Record<PaymentStatus, …>`) needs a case for `Other` with `Enumeration.isOther(status)` (a bare `status._tag` check does not type-check, since the known members are plain strings). Comparing against a known literal (`status === "succeeded"`) works as usual. Request inputs that name a value (`Subscription.ListParams.status`, `Price.CreateParams.recurring.interval`) take the `Known*` type, since only a known value can be requested.
- **Stripe:** payment intent `status`, subscription `status`, refund `status`, price `type` and recurring `interval` decode leniently, so one unrecognised value never fails the call or its list page.
- **PayPal / Airwallex:** an unrecognised order, subscription or refund status (and PayPal billing interval unit) becomes `Other` rather than a neutral fallback.
