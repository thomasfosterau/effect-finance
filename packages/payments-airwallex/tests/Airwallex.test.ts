import { describe, it, expect } from "vite-plus/test";
import { Effect, Layer } from "effect";
import { FetchHttpClient, type HttpClient } from "effect/unstable/http";
import { PaymentAuthenticationError, PaymentConfigError } from "@thomasfosterau/effect-payments";
import { make, type AirwallexConfig } from "../src/Airwallex.ts";

const LOGIN_PATH = "/api/v1/authentication/login";
const LOGIN_RESPONSE = () =>
  jsonResponse(201, {
    token: "tok_123",
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });

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

const config = (over: Partial<AirwallexConfig>): AirwallexConfig => ({
  clientId: "client_1",
  apiKey: "key_1",
  ...over,
});

describe("Airwallex client", () => {
  it("logs in once, caches the token, and authorizes requests", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "cus_1", email: "a@b.com" }));

    const program = Effect.gen(function* () {
      const client = yield* make(config({}));
      const first = yield* client.request<{ id: string }>({
        method: "GET",
        path: "/api/v1/pa/customers/cus_1",
      });
      const second = yield* client.request<{ id: string }>({
        method: "GET",
        path: "/api/v1/pa/customers/cus_1",
      });
      return { first, second };
    });

    const result = await Effect.runPromise(program.pipe(Effect.provide(http)));
    expect(result.first.id).toBe("cus_1");

    // One login + two resource requests, and the token only fetched once.
    const logins = calls.filter((c) => c.url.endsWith(LOGIN_PATH));
    expect(logins).toHaveLength(1);
    const resourceCall = calls.find((c) => c.url.includes("/pa/customers"))!;
    expect(resourceCall.headers.get("authorization")).toBe("Bearer tok_123");
  });

  it("sends client credentials on the login request", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { items: [], has_more: false }));

    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        yield* client.request({ method: "GET", path: "/api/v1/pa/customers" });
      }).pipe(Effect.provide(http)),
    );

    const login = calls.find((c) => c.url.endsWith(LOGIN_PATH))!;
    expect(login.method).toBe("POST");
    expect(login.headers.get("x-client-id")).toBe("client_1");
    expect(login.headers.get("x-api-key")).toBe("key_1");
  });

  it("maps an HTTP 401 to a neutral authentication error", async () => {
    const { http } = stubFetch(() =>
      jsonResponse(401, { code: "unauthorized", message: "invalid token" }),
    );

    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        return yield* client.request({
          method: "GET",
          path: "/api/v1/pa/customers/cus_1",
        });
      }).pipe(Effect.flip, Effect.provide(http)),
    );

    expect(error).toBeInstanceOf(PaymentAuthenticationError);
    expect(error.message).toBe("invalid token");
  });

  it("fails with a config error when credentials are missing", async () => {
    const { http } = stubFetch(() => jsonResponse(200, {}));
    const error = await Effect.runPromise(
      make(config({ clientId: "", apiKey: "" })).pipe(Effect.flip, Effect.provide(http)),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
  });
  it("sends Content-Type: application/json on a bodyless POST", async () => {
    const { http, calls } = stubFetch(() => new Response(null, { status: 204 }));

    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        yield* client.request({ method: "POST", path: "/api/v1/pa/payment_intents/int_1/cancel" });
      }).pipe(Effect.provide(http)),
    );

    const post = calls.find((c) => c.url.endsWith("/api/v1/pa/payment_intents/int_1/cancel"))!;
    expect(post.method).toBe("POST");
    expect(post.body).toBeUndefined();
    expect(post.headers.get("content-type")).toBe("application/json");
  });

  it("logs in once for concurrent first requests", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "x" }));

    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        yield* Effect.all(
          Array.from({ length: 5 }, () =>
            client.request({ method: "GET", path: "/api/v1/pa/customers/cus_1" }),
          ),
          { concurrency: "unbounded" },
        );
      }).pipe(Effect.provide(http)),
    );

    expect(calls.filter((c) => c.url.endsWith(LOGIN_PATH))).toHaveLength(1);
    expect(calls.filter((c) => c.url.endsWith("/api/v1/pa/customers/cus_1"))).toHaveLength(5);
  });

  it("forgets the cached token after a 401 and logs in again on the next call", async () => {
    let resourceCalls = 0;
    const { http, calls } = stubFetch(() => {
      resourceCalls += 1;
      return resourceCalls === 1
        ? jsonResponse(401, { message: "token revoked" })
        : jsonResponse(200, { id: "x" });
    });

    const second = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        const first = yield* Effect.flip(
          client.request({ method: "GET", path: "/api/v1/pa/customers/cus_1" }),
        );
        expect(first).toBeInstanceOf(PaymentAuthenticationError);
        return yield* client.request<{ id: string }>({
          method: "GET",
          path: "/api/v1/pa/customers/cus_1",
        });
      }).pipe(Effect.provide(http)),
    );

    expect(second.id).toBe("x");
    expect(calls.filter((c) => c.url.endsWith(LOGIN_PATH))).toHaveLength(2);
  });
});
