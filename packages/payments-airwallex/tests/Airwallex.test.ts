import { describe, it, expect } from "vite-plus/test";
import { Cause, Effect, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";
import { FetchHttpClient, type HttpClient } from "effect/unstable/http";
import {
  PaymentAuthenticationError,
  PaymentConfigError,
  PaymentNetworkError,
} from "@thomasfosterau/effect-payments";
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
  it("keeps a newer token when a request made with the old one gets a late 401", async () => {
    // Login 1 hands out a token that is already inside the refresh window, so
    // the next caller logs in again (login 2) while the first request is
    // still in flight. The first request's 401 then arrives late.
    let logins = 0;
    let releaseSlow!: () => void;
    const slowReleased = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    let markSlowStarted!: () => void;
    const slowStarted = new Promise<void>((resolve) => {
      markSlowStarted = resolve;
    });
    const seen: Array<{ url: string; authorization: string | null }> = [];
    const fetchImpl: typeof globalThis.fetch = async (input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get("authorization");
      seen.push({ url, authorization });
      if (url.endsWith("/api/v1/authentication/login")) {
        logins += 1;
        return logins === 1
          ? jsonResponse(200, {
              token: "tok_1",
              expires_at: new Date(Date.now() + 30_000).toISOString(),
            })
          : jsonResponse(200, {
              token: "tok_2",
              expires_at: new Date(Date.now() + 3_600_000).toISOString(),
            });
      }
      if (url.endsWith("/api/v1/pa/customers/SLOW")) {
        markSlowStarted();
        await slowReleased;
        return jsonResponse(401, { message: "token revoked" });
      }
      return jsonResponse(200, { id: "x" });
    };
    const http = FetchHttpClient.layer.pipe(
      Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetchImpl)),
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        const slow = yield* Effect.forkChild(
          Effect.flip(client.request({ method: "GET", path: "/api/v1/pa/customers/SLOW" })),
        );
        yield* Effect.tryPromise(() => slowStarted);
        // Refreshes the token (login 2) while the T1 request is in flight.
        yield* client.request({ method: "GET", path: "/api/v1/pa/customers/FAST" });
        releaseSlow();
        const error = yield* Fiber.join(slow);
        expect(error).toBeInstanceOf(PaymentAuthenticationError);
        // T2 must survive T1's late 401: no third login, and T2 is sent.
        yield* client.request({ method: "GET", path: "/api/v1/pa/customers/FAST" });
      }).pipe(Effect.provide(http)),
    );

    expect(logins).toBe(2);
    const fast = seen.filter((c) => c.url.endsWith("/api/v1/pa/customers/FAST"));
    expect(fast.map((c) => c.authorization)).toEqual(["Bearer tok_2", "Bearer tok_2"]);
    expect(seen.find((c) => c.url.endsWith("/api/v1/pa/customers/SLOW"))!.authorization).toBe(
      "Bearer tok_1",
    );
  });
});

/** Let pending promises (the stubbed `fetch`) settle. */
const macrotask = Effect.callback<void>((resume) => {
  const timer = setTimeout(() => resume(Effect.void), 0);
  return Effect.sync(() => clearTimeout(timer));
});

/**
 * A stub `fetch` whose Nth login (1-based, listed in `hung`) never answers
 * until the client aborts it; every other call answers normally. `aborted`
 * counts the hung requests the client cancelled.
 */
const hangingFetch = (hung: { logins?: ReadonlyArray<number>; resources?: boolean }) => {
  const resources: Array<string | null> = [];
  const state = { logins: 0, aborted: 0, resources };
  const hang = (init: RequestInit | undefined) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        state.aborted += 1;
        reject(new Error("aborted"));
      });
    });
  const fetchImpl: typeof globalThis.fetch = async (input, init) => {
    if (String(input).endsWith(LOGIN_PATH)) {
      state.logins += 1;
      return hung.logins?.includes(state.logins) ? hang(init) : LOGIN_RESPONSE();
    }
    state.resources.push(new Headers(init?.headers).get("authorization"));
    return hung.resources ? hang(init) : jsonResponse(200, { id: "x" });
  };
  const http: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer.pipe(
    Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetchImpl)),
  );
  return { http, state };
};

describe("Airwallex client timeouts", () => {
  const get = { method: "GET", path: "/api/v1/pa/customers/cus_1" } as const;

  it("fails a login that never answers with a network error after the login timeout", async () => {
    const { http, state } = hangingFetch({ logins: [1] });

    const { error, pendingBefore } = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ loginTimeout: 10_000 }));
        const fiber = yield* Effect.forkChild(Effect.flip(client.request(get)));
        yield* macrotask;
        yield* TestClock.adjust("9 seconds");
        yield* macrotask;
        const pendingBefore = fiber.pollUnsafe() === undefined;
        yield* TestClock.adjust("1 second");
        return { error: yield* Fiber.join(fiber), pendingBefore };
      }).pipe(Effect.provide(http), Effect.provide(TestClock.layer())),
    );

    expect(pendingBefore).toBe(true);
    expect(error).toBeInstanceOf(PaymentNetworkError);
    expect(error.message).toBe("Airwallex login timed out after 10000 ms");
    expect(state.aborted).toBe(1);
    expect(state.resources).toHaveLength(0);
  });

  it("releases the token lock so a caller queued behind a hung login logs in afresh", async () => {
    const { http, state } = hangingFetch({ logins: [1] });

    const { first, second } = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ loginTimeout: 10_000 }));
        const first = yield* Effect.forkChild(Effect.flip(client.request(get)));
        yield* macrotask;
        // Queued on the token lock behind the hung login.
        const second = yield* Effect.forkChild(client.request<{ id: string }>(get));
        yield* macrotask;
        yield* TestClock.adjust("10 seconds");
        return { first: yield* Fiber.join(first), second: yield* Fiber.join(second) };
      }).pipe(Effect.provide(http), Effect.provide(TestClock.layer())),
    );

    expect(first).toBeInstanceOf(PaymentNetworkError);
    expect(second.id).toBe("x");
    expect(state.logins).toBe(2);
    expect(state.resources).toEqual(["Bearer tok_123"]);
  });

  it("releases the token lock when an outer timeout interrupts the login it holds", async () => {
    const { http, state } = hangingFetch({ logins: [1] });

    const { first, second } = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ loginTimeout: 10_000 }));
        // The caller gives up after 2 s, well inside the 10 s login timeout,
        // interrupting the login while it holds the permit.
        const first = yield* Effect.forkChild(
          Effect.flip(client.request(get).pipe(Effect.timeout("2 seconds"))),
        );
        yield* macrotask;
        const second = yield* Effect.forkChild(client.request<{ id: string }>(get));
        yield* macrotask;
        yield* TestClock.adjust("2 seconds");
        return { first: yield* Fiber.join(first), second: yield* Fiber.join(second) };
      }).pipe(Effect.provide(http), Effect.provide(TestClock.layer())),
    );

    expect(Cause.isTimeoutError(first)).toBe(true);
    expect(second.id).toBe("x");
    expect(state.logins).toBe(2);
    expect(state.aborted).toBe(1);
  });

  it("rejects a zero, negative or NaN timeout with a config error, and accepts Infinity", async () => {
    const { http } = hangingFetch({});
    const invalid: ReadonlyArray<Partial<AirwallexConfig>> = [
      { loginTimeout: 0 },
      { loginTimeout: -1 },
      { loginTimeout: Number.NaN },
      { timeout: 0 },
      { timeout: -5_000 },
      { timeout: Number.NEGATIVE_INFINITY },
    ];
    for (const over of invalid) {
      const error = await Effect.runPromise(
        make(config(over)).pipe(Effect.flip, Effect.provide(http)),
      );
      expect(error).toBeInstanceOf(PaymentConfigError);
      expect(error.message).toMatch(/^Airwallex (loginTimeout|timeout) must be a positive number/);
    }
    const result = await Effect.runPromise(
      Effect.flatMap(
        make(config({ loginTimeout: Number.POSITIVE_INFINITY, timeout: Number.POSITIVE_INFINITY })),
        (client) => client.request<{ id: string }>(get),
      ).pipe(Effect.provide(http)),
    );
    expect(result.id).toBe("x");
  });

  it("fails a resource request that never answers with a network error after the timeout", async () => {
    const { http, state } = hangingFetch({ resources: true });

    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ timeout: 5_000 }));
        const fiber = yield* Effect.forkChild(Effect.flip(client.request(get)));
        yield* macrotask;
        yield* macrotask;
        yield* TestClock.adjust("5 seconds");
        return yield* Fiber.join(fiber);
      }).pipe(Effect.provide(http), Effect.provide(TestClock.layer())),
    );

    expect(error).toBeInstanceOf(PaymentNetworkError);
    expect(error.message).toBe("Airwallex request timed out after 5000 ms");
    expect(state.aborted).toBe(1);
  });
});
