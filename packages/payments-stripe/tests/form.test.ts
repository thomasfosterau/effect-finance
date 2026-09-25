import { describe, it, expect } from "vite-plus/test";
import { encodeForm, flattenParams } from "../src/internal/form.ts";

/**
 * Every expectation here was checked against what the official SDK sends
 * (`qs.stringify` with `arrayFormat: "indices"`, dates as Unix seconds,
 * brackets restored), so the fetch transport's wire format is the SDK's.
 */
describe("Stripe form encoding", () => {
  it("encodes nothing for no params or an empty object", () => {
    expect(encodeForm(undefined)).toBe("");
    expect(encodeForm({})).toBe("");
  });

  it("escapes values like the SDK", () => {
    expect(encodeForm({ email: "a+b@example.com", name: "Jane Doe" })).toBe(
      "email=a%2Bb%40example.com&name=Jane%20Doe",
    );
  });

  it("escapes the characters encodeURIComponent leaves alone", () => {
    expect(encodeForm({ weird: "!'()*~-_." })).toBe("weird=%21%27%28%29%2A~-_.");
  });

  it("encodes UTF-8", () => {
    expect(encodeForm({ unicode: "héllo 🌱" })).toBe("unicode=h%C3%A9llo%20%F0%9F%8C%B1");
  });

  it("nests objects in brackets, escaping keys but not the brackets", () => {
    expect(encodeForm({ metadata: { user_id: "u1", "my key": "v&w=x" } })).toBe(
      "metadata[user_id]=u1&metadata[my%20key]=v%26w%3Dx",
    );
  });

  it("indexes arrays, including arrays of objects", () => {
    expect(
      encodeForm({ items: [{ price: "p1", quantity: 2 }, { price: "p2" }], expand: ["a", "b"] }),
    ).toBe("items[0][price]=p1&items[0][quantity]=2&items[1][price]=p2&expand[0]=a&expand[1]=b");
    expect(encodeForm({ arr: [["a", "b"], ["c"]] })).toBe("arr[0][0]=a&arr[0][1]=b&arr[1][0]=c");
  });

  it("skips undefined but keeps an array item's index", () => {
    expect(encodeForm({ a: undefined, d: [undefined, "x"] })).toBe("d[1]=x");
  });

  it("encodes null and the empty string as an empty value (Stripe's unset)", () => {
    expect(encodeForm({ description: null, metadata: { plan: "" } })).toBe(
      "description=&metadata[plan]=",
    );
  });

  it("encodes nothing for an empty array or object", () => {
    expect(encodeForm({ a: [], b: {} })).toBe("");
  });

  it("encodes scalars", () => {
    expect(encodeForm({ flag: true, off: false, n: 0, f: 1.5, big: 10n })).toBe(
      "flag=true&off=false&n=0&f=1.5&big=10",
    );
  });

  it("encodes a Date as whole Unix seconds", () => {
    expect(encodeForm({ when: new Date(1_700_000_000_500) })).toBe("when=1700000000");
  });

  it("drops values with no wire form", () => {
    expect(encodeForm({ fn: () => 1, sym: Symbol("s"), kept: "k" })).toBe("kept=k");
  });

  it("flattens without escaping, for multipart fields", () => {
    expect(flattenParams({ file_link_data: { create: true, metadata: { a: "b c" } } })).toEqual([
      ["file_link_data[create]", "true"],
      ["file_link_data[metadata][a]", "b c"],
    ]);
  });
});
