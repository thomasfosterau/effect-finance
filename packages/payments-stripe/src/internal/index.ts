import { Effect, Predicate } from "effect";
import { PaymentInvalidRequestError, type PaymentsError } from "@thomasfosterau/effect-payments";
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
 * A built request path, or the invalid-request error a bad segment produced
 * (see {@link path}).
 */
export type RequestPath = string | PaymentInvalidRequestError;

/**
 * A request path with every interpolated value URI-encoded as one segment:
 * `` path`/v1/customers/${id}` ``. A segment that is not a non-empty string (an
 * `undefined` id from untyped code, or `""`) would silently address a
 * different endpoint — `/v1/customers/` is the list — so it yields a
 * {@link PaymentInvalidRequestError} instead, which the request fails with.
 */
export const path = (
  strings: TemplateStringsArray,
  ...segments: ReadonlyArray<string>
): RequestPath => {
  const invalid = segments.findIndex(
    (segment: unknown) => !Predicate.isString(segment) || segment === "",
  );
  if (invalid !== -1) {
    return new PaymentInvalidRequestError({
      message: `Path segment ${invalid + 1} of ${strings.join("{…}")} must be a non-empty string`,
    });
  }
  return strings.reduce(
    (built, literal, index) =>
      index === 0 ? literal : `${built}${encodeURIComponent(segments[index - 1] ?? "")}${literal}`,
    "",
  );
};

/** Run `f` on a valid path, or fail with the error a bad segment produced. */
export const withPath = <A, E, R>(
  requestPath: RequestPath,
  f: (valid: string) => Effect.Effect<A, E, R>,
): Effect.Effect<A, E | PaymentInvalidRequestError, R> =>
  Predicate.isString(requestPath) ? f(requestPath) : Effect.fail(requestPath);

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
  requestPath: RequestPath,
  params?: StripeParams | undefined,
): Effect.Effect<A, StripeError, StripeHttp> =>
  // SAFETY: NOT checked — see above. The shape is the one the Stripe API
  // documents for this path at the pinned `Stripe-Version`.
  withPath(requestPath, (valid) =>
    Effect.flatMap(StripeHttp, (http) => http.request({ method, path: valid, params })),
  ) as Effect.Effect<A, StripeError, StripeHttp>;

/**
 * Upload through the {@link StripeHttp} transport: a `multipart/form-data`
 * `POST` to the uploads origin (the Files API), unchecked like
 * {@link stripeRequest}.
 */
export const stripeUpload = <A>(
  requestPath: RequestPath,
  params: StripeParams,
): Effect.Effect<A, StripeError, StripeHttp> =>
  // SAFETY: NOT checked — see `stripeRequest`.
  withPath(requestPath, (valid) =>
    Effect.flatMap(StripeHttp, (http) =>
      http.request({ method: "POST", path: valid, params, upload: true }),
    ),
  ) as Effect.Effect<A, StripeError, StripeHttp>;
