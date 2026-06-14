/**
 * The PayPal client service.
 *
 * PayPal authenticates with an OAuth 2.0 client-credentials access token. This
 * service hides that exchange: it lazily fetches a token using HTTP Basic auth,
 * caches it until shortly before expiry, and exposes a single
 * {@link PayPalClient.request} method that the capability layers build upon.
 *
 * @module
 */

import { Context, Effect, Layer, Ref } from "effect";
import {
  PaymentConfigError,
  PaymentNetworkError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { handlePayPalError, type PayPalErrorBody } from "./internal/error.js";

const DEFAULT_BASE_URL = "https://api-m.paypal.com";

/** Configuration for the PayPal client. */
export interface PayPalConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  /**
   * Override the API base URL. Defaults to the production endpoint; use
   * `https://api-m.sandbox.paypal.com` for sandbox.
   */
  readonly baseUrl?: string;
  /** Inject a custom `fetch` implementation (defaults to the global). */
  readonly fetch?: typeof fetch;
}

/** A request issued through the PayPal client. */
export interface PayPalRequest {
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path beginning with a slash, e.g. `/v2/checkout/orders`. */
  readonly path: string;
  readonly query?: Record<string, string | number | undefined>;
  readonly body?: unknown;
}

/**
 * The PayPal client. Capability layers depend on this service; tests can provide
 * a fake implementation of {@link PayPalClient.request}.
 */
export class PayPalClient extends Context.Tag(
  "@effect-payments-paypal/PayPalClient"
)<
  PayPalClient,
  {
    readonly request: <A>(
      request: PayPalRequest
    ) => Effect.Effect<A, PaymentsError>;
  }
>() {}

interface TokenState {
  readonly token: string;
  readonly expiresAt: number;
}

const buildUrl = (
  baseUrl: string,
  path: string,
  query: PayPalRequest["query"]
): string => {
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
 * Build a PayPal client from configuration.
 */
export const make = (
  config: PayPalConfig
): Effect.Effect<typeof PayPalClient.Service, PaymentConfigError> =>
  Effect.gen(function* () {
    if (!config.clientId || !config.clientSecret) {
      return yield* Effect.fail(
        new PaymentConfigError({
          message: "PayPal clientId and clientSecret are required",
        })
      );
    }

    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    const fetchImpl = config.fetch ?? fetch;
    const basicAuth = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString("base64");
    const tokenRef = yield* Ref.make<TokenState | null>(null);

    const doFetch = (
      url: string,
      init: RequestInit
    ): Effect.Effect<Response, PaymentNetworkError> =>
      Effect.tryPromise({
        try: () => fetchImpl(url, init),
        catch: (cause) =>
          new PaymentNetworkError({
            message: cause instanceof Error ? cause.message : String(cause),
            cause,
          }),
      });

    const login: Effect.Effect<string, PaymentsError> = Effect.gen(
      function* () {
        const response = yield* doFetch(`${baseUrl}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
          },
          body: "grant_type=client_credentials",
        });
        if (!response.ok) {
          const body = (yield* parseJson(response)) as PayPalErrorBody;
          return yield* Effect.fail(handlePayPalError(response.status, body));
        }
        const body = (yield* parseJson(response)) as {
          access_token: string;
          expires_in?: number;
        };
        const expiresAt = Date.now() + (body.expires_in ?? 1800) * 1000;
        yield* Ref.set(tokenRef, { token: body.access_token, expiresAt });
        return body.access_token;
      }
    );

    // Refresh a minute before expiry to avoid using a token mid-rotation.
    const getToken: Effect.Effect<string, PaymentsError> = Effect.gen(
      function* () {
        const current = yield* Ref.get(tokenRef);
        if (current && current.expiresAt - 60_000 > Date.now()) {
          return current.token;
        }
        return yield* login;
      }
    );

    const request = <A>(req: PayPalRequest): Effect.Effect<A, PaymentsError> =>
      Effect.gen(function* () {
        const token = yield* getToken;
        const response = yield* doFetch(
          buildUrl(baseUrl, req.path, req.query),
          {
            method: req.method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: req.body != null ? JSON.stringify(req.body) : undefined,
          }
        );
        if (!response.ok) {
          const body = (yield* parseJson(response)) as PayPalErrorBody;
          return yield* Effect.fail(handlePayPalError(response.status, body));
        }
        return (yield* parseJson(response)) as A;
      });

    return PayPalClient.of({ request });
  });

/** Create a PayPal client layer from configuration. */
export const layer = (
  config: PayPalConfig
): Layer.Layer<PayPalClient, PaymentConfigError> =>
  Layer.effect(PayPalClient, make(config));

/** Create a PayPal client layer from environment variables. */
export const layerFromEnv = (
  clientIdVar = "PAYPAL_CLIENT_ID",
  clientSecretVar = "PAYPAL_CLIENT_SECRET"
): Layer.Layer<PayPalClient, PaymentConfigError> =>
  Layer.effect(
    PayPalClient,
    Effect.suspend(() =>
      make({
        clientId: process.env[clientIdVar] ?? "",
        clientSecret: process.env[clientSecretVar] ?? "",
        baseUrl: process.env.PAYPAL_BASE_URL,
      })
    )
  );
