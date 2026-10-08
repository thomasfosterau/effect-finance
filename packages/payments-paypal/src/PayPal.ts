/**
 * The PayPal client service.
 *
 * PayPal authenticates with an OAuth 2.0 client-credentials access token. This
 * service hides that exchange: it lazily fetches a token using HTTP Basic auth,
 * caches it until shortly before expiry, and exposes a single
 * {@link PayPalClient.request} method for calls of your own to PayPal's REST
 * API. The capability layers (`PayPalPayments`) run on Distilled's PayPal
 * operations instead, authenticated by the same login (`layer` / `layerFromEnv`
 * there take this module's {@link PayPalConfig}).
 *
 * Every call goes through `effect/http`'s `HttpClient`, which the
 * layers require: provide `FetchHttpClient.layer` in production, or a stub
 * `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests.
 *
 * @module
 */

import { Context, Effect, Layer, type Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import {
  type PaymentConfigError,
  PaymentInvalidRequestError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { configFromEnv, isOk, sessionOf, send } from "./internal/auth.js";
import { errorBodyOf, handlePayPalError } from "./internal/error.js";

/**
 * Which PayPal environment a client talks to: `live` (real money) or
 * `sandbox` (PayPal's test environment).
 */
export type PayPalEnvironment = "live" | "sandbox";

/** Configuration for the PayPal client. */
export interface PayPalConfig {
  readonly clientId: string;
  /** The client secret, kept `Redacted` so it never reaches a log line or an error. */
  readonly clientSecret: Redacted.Redacted<string>;
  /**
   * The environment to talk to, which selects the API base URL: `live`
   * (`https://api-m.paypal.com`) or `sandbox`
   * (`https://api-m.sandbox.paypal.com`). Defaults to `live`; `baseUrl`, when
   * set, wins over it. `layerFromEnv` always passes it (`PAYPAL_ENV` is
   * required there).
   */
  readonly environment?: PayPalEnvironment | undefined;
  /**
   * Override the API base URL (by default the {@link PayPalConfig.environment}'s
   * endpoint). Must be an absolute http(s) URL: an empty or relative value
   * fails `make` with {@link PaymentConfigError} rather than falling back to
   * an environment's endpoint.
   */
  readonly baseUrl?: string | undefined;
  /**
   * How long the token login may take, in milliseconds, before it fails with
   * `PaymentNetworkError`. Defaults to 30 000; `Infinity` disables it, and
   * `0`, a negative number or `NaN` fails with `PaymentConfigError`. Logins are
   * serialised, so a login that never answers would otherwise stall every
   * request on the client. Callers that arrive while a login is in flight
   * share its outcome, so each waits at most about one `loginTimeout`; the next
   * call after a failure logs in afresh (#65).
   */
  readonly loginTimeout?: number | undefined;
  /**
   * How long a resource request may take (response headers and body), in
   * milliseconds, before it fails with `PaymentNetworkError`. Defaults to
   * 80 000, the Stripe transport's per-attempt timeout; `Infinity` disables it.
   * It does not include acquiring a token (see `loginTimeout`). A non-GET that
   * times out has an unknown outcome — the vendor may have applied it — so do
   * not blindly retry a write (#66).
   */
  readonly timeout?: number | undefined;
}

/** A request issued through the PayPal client. */
export interface PayPalRequest {
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path beginning with a slash, e.g. `/v2/checkout/orders`. */
  readonly path: string;
  readonly query?: Record<string, string | number | undefined> | undefined;
  readonly body?: unknown | undefined;
  /**
   * A `PayPal-Request-Id` for a `POST`: makes one logical write safe to
   * repeat. Create it once, before the first attempt, and send the same value
   * on every retry of that write; PayPal then returns the original outcome
   * instead of applying the write again. Sent verbatim, on `POST` only (PayPal
   * documents the header for `POST`, and not for every endpoint: a `POST` to
   * an endpoint that ignores it is simply not deduplicated). PayPal's OpenAPI
   * specifications set the limits per API: Orders (`/v2/checkout/orders` and
   * its `capture`) takes 1 to 108 characters and keeps the id for 6 hours by
   * default (up to 72 on request to PayPal); Catalog Products
   * (`/v1/catalogs/products`) and Subscriptions (`/v1/billing/plans`,
   * `/v1/billing/subscriptions`) state no length limit and keep it for 72
   * hours; Payments (refunds) takes 1 to
   * 10 000 characters and states no retention. An empty string fails with
   * `PaymentInvalidRequestError` before anything is sent, and a `GET`,
   * `PATCH` or `DELETE` carrying one is rejected the same way rather than
   * silently ignoring it.
   */
  readonly requestId?: string | undefined;
}

/**
 * The PayPal client: one authenticated `request` function over PayPal's REST
 * API. The capability layers no longer depend on it (they run on Distilled's
 * operations); a program can use it for endpoints they do not cover.
 */
export class PayPalClient extends Context.Service<
  PayPalClient,
  {
    /**
     * Send `request` and succeed with the response's JSON body (`{}` when it
     * is empty or not JSON), unchecked: decode it with a `Schema` for the
     * shape you read.
     */
    readonly request: (request: PayPalRequest) => Effect.Effect<unknown, PaymentsError>;
  }
>()("@effect-payments-paypal/PayPalClient") {}

const buildUrl = (baseUrl: string, path: string, query: PayPalRequest["query"]): string => {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

/**
 * Why a `requestId` cannot be honoured, or `undefined` when it can: it is
 * empty, or the method is not a `POST`. Refusing beats sending a header
 * PayPal ignores, which would leave the caller believing a retry is safe.
 */
const requestIdRejection = (
  method: PayPalRequest["method"],
  requestId: string,
): PaymentInvalidRequestError | undefined => {
  if (requestId === "") {
    return new PaymentInvalidRequestError({ message: "PayPal requestId must not be empty" });
  }
  if (method !== "POST") {
    return new PaymentInvalidRequestError({
      message: `PayPal requestId applies to POST requests only (got ${method})`,
    });
  }
  return undefined;
};

/**
 * Build a PayPal client from configuration.
 */
export const make = (
  config: PayPalConfig,
): Effect.Effect<PayPalClient["Service"], PaymentConfigError, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    const session = yield* sessionOf(config);
    const http = yield* HttpClient.HttpClient;

    const request = (req: PayPalRequest): Effect.Effect<unknown, PaymentsError> =>
      Effect.gen(function* () {
        if (req.requestId !== undefined) {
          const rejection = requestIdRejection(req.method, req.requestId);
          if (rejection !== undefined) return yield* rejection;
        }
        const token = yield* session.token;
        const base = HttpClientRequest.make(req.method)(
          buildUrl(session.baseUrl, req.path, req.query),
        ).pipe(
          HttpClientRequest.bearerToken(token),
          HttpClientRequest.acceptJson,
          // `PayPal-Request-Id` (validated above): how a retried write is
          // recognised as the same write.
          (built) =>
            req.requestId === undefined
              ? built
              : HttpClientRequest.setHeader(built, "PayPal-Request-Id", req.requestId),
        );
        // `Content-Type: application/json` goes on EVERY request, body or not,
        // as it did before the move to HttpClient: PayPal answers a bodyless
        // POST (`/v1/billing/plans/{id}/activate`) without it with 415.
        const reply = yield* send(
          http,
          req.body != null
            ? HttpClientRequest.bodyJsonUnsafe(base, req.body)
            : HttpClientRequest.setHeader(base, "Content-Type", "application/json"),
          session.timeout,
          "request",
        );
        // A revoked or rotated token: forget it (if it is still the stored
        // one), so the next call logs in again.
        if (reply.status === 401) yield* session.forget(token);
        if (!isOk(reply.status)) {
          return yield* handlePayPalError(reply.status, errorBodyOf(reply.json));
        }
        return reply.json;
      });

    return { request };
  });

/** Create a PayPal client layer from configuration. */
export const layer = (
  config: PayPalConfig,
): Layer.Layer<PayPalClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(PayPalClient, make(config));

/**
 * Create a PayPal client layer from configuration variables (read through the
 * current `ConfigProvider`, which defaults to the process environment).
 * `PAYPAL_ENV` is required and must be `live` or `sandbox`: it selects the
 * endpoint, so a missing or misspelt value fails with
 * {@link PaymentConfigError} instead of silently selecting live.
 * `PAYPAL_BASE_URL`, when set, overrides the endpoint `PAYPAL_ENV` selects
 * (`PAYPAL_ENV` is still required).
 * An empty variable counts as unset (Effect rc.118 reads an empty string as
 * missing): an empty id, secret or `PAYPAL_ENV` fails with
 * {@link PaymentConfigError}, an empty `PAYPAL_BASE_URL` selects the
 * `PAYPAL_ENV` endpoint.
 */
export const layerFromEnv = (
  clientIdVar = "PAYPAL_CLIENT_ID",
  clientSecretVar = "PAYPAL_CLIENT_SECRET",
): Layer.Layer<PayPalClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(PayPalClient, Effect.flatMap(configFromEnv(clientIdVar, clientSecretVar), make));
