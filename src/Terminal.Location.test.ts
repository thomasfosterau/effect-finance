import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import type Stripe from "stripe";
import * as TerminalLocation from "./Terminal.Location.js";
import { StripeService } from "./Stripe.js";

describe("Terminal.Location", () => {
  const createMockStripe = () => {
    const mockLocation: Stripe.Terminal.Location = {
      id: "tml_123",
      object: "terminal.location",
      display_name: "HQ",
      address: {
        line1: "1272 Valencia Street",
        city: "San Francisco",
        state: "CA",
        country: "US",
        postal_code: "94110",
      },
      livemode: false,
    } as Stripe.Terminal.Location;

    const mockDeletedLocation: Stripe.Terminal.DeletedLocation = {
      id: "tml_123",
      object: "terminal.location",
      deleted: true,
    };

    return {
      terminal: {
        locations: {
          create: vi.fn().mockResolvedValue(mockLocation),
          retrieve: vi.fn().mockResolvedValue(mockLocation),
          update: vi.fn().mockResolvedValue(mockLocation),
          del: vi.fn().mockResolvedValue(mockDeletedLocation),
          list: vi.fn().mockResolvedValue({
            object: "list",
            data: [mockLocation],
            has_more: false,
            url: "/v1/terminal/locations",
          }),
        },
      },
    } as unknown as Stripe;
  };

  const createTestLayer = (mockStripe: Stripe) =>
    Layer.succeed(StripeService, mockStripe);

  describe("create", () => {
    it("should call stripe.terminal.locations.create with correct params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const params = {
        display_name: "HQ",
        address: {
          line1: "1272 Valencia Street",
          city: "San Francisco",
          state: "CA",
          country: "US",
          postal_code: "94110",
        },
      };

      const result = await Effect.runPromise(
        TerminalLocation.create(params).pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.locations.create).toHaveBeenCalledWith(params);
      expect(result.id).toBe("tml_123");
      expect(result.display_name).toBe("HQ");
    });
  });

  describe("retrieve", () => {
    it("should call stripe.terminal.locations.retrieve with correct id", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const result = await Effect.runPromise(
        TerminalLocation.retrieve("tml_123").pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.locations.retrieve).toHaveBeenCalledWith(
        "tml_123",
        undefined
      );
      expect(result.id).toBe("tml_123");
    });
  });

  describe("update", () => {
    it("should call stripe.terminal.locations.update with correct params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const params = { display_name: "Updated HQ" };

      const result = await Effect.runPromise(
        TerminalLocation.update("tml_123", params).pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.locations.update).toHaveBeenCalledWith(
        "tml_123",
        params
      );
      expect(result.id).toBe("tml_123");
    });
  });

  describe("del", () => {
    it("should call stripe.terminal.locations.del with correct id", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const result = await Effect.runPromise(
        TerminalLocation.del("tml_123").pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.locations.del).toHaveBeenCalledWith("tml_123");
      expect(result.deleted).toBe(true);
    });
  });

  describe("list", () => {
    it("should call stripe.terminal.locations.list with no params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const result = await Effect.runPromise(
        TerminalLocation.list().pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.locations.list).toHaveBeenCalledWith(
        undefined
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("tml_123");
    });

    it("should call stripe.terminal.locations.list with params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const params = { limit: 10 };

      await Effect.runPromise(
        TerminalLocation.list(params).pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.locations.list).toHaveBeenCalledWith(params);
    });
  });
});
