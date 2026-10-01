/**
 * Stripe's `/v1/files` API as a raw resource module, the escape hatch for what
 * the neutral capabilities do not cover. Results are typed with the `stripe`
 * package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest, stripeUpload } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Upload a file (multipart `POST /v1/files` on `files.stripe.com`).
 */
export const create = (
  params: Stripe.FileCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.File, StripeError, StripeHttp> =>
  stripeUpload("/v1/files", params, options);

/**
 * Retrieve a file (`GET /v1/files/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.FileRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.File, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/files/${id}`, params, options);

/**
 * List files (`GET /v1/files`).
 */
export const list = (
  params?: Stripe.FileListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.File>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/files", params, options);
