/**
 * AccountLink resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as AccountLink from "@thomasfosterau/effect-payments-stripe/AccountLink";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createAccountLink = (accountId: string) =>
 *   AccountLink.create({
 *     account: accountId,
 *     type: "account_onboarding",
 *     refresh_url: "https://example.com/reauth",
 *     return_url: "https://example.com/return",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const accountLink = yield* createAccountLink("acct_123");
 *   return accountLink;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, stripeRequest } from "./internal/index.js";
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create an account link
 */
export const create = (
  params: Stripe.AccountLinkCreateParams,
): Effect.Effect<Stripe.AccountLink, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/account_links", params);
