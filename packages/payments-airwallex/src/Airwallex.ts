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
  DateTime,
  Effect,
  Layer,
  Option,
  Ref,
  Schema,
  Semaphore,
} from "effect";
import { HttpClient, HttpClientRequest, type HttpClientResponse } from "effect/unstable/http";
import {
  PaymentConfigError,
  PaymentNetworkError,
  PaymentProviderError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { AirwallexErrorBody, handleAirwallexError, PROVIDER } from "./internal/error.js";

const DEFAULT_BASE_URL = "https://api.airwallex.com";

/** Configuration for the Airwallex client. */
export interface AirwallexConfig {
  readonly clientId: string;
  readonly apiKey: string;
  /** Override the API base URL (defaults to the production endpoint). */
  readonly baseUrl?: string | undefined;
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
    readonly request: <A>(request: AirwallexRequest) => Effect.Effect<A, PaymentsError>;
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
 * Build an Airwallex client from configuration.
 */
export const make = (
  config: AirwallexConfig,
): Effect.Effect<AirwallexClient["Service"], PaymentConfigError, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    if (!config.clientId || !config.apiKey) {
      return yield* new PaymentConfigError({
        message: "Airwallex clientId and apiKey are required",
      });
    }

    const http = yield* HttpClient.HttpClient;
    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    const tokenRef = yield* Ref.make(Option.none<TokenState>());
    // One login at a time: concurrent first calls (or calls racing an expiry)
    // wait for the in-flight login and then reuse its token.
    const tokenLock = yield* Semaphore.make(1);

    const execute = (
      request: HttpClientRequest.HttpClientRequest,
    ): Effect.Effect<HttpClientResponse.HttpClientResponse, PaymentNetworkError> =>
      http
        .execute(request)
        .pipe(
          Effect.mapError((cause) => new PaymentNetworkError({ message: cause.message, cause })),
        );

    const login: Effect.Effect<string, PaymentsError> = Effect.gen(function* () {
      const response = yield* execute(
        HttpClientRequest.post(`${baseUrl}/api/v1/authentication/login`).pipe(
          HttpClientRequest.setHeaders({
            "Content-Type": "application/json",
            "x-client-id": config.clientId,
            "x-api-key": config.apiKey,
          }),
        ),
      );
      if (!isOk(response.status)) {
        return yield* handleAirwallexError(response.status, errorBodyOf(yield* readJson(response)));
      }
      const body = yield* Schema.decodeUnknownEffect(LoginResponse)(yield* readJson(response)).pipe(
        Effect.mapError(
          (cause) =>
            new PaymentProviderError({
              message: "Airwallex returned a malformed login response",
              provider: PROVIDER,
              statusCode: response.status,
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

    // Refresh a minute before expiry to avoid using a token mid-rotation. The
    // check runs under `tokenLock`, so only the first caller logs in.
    const getToken: Effect.Effect<string, PaymentsError> = tokenLock.withPermits(1)(
      Effect.gen(function* () {
        const current = yield* Ref.get(tokenRef);
        const now = yield* Clock.currentTimeMillis;
        if (Option.isSome(current) && current.value.expiresAt - 60_000 > now) {
          return current.value.token;
        }
        return yield* login;
      }),
    );

    const request = <A>(req: AirwallexRequest): Effect.Effect<A, PaymentsError> =>
      Effect.gen(function* () {
        const token = yield* getToken;
        const base = HttpClientRequest.make(req.method)(
          buildUrl(baseUrl, req.path, req.query),
        ).pipe(HttpClientRequest.bearerToken(token), HttpClientRequest.acceptJson);
        // `Content-Type: application/json` goes on EVERY request, body or not,
        // as it did before the move to HttpClient: PayPal answers a bodyless
        // POST (`/v1/billing/plans/{id}/activate`) without it with 415.
        const response = yield* execute(
          req.body != null
            ? HttpClientRequest.bodyJsonUnsafe(base, req.body)
            : HttpClientRequest.setHeader(base, "Content-Type", "application/json"),
        );
        if (response.status === 401) {
          // A revoked or rotated token: forget it, so the next call logs in
          // again instead of replaying the rejected token until it expires.
          yield* Ref.set(tokenRef, Option.none());
        }
        if (!isOk(response.status)) {
          return yield* handleAirwallexError(
            response.status,
            errorBodyOf(yield* readJson(response)),
          );
        }
        // SAFETY: NOT checked — `request<A>` is the client's untyped escape
        // hatch, and each capability layer names the Airwallex shape it
        // expects (see internal/mapping.ts).
        return (yield* readJson(response)) as A;
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
      const apiKey = yield* Config.String(apiKeyVar).pipe(Config.withDefault(""));
      const baseUrl = yield* Config.option(Config.String("AIRWALLEX_BASE_URL"));
      return yield* make({ clientId, apiKey, baseUrl: Option.getOrUndefined(baseUrl) });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );
