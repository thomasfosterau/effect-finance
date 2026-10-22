---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": patch
---

`Page` gains an optional `nextCursor`, the cursor of the next page. It is present when `hasMore` is set. To list the next page, pass it as the list params' `startingAfter`, with the same `limit` and filters. The cursor is opaque: only the provider that returned it reads it.

- Stripe sets `nextCursor` to the last item's id, which is its own `starting_after`. Passing any item id as `startingAfter` keeps working there.
- The core's semver-exempt `./internal` subpath gains `pageNumberedList`, which page-numbered providers use to encode and read back their cursors.
