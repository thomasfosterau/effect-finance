/**
 * The PayPal client service.
 *
 * PayPal authenticates with an OAuth 2.0 client-credentials access token. This
 * service hides that exchange: it lazily fetches a token using HTTP Basic auth,
 * caches it until shortly before expiry, and exposes a single
 * {@link PayPalClient.request} method that the capability layers build upon.
 *
 * Every call goes through `effect/http`'s `HttpClient`, which the
 * layers require: provide `FetchHttpClient.layer` in production, or a stub
 * `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests.
 *
 * @module
 */

import {
  Clock,
  Config,
  Context,
  Duration,
  Effect,
  Layer,
  Option,
  Redacted,
  Ref,
  Schema,
} from "effect";
import { Base64 } from "effect/encoding";
import {
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  type HttpClientResponse,
} from "effect/http";
import {
  PaymentConfigError,
  PaymentInvalidRequestError,
  PaymentNetworkError,
  PaymentProviderError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { shareLogin } from "./internal/sharedLogin.js";
import { handlePayPalError, PayPalErrorBody, PROVIDER } from "./internal/error.js";

const DEFAULT_BASE_URL = "https://api-m.paypal.com";
/** A login that has not answered after 30 s is abandoned. */
const DEFAULT_LOGIN_TIMEOUT_MS = 30_000;
/** A resource request is abandoned after 80 s, the Stripe transport default. */
const DEFAULT_TIMEOUT_MS = 80_000;

/** Configuration for the PayPal client. */
export interface PayPalConfig {
  readonly clientId: string;
  /** The client secret, kept `Redacted` so it never reaches a log line or an error. */
  readonly clientSecret: Redacted.Redacted<string>;
  /**
   * Override the API base URL. Defaults to the production endpoint; use
   * `https://api-m.sandbox.paypal.com` for sandbox. Must be an absolute
   * http(s) URL: an empty or relative value fails `make` with
   * {@link PaymentConfigError} rather than falling back to production.
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
   * an endpoint that ignores it is simply not deduplicated). PayPal limits the
   * id to about 108 characters and keeps it for a limited time that differs
   * per API; both figures are unverified (#93). An empty string fails with
   * `PaymentInvalidRequestError` before anything is sent, and a `GET`,
   * `PATCH` or `DELETE` carrying one is rejected the same way rather than
   * silently ignoring it.
   */
  readonly requestId?: string | undefined;
}

/**
 * The PayPal client. Capability layers depend on this service; tests can provide
 * a fake implementation of {@link PayPalClient.request}.
 */
export class PayPalClient extends Context.Service<
  PayPalClient,
  {
    /**
     * Send `request` and succeed with the response's JSON body (`{}` when it
     * is empty), unchecked: each capability layer decodes the body with the
     * `Schema` for the shape it reads (`internal/mapping.ts`).
     */
    readonly request: (request: PayPalRequest) => Effect.Effect<unknown, PaymentsError>;
  }
>()("@effect-payments-paypal/PayPalClient") {}

interface TokenState {
  readonly token: string;
  readonly expiresAt: number;
}

const buildUrl = (baseUrl: string, path: string, query: PayPalRequest["query"]): string => {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

/** The response body as JSON, or `{}` when it is empty or not JSON. */
const readJson = (response: HttpClientResponse.HttpClientResponse): Effect.Effect<unknown> =>
  response.json.pipe(Effect.orElseSucceed(() => ({})));

/** A response reduced to its status and JSON body. */
interface Reply {
  readonly status: number;
  readonly json: unknown;
}

/**
 * The underlying failure of an `HttpClientError`, without the request it
 * carries — whose headers hold the credentials.
 */
const causeOf = (error: HttpClientError.HttpClientError): unknown =>
  "cause" in error.reason ? error.reason.cause : undefined;

const isOk = (status: number): boolean => status >= 200 && status < 300;

/** The OAuth token response, decoded rather than trusted. */
const TokenResponse = Schema.Struct({
  access_token: Schema.String,
  expires_in: Schema.optional(Schema.Number),
});

/** A vendor error body, decoded leniently: an unexpected shape maps as absent. */
const errorBodyOf = (json: unknown): PayPalErrorBody | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(PayPalErrorBody)(json));

/**
 * A configured timeout as a `Duration`: a positive, finite number of
 * milliseconds, or `Infinity` for no timeout. Anything else — `0`, a negative
 * number, `NaN` — fails with {@link PaymentConfigError}.
 */
const timeoutOf = (
  name: string,
  millis: number,
): Effect.Effect<Duration.Duration, PaymentConfigError> =>
  millis === Number.POSITIVE_INFINITY || (Number.isFinite(millis) && millis > 0)
    ? Effect.succeed(Duration.millis(millis))
    : Effect.fail(
        new PaymentConfigError({
          message: `PayPal ${name} must be a positive number of milliseconds, or Infinity for none (got ${millis})`,
        }),
      );

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

/** Whether `value` parses as an absolute `http:` or `https:` URL (an empty string does not). */
const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Build a PayPal client from configuration.
 */
export const make = (
  config: PayPalConfig,
): Effect.Effect<PayPalClient["Service"], PaymentConfigError, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    if (!config.clientId || !Redacted.value(config.clientSecret)) {
      return yield* new PaymentConfigError({
        message: "PayPal clientId and clientSecret are required",
      });
    }

    if (config.baseUrl !== undefined && !isAbsoluteHttpUrl(config.baseUrl)) {
      return yield* new PaymentConfigError({
        message: "PayPal baseUrl must be an absolute http(s) URL (omit it for the live endpoint)",
      });
    }

    const http = yield* HttpClient.HttpClient;
    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    const basicAuth = Redacted.make(
      Base64.encode(`${config.clientId}:${Redacted.value(config.clientSecret)}`),
    );
    const tokenRef = yield* Ref.make(Option.none<TokenState>());

    const loginTimeout = yield* timeoutOf(
      "loginTimeout",
      config.loginTimeout ?? DEFAULT_LOGIN_TIMEOUT_MS,
    );
    const timeout = yield* timeoutOf("timeout", config.timeout ?? DEFAULT_TIMEOUT_MS);

    /**
     * Send `request` and read its JSON body, all within `limit`. A request that
     * has not finished by then is interrupted (which aborts the fetch) and
     * fails with {@link PaymentNetworkError}.
     */
    const send = (
      request: HttpClientRequest.HttpClientRequest,
      limit: Duration.Duration,
      what: string,
    ): Effect.Effect<Reply, PaymentNetworkError> =>
      http.execute(request).pipe(
        Effect.flatMap((response) =>
          Effect.map(readJson(response), (json): Reply => ({ status: response.status, json })),
        ),
        Effect.mapError(
          // The error's request carries the credentials in its headers:
          // keep only the underlying failure.
          (error) => new PaymentNetworkError({ message: error.message, cause: causeOf(error) }),
        ),
        Effect.timeoutOption(limit),
        Effect.flatMap(
          Option.match({
            onSome: Effect.succeed,
            onNone: () =>
              Effect.fail(
                new PaymentNetworkError({
                  message: `PayPal ${what} timed out after ${Duration.toMillis(limit)} ms`,
                }),
              ),
          }),
        ),
      );

    const login: Effect.Effect<string, PaymentsError> = Effect.gen(function* () {
      const reply = yield* send(
        HttpClientRequest.post(`${baseUrl}/v1/oauth2/token`).pipe(
          HttpClientRequest.setHeader("Authorization", `Basic ${Redacted.value(basicAuth)}`),
          HttpClientRequest.bodyText(
            "grant_type=client_credentials",
            "application/x-www-form-urlencoded",
          ),
        ),
        loginTimeout,
        "login",
      );
      if (!isOk(reply.status)) {
        return yield* handlePayPalError(reply.status, errorBodyOf(reply.json));
      }
      const body = yield* Schema.decodeUnknownEffect(TokenResponse)(reply.json).pipe(
        Effect.mapError(
          (cause) =>
            new PaymentProviderError({
              message: "PayPal returned a malformed OAuth token response",
              provider: PROVIDER,
              statusCode: reply.status,
              cause,
            }),
        ),
      );
      const now = yield* Clock.currentTimeMillis;
      const expiresAt = now + (body.expires_in ?? 1800) * 1000;
      yield* Ref.set(tokenRef, Option.some({ token: body.access_token, expiresAt }));
      return body.access_token;
    });

    // Refresh a minute before expiry to avoid using a token mid-rotation.
    const cachedToken: Effect.Effect<Option.Option<string>> = Effect.gen(function* () {
      const current = yield* Ref.get(tokenRef);
      const now = yield* Clock.currentTimeMillis;
      return Option.filter(current, (stored) => stored.expiresAt - 60_000 > now).pipe(
        Option.map((stored) => stored.token),
      );
    });
    // One login at a time, and its outcome is shared: concurrent first calls
    // (or calls racing an expiry) await the in-flight login and reuse its
    // token — or all fail with its error, after which the next call retries.
    const getToken = yield* shareLogin(cachedToken, login);

    const request = (req: PayPalRequest): Effect.Effect<unknown, PaymentsError> =>
      Effect.gen(function* () {
        if (req.requestId !== undefined) {
          const rejection = requestIdRejection(req.method, req.requestId);
          if (rejection !== undefined) return yield* rejection;
        }
        const token = yield* getToken;
        const base = HttpClientRequest.make(req.method)(
          buildUrl(baseUrl, req.path, req.query),
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
          req.body != null
            ? HttpClientRequest.bodyJsonUnsafe(base, req.body)
            : HttpClientRequest.setHeader(base, "Content-Type", "application/json"),
          timeout,
          "request",
        );
        if (reply.status === 401) {
          // A revoked or rotated token: forget it, so the next call logs in
          // again instead of replaying the rejected token until it expires —
          // but only if it is still the stored one. A late 401 for a token
          // another caller has already replaced must not clear the new one.
          yield* Ref.update(
            tokenRef,
            Option.filter((stored) => stored.token !== token),
          );
        }
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
 * `PAYPAL_BASE_URL` optionally overrides the endpoint.
 * An empty variable counts as unset (Effect rc.118 reads an empty string as
 * missing): an empty id or secret fails with {@link PaymentConfigError}, an
 * empty `PAYPAL_BASE_URL` selects the default endpoint.
 */
export const layerFromEnv = (
  clientIdVar = "PAYPAL_CLIENT_ID",
  clientSecretVar = "PAYPAL_CLIENT_SECRET",
): Layer.Layer<PayPalClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(
    PayPalClient,
    Effect.gen(function* () {
      const clientId = yield* Config.String(clientIdVar).pipe(Config.withDefault(""));
      const clientSecret = yield* Config.Redacted(clientSecretVar).pipe(
        Config.withDefault(Redacted.make("")),
      );
      const baseUrl = yield* Config.option(Config.String("PAYPAL_BASE_URL"));
      return yield* make({ clientId, clientSecret, baseUrl: Option.getOrUndefined(baseUrl) });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );
