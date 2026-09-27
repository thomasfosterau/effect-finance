/**
 * The Airwallex client service.
 *
 * Airwallex authenticates with a short-lived bearer token obtained by exchanging
 * a client id + API key. This service hides that handshake: it lazily logs in,
 * caches the token until shortly before it expires, and exposes a single
 * {@link AirwallexClient.request} method that the capability layers build upon.
 *
 * Every call goes through `effect/unstable/http`'s `HttpClient`, which the
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
  DateTime,
  Effect,
  Layer,
  Option,
  Redacted,
  Ref,
  Schema,
} from "effect";
import {
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  type HttpClientResponse,
} from "effect/unstable/http";
import {
  PaymentConfigError,
  PaymentNetworkError,
  PaymentProviderError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { shareLogin } from "./internal/sharedLogin.js";
import { AirwallexErrorBody, handleAirwallexError, PROVIDER } from "./internal/error.js";

const DEFAULT_BASE_URL = "https://api.airwallex.com";
/** A login that has not answered after 30 s is abandoned. */
const DEFAULT_LOGIN_TIMEOUT_MS = 30_000;
/** A resource request is abandoned after 80 s, the Stripe transport default. */
const DEFAULT_TIMEOUT_MS = 80_000;

/** Configuration for the Airwallex client. */
export interface AirwallexConfig {
  readonly clientId: string;
  /** The API key, kept `Redacted` so it never reaches a log line or an error. */
  readonly apiKey: Redacted.Redacted<string>;
  /** Override the API base URL (defaults to the production endpoint). */
  readonly baseUrl?: string | undefined;
  /**
   * How long the token login may take, in milliseconds, before it fails with
   * `PaymentNetworkError`. Defaults to 30 000; `Infinity` disables it, and
   * `0`, a negative number or `NaN` fails with `PaymentConfigError`. Logins are
   * serialised, so a login that never answers would otherwise stall every
   * request on the client. A caller queued behind a failed login makes its own
   * attempt, so the k-th queued caller can wait about k × `loginTimeout` (#65).
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

/** A request issued through the Airwallex client. */
export interface AirwallexRequest {
  readonly method: "GET" | "POST" | "DELETE";
  /** Path beginning with a slash, e.g. `/api/v1/pa/customers`. */
  readonly path: string;
  readonly query?: Record<string, string | number | undefined> | undefined;
  readonly body?: unknown | undefined;
}

/**
 * The Airwallex client. Capability layers depend on this service; tests can
 * provide a fake implementation of {@link AirwallexClient.request}.
 */
export class AirwallexClient extends Context.Service<
  AirwallexClient,
  {
    /**
     * Send `request` and succeed with the response's JSON body (`{}` when it
     * is empty), unchecked: each capability layer decodes the body with the
     * `Schema` for the shape it reads (`internal/mapping.ts`).
     */
    readonly request: (request: AirwallexRequest) => Effect.Effect<unknown, PaymentsError>;
  }
>()("@effect-payments-airwallex/AirwallexClient") {}

interface TokenState {
  readonly token: string;
  readonly expiresAt: number;
}

const buildUrl = (baseUrl: string, path: string, query: AirwallexRequest["query"]): string => {
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

/** The login response, decoded rather than trusted. */
const LoginResponse = Schema.Struct({
  token: Schema.String,
  expires_at: Schema.optional(Schema.String),
});

/** A vendor error body, decoded leniently: an unexpected shape maps as absent. */
const errorBodyOf = (json: unknown): AirwallexErrorBody | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(AirwallexErrorBody)(json));

/** Tokens without a parseable `expires_at` are assumed to last 25 minutes. */
const DEFAULT_TOKEN_LIFETIME_MS = 25 * 60 * 1000;

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
          message: `Airwallex ${name} must be a positive number of milliseconds, or Infinity for none (got ${millis})`,
        }),
      );

/**
 * Build an Airwallex client from configuration.
 */
export const make = (
  config: AirwallexConfig,
): Effect.Effect<AirwallexClient["Service"], PaymentConfigError, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    if (!config.clientId || !Redacted.value(config.apiKey)) {
      return yield* new PaymentConfigError({
        message: "Airwallex clientId and apiKey are required",
      });
    }

    const http = yield* HttpClient.HttpClient;
    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
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
                  message: `Airwallex ${what} timed out after ${Duration.toMillis(limit)} ms`,
                }),
              ),
          }),
        ),
      );

    const login: Effect.Effect<string, PaymentsError> = Effect.gen(function* () {
      const reply = yield* send(
        HttpClientRequest.post(`${baseUrl}/api/v1/authentication/login`).pipe(
          HttpClientRequest.setHeaders({
            "Content-Type": "application/json",
            "x-client-id": config.clientId,
            "x-api-key": Redacted.value(config.apiKey),
          }),
        ),
        loginTimeout,
        "login",
      );
      if (!isOk(reply.status)) {
        return yield* handleAirwallexError(reply.status, errorBodyOf(reply.json));
      }
      const body = yield* Schema.decodeUnknownEffect(LoginResponse)(reply.json).pipe(
        Effect.mapError(
          (cause) =>
            new PaymentProviderError({
              message: "Airwallex returned a malformed login response",
              provider: PROVIDER,
              statusCode: reply.status,
              cause,
            }),
        ),
      );
      const now = yield* Clock.currentTimeMillis;
      const expiresAt = Option.fromNullishOr(body.expires_at).pipe(
        Option.flatMap(DateTime.make),
        Option.map(DateTime.toEpochMillis),
        Option.getOrElse(() => now + DEFAULT_TOKEN_LIFETIME_MS),
      );
      yield* Ref.set(tokenRef, Option.some({ token: body.token, expiresAt }));
      return body.token;
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

    const request = (req: AirwallexRequest): Effect.Effect<unknown, PaymentsError> =>
      Effect.gen(function* () {
        const token = yield* getToken;
        const base = HttpClientRequest.make(req.method)(
          buildUrl(baseUrl, req.path, req.query),
        ).pipe(HttpClientRequest.bearerToken(token), HttpClientRequest.acceptJson);
        // `Content-Type: application/json` goes on EVERY request, body or not:
        // this restores the pre-HttpClient behaviour and keeps the client
        // consistent with the PayPal one.
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
          return yield* handleAirwallexError(reply.status, errorBodyOf(reply.json));
        }
        return reply.json;
      });

    return { request };
  });

/** Create an Airwallex client layer from configuration. */
export const layer = (
  config: AirwallexConfig,
): Layer.Layer<AirwallexClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(AirwallexClient, make(config));

/**
 * Create an Airwallex client layer from configuration variables (read through
 * the current `ConfigProvider`, which defaults to the process environment).
 * `AIRWALLEX_BASE_URL` optionally overrides the endpoint.
 */
export const layerFromEnv = (
  clientIdVar = "AIRWALLEX_CLIENT_ID",
  apiKeyVar = "AIRWALLEX_API_KEY",
): Layer.Layer<AirwallexClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(
    AirwallexClient,
    Effect.gen(function* () {
      const clientId = yield* Config.String(clientIdVar).pipe(Config.withDefault(""));
      const apiKey = yield* Config.Redacted(apiKeyVar).pipe(Config.withDefault(Redacted.make("")));
      const baseUrl = yield* Config.option(Config.String("AIRWALLEX_BASE_URL"));
      return yield* make({ clientId, apiKey, baseUrl: Option.getOrUndefined(baseUrl) });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );
