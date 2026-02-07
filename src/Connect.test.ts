import { describe, it, expect } from "vitest";
import * as Account from "../src/Account";
import * as AccountLink from "../src/AccountLink";
import * as Person from "../src/Person";
import * as ExternalAccount from "../src/ExternalAccount";
import * as Transfer from "../src/Transfer";
import * as Topup from "../src/Topup";

describe("Connect Resources", () => {
  describe("Account", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = Account.create({ type: "express" });
      expect(typeof effect).toBe("object");
    });

    it("should have retrieve function that requires Stripe service", () => {
      const effect = Account.retrieve("acct_123");
      expect(typeof effect).toBe("object");
    });

    it("should have update function that requires Stripe service", () => {
      const effect = Account.update("acct_123", { metadata: {} });
      expect(typeof effect).toBe("object");
    });

    it("should have del function that requires Stripe service", () => {
      const effect = Account.del("acct_123");
      expect(typeof effect).toBe("object");
    });

    it("should have list function that requires Stripe service", () => {
      const effect = Account.list();
      expect(typeof effect).toBe("object");
    });
  });

  describe("AccountLink", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = AccountLink.create({
        account: "acct_123",
        type: "account_onboarding",
        refresh_url: "https://example.com/reauth",
        return_url: "https://example.com/return",
      });
      expect(typeof effect).toBe("object");
    });
  });

  describe("Person", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = Person.create("acct_123", { first_name: "Jane" });
      expect(typeof effect).toBe("object");
    });

    it("should have retrieve function that requires Stripe service", () => {
      const effect = Person.retrieve("acct_123", "person_123");
      expect(typeof effect).toBe("object");
    });

    it("should have update function that requires Stripe service", () => {
      const effect = Person.update("acct_123", "person_123", {
        metadata: {},
      });
      expect(typeof effect).toBe("object");
    });

    it("should have del function that requires Stripe service", () => {
      const effect = Person.del("acct_123", "person_123");
      expect(typeof effect).toBe("object");
    });

    it("should have list function that requires Stripe service", () => {
      const effect = Person.list("acct_123");
      expect(typeof effect).toBe("object");
    });
  });

  describe("ExternalAccount", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = ExternalAccount.create("acct_123", {
        external_account: "btok_123",
      });
      expect(typeof effect).toBe("object");
    });

    it("should have retrieve function that requires Stripe service", () => {
      const effect = ExternalAccount.retrieve("acct_123", "ba_123");
      expect(typeof effect).toBe("object");
    });

    it("should have update function that requires Stripe service", () => {
      const effect = ExternalAccount.update("acct_123", "ba_123", {
        metadata: {},
      });
      expect(typeof effect).toBe("object");
    });

    it("should have del function that requires Stripe service", () => {
      const effect = ExternalAccount.del("acct_123", "ba_123");
      expect(typeof effect).toBe("object");
    });

    it("should have list function that requires Stripe service", () => {
      const effect = ExternalAccount.list("acct_123");
      expect(typeof effect).toBe("object");
    });
  });

  describe("Transfer", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = Transfer.create({
        amount: 1000,
        currency: "usd",
        destination: "acct_123",
      });
      expect(typeof effect).toBe("object");
    });

    it("should have retrieve function that requires Stripe service", () => {
      const effect = Transfer.retrieve("tr_123");
      expect(typeof effect).toBe("object");
    });

    it("should have update function that requires Stripe service", () => {
      const effect = Transfer.update("tr_123", { metadata: {} });
      expect(typeof effect).toBe("object");
    });

    it("should have list function that requires Stripe service", () => {
      const effect = Transfer.list();
      expect(typeof effect).toBe("object");
    });
  });

  describe("Topup", () => {
    it("should have create function that requires Stripe service", () => {
      const effect = Topup.create({
        amount: 1000,
        currency: "usd",
        description: "Test topup",
      });
      expect(typeof effect).toBe("object");
    });

    it("should have retrieve function that requires Stripe service", () => {
      const effect = Topup.retrieve("tu_123");
      expect(typeof effect).toBe("object");
    });

    it("should have update function that requires Stripe service", () => {
      const effect = Topup.update("tu_123", { metadata: {} });
      expect(typeof effect).toBe("object");
    });

    it("should have list function that requires Stripe service", () => {
      const effect = Topup.list();
      expect(typeof effect).toBe("object");
    });
  });
});
