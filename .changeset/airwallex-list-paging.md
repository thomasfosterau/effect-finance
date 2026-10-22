---
"@thomasfosterau/effect-payments-airwallex": patch
---

Airwallex's `Customer.list`, `PaymentIntent.list` and `Refund.list` can now go past the first page. When there is more, a page carries `nextCursor`, which encodes the next `page_num` and the `limit`. Passed back as `startingAfter` with the same `limit`, it lists that page. Previously `startingAfter` was dropped and every call returned the first page.

An item id or a cursor for another `limit` fails with `PaymentInvalidRequestError` (`param: "startingAfter"`). So do `Customer.list`'s `email` filter and `Refund.list`'s `charge` filter, which were previously ignored.
