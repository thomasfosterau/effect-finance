import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import type Stripe from "stripe";
import * as TerminalReader from "./Terminal.Reader.js";
import { StripeService } from "./Stripe.js";

describe("Terminal.Reader", () => {
  const createMockStripe = () => {
    const mockReader: Stripe.Terminal.Reader = {
      id: "tmr_123",
      object: "terminal.reader",
      device_type: "bbpos_wisepos_e",
      label: "Test Reader",
      location: "tml_123",
      status: "online",
      livemode: false,
    } as Stripe.Terminal.Reader;

    const mockDeletedReader: Stripe.Terminal.DeletedReader = {
      id: "tmr_123",
      object: "terminal.reader",
      deleted: true,
    };

    return {
      terminal: {
        readers: {
          create: vi.fn().mockResolvedValue(mockReader),
          retrieve: vi.fn().mockResolvedValue(mockReader),
          update: vi.fn().mockResolvedValue(mockReader),
          del: vi.fn().mockResolvedValue(mockDeletedReader),
          list: vi.fn().mockResolvedValue({
            object: "list",
            data: [mockReader],
            has_more: false,
            url: "/v1/terminal/readers",
          }),
        },
      },
    } as unknown as Stripe;
  };

  const createTestLayer = (mockStripe: Stripe) =>
    Layer.succeed(StripeService, mockStripe);

  describe("create", () => {
    it("should call stripe.terminal.readers.create with correct params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const params = {
        registration_code: "simulated-wpe",
        location: "tml_123",
        label: "Test Reader",
      };

      const result = await Effect.runPromise(
        TerminalReader.create(params).pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.readers.create).toHaveBeenCalledWith(params);
      expect(result.id).toBe("tmr_123");
    });
  });

  describe("retrieve", () => {
    it("should call stripe.terminal.readers.retrieve with correct id", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const result = await Effect.runPromise(
        TerminalReader.retrieve("tmr_123").pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.readers.retrieve).toHaveBeenCalledWith(
        "tmr_123",
        undefined
      );
      expect(result.id).toBe("tmr_123");
    });
  });

  describe("update", () => {
    it("should call stripe.terminal.readers.update with correct params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const params = { label: "Updated Reader" };

      const result = await Effect.runPromise(
        TerminalReader.update("tmr_123", params).pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.readers.update).toHaveBeenCalledWith(
        "tmr_123",
        params
      );
      expect(result.id).toBe("tmr_123");
    });
  });

  describe("del", () => {
    it("should call stripe.terminal.readers.del with correct id", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const result = await Effect.runPromise(
        TerminalReader.del("tmr_123").pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.readers.del).toHaveBeenCalledWith("tmr_123");
      expect(result.deleted).toBe(true);
    });
  });

  describe("list", () => {
    it("should call stripe.terminal.readers.list with no params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const result = await Effect.runPromise(
        TerminalReader.list().pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.readers.list).toHaveBeenCalledWith(undefined);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("tmr_123");
    });

    it("should call stripe.terminal.readers.list with params", async () => {
      const mockStripe = createMockStripe();
      const layer = createTestLayer(mockStripe);

      const params = { limit: 10 };

      await Effect.runPromise(
        TerminalReader.list(params).pipe(Effect.provide(layer))
      );

      expect(mockStripe.terminal.readers.list).toHaveBeenCalledWith(params);
    });
  });
});
