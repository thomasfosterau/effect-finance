import { describe, it, expect, vi } from "vite-plus/test";
import { Effect, Layer } from "effect";
import type Stripe from "stripe";
import * as TerminalConnectionToken from "../src/Terminal.ConnectionToken.ts";
import { StripeService } from "../src/Stripe.ts";

describe("Terminal.ConnectionToken", () => {
  const createMockStripe = () => {
    const mockToken: Stripe.Terminal.ConnectionToken = {
      object: "terminal.connection_token",
      secret: "pst_test_123456789",
      location: "tml_123",
    } as Stripe.Terminal.ConnectionToken;

    return {
      terminal: {
        connectionTokens: {
          create: vi.fn().mockResolvedValue(mockToken),
        },
      },
    } as unknown as Stripe;
  };

  const createTestLayer = (mockStripe: Stripe) => Layer.succeed(StripeService, mockStripe);

  describe("create", () => {
    it("should call stripe.terminal.connectionTokens.create with no params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const result = await Effect.runPromise(
        TerminalConnectionToken.create().pipe(Effect.provide(layer)),
      );

      expect(mockStripe.terminal.connectionTokens.create).toHaveBeenCalledWith(undefined);
      expect(result.secret).toBe("pst_test_123456789");
    });

    it("should call stripe.terminal.connectionTokens.create with location param", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const params = { location: "tml_123" };

      const result = await Effect.runPromise(
        TerminalConnectionToken.create(params).pipe(Effect.provide(layer)),
      );

      expect(mockStripe.terminal.connectionTokens.create).toHaveBeenCalledWith(params);
      expect(result.location).toBe("tml_123");
    });
  });
});
