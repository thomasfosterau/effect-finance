/**
 * File resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as File from "@thomasfosterau/effect-payments-stripe/File";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createFile = (file: Buffer, purpose: string) =>
 *   File.create({ file, purpose });
 *
 * const program = Effect.gen(function* () {
 *   const fileObj = yield* createFile(Buffer.from("..."), "dispute_evidence");
 *   return fileObj;
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
 * Create a file
 */
export const create = (
  params: Stripe.FileCreateParams,
): Effect.Effect<Stripe.File, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.files.create(params));

/**
 * Retrieve a file
 */
export const retrieve = (
  id: string,
  params?: Stripe.FileRetrieveParams,
): Effect.Effect<Stripe.File, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.files.retrieve(id, params));

/**
 * List files
 */
export const list = (
  params?: Stripe.FileListParams,
): Effect.Effect<Stripe.ApiList<Stripe.File>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.files.list(params));
