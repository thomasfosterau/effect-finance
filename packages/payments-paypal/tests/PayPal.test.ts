import { describe, it, expect } from "vite-plus/test";
import { Cause, ConfigProvider, Effect, Fiber, Layer, Predicate, Redacted } from "effect";
import { TestClock } from "effect/testing";
import { FetchHttpClient, type HttpClient } from "effect/http";
import {
  PaymentAuthenticationError,
  PaymentConfigError,
  PaymentInvalidRequestError,
  PaymentNetworkError,
} from "@thomasfosterau/effect-payments";
import { PayPalClient, layerFromEnv, make, type PayPalConfig } from "../src/PayPal.ts";

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
 * `handler`, served to the client as `effect/http`'s `HttpClient`
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
  clientSecret: Redacted.make("secret_1"),
  ...over,
});

/**
 * Every string reachable from `value` through its own properties, enumerable
 * or not — what a logger that walks the object could print.
 */
const stringsIn = (value: unknown, seen = new Set<unknown>()): Array<string> => {
  if (Predicate.isString(value)) return [value];
  if (!Predicate.isObject(value) || seen.has(value)) return [];
  seen.add(value);
  return Object.getOwnPropertyNames(value).flatMap((key) =>
    stringsIn(Object.getOwnPropertyDescriptor(value, key)?.value, seen),
  );
};

describe("PayPal client", () => {
  it("exchanges credentials for a token and authorizes requests", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "PROD-1", name: "Premium" }));

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        return yield* client.request({
          method: "GET",
          path: "/v1/catalogs/products/PROD-1",
        });
      }).pipe(Effect.provide(http)),
    );
    expect(result).toMatchObject({ id: "PROD-1" });

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
      make(config({ clientId: "", clientSecret: Redacted.make("") })).pipe(
        Effect.flip,
        Effect.provide(http),
      ),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
  });
  it("sends Content-Type: application/json on a bodyless POST", async () => {
    const { http, calls } = stubFetch(() => new Response(null, { status: 204 }));

    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        yield* client.request({ method: "POST", path: "/v1/billing/plans/P-1/activate" });
      }).pipe(Effect.provide(http)),
    );

    const post = calls.find((c) => c.url.endsWith("/v1/billing/plans/P-1/activate"))!;
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
            client.request({ method: "GET", path: "/v1/catalogs/products/PROD-1" }),
          ),
          { concurrency: "unbounded" },
        );
      }).pipe(Effect.provide(http)),
    );

    expect(calls.filter((c) => c.url.endsWith(LOGIN_PATH))).toHaveLength(1);
    expect(calls.filter((c) => c.url.endsWith("/v1/catalogs/products/PROD-1"))).toHaveLength(5);
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
          client.request({ method: "GET", path: "/v1/catalogs/products/PROD-1" }),
        );
        expect(first).toBeInstanceOf(PaymentAuthenticationError);
        return yield* client.request({
          method: "GET",
          path: "/v1/catalogs/products/PROD-1",
        });
      }).pipe(Effect.provide(http)),
    );

    expect(second).toMatchObject({ id: "x" });
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
      if (url.endsWith("/v1/oauth2/token")) {
        logins += 1;
        return logins === 1
          ? jsonResponse(200, { access_token: "at_1", expires_in: 30 })
          : jsonResponse(200, { access_token: "at_2", expires_in: 3600 });
      }
      if (url.endsWith("/v1/catalogs/products/SLOW")) {
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
          Effect.flip(client.request({ method: "GET", path: "/v1/catalogs/products/SLOW" })),
        );
        yield* Effect.tryPromise(() => slowStarted);
        // Refreshes the token (login 2) while the T1 request is in flight.
        yield* client.request({ method: "GET", path: "/v1/catalogs/products/FAST" });
        releaseSlow();
        const error = yield* Fiber.join(slow);
        expect(error).toBeInstanceOf(PaymentAuthenticationError);
        // T2 must survive T1's late 401: no third login, and T2 is sent.
        yield* client.request({ method: "GET", path: "/v1/catalogs/products/FAST" });
      }).pipe(Effect.provide(http)),
    );

    expect(logins).toBe(2);
    const fast = seen.filter((c) => c.url.endsWith("/v1/catalogs/products/FAST"));
    expect(fast.map((c) => c.authorization)).toEqual(["Bearer at_2", "Bearer at_2"]);
    expect(seen.find((c) => c.url.endsWith("/v1/catalogs/products/SLOW"))!.authorization).toBe(
      "Bearer at_1",
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
const hangingFetch = (hung: {
  logins?: ReadonlyArray<number>;
  refused?: ReadonlyArray<number>;
  resources?: boolean;
}) => {
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
      if (hung.refused?.includes(state.logins)) {
        // Answered on a later macrotask, so concurrent callers queue behind it.
        await new Promise((resolve) => setTimeout(resolve, 0));
        return jsonResponse(401, { message: "invalid client" });
      }
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

describe("PayPal client timeouts", () => {
  const get = { method: "GET", path: "/v1/catalogs/products/PROD-1" } as const;

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
    expect(error.message).toBe("PayPal login timed out after 10000 ms");
    expect(state.aborted).toBe(1);
    expect(state.resources).toHaveLength(0);
  });

  it("fails every caller queued behind a hung login with its error, after one login timeout", async () => {
    const { http, state } = hangingFetch({ logins: [1] });

    const { errors, pendingBefore, after } = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ loginTimeout: 10_000 }));
        const leader = yield* Effect.forkChild(Effect.flip(client.request(get)));
        yield* macrotask;
        // Four more callers arrive while the login is in flight.
        const queued = yield* Effect.forEach(Array.from({ length: 4 }), () =>
          Effect.forkChild(Effect.flip(client.request(get))),
        );
        yield* macrotask;
        yield* TestClock.adjust("9 seconds");
        yield* macrotask;
        const fibers = [leader, ...queued];
        const pendingBefore = fibers.every((fiber) => fiber.pollUnsafe() === undefined);
        yield* TestClock.adjust("1 second");
        const errors = yield* Effect.forEach(fibers, Fiber.join);
        // A caller arriving after the failure starts a fresh login.
        const after = yield* client.request(get);
        return { errors, pendingBefore, after };
      }).pipe(Effect.provide(http), Effect.provide(TestClock.layer())),
    );

    expect(pendingBefore).toBe(true);
    expect(errors).toHaveLength(5);
    // One login attempt, and every caller sees its very error.
    for (const error of errors) expect(error).toBe(errors[0]);
    expect(errors[0]).toBeInstanceOf(PaymentNetworkError);
    expect(errors[0]?.message).toBe("PayPal login timed out after 10000 ms");
    expect(after).toMatchObject({ id: "x" });
    expect(state.logins).toBe(2);
    expect(state.aborted).toBe(1);
    expect(state.resources).toEqual(["Bearer at_1"]);
  });

  it("shares a refused login's error with the callers waiting on it, then retries afresh", async () => {
    const { http, state } = hangingFetch({ refused: [1] });

    const { errors, after } = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        const errors = yield* Effect.all(
          Array.from({ length: 5 }, () => Effect.flip(client.request(get))),
          { concurrency: "unbounded" },
        );
        const after = yield* client.request(get);
        return { errors, after };
      }).pipe(Effect.provide(http)),
    );

    expect(errors).toHaveLength(5);
    for (const error of errors) expect(error).toBe(errors[0]);
    expect(errors[0]).toBeInstanceOf(PaymentAuthenticationError);
    expect(after).toMatchObject({ id: "x" });
    // One refused login for the five, then one fresh login; nothing cached on failure.
    expect(state.logins).toBe(2);
    expect(state.resources).toEqual(["Bearer at_1"]);
  });

  it("lets a waiter give up without disturbing the login it was waiting on", async () => {
    const { http, state } = hangingFetch({ logins: [1] });

    const { leader, waiter } = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ loginTimeout: 10_000 }));
        const leader = yield* Effect.forkChild(Effect.flip(client.request(get)));
        yield* macrotask;
        const waiter = yield* Effect.forkChild(
          Effect.flip(client.request(get).pipe(Effect.timeout("2 seconds"))),
        );
        yield* macrotask;
        yield* TestClock.adjust("10 seconds");
        return { leader: yield* Fiber.join(leader), waiter: yield* Fiber.join(waiter) };
      }).pipe(Effect.provide(http), Effect.provide(TestClock.layer())),
    );

    expect(Cause.isTimeoutError(waiter)).toBe(true);
    expect(leader).toBeInstanceOf(PaymentNetworkError);
    expect(state.logins).toBe(1);
  });

  it("hands the login on when an outer timeout interrupts the caller running it", async () => {
    const { http, state } = hangingFetch({ logins: [1] });

    const { first, second, third } = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ loginTimeout: 10_000 }));
        // The caller gives up after 2 s, well inside the 10 s login timeout,
        // interrupting the login it is running.
        const first = yield* Effect.forkChild(
          Effect.flip(client.request(get).pipe(Effect.timeout("2 seconds"))),
        );
        yield* macrotask;
        // Waiting on the leader's login when the leader is interrupted.
        const second = yield* Effect.forkChild(client.request(get));
        const third = yield* Effect.forkChild(client.request(get));
        yield* macrotask;
        yield* TestClock.adjust("2 seconds");
        return {
          first: yield* Fiber.join(first),
          second: yield* Fiber.join(second),
          third: yield* Fiber.join(third),
        };
      }).pipe(Effect.provide(http), Effect.provide(TestClock.layer())),
    );

    expect(Cause.isTimeoutError(first)).toBe(true);
    // The waiters are not stranded: one of them logs in afresh for both.
    expect(second).toMatchObject({ id: "x" });
    expect(third).toMatchObject({ id: "x" });
    expect(state.logins).toBe(2);
    expect(state.aborted).toBe(1);
  });

  it("rejects a zero, negative or NaN timeout with a config error, and accepts Infinity", async () => {
    const { http } = hangingFetch({});
    const invalid: ReadonlyArray<Partial<PayPalConfig>> = [
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
      expect(error.message).toMatch(/^PayPal (loginTimeout|timeout) must be a positive number/);
    }
    const result = await Effect.runPromise(
      Effect.flatMap(
        make(config({ loginTimeout: Number.POSITIVE_INFINITY, timeout: Number.POSITIVE_INFINITY })),
        (client) => client.request(get),
      ).pipe(Effect.provide(http)),
    );
    expect(result).toMatchObject({ id: "x" });
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
    expect(error.message).toBe("PayPal request timed out after 5000 ms");
    expect(state.aborted).toBe(1);
  });
});

describe("PayPal client secrets", () => {
  const SECRET = "secret_1";
  const get = { method: "GET", path: "/v1/catalogs/products/PROD-1" } as const;

  it("reads the clientSecret from configuration as a Redacted", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "x" }));
    await Effect.runPromise(
      Effect.flatMap(PayPalClient, (client) => client.request(get)).pipe(
        Effect.provide(layerFromEnv()),
        Effect.provide(http),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              PAYPAL_CLIENT_ID: "client_env",
              PAYPAL_CLIENT_SECRET: "secret_env",
            }),
          ),
        ),
      ),
    );
    const login = calls.find((c) => c.url.endsWith(LOGIN_PATH))!;
    expect(login.headers.get("authorization")).toBe(`Basic ${btoa("client_env:secret_env")}`);
  });

  it("fails with PaymentConfigError when the clientSecret variable is absent", async () => {
    const { http } = stubFetch(() => jsonResponse(200, {}));
    const error = await Effect.runPromise(
      Effect.flip(
        Layer.build(layerFromEnv()).pipe(
          Effect.scoped,
          Effect.provide(http),
          Effect.provide(
            ConfigProvider.layer(ConfigProvider.fromUnknown({ PAYPAL_CLIENT_ID: "client_env" })),
          ),
        ),
      ),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
  });

  it("keeps the clientSecret out of the config's string and JSON forms", () => {
    const { clientSecret } = config({});
    expect(String(clientSecret)).not.toContain(SECRET);
    expect(JSON.stringify(config({}))).not.toContain(SECRET);
  });

  it("never carries the clientSecret in an error", async () => {
    const answers: ReadonlyArray<() => Response> = [
      () =>
        jsonResponse(401, {
          error: "invalid_client",
          error_description: "Client Authentication failed",
        }),
      () => {
        throw new TypeError("fetch failed");
      },
      () => jsonResponse(200, { access_token: 42 }),
      () => jsonResponse(200, { access_token: "tok_leak", expires_in: "x" }),
    ];
    for (const answer of answers) {
      const fetchImpl: typeof globalThis.fetch = async () => answer();
      const http = FetchHttpClient.layer.pipe(
        Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetchImpl)),
      );
      const error = await Effect.runPromise(
        Effect.flatMap(make(config({})), (client) => Effect.flip(client.request(get))).pipe(
          Effect.provide(http),
        ),
      );
      // The request (whose headers carry the credentials) is never kept.
      expect(Predicate.hasProperty(error.cause, "request")).toBe(false);
      for (const leak of [SECRET, btoa("client_1:secret_1"), "tok_leak"]) {
        expect(JSON.stringify(error)).not.toContain(leak);
        expect(String(error)).not.toContain(leak);
        // Anywhere in the error's object graph, not just its serialised forms.
        expect(stringsIn(error).filter((text) => text.includes(leak))).toEqual([]);
        expect(JSON.stringify(error.cause ?? null)).not.toContain(leak);
      }
    }
  });
});

describe("PayPal client requestId (PayPal-Request-Id)", () => {
  const order = { method: "POST", path: "/v2/checkout/orders", body: { a: 1 } } as const;

  it("sends the requestId as PayPal-Request-Id on a POST", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(201, { id: "ORDER-1" }));
    await Effect.runPromise(
      Effect.flatMap(make(config({})), (client) =>
        client.request({ ...order, requestId: "order-7" }),
      ).pipe(Effect.provide(http)),
    );
    const post = calls.find((c) => c.url.endsWith("/v2/checkout/orders"))!;
    expect(post.headers.get("paypal-request-id")).toBe("order-7");
    expect(post.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("sends the header on a bodyless POST too", async () => {
    const { http, calls } = stubFetch(() => new Response(null, { status: 204 }));
    await Effect.runPromise(
      Effect.flatMap(make(config({})), (client) =>
        client.request({
          method: "POST",
          path: "/v1/billing/plans/P-1/activate",
          requestId: "r-1",
        }),
      ).pipe(Effect.provide(http)),
    );
    const post = calls.find((c) => c.url.endsWith("/activate"))!;
    expect(post.headers.get("paypal-request-id")).toBe("r-1");
  });

  it("sends no header without a requestId", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(201, { id: "ORDER-1" }));
    await Effect.runPromise(
      Effect.flatMap(make(config({})), (client) => client.request(order)).pipe(
        Effect.provide(http),
      ),
    );
    const post = calls.find((c) => c.url.endsWith("/v2/checkout/orders"))!;
    expect(post.headers.get("paypal-request-id")).toBeNull();
  });

  it("sends the same id when the caller retries a write that failed in flight", async () => {
    let attempts = 0;
    const { http, calls } = stubFetch(() => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("fetch failed");
      return jsonResponse(201, { id: "ORDER-1" });
    });
    const outcome = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        const write = client.request({ ...order, requestId: "order-8" });
        const first = yield* Effect.flip(write);
        const second = yield* write;
        return { first, second };
      }).pipe(Effect.provide(http)),
    );
    expect(outcome.first).toBeInstanceOf(PaymentNetworkError);
    expect(outcome.second).toMatchObject({ id: "ORDER-1" });
    const posts = calls.filter((c) => c.url.endsWith("/v2/checkout/orders"));
    expect(posts.map((c) => c.headers.get("paypal-request-id"))).toEqual(["order-8", "order-8"]);
  });

  it("refuses an empty id, or an id on a method that is not POST, before sending anything", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, {}));
    const errors = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({}));
        return yield* Effect.all([
          Effect.flip(client.request({ ...order, requestId: "" })),
          Effect.flip(client.request({ method: "GET", path: "/v2/x", requestId: "r" })),
          Effect.flip(client.request({ method: "PATCH", path: "/v2/x", requestId: "r" })),
        ]);
      }).pipe(Effect.provide(http)),
    );
    for (const error of errors) expect(error).toBeInstanceOf(PaymentInvalidRequestError);
    expect(calls).toEqual([]);
  });
});

// Effect rc.118's ConfigProvider treats a literal empty string as a MISSING
// value (it was a present "" through rc.117). For the credentials that changes
// nothing observable (an empty value never authenticated); for the base URL it
// means `PAYPAL_BASE_URL=` falls back to the default endpoint instead of
// producing an unusable request URL.
describe("PayPal layerFromEnv and empty variables", () => {
  const build = (values: Record<string, string>) => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "x" }));
    const program = Effect.flatMap(PayPalClient, (client) =>
      client.request({ method: "GET", path: "/probe" }),
    ).pipe(
      Effect.provide(layerFromEnv()),
      Effect.provide(http),
      Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(values))),
    );
    return { program, calls };
  };

  it("fails with PaymentConfigError when the client id variable is empty", async () => {
    const { program, calls } = build({ PAYPAL_CLIENT_ID: "", PAYPAL_CLIENT_SECRET: "secret_env" });
    const error = await Effect.runPromise(Effect.flip(program));
    expect(error).toBeInstanceOf(PaymentConfigError);
    expect(calls).toHaveLength(0);
  });

  it("fails with PaymentConfigError when the client secret variable is empty", async () => {
    const { program, calls } = build({ PAYPAL_CLIENT_ID: "client_env", PAYPAL_CLIENT_SECRET: "" });
    const error = await Effect.runPromise(Effect.flip(program));
    expect(error).toBeInstanceOf(PaymentConfigError);
    expect(calls).toHaveLength(0);
  });

  it("uses the default endpoint when PAYPAL_BASE_URL is empty", async () => {
    const { program, calls } = build({
      PAYPAL_CLIENT_ID: "client_env",
      PAYPAL_CLIENT_SECRET: "secret_env",
      PAYPAL_BASE_URL: "",
    });
    await Effect.runPromise(program);
    expect(calls[0]?.url).toBe(`https://api-m.paypal.com${LOGIN_PATH}`);
  });

  it("still honours a non-empty PAYPAL_BASE_URL", async () => {
    const { program, calls } = build({
      PAYPAL_CLIENT_ID: "client_env",
      PAYPAL_CLIENT_SECRET: "secret_env",
      PAYPAL_BASE_URL: "https://sandbox.example.test",
    });
    await Effect.runPromise(program);
    expect(calls[0]?.url).toBe(`https://sandbox.example.test${LOGIN_PATH}`);
  });
});
