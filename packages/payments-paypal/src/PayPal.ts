/**
 * The PayPal client service.
 *
 * PayPal authenticates with an OAuth 2.0 client-credentials access token. This
 * service hides that exchange: it lazily fetches a token using HTTP Basic auth,
 * caches it until shortly before expiry, and exposes a single
 * {@link PayPalClient.request} method that the capability layers build upon.
 *
 * Every call goes through `effect/unstable/http`'s `HttpClient`, which the
 * layers require: provide `FetchHttpClient.layer` in production, or a stub
 * `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests.
 *
 * @module
 */

import { Clock, Config, Context, Effect, Encoding, Layer, Option, Ref, Schema } from "effect";
import { HttpClient, HttpClientRequest, type HttpClientResponse } from "effect/unstable/http";
import {
  PaymentConfigError,
  PaymentNetworkError,
  PaymentProviderError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { handlePayPalError, PayPalErrorBody, PROVIDER } from "./internal/error.js";

const DEFAULT_BASE_URL = "https://api-m.paypal.com";

/** Configuration for the PayPal client. */
export interface PayPalConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  /**
   * Override the API base URL. Defaults to the production endpoint; use
   * `https://api-m.sandbox.paypal.com` for sandbox.
   */
  readonly baseUrl?: string | undefined;
}

/** A request issued through the PayPal client. */
export interface PayPalRequest {
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path beginning with a slash, e.g. `/v2/checkout/orders`. */
  readonly path: string;
  readonly query?: Record<string, string | number | undefined> | undefined;
  readonly body?: unknown | undefined;
}

/**
 * The PayPal client. Capability layers depend on this service; tests can provide
 * a fake implementation of {@link PayPalClient.request}.
 */
export class PayPalClient extends Context.Service<
  PayPalClient,
  {
    readonly request: <A>(request: PayPalRequest) => Effect.Effect<A, PaymentsError>;
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
 * Build a PayPal client from configuration.
 */
export const make = (
  config: PayPalConfig,
): Effect.Effect<PayPalClient["Service"], PaymentConfigError, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    if (!config.clientId || !config.clientSecret) {
      return yield* new PaymentConfigError({
        message: "PayPal clientId and clientSecret are required",
      });
    }

    const http = yield* HttpClient.HttpClient;
    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    const basicAuth = Encoding.encodeBase64(`${config.clientId}:${config.clientSecret}`);
    const tokenRef = yield* Ref.make(Option.none<TokenState>());

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
        HttpClientRequest.post(`${baseUrl}/v1/oauth2/token`).pipe(
          HttpClientRequest.setHeader("Authorization", `Basic ${basicAuth}`),
          HttpClientRequest.bodyText(
            "grant_type=client_credentials",
            "application/x-www-form-urlencoded",
          ),
        ),
      );
      if (!isOk(response.status)) {
        return yield* handlePayPalError(response.status, errorBodyOf(yield* readJson(response)));
      }
      const body = yield* Schema.decodeUnknownEffect(TokenResponse)(yield* readJson(response)).pipe(
        Effect.mapError(
          (cause) =>
            new PaymentProviderError({
              message: "PayPal returned a malformed OAuth token response",
              provider: PROVIDER,
              statusCode: response.status,
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
    const getToken: Effect.Effect<string, PaymentsError> = Effect.gen(function* () {
      const current = yield* Ref.get(tokenRef);
      const now = yield* Clock.currentTimeMillis;
      if (Option.isSome(current) && current.value.expiresAt - 60_000 > now) {
        return current.value.token;
      }
      return yield* login;
    });

    const request = <A>(req: PayPalRequest): Effect.Effect<A, PaymentsError> =>
      Effect.gen(function* () {
        const token = yield* getToken;
        const base = HttpClientRequest.make(req.method)(
          buildUrl(baseUrl, req.path, req.query),
        ).pipe(HttpClientRequest.bearerToken(token), HttpClientRequest.acceptJson);
        const response = yield* execute(
          req.body != null ? HttpClientRequest.bodyJsonUnsafe(base, req.body) : base,
        );
        if (!isOk(response.status)) {
          return yield* handlePayPalError(response.status, errorBodyOf(yield* readJson(response)));
        }
        // SAFETY: NOT checked — `request<A>` is the client's untyped escape
        // hatch, and each capability layer names the PayPal shape it expects
        // (see internal/mapping.ts). Decoding each resource is #39-era work.
        return (yield* readJson(response)) as A;
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
 */
export const layerFromEnv = (
  clientIdVar = "PAYPAL_CLIENT_ID",
  clientSecretVar = "PAYPAL_CLIENT_SECRET",
): Layer.Layer<PayPalClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(
    PayPalClient,
    Effect.gen(function* () {
      const clientId = yield* Config.String(clientIdVar).pipe(Config.withDefault(""));
      const clientSecret = yield* Config.String(clientSecretVar).pipe(Config.withDefault(""));
      const baseUrl = yield* Config.option(Config.String("PAYPAL_BASE_URL"));
      return yield* make({ clientId, clientSecret, baseUrl: Option.getOrUndefined(baseUrl) });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );
