/**
 * Test doubles shared by the Stripe suites: a stubbed `fetch` served as
 * `effect/http`'s `HttpClient`, and {@link stubStripe}, the same stub decoded
 * into Stripe calls for the capability layers and resource modules (which run
 * on Distilled's operations). No test reaches `api.stripe.com`.
 */

import { Effect, Fiber, Layer, Predicate, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import { TestClock } from "effect/testing";
import { Credentials } from "@distilled.cloud/stripe/Credentials";

/** A request as the stubbed `fetch` saw it. */
export interface CapturedRequest {
  readonly url: URL;
  readonly method: string;
  readonly headers: Headers;
  readonly init: RequestInit | undefined;
  /** A text or bytes body, decoded; `undefined` for none or for multipart. */
  readonly body: string | undefined;
  /** A multipart body, as sent. */
  readonly form: FormData | undefined;
}

const textOf = (raw: BodyInit | null | undefined): string | undefined =>
  typeof raw === "string"
    ? raw
    : raw instanceof Uint8Array
      ? new TextDecoder().decode(raw)
      : undefined;

/** A JSON response with `status`, plus any extra headers. */
export const jsonResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
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
      form: init?.body instanceof FormData ? init.body : undefined,
    };
    calls.push(captured);
    return handler(captured, calls.length);
  };
  const http = FetchHttpClient.layer.pipe(
    Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetchImpl)),
  );
  return { http, calls };
};

/** Let pending promises (the stubbed `fetch`) settle. */
const macrotask = Effect.callback<void>((resume) => {
  const timer = setTimeout(() => resume(Effect.void), 0);
  return Effect.sync(() => clearTimeout(timer));
});

/**
 * Run `effect` under a `TestClock`, advancing it until the effect completes,
 * so retry backoff and timeouts elapse instantly and deterministically.
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

/** The secret key {@link stubStripe} authenticates with. */
export const TEST_KEY = "sk_test_not_a_real_key_4242";

/** One request to the stubbed Stripe API, as Stripe would read it. */
export interface StripeCall {
  readonly method: string;
  /** The path, e.g. `/v1/customers/cus_1`. */
  readonly path: string;
  /**
   * The parameters, flat as they travel (`{ "metadata[tier]": "pro" }`): the
   * form body of a `POST`, the query string otherwise. Compare with
   * {@link formOf}.
   */
  readonly params: Readonly<Record<string, string>>;
  readonly headers: Headers;
}

/** One parameter flattened into its bracketed form fields. */
const fieldsOf = (key: string, value: unknown): ReadonlyArray<readonly [string, string]> =>
  value === undefined || value === null
    ? []
    : Array.isArray(value)
      ? value.flatMap((item, index) => fieldsOf(`${key}[${index}]`, item))
      : Predicate.isObject(value)
        ? Object.entries(value).flatMap(([name, item]) => fieldsOf(`${key}[${name}]`, item))
        : [[key, String(value)]];

/**
 * `params` flattened the way Stripe reads a form body, for comparison with a
 * {@link StripeCall}'s `params`: undefined members vanish, `metadata: { tier:
 * "pro" }` becomes `"metadata[tier]": "pro"` and `items: [{ price }]`
 * becomes `"items[0][price]"`.
 */
export const formOf = (params: Readonly<Record<string, unknown>>): Record<string, string> =>
  Object.fromEntries(Object.entries(params).flatMap(([key, value]) => fieldsOf(key, value)));

/**
 * A stubbed Stripe API for the capability layers: `answer` maps each call to a
 * body (served as a 200) or a whole `Response`, and may throw to simulate a
 * connection failure. `layer` is what the capability layers require:
 * Distilled's `Credentials` (holding {@link TEST_KEY}) and the stubbed
 * `HttpClient`.
 */
export const stubStripe = (answer: (call: StripeCall, attempt: number) => unknown) => {
  const calls: Array<StripeCall> = [];
  const stub = stubFetch((request, attempt) => {
    const call: StripeCall = {
      method: request.method,
      path: request.url.pathname,
      params: Object.fromEntries(
        request.method === "POST"
          ? new URLSearchParams(request.body ?? "")
          : request.url.searchParams,
      ),
      headers: request.headers,
    };
    calls.push(call);
    const body = answer(call, attempt);
    return body instanceof Response ? body : jsonResponse(200, body);
  });
  const credentials = Layer.succeed(
    Credentials,
    Effect.succeed({ apiKey: Redacted.make(TEST_KEY), apiBaseUrl: "https://api.stripe.com" }),
  );
  return { calls, requests: stub.calls, layer: Layer.merge(stub.http, credentials) };
};

/** `stubStripe` answering from a table keyed by `METHOD /path`; a miss is a 404. */
export const stubStripeTable = (answers: Readonly<Record<string, unknown>>) =>
  stubStripe(
    (call) =>
      answers[`${call.method} ${call.path}`] ??
      jsonResponse(404, {
        error: {
          type: "invalid_request_error",
          message: `No stub for ${call.method} ${call.path}`,
        },
      }),
  );
