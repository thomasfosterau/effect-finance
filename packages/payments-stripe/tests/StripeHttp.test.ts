import { describe, it, expect } from "vite-plus/test";
import { ConfigProvider, Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import {
  PaymentAuthenticationError,
  PaymentConfigError,
  PaymentInvalidRequestError,
  PaymentNetworkError,
  PaymentProviderError,
  PaymentRateLimitError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import * as Customer from "../src/Customer.ts";
import * as File from "../src/File.ts";
import * as Subscription from "../src/Subscription.ts";
import {
  DEFAULT_API_VERSION,
  layer,
  layerFromEnv,
  make,
  StripeHttp,
  type StripeHttpConfig,
  type StripeRequest,
} from "../src/StripeHttp.ts";
import { type CapturedRequest, jsonResponse, stubFetch, withTestClock } from "./support.ts";

const KEY = "sk_test_not_a_real_key_4242";

const config = (over: Partial<StripeHttpConfig> = {}): StripeHttpConfig => ({
  apiKey: Redacted.make(KEY),
  ...over,
});

/** Issue one request through a transport built from `over`, against `handler`. */
const send = (
  handler: (request: CapturedRequest, attempt: number) => Response | Promise<Response>,
  request: StripeRequest,
  over: Partial<StripeHttpConfig> = {},
) => {
  const { http, calls } = stubFetch(handler);
  const run = Effect.gen(function* () {
    const client = yield* make(config(over));
    return yield* client.request(request);
  }).pipe(Effect.provide(http));
  return { run, calls };
};

const ok = () => jsonResponse(200, { id: "cus_1", object: "customer" });

/** Run to a neutral failure, under a `TestClock` so backoff elapses at once. */
const failure = (effect: Effect.Effect<unknown, PaymentsError | PaymentConfigError>) =>
  Effect.runPromise(withTestClock(Effect.flip(effect)));

describe("StripeHttp request encoding", () => {
  it("POSTs form-encoded params with the key, the pinned version and JSON accept", async () => {
    const { run, calls } = send(ok, {
      method: "POST",
      path: "/v1/customers",
      params: { email: "jane@example.com", metadata: { user_id: "user-1" } },
    });
    const body = await Effect.runPromise(run);

    expect(body).toEqual({ id: "cus_1", object: "customer" });
    const call = calls[0]!;
    expect(call.url.toString()).toBe("https://api.stripe.com/v1/customers");
    expect(call.method).toBe("POST");
    expect(call.headers.get("authorization")).toBe(`Bearer ${KEY}`);
    expect(call.headers.get("stripe-version")).toBe(DEFAULT_API_VERSION);
    expect(call.headers.get("accept")).toBe("application/json");
    expect(call.headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(call.body).toBe("email=jane%40example.com&metadata[user_id]=user-1");
    // The body parses back to the bracketed keys.
    expect(new URLSearchParams(call.body).get("metadata[user_id]")).toBe("user-1");
  });

  it("encodes nested arrays with indices, as Checkout line items need", async () => {
    const { run, calls } = send(ok, {
      method: "POST",
      path: "/v1/checkout/sessions",
      params: {
        mode: "subscription",
        line_items: [{ price: "price_monthly", quantity: 1 }],
        subscription_data: { metadata: { user_id: "user-1" } },
      },
    });
    await Effect.runPromise(run);

    const body = new URLSearchParams(calls[0]?.body);
    expect(body.get("line_items[0][price]")).toBe("price_monthly");
    expect(body.get("line_items[0][quantity]")).toBe("1");
    expect(body.get("subscription_data[metadata][user_id]")).toBe("user-1");
    // No amount, ever: the price object is the authority.
    expect(body.get("amount")).toBeNull();
  });

  it("puts GET and DELETE params in the query string, with no body", async () => {
    const { run, calls } = send(ok, {
      method: "GET",
      path: "/v1/customers",
      params: { limit: 3, starting_after: "cus_0", expand: ["data.default_source"] },
    });
    await Effect.runPromise(run);
    const call = calls[0]!;
    expect(call.url.pathname).toBe("/v1/customers");
    expect(call.url.search).toBe("?limit=3&starting_after=cus_0&expand[0]=data.default_source");
    expect(call.body).toBeUndefined();
    expect(call.headers.get("content-type")).toBeNull();

    const del = send(ok, { method: "DELETE", path: "/v1/customers/cus_1" });
    await Effect.runPromise(del.run);
    expect(del.calls[0]?.method).toBe("DELETE");
    expect(del.calls[0]?.url.search).toBe("");
  });

  it("pins a configured API version and base URL", async () => {
    const { run, calls } = send(
      ok,
      { method: "GET", path: "/v1/balance" },
      { apiVersion: "2025-08-27.basil", baseUrl: "http://localhost:12111" },
    );
    await Effect.runPromise(run);
    expect(calls[0]?.url.toString()).toBe("http://localhost:12111/v1/balance");
    expect(calls[0]?.headers.get("stripe-version")).toBe("2025-08-27.basil");
  });

  it("refuses redirects, keeping other fetch defaults", async () => {
    const { http, calls } = stubFetch(ok);
    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config());
        return yield* client.request({ method: "GET", path: "/v1/balance" });
      }).pipe(
        Effect.provide(http),
        Effect.provideService(FetchHttpClient.RequestInit, { credentials: "omit" }),
      ),
    );
    expect(calls[0]?.init?.redirect).toBe("error");
    expect(calls[0]?.init?.credentials).toBe("omit");
  });

  it("sends Stripe-Account from the config, overridden per request", async () => {
    const configured = send(
      ok,
      { method: "GET", path: "/v1/balance" },
      { stripeAccount: "acct_config" },
    );
    await Effect.runPromise(configured.run);
    expect(configured.calls[0]?.headers.get("stripe-account")).toBe("acct_config");

    const overridden = send(
      ok,
      { method: "GET", path: "/v1/balance", stripeAccount: "acct_call" },
      { stripeAccount: "acct_config" },
    );
    await Effect.runPromise(overridden.run);
    expect(overridden.calls[0]?.headers.get("stripe-account")).toBe("acct_call");

    const none = send(ok, { method: "GET", path: "/v1/balance" });
    await Effect.runPromise(none.run);
    expect(none.calls[0]?.headers.get("stripe-account")).toBeNull();
  });
});

describe("StripeHttp idempotency keys", () => {
  it("generates one for a retryable POST", async () => {
    const { run, calls } = send(ok, { method: "POST", path: "/v1/customers" });
    await Effect.runPromise(run);
    expect(calls[0]?.headers.get("idempotency-key")).toMatch(
      /^effect-payments-retry-[0-9a-f-]{36}$/,
    );
  });

  it("sends the caller's key verbatim", async () => {
    const { run, calls } = send(ok, {
      method: "POST",
      path: "/v1/customers",
      idempotencyKey: "signup-user-1",
    });
    await Effect.runPromise(run);
    expect(calls[0]?.headers.get("idempotency-key")).toBe("signup-user-1");
  });

  it("sends none on a GET, or on a POST that will not be retried", async () => {
    const get = send(ok, { method: "GET", path: "/v1/customers/cus_1" });
    await Effect.runPromise(get.run);
    expect(get.calls[0]?.headers.get("idempotency-key")).toBeNull();

    const once = send(ok, { method: "POST", path: "/v1/customers" }, { maxNetworkRetries: 0 });
    await Effect.runPromise(once.run);
    expect(once.calls[0]?.headers.get("idempotency-key")).toBeNull();
  });

  it("reuses the key across the attempts of one request", async () => {
    const { run, calls } = send(
      (_request, attempt) =>
        attempt === 1 ? jsonResponse(500, { error: { type: "api_error", message: "boom" } }) : ok(),
      { method: "POST", path: "/v1/customers" },
    );
    await Effect.runPromise(withTestClock(run));
    expect(calls).toHaveLength(2);
    const first = calls[0]?.headers.get("idempotency-key");
    expect(first).not.toBeNull();
    expect(calls[1]?.headers.get("idempotency-key")).toBe(first);
  });
});

describe("StripeHttp error decoding", () => {
  const once = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    failure(
      send(
        () =>
          typeof body === "string"
            ? new Response(body, { status, headers })
            : jsonResponse(status, body, headers),
        { method: "POST", path: "/v1/checkout/sessions" },
        { maxNetworkRetries: 0 },
      ).run,
    );

  it("maps invalid_request_error to PaymentInvalidRequestError with the param", async () => {
    const error = await once(400, {
      error: {
        type: "invalid_request_error",
        code: "resource_missing",
        message: "No such price: 'price_monthly'",
        param: "line_items[0][price]",
      },
    });
    expect(error).toBeInstanceOf(PaymentInvalidRequestError);
    expect(error).toMatchObject({
      message: "No such price: 'price_monthly'",
      param: "line_items[0][price]",
      statusCode: 400,
    });
  });

  it("reads null error fields as absent rather than failing the decode", async () => {
    const error = await once(400, {
      error: {
        type: "invalid_request_error",
        code: null,
        message: "Missing required param: customer.",
        param: "customer",
        decline_code: null,
        doc_url: null,
      },
    });
    expect(error).toBeInstanceOf(PaymentInvalidRequestError);
    expect(error).toMatchObject({
      message: "Missing required param: customer.",
      param: "customer",
      statusCode: 400,
    });
  });

  it("keeps the whole vendor error object as the cause, undecoded fields included", async () => {
    const vendor = {
      type: "card_error",
      code: "card_declined",
      message: "Your card was declined.",
      advice_code: "try_again_later",
      payment_intent: { id: "pi_1", status: "requires_payment_method" },
      charge: "ch_1",
      payment_method: { id: "pm_1" },
    };
    const error = await once(402, { error: vendor });
    expect(error).toMatchObject({ _tag: "PaymentProviderError", code: "card_declined" });
    expect((error as { cause?: unknown }).cause).toEqual(vendor);
  });

  it("maps a 401 to PaymentAuthenticationError whatever the body's type", async () => {
    const error = await once(401, {
      error: {
        type: "invalid_request_error",
        message: "Invalid API Key provided: sk_test_****4242",
      },
    });
    expect(error).toBeInstanceOf(PaymentAuthenticationError);
    expect(error).toMatchObject({ statusCode: 401 });
  });

  it("maps a 403 to a provider error coded as a permission error", async () => {
    const error = await once(403, {
      error: { type: "invalid_request_error", message: "The provided key does not have access" },
    });
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error).toMatchObject({ code: "StripePermissionError", statusCode: 403 });
  });

  it("maps a 429 to PaymentRateLimitError with Retry-After", async () => {
    const error = await once(
      429,
      { error: { type: "invalid_request_error", message: "Too many requests" } },
      { "retry-after": "7" },
    );
    expect(error).toBeInstanceOf(PaymentRateLimitError);
    expect(error).toMatchObject({ message: "Too many requests", retryAfter: 7 });
  });

  it("maps card_error to a provider error carrying Stripe's code", async () => {
    const error = await once(402, {
      error: {
        type: "card_error",
        code: "card_declined",
        decline_code: "insufficient_funds",
        message: "Your card has insufficient funds.",
      },
    });
    expect(error).toMatchObject({
      _tag: "PaymentProviderError",
      code: "card_declined",
      statusCode: 402,
      provider: "stripe",
      cause: { decline_code: "insufficient_funds" },
    });
  });

  it("codes an idempotency_error without a code as the SDK's error kind", async () => {
    const error = await once(400, {
      error: {
        type: "idempotency_error",
        message: "Keys for idempotent requests can only be used with the same parameters",
      },
    });
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error).toMatchObject({ code: "StripeIdempotencyError", statusCode: 400 });
  });

  it("maps api_error to a provider error", async () => {
    const error = await once(500, {
      error: { type: "api_error", message: "Something went wrong" },
    });
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error).toMatchObject({ code: "StripeAPIError", message: "Something went wrong" });
  });

  it("normalises the OAuth error form", async () => {
    const error = await once(400, {
      error: "invalid_grant",
      error_description: "Authorization code expired",
    });
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error).toMatchObject({
      code: "StripeInvalidGrantError",
      message: "Authorization code expired",
    });
  });

  it("falls back to the status when the error body does not decode", async () => {
    const error = await once(503, "<html>gateway</html>");
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error.message).toContain("503");
    expect(error).toMatchObject({ statusCode: 503, code: "StripeAPIError" });
  });

  it("fails a 2xx whose body is not JSON rather than inventing one", async () => {
    const error = await once(200, "not json");
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect(error.message).toBe("Invalid JSON received from the Stripe API");
  });

  it("never carries the key in the error", async () => {
    const auth = await once(401, {
      error: { type: "authentication_error", message: "Invalid API Key" },
    });
    const { run } = send(
      () => {
        throw new TypeError("fetch failed");
      },
      { method: "GET", path: "/v1/balance" },
      { maxNetworkRetries: 0 },
    );
    const network = await failure(run);
    for (const error of [auth, network]) {
      expect(JSON.stringify(error)).not.toContain(KEY);
      expect(String(error)).not.toContain(KEY);
      expect(JSON.stringify((error as { cause?: unknown }).cause ?? null)).not.toContain(KEY);
    }
  });
});

describe("StripeHttp retries", () => {
  it("retries a 5xx, then succeeds", async () => {
    const { run, calls } = send(
      (_request, attempt) => (attempt < 3 ? jsonResponse(503, {}) : ok()),
      { method: "GET", path: "/v1/customers/cus_1" },
    );
    const body = await Effect.runPromise(withTestClock(run));
    expect(body).toMatchObject({ id: "cus_1" });
    expect(calls).toHaveLength(3);
  });

  it("gives up after maxNetworkRetries, failing with the last error", async () => {
    const { run, calls } = send(
      () =>
        jsonResponse(409, { error: { type: "invalid_request_error", message: "Lock timeout" } }),
      { method: "POST", path: "/v1/customers" },
      { maxNetworkRetries: 1 },
    );
    const error = await failure(run);
    expect(calls).toHaveLength(2);
    expect(error).toBeInstanceOf(PaymentInvalidRequestError);
    expect(error).toMatchObject({ statusCode: 409 });
  });

  it("defers to Stripe-Should-Retry", async () => {
    const never = send(
      () =>
        jsonResponse(
          500,
          { error: { type: "api_error", message: "no" } },
          { "stripe-should-retry": "false" },
        ),
      { method: "POST", path: "/v1/customers" },
    );
    await failure(never.run);
    expect(never.calls).toHaveLength(1);

    const always = send(
      (_request, attempt) =>
        attempt === 1
          ? jsonResponse(
              400,
              { error: { type: "invalid_request_error", message: "retry me" } },
              { "stripe-should-retry": "true" },
            )
          : ok(),
      { method: "POST", path: "/v1/customers" },
    );
    await Effect.runPromise(withTestClock(always.run));
    expect(always.calls).toHaveLength(2);
  });

  it("does not retry a 4xx", async () => {
    const { run, calls } = send(
      () =>
        jsonResponse(404, {
          error: { type: "invalid_request_error", message: "No such customer" },
        }),
      { method: "GET", path: "/v1/customers/cus_x" },
    );
    await failure(run);
    expect(calls).toHaveLength(1);
  });

  it("retries a connection failure, then reports it as PaymentNetworkError", async () => {
    const { run, calls } = send(
      () => {
        throw new TypeError("fetch failed");
      },
      { method: "GET", path: "/v1/balance" },
    );
    const error = await failure(run);
    expect(calls).toHaveLength(3);
    expect(error).toBeInstanceOf(PaymentNetworkError);
    expect(error.message).toContain("Request was retried 2 times");
  });

  it("times out a hung request as a network error", async () => {
    const { run } = send(
      (request) =>
        new Promise<Response>((_resolve, reject) => {
          request.init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
      { method: "GET", path: "/v1/balance" },
      { maxNetworkRetries: 0, timeout: 5_000 },
    );
    const error = await failure(run);
    expect(error).toBeInstanceOf(PaymentNetworkError);
    expect(error.message).toContain("timed out after 5000 ms");
  });
});

describe("StripeHttp uploads", () => {
  it("sends a file as multipart/form-data to the uploads origin", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "file_1", object: "file" }));
    const file = await Effect.runPromise(
      File.create({
        purpose: "dispute_evidence",
        file: {
          data: new TextEncoder().encode("%PDF-1.4"),
          name: "evidence.pdf",
          type: "application/pdf",
        },
        file_link_data: { create: true },
      }).pipe(Effect.provide(layer(config())), Effect.provide(http)),
    );
    expect(file.id).toBe("file_1");
    const call = calls[0]!;
    expect(call.url.toString()).toBe("https://files.stripe.com/v1/files");
    expect(call.form?.get("purpose")).toBe("dispute_evidence");
    expect(call.form?.get("file_link_data[create]")).toBe("true");
    const part = call.form?.get("file");
    expect(part).toBeInstanceOf(Blob);
    expect((part as globalThis.File).name).toBe("evidence.pdf");
    expect((part as Blob).type).toBe("application/pdf");
  });

  it("sends a bare Uint8Array parameter as a file part", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, { id: "file_2", object: "file" }));
    await Effect.runPromise(
      Effect.flatMap(StripeHttp, (client) =>
        client.request({
          method: "POST",
          path: "/v1/files",
          params: { purpose: "dispute_evidence", file: new TextEncoder().encode("bytes") },
          upload: true,
        }),
      ).pipe(Effect.provide(layer(config())), Effect.provide(http)),
    );
    const part = calls[0]?.form?.get("file");
    expect(part).toBeInstanceOf(Blob);
    expect(await (part as Blob).text()).toBe("bytes");
    expect(calls[0]?.form?.get("file[0]")).toBeNull();
  });

  it("refuses file data it cannot send", async () => {
    const { http, calls } = stubFetch(ok);
    const error = await Effect.runPromise(
      Effect.flip(
        Effect.flatMap(StripeHttp, (client) =>
          client.request({
            method: "POST",
            path: "/v1/files",
            params: { purpose: "identity_document", file: { data: 42 } },
            upload: true,
          }),
        ).pipe(Effect.provide(layer(config())), Effect.provide(http)),
      ),
    );
    expect(error).toBeInstanceOf(PaymentInvalidRequestError);
    expect(error).toMatchObject({ param: "file" });
    expect(calls).toHaveLength(0);
  });
});

describe("StripeHttp configuration", () => {
  it("fails an empty key with PaymentConfigError", async () => {
    const { http } = stubFetch(ok);
    const error = await Effect.runPromise(
      Effect.flip(make({ apiKey: Redacted.make("") }).pipe(Effect.provide(http))),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
  });

  it("reads the key from configuration as a Redacted", async () => {
    const { http, calls } = stubFetch(ok);
    await Effect.runPromise(
      Customer.retrieve("cus_1").pipe(
        Effect.provide(layerFromEnv()),
        Effect.provide(http),
        Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ STRIPE_API_KEY: KEY }))),
      ),
    );
    expect(calls[0]?.headers.get("authorization")).toBe(`Bearer ${KEY}`);
  });

  it("fails with PaymentConfigError when the variable is absent", async () => {
    const { http } = stubFetch(ok);
    const error = await Effect.runPromise(
      Effect.flip(
        Layer.build(layerFromEnv("MY_STRIPE_KEY")).pipe(
          Effect.scoped,
          Effect.provide(http),
          Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
        ),
      ),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
    expect(error.message).toContain("MY_STRIPE_KEY");
  });

  // Effect rc.118's ConfigProvider treats a literal empty string as a MISSING
  // value (it was a present "" through rc.117), so an empty key variable is
  // indistinguishable from an unset one: the same failure, naming the variable.
  it("treats an empty key variable as absent", async () => {
    const { http, calls } = stubFetch(ok);
    const error = await Effect.runPromise(
      Effect.flip(
        Layer.build(layerFromEnv()).pipe(
          Effect.scoped,
          Effect.provide(http),
          Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ STRIPE_API_KEY: "" }))),
        ),
      ),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
    expect(error.message).toContain("STRIPE_API_KEY");
    expect(calls).toHaveLength(0);
  });
});

describe("resource modules over the fetch transport", () => {
  it("runs a resource module end to end", async () => {
    const { http, calls } = stubFetch(() =>
      jsonResponse(200, { id: "sub_1", object: "subscription", cancel_at_period_end: true }),
    );
    const subscription = await Effect.runPromise(
      Subscription.update("sub_1", { cancel_at_period_end: true }).pipe(
        Effect.provide(layer(config())),
        Effect.provide(http),
      ),
    );
    expect(subscription.cancel_at_period_end).toBe(true);
    expect(calls[0]?.url.toString()).toBe("https://api.stripe.com/v1/subscriptions/sub_1");
    expect(calls[0]?.body).toBe("cancel_at_period_end=true");
  });

  it("fails a missing or empty id instead of addressing another endpoint", async () => {
    const { http, calls } = stubFetch(ok);
    for (const id of ["", undefined as unknown as string]) {
      const error = await Effect.runPromise(
        Effect.flip(Customer.retrieve(id)).pipe(
          Effect.provide(layer(config())),
          Effect.provide(http),
        ),
      );
      expect(error).toBeInstanceOf(PaymentInvalidRequestError);
      expect(error.message).toContain("Path segment 1 of /v1/customers/{…}");
    }
    expect(calls).toHaveLength(0);
  });

  it("encodes a path segment", async () => {
    const { http, calls } = stubFetch(ok);
    await Effect.runPromise(
      Customer.retrieve("cus_1/../balance").pipe(
        Effect.provide(layer(config())),
        Effect.provide(http),
      ),
    );
    expect(calls[0]?.url.pathname).toBe("/v1/customers/cus_1%2F..%2Fbalance");
  });
});
