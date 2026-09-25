/**
 * CountrySpec resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as CountrySpec from "@thomasfosterau/effect-payments-stripe/CountrySpec";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const usSpec = yield* CountrySpec.retrieve("US");
 *   const allSpecs = yield* CountrySpec.list({ limit: 10 });
 *   return { usSpec, allSpecs };
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
 * Retrieve a country spec
 */
export const retrieve = (
  country: string,
  params?: Stripe.CountrySpecRetrieveParams,
): Effect.Effect<Stripe.CountrySpec, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.countrySpecs.retrieve(country, params));

/**
 * List country specs
 */
export const list = (
  params?: Stripe.CountrySpecListParams,
): Effect.Effect<Stripe.ApiList<Stripe.CountrySpec>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.countrySpecs.list(params));
