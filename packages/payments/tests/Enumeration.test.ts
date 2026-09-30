import { describe, it, expect } from "vite-plus/test";
import { Schema } from "effect";
import * as Enumeration from "@thomasfosterau/effect-payments/Enumeration";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Price from "@thomasfosterau/effect-payments/Price";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";

describe("Enumeration", () => {
  it("builds an Other member carrying the raw string", () => {
    const value = Enumeration.other("held");
    expect(value).toEqual({ _tag: "Other", raw: "held" });
    expect(Enumeration.isOther(value)).toBe(true);
    expect(Enumeration.isOther("succeeded")).toBe(false);
  });

  it("parses a known literal to itself and anything else to Other", () => {
    expect(Enumeration.parse(Refund.KnownRefundStatus, "failed")).toBe("failed");
    expect(Enumeration.parse(Refund.KnownRefundStatus, "held")).toEqual({
      _tag: "Other",
      raw: "held",
    });
  });

  it("decodes a wire string leniently and encodes it back to the same string", () => {
    const wire = Enumeration.fromWire(Refund.KnownRefundStatus);
    expect(Schema.decodeUnknownSync(wire)("pending")).toBe("pending");
    const unknown = Schema.decodeUnknownSync(wire)("held");
    expect(unknown).toEqual({ _tag: "Other", raw: "held" });
    expect(Schema.encodeSync(wire)(unknown)).toBe("held");
    expect(Schema.encodeSync(wire)("pending")).toBe("pending");
  });

  it("makes each neutral enumeration accept its known literals and Other, and nothing else", () => {
    const cases = [
      [PaymentIntent.PaymentStatus, "succeeded"],
      [Subscription.SubscriptionStatus, "active"],
      [Refund.RefundStatus, "failed"],
      [Price.PriceType, "recurring"],
      [Price.RecurringInterval, "week"],
    ] as const;
    for (const [schema, known] of cases) {
      const decode = Schema.decodeUnknownSync(schema as Schema.Decoder<unknown>);
      expect(decode(known)).toBe(known);
      expect(decode(Enumeration.other("new"))).toEqual({ _tag: "Other", raw: "new" });
      expect(() => decode("not_modelled")).toThrow();
    }
  });
});
