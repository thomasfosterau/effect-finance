/**
 * Test doubles shared by the PayPal capability suites: a stubbed `fetch`
 * served as `effect/http`'s `HttpClient`, and {@link stubPayPal}, the same
 * stub decoded into PayPal calls for the capability layers (which run on
 * Distilled's operations). No test reaches `api-m.paypal.com`.
 */

import { Effect, Fiber, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import { TestClock } from "effect/testing";
import { Credentials } from "@distilled.cloud/paypal/Credentials";
import * as PayPalPayments from "../src/PayPalPayments.ts";

/** A request as the stubbed `fetch` saw it. */
export interface CapturedRequest {
  readonly url: URL;
  readonly method: string;
  readonly headers: Headers;
  readonly init: RequestInit | undefined;
  /** A text or bytes body, decoded; `undefined` for none. */
  readonly body: string | undefined;
}

const textOf = (raw: BodyInit | null | undefined): string | undefined =>
  typeof raw === "string"
    ? raw
    : raw instanceof Uint8Array
      ? new TextDecoder().decode(raw)
      : undefined;

/** A JSON response with `status`. */
export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * A stubbed `fetch` answering with `handler`, served through
 * `FetchHttpClient.layer`. `handler` may throw (or return a rejected
 * promise) to simulate a connection failure.
 */
export const stubFetch = (
  handler: (request: CapturedRequest, attempt: number) => Response | Promise<Response>,
) => {
  const calls: Array<CapturedRequest> = [];
  const fetchImpl: typeof globalThis.fetch = async (input, init) => {
    const captured: CapturedRequest = {
      url: new URL(String(input)),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      init,
      body: textOf(init?.body),
    };
    calls.push(captured);
    return handler(captured, calls.length);
  };
  const http = FetchHttpClient.layer.pipe(
    Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetchImpl)),
  );
  return { http, calls };
};

/** The access token {@link stubPayPal} authenticates with. */
export const TEST_TOKEN = "A21AA_not_a_real_access_token";

/** One request to the stubbed PayPal API, as PayPal would read it. */
export interface PayPalCall {
  readonly method: string;
  /** The path, e.g. `/v1/catalogs/products/PROD-1`. */
  readonly path: string;
  /** The query string, as a record. */
  readonly query: Readonly<Record<string, string>>;
  /** The JSON body, parsed; `undefined` for none. */
  readonly body: unknown;
  /** The `PayPal-Request-Id` header, if sent. */
  readonly requestId: string | undefined;
  readonly headers: Headers;
}

/** A captured request as a {@link PayPalCall}. */
export const callOf = (request: CapturedRequest): PayPalCall => ({
  method: request.method,
  path: request.url.pathname,
  query: Object.fromEntries(request.url.searchParams),
  body: request.body === undefined || request.body === "" ? undefined : JSON.parse(request.body),
  requestId: request.headers.get("paypal-request-id") ?? undefined,
  headers: request.headers,
});

/**
 * A stubbed PayPal API for the capability layers: `answer` maps each call to a
 * body (served as a 200) or a whole `Response`, and may throw to simulate a
 * connection failure. `layer` is what the capability layers require:
 * Distilled's `Credentials` (holding {@link TEST_TOKEN}) and the stubbed
 * `HttpClient`.
 */
export const stubPayPal = (answer: (call: PayPalCall, attempt: number) => unknown) => {
  const calls: Array<PayPalCall> = [];
  const stub = stubFetch((request, attempt) => {
    const call = callOf(request);
    calls.push(call);
    const body = answer(call, attempt);
    return body instanceof Response ? body : jsonResponse(200, body);
  });
  const credentials = Layer.succeed(
    Credentials,
    Effect.succeed({ apiKey: Redacted.make(TEST_TOKEN), apiBaseUrl: "https://api-m.paypal.com" }),
  );
  return { calls, requests: stub.calls, layer: Layer.merge(stub.http, credentials) };
};

/** What the capability layers require, as {@link stubPayPal} provides it. */
type Requirements = Layer.Services<typeof PayPalPayments.capabilities>;

/** Every PayPal capability over a stub's layer. */
export const capabilitiesOver = (layer: Layer.Layer<Requirements>) =>
  Layer.provide(PayPalPayments.capabilities, layer);

/** Let pending promises (the stubbed `fetch`) settle. */
const macrotask = Effect.callback<void>((resume) => {
  const timer = setTimeout(() => resume(Effect.void), 0);
  return Effect.sync(() => clearTimeout(timer));
});

/**
 * Run `effect` under a `TestClock`, advancing it until the effect completes,
 * so timeouts and token expiry elapse instantly and deterministically.
 */
export const withTestClock = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(effect);
    for (let step = 0; step < 1000 && fiber.pollUnsafe() === undefined; step++) {
      yield* macrotask;
      yield* TestClock.adjust("1 second");
    }
    return yield* Fiber.join(fiber);
  }).pipe(Effect.provide(TestClock.layer()));
