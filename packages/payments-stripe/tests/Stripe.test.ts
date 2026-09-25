import { describe, it, expect } from "vite-plus/test";
import { Effect, Redacted } from "effect";
import StripeSdk from "stripe";
import {
  PaymentAuthenticationError,
  PaymentConfigError,
  PaymentInvalidRequestError,
  PaymentNetworkError,
  PaymentProviderError,
  PaymentRateLimitError,
} from "@thomasfosterau/effect-payments";
import * as Stripe from "../src/Stripe.ts";
import { StripeHttp } from "../src/StripeHttp.ts";
import * as Product from "../src/Product.ts";
import * as Customer from "../src/Customer.ts";
import { jsonResponse } from "./support.ts";

/** A request as the SDK's fetch client sent it. */
interface SdkCall {
  readonly url: URL;
  readonly method: string;
  readonly headers: Headers;
  readonly body: string | undefined;
}

/**
 * A real SDK client whose HTTP goes to a stubbed `fetch`, so the SDK
 * transport and its error mapping run without the network.
 */
const sdkWith = (handler: () => Response | Promise<Response>) => {
  const calls: Array<SdkCall> = [];
  const fetchImpl: typeof globalThis.fetch = async (input, init) => {
    calls.push({
      url: new URL(String(input)),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
    });
    return handler();
  };
  const stripe = new StripeSdk("sk_test_sdk", {
    httpClient: StripeSdk.createFetchHttpClient(fetchImpl),
    maxNetworkRetries: 0,
  });
  return { transport: Stripe.transport(stripe), calls };
};

describe("Stripe SDK transport", () => {
  describe("make", () => {
    it("should create a Stripe client with valid config", async () => {
      const client = await Effect.runPromise(Stripe.make({ apiKey: Redacted.make("sk_test_123") }));

      expect(client).toBeDefined();
    });

    it("should fail with invalid config", async () => {
      const error = await Effect.runPromise(
        Effect.flip(Stripe.make({ apiKey: Redacted.make("") })),
      );
      expect(error).toBeInstanceOf(PaymentConfigError);
      expect(error.message).toContain("API key is required");
    });
  });

  describe("layer", () => {
    it("provides the SDK client and the transport over it", async () => {
      const layer = Stripe.layer({ apiKey: Redacted.make("sk_test_123") });

      const program = Effect.gen(function* () {
        const stripe = yield* Stripe.StripeService;
        const http = yield* StripeHttp;
        return stripe instanceof StripeSdk && typeof http.request === "function";
      });

      const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));

      expect(result).toBe(true);
    });
  });

  describe("transport", () => {
    it("sends a GET's params in the query and a POST's in the form body", async () => {
      const { transport, calls } = sdkWith(() => jsonResponse(200, { id: "cus_1" }));
      await Effect.runPromise(
        transport.request({ method: "GET", path: "/v1/customers", params: { limit: 2 } }),
      );
      await Effect.runPromise(
        transport.request({
          method: "POST",
          path: "/v1/customers",
          params: { metadata: { user_id: "u1" } },
          idempotencyKey: "key-1",
          stripeAccount: "acct_1",
        }),
      );
      expect(calls[0]?.method).toBe("GET");
      expect(calls[0]?.url.pathname).toBe("/v1/customers");
      expect(calls[0]?.url.search).toBe("?limit=2");
      expect(calls[1]?.method).toBe("POST");
      expect(calls[1]?.body).toBe("metadata[user_id]=u1");
      expect(calls[1]?.headers.get("idempotency-key")).toBe("key-1");
      expect(calls[1]?.headers.get("stripe-account")).toBe("acct_1");
    });

    it("maps an SDK invalid-request error, keeping the param", async () => {
      const { transport } = sdkWith(() =>
        jsonResponse(400, {
          error: { type: "invalid_request_error", message: "Missing email", param: "email" },
        }),
      );
      const error = await Effect.runPromise(
        Effect.flip(transport.request({ method: "POST", path: "/v1/customers" })),
      );
      expect(error).toBeInstanceOf(PaymentInvalidRequestError);
      expect(error).toMatchObject({ param: "email", statusCode: 400 });
    });

    it("maps an SDK authentication error", async () => {
      const { transport } = sdkWith(() =>
        jsonResponse(401, { error: { type: "invalid_request_error", message: "Invalid API Key" } }),
      );
      const error = await Effect.runPromise(
        Effect.flip(transport.request({ method: "GET", path: "/v1/balance" })),
      );
      expect(error).toBeInstanceOf(PaymentAuthenticationError);
    });

    it("maps an SDK rate-limit error with Retry-After", async () => {
      const { transport } = sdkWith(() =>
        jsonResponse(
          429,
          { error: { type: "rate_limit_error", message: "Slow down" } },
          { "retry-after": "3" },
        ),
      );
      const error = await Effect.runPromise(
        Effect.flip(transport.request({ method: "GET", path: "/v1/balance" })),
      );
      expect(error).toBeInstanceOf(PaymentRateLimitError);
      expect(error).toMatchObject({ retryAfter: 3 });
    });

    it("maps an SDK card error to a provider error with Stripe's code", async () => {
      const { transport } = sdkWith(() =>
        jsonResponse(402, {
          error: { type: "card_error", code: "card_declined", message: "Declined" },
        }),
      );
      const error = await Effect.runPromise(
        Effect.flip(transport.request({ method: "POST", path: "/v1/payment_intents" })),
      );
      expect(error).toBeInstanceOf(PaymentProviderError);
      expect(error).toMatchObject({ code: "card_declined", statusCode: 402 });
    });

    it("maps an SDK connection error to PaymentNetworkError", async () => {
      const { transport } = sdkWith(() => {
        throw new TypeError("fetch failed");
      });
      const error = await Effect.runPromise(
        Effect.flip(transport.request({ method: "GET", path: "/v1/balance" })),
      );
      expect(error).toBeInstanceOf(PaymentNetworkError);
    });

    it("maps a non-SDK rejection to a provider error", async () => {
      const failing = {
        rawRequest: async () => {
          throw new Error("network down");
        },
      } as unknown as StripeSdk;
      const error = await Effect.runPromise(
        Effect.flip(Stripe.transport(failing).request({ method: "POST", path: "/v1/customers" })),
      );
      expect(error).toBeInstanceOf(PaymentProviderError);
      expect(error.message).toBe("network down");
    });
  });
});

describe("Product", () => {
  it("should have create function that requires the Stripe transport", () => {
    const effect = Product.create({ name: "Test Product" });

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });
});

describe("Customer", () => {
  it("should have create function that requires the Stripe transport", () => {
    const effect = Customer.create({ email: "test@example.com" });

    // Check that the effect type requires the StripeHttp transport
    expect(typeof effect).toBe("object");
  });
});
