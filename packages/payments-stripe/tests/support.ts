/**
 * Test doubles shared by the Stripe suites: a fake {@link StripeHttp} that
 * records what the resource modules and capability layers ask for, and a
 * stubbed `fetch` served as `effect/http`'s `HttpClient` for the
 * transport itself. No test reaches `api.stripe.com`.
 */

import { Effect, Fiber, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { TestClock } from "effect/testing";
import type { PaymentsError } from "@thomasfosterau/effect-payments";
import { StripeHttp, type StripeRequest } from "../src/StripeHttp.ts";

/**
 * A fake transport answering each request with `respond(request)` — a body,
 * or an `Effect` for a failure — and recording every request it was asked.
 */
export const fakeStripeHttp = (respond: (request: StripeRequest) => unknown = () => ({})) => {
  const calls: Array<StripeRequest> = [];
  const layer = Layer.succeed(
    StripeHttp,
    StripeHttp.of({
      request: (request) =>
        Effect.suspend(() => {
          calls.push(request);
          const answer = respond(request);
          return Effect.isEffect(answer)
            ? (answer as Effect.Effect<unknown, PaymentsError>)
            : Effect.succeed(answer);
        }),
    }),
  );
  return { layer, calls };
};

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
