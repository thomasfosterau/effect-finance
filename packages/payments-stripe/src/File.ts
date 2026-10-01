/**
 * File resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as File from "@thomasfosterau/effect-payments-stripe/File";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createFile = (file: Buffer, purpose: string) =>
 *   File.create({ file, purpose });
 *
 * const program = Effect.gen(function* () {
 *   const fileObj = yield* createFile(Buffer.from("..."), "dispute_evidence");
 *   return fileObj;
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
import { path, type StripeError, stripeRequest, stripeUpload } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a file
 */
export const create = (
  params: Stripe.FileCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.File, StripeError, StripeHttp> =>
  stripeUpload("/v1/files", params, options);

/**
 * Retrieve a file
 */
export const retrieve = (
  id: string,
  params?: Stripe.FileRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.File, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/files/${id}`, params, options);

/**
 * List files
 */
export const list = (
  params?: Stripe.FileListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.File>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/files", params, options);
