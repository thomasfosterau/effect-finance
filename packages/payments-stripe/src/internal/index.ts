import { Effect } from "effect";
import type { PaymentsError } from "@thomasfosterau/effect-payments";
import { StripeHttp, type StripeMethod } from "../StripeHttp.js";
import type { StripeParams } from "./params.js";

/**
 * All possible errors that can occur during a Stripe API call, expressed in
 * terms of the vendor-neutral {@link PaymentsError} channel.
 *
 * Note: configuration errors are not included as they only occur during layer
 * initialization, not during API calls.
 */
export type StripeError = PaymentsError;

/**
 * A request path with every interpolated value URI-encoded as one segment:
 * `` path`/v1/customers/${id}` ``.
 */
export const path = (strings: TemplateStringsArray, ...segments: ReadonlyArray<string>): string =>
  strings.reduce(
    (built, literal, index) =>
      index === 0 ? literal : `${built}${encodeURIComponent(segments[index - 1] ?? "")}${literal}`,
    "",
  );

/**
 * Issue one Stripe API call through the {@link StripeHttp} transport in
 * context. Every resource module's operations are one call to this.
 *
 * The result is the response JSON as the resource module names it (the
 * `stripe` package's type for that resource at the pinned API version). It is
 * not decoded: the resource modules are the full-fidelity escape hatch, and
 * the capability layers decode the fields they read (`StripePayments`).
 */
export const stripeRequest = <A>(
  method: StripeMethod,
  requestPath: string,
  params?: StripeParams | undefined,
): Effect.Effect<A, StripeError, StripeHttp> =>
  // SAFETY: NOT checked — see above. The shape is the one the Stripe API
  // documents for this path at the pinned `Stripe-Version`.
  Effect.flatMap(StripeHttp, (http) =>
    http.request({ method, path: requestPath, params }),
  ) as Effect.Effect<A, StripeError, StripeHttp>;

/**
 * Upload through the {@link StripeHttp} transport: a `multipart/form-data`
 * `POST` to the uploads origin (the Files API), unchecked like
 * {@link stripeRequest}.
 */
export const stripeUpload = <A>(
  requestPath: string,
  params: StripeParams,
): Effect.Effect<A, StripeError, StripeHttp> =>
  // SAFETY: NOT checked — see `stripeRequest`.
  Effect.flatMap(StripeHttp, (http) =>
    http.request({ method: "POST", path: requestPath, params, upload: true }),
  ) as Effect.Effect<A, StripeError, StripeHttp>;
