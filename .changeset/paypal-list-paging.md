---
"@thomasfosterau/effect-payments-paypal": patch
---

PayPal's `Product.list` and `Price.list` can now go past the first page. When there is more, a page carries `nextCursor`, which encodes PayPal's next page number and the `limit`. Passed back as `startingAfter` with the same `limit`, it lists that page. Previously `startingAfter` was dropped and every call returned the first page.

An item id or a cursor for another `limit` fails with `PaymentInvalidRequestError` (`param: "startingAfter"`). So does the `active` filter, which PayPal cannot apply and which was previously ignored.
