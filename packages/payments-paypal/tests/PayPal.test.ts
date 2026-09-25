import { describe, it, expect } from "vite-plus/test";
import { Effect, Layer } from "effect";
import { FetchHttpClient, type HttpClient } from "effect/unstable/http";
import { PaymentAuthenticationError, PaymentConfigError } from "@thomasfosterau/effect-payments";
import { make, type PayPalConfig } from "../src/PayPal.ts";

const LOGIN_PATH = "/v1/oauth2/token";
const LOGIN_RESPONSE = () => jsonResponse(200, { access_token: "at_1", expires_in: 3600 });

/**
 * A request as the stubbed `fetch` saw it: the URL, the headers, and the body
 * decoded to text (`FetchHttpClient` sends a text body as bytes).
 */
interface CapturedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly body: string | undefined;
}

const textOf = (raw: BodyInit | null | undefined): string | undefined =>
  typeof raw === "string"
    ? raw
    : raw instanceof Uint8Array
      ? new TextDecoder().decode(raw)
      : undefined;

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * A stub `fetch` that answers the LOGIN_PATH handshake then delegates to
 * `handler`, served to the client as `effect/unstable/http`'s `HttpClient`
 * through `FetchHttpClient.layer`. No test here reaches the vendor.
 */
const stubFetch = (handler: (request: CapturedRequest) => Response) => {
  const calls: Array<CapturedRequest> = [];
  const fetchImpl: typeof globalThis.fetch = async (input, init) => {
    const captured: CapturedRequest = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: textOf(init?.body),
    };
    calls.push(captured);
    if (captured.url.endsWith(LOGIN_PATH)) {
      return LOGIN_RESPONSE();
    }
    return handler(captured);
  };
  const http: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer.pipe(
    Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetchImpl)),
  );
  return { http, calls };
};

const config = (over: Partial<PayPalConfig>): PayPalConfig => ({
  clientId: "client_1",
  clientSecret: "secret_1",
  ...over,
});

describe("PayPal client", () => {
  it("exchanges credentials for a token and authorizes requests", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "PROD-1", name: "Premium" }));

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        return yield* client.request<{ id: string }>({
          method: "GET",
          path: "/v1/catalogs/products/PROD-1",
        });
      }).pipe(Effect.provide(http)),
    );
    expect(result.id).toBe("PROD-1");

    const token = calls.find((c) => c.url.endsWith(LOGIN_PATH))!;
    const expectedBasic = btoa("client_1:secret_1");
    expect(token.method).toBe("POST");
    expect(token.headers.get("authorization")).toBe(`Basic ${expectedBasic}`);
    expect(token.headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(token.body).toBe("grant_type=client_credentials");

    const resource = calls.find((c) => c.url.includes("/catalogs/products"))!;
    expect(resource.headers.get("authorization")).toBe("Bearer at_1");
  });

  it("caches the token across requests and sends a JSON body", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(201, { id: "ORDER-1" }));

    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        yield* client.request({ method: "POST", path: "/v2/checkout/orders", body: { a: 1 } });
        yield* client.request({ method: "GET", path: "/v2/checkout/orders/ORDER-1" });
      }).pipe(Effect.provide(http)),
    );

    expect(calls.filter((c) => c.url.endsWith(LOGIN_PATH))).toHaveLength(1);
    const create = calls.find((c) => c.method === "POST" && c.url.endsWith("/v2/checkout/orders"))!;
    expect(create.body).toBe(JSON.stringify({ a: 1 }));
    expect(create.headers.get("content-type")).toBe("application/json");
  });

  it("maps an HTTP 401 to a neutral authentication error", async () => {
    const { http } = stubFetch(() =>
      jsonResponse(401, { name: "NOT_AUTHORIZED", message: "invalid token" }),
    );

    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        return yield* client.request({
          method: "GET",
          path: "/v1/catalogs/products/PROD-1",
        });
      }).pipe(Effect.flip, Effect.provide(http)),
    );

    expect(error).toBeInstanceOf(PaymentAuthenticationError);
    expect(error.message).toBe("invalid token");
  });

  it("fails with a config error when credentials are missing", async () => {
    const { http } = stubFetch(() => jsonResponse(200, {}));
    const error = await Effect.runPromise(
      make(config({ clientId: "", clientSecret: "" })).pipe(Effect.flip, Effect.provide(http)),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
  });
});
