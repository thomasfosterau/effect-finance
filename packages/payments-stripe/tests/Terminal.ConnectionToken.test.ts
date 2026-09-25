import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import type Stripe from "stripe";
import * as TerminalConnectionToken from "../src/Terminal.ConnectionToken.ts";
import type { StripeRequest } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";

describe("Terminal.ConnectionToken", () => {
  const createMockStripe = () => {
    const mockToken: Stripe.Terminal.ConnectionToken = {
      object: "terminal.connection_token",
      secret: "pst_test_123456789",
      location: "tml_123",
    } as Stripe.Terminal.ConnectionToken;

    return (request: StripeRequest) => {
      return mockToken;
    };
  };

  const createTestLayer = (answer: (request: StripeRequest) => unknown) => fakeStripeHttp(answer);

  describe("create", () => {
    it("should create through the transport with no params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const result = await Effect.runPromise(
        TerminalConnectionToken.create().pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({
        method: "POST",
        path: "/v1/terminal/connection_tokens",
        params: undefined,
      });
      expect(result.secret).toBe("pst_test_123456789");
    });

    it("should create through the transport with location param", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const params = { location: "tml_123" };

      const result = await Effect.runPromise(
        TerminalConnectionToken.create(params).pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({ method: "POST", path: "/v1/terminal/connection_tokens", params });
      expect(result.location).toBe("tml_123");
    });
  });
});
