/**
 * AccountLink resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as AccountLink from "@thomasfosterau/effect-payments-stripe/AccountLink";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create an account link
 */
export const create = (
  params: Stripe.AccountLinkCreateParams,
): Effect.Effect<Stripe.AccountLink, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accountLinks.create(params));
