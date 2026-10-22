---
"@thomasfosterau/effect-payments-stripe": patch
---

`StripeHttp` applies stripe-node's `/v2` request policy (#181). A `/v2` `DELETE` (`V2.Core.EventDestination.del`, `V2.Core.AccountPerson.del`, …) sent without a caller's `idempotencyKey` now carries a generated `Idempotency-Key`, reused across the client's retries, so a retry after a lost response replays the deletion instead of failing as not found (a `/v1` `DELETE` still gets none, as in the SDK). A `/v2` request's array query params are sent indexed (`include[0]=identity&include[1]=…`), as stripe-node and stripe-python send them, where Distilled sent repeated `include[]` keys; `/v1` queries are unchanged.
