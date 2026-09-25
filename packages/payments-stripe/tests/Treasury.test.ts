import { describe, it, expect } from "vite-plus/test";
import * as Treasury from "../src/Treasury.ts";

describe("Treasury.FinancialAccount", () => {
  it("should have create function that requires the Stripe transport", () => {
    const effect = Treasury.FinancialAccount.create({
      supported_currencies: ["usd"],
    });

    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function that requires the Stripe transport", () => {
    const effect = Treasury.FinancialAccount.retrieve("fa_test");

    expect(typeof effect).toBe("object");
  });

  it("should have update function that requires the Stripe transport", () => {
    const effect = Treasury.FinancialAccount.update("fa_test", {
      metadata: { key: "value" },
    });

    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires the Stripe transport", () => {
    const effect = Treasury.FinancialAccount.list({ limit: 10 });

    expect(typeof effect).toBe("object");
  });

  it("should have close function that requires the Stripe transport", () => {
    const effect = Treasury.FinancialAccount.close("fa_test");

    expect(typeof effect).toBe("object");
  });

  it("should have retrieveFeatures function that requires the Stripe transport", () => {
    const effect = Treasury.FinancialAccount.retrieveFeatures("fa_test");

    expect(typeof effect).toBe("object");
  });

  it("should have updateFeatures function that requires the Stripe transport", () => {
    const effect = Treasury.FinancialAccount.updateFeatures("fa_test", {
      inbound_transfers: { ach: { requested: true } },
    });

    expect(typeof effect).toBe("object");
  });
});

describe("Treasury.Transaction", () => {
  it("should have retrieve function that requires the Stripe transport", () => {
    const effect = Treasury.Transaction.retrieve("trxn_test");

    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires the Stripe transport", () => {
    const effect = Treasury.Transaction.list({
      financial_account: "fa_test",
    });

    expect(typeof effect).toBe("object");
  });
});

describe("Treasury.InboundTransfer", () => {
  it("should have create function that requires the Stripe transport", () => {
    const effect = Treasury.InboundTransfer.create({
      financial_account: "fa_test",
      amount: 10000,
      currency: "usd",
      origin_payment_method: "pm_test",
    });

    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function that requires the Stripe transport", () => {
    const effect = Treasury.InboundTransfer.retrieve("ibt_test");

    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires the Stripe transport", () => {
    const effect = Treasury.InboundTransfer.list({
      financial_account: "fa_test",
    });

    expect(typeof effect).toBe("object");
  });

  it("should have cancel function that requires the Stripe transport", () => {
    const effect = Treasury.InboundTransfer.cancel("ibt_test");

    expect(typeof effect).toBe("object");
  });
});

describe("Treasury.OutboundTransfer", () => {
  it("should have create function that requires the Stripe transport", () => {
    const effect = Treasury.OutboundTransfer.create({
      financial_account: "fa_test",
      amount: 10000,
      currency: "usd",
      destination_payment_method: "pm_test",
    });

    expect(typeof effect).toBe("object");
  });

  it("should have retrieve function that requires the Stripe transport", () => {
    const effect = Treasury.OutboundTransfer.retrieve("obt_test");

    expect(typeof effect).toBe("object");
  });

  it("should have list function that requires the Stripe transport", () => {
    const effect = Treasury.OutboundTransfer.list({
      financial_account: "fa_test",
    });

    expect(typeof effect).toBe("object");
  });

  it("should have cancel function that requires the Stripe transport", () => {
    const effect = Treasury.OutboundTransfer.cancel("obt_test");

    expect(typeof effect).toBe("object");
  });
});
