---
"@thomasfosterau/effect-payments-stripe": minor
---

The `Subscription`, `SubscriptionSchedule` and `Invoice` resource modules are typed by Schemas generated from Stripe's OpenAPI spec, with their responses decoded (the second slice of migrating the remaining resource modules off the `stripe` package's types).

- **`Subscription`** (`create`, `retrieve`, `update`, `cancel`, `list`), **`SubscriptionSchedule`** (`create`, `retrieve`, `update`, `cancel`, `release`, `list`) and **`Invoice`** (`create`, `retrieve`, `update`, `del`, `list`) export their Schemas (`Subscription`, `SubscriptionList`, `SubscriptionSchedule`, `SubscriptionScheduleList`, `Invoice`, `DeletedInvoice`, `InvoiceList`) and parameter types (`SubscriptionCreateParams`, `SubscriptionRetrieveParams`, `SubscriptionUpdateParams`, `SubscriptionCancelParams`, `SubscriptionListParams`; the same plus `SubscriptionScheduleReleaseParams` for `SubscriptionSchedule`; `InvoiceCreateParams`, `InvoiceRetrieveParams`, `InvoiceUpdateParams`, `InvoiceListParams`). These keep the SDK's names, so a call site only changes its import. Every response is decoded, and a 2xx body that does not match fails with `PaymentProviderError` instead of being cast. Their emitted `.d.ts` files do not import `stripe`.
- **Type changes.** The results are no longer `Stripe.Subscription`, `Stripe.SubscriptionSchedule`, `Stripe.Invoice`, `Stripe.DeletedInvoice` or `Stripe.ApiList<…>`. An expandable field (`customer`, `latest_invoice`, `default_payment_method`, `subscription`, `test_clock`, …) decodes as its id or, when expanded, an open JSON object. So does each resource a Stripe error object carries (`Invoice`'s `last_finalization_error.payment_intent`, `.setup_intent`, `.payment_method`, `.source`), which also breaks the error object's cycle through the intents. Response enumerations (`status`, `collection_method`, `billing_reason`, `end_behavior`, …) are lenient, so code that exhaustively matches one must also handle `Enumeration.Other`. Request enumerations stay closed to the pinned spec.
- **Parameters the SDK 18.5 types had and the pinned spec does not.** These no longer type-check:
  - the legacy `plan` in `SubscriptionCreateParams.items[]` and `SubscriptionUpdateParams.items[]`, in `SubscriptionScheduleCreateParams.phases[].items[]` and `SubscriptionScheduleUpdateParams.phases[].items[]`, and as the `SubscriptionListParams` filter (use `price`)
  - `SubscriptionScheduleUpdateParams.phases[].currency`
  - the `SubscriptionListParams` filter `automatic_tax: { enabled }`, which is now the flat, bracketed key `"automatic_tax[enabled]"` (also its wire name)

  The response types no longer name the legacy `plan` on a subscription item or a schedule phase item, nor `recurring.trial_period_days` on a subscription item's price. A value Stripe still sends for one is kept, untyped.

- **Parameter values the SDK 18.5 types accepted and the generated ones do not.** "Unset" is spelled `""` only: the SDK's `Emptyable` also took `null` (`Subscription.update(id, { description: null })`, `{ metadata: null }`). `metadata` values must be strings: the SDK also took `number` and `null` (`{ metadata: { seats: 3 } }`, `Invoice.update(id, { metadata: { k: null } })`). On the wire nothing changes (`null` was already sent as `""`). `payment_settings.payment_method_options.konbini` and `.sepa_debit` on `Invoice` and `Subscription` are open records, so an object literal still type-checks but a value typed with the SDK's interface does not.

- The neutral capability layer (`StripePayments.subscriptionsLayer`) is unchanged.
