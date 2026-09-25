/**
 * The Airwallex client service.
 *
 * Airwallex authenticates with a short-lived bearer token obtained by exchanging
 * a client id + API key. This service hides that handshake: it lazily logs in,
 * caches the token until shortly before it expires, and exposes a single
 * {@link AirwallexClient.request} method that the capability layers build upon.
 *
 * @module
 */

import { Context, Effect, Layer, Ref } from "effect";
import {
  PaymentConfigError,
  PaymentNetworkError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { handleAirwallexError, type AirwallexErrorBody } from "./internal/error.js";

const DEFAULT_BASE_URL = "https://api.airwallex.com";

/** Configuration for the Airwallex client. */
export interface AirwallexConfig {
  readonly clientId: string;
  readonly apiKey: string;
  /** Override the API base URL (defaults to the production endpoint). */
  readonly baseUrl?: string | undefined;
  /** Inject a custom `fetch` implementation (defaults to the global). */
  readonly fetch?: typeof fetch | undefined;
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
export class AirwallexClient extends Context.Tag("@effect-payments-airwallex/AirwallexClient")<
  AirwallexClient,
  {
    readonly request: <A>(request: AirwallexRequest) => Effect.Effect<A, PaymentsError>;
  }
>() {}

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

const parseJson = (response: Response): Effect.Effect<unknown> =>
  Effect.promise(() => response.json().catch(() => ({})));

/**
 * Build an Airwallex client from configuration.
 */
export const make = (
  config: AirwallexConfig,
): Effect.Effect<typeof AirwallexClient.Service, PaymentConfigError> =>
  Effect.gen(function* () {
    if (!config.clientId || !config.apiKey) {
      return yield* Effect.fail(
        new PaymentConfigError({
          message: "Airwallex clientId and apiKey are required",
        }),
      );
    }

    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    const fetchImpl = config.fetch ?? fetch;
    const tokenRef = yield* Ref.make<TokenState | null>(null);

    const doFetch = (
      url: string,
      init: RequestInit,
    ): Effect.Effect<Response, PaymentNetworkError> =>
      Effect.tryPromise({
        try: () => fetchImpl(url, init),
        catch: (cause) =>
          new PaymentNetworkError({
            message: cause instanceof Error ? cause.message : String(cause),
            cause,
          }),
      });

    const login: Effect.Effect<string, PaymentsError> = Effect.gen(function* () {
      const response = yield* doFetch(`${baseUrl}/api/v1/authentication/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": config.clientId,
          "x-api-key": config.apiKey,
        },
      });
      if (!response.ok) {
        const body = (yield* parseJson(response)) as AirwallexErrorBody;
        return yield* Effect.fail(handleAirwallexError(response.status, body));
      }
      const body = (yield* parseJson(response)) as {
        token: string;
        expires_at?: string | undefined;
      };
      const expiresAt = body.expires_at ? Date.parse(body.expires_at) : Date.now() + 25 * 60 * 1000;
      yield* Ref.set(tokenRef, { token: body.token, expiresAt });
      return body.token;
    });

    // Refresh a minute before expiry to avoid using a token mid-rotation.
    const getToken: Effect.Effect<string, PaymentsError> = Effect.gen(function* () {
      const current = yield* Ref.get(tokenRef);
      if (current && current.expiresAt - 60_000 > Date.now()) {
        return current.token;
      }
      return yield* login;
    });

    const request = <A>(req: AirwallexRequest): Effect.Effect<A, PaymentsError> =>
      Effect.gen(function* () {
        const token = yield* getToken;
        const response = yield* doFetch(buildUrl(baseUrl, req.path, req.query), {
          method: req.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: req.body != null ? JSON.stringify(req.body) : null,
        });
        if (!response.ok) {
          const body = (yield* parseJson(response)) as AirwallexErrorBody;
          return yield* Effect.fail(handleAirwallexError(response.status, body));
        }
        return (yield* parseJson(response)) as A;
      });

    return AirwallexClient.of({ request });
  });

/** Create an Airwallex client layer from configuration. */
export const layer = (config: AirwallexConfig): Layer.Layer<AirwallexClient, PaymentConfigError> =>
  Layer.effect(AirwallexClient, make(config));

/** Create an Airwallex client layer from environment variables. */
export const layerFromEnv = (
  clientIdVar = "AIRWALLEX_CLIENT_ID",
  apiKeyVar = "AIRWALLEX_API_KEY",
): Layer.Layer<AirwallexClient, PaymentConfigError> =>
  Layer.effect(
    AirwallexClient,
    Effect.suspend(() =>
      make({
        clientId: process.env[clientIdVar] ?? "",
        apiKey: process.env[apiKeyVar] ?? "",
        baseUrl: process.env.AIRWALLEX_BASE_URL,
      }),
    ),
  );
