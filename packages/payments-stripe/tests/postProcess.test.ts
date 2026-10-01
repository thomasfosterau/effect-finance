import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit } from "effect";
import {
  lenientEnumerations,
  optionalUndefined,
  postProcess,
  UnexpectedGeneratorOutput,
} from "../scripts/postProcess.ts";

const CLIENT = "export interface OperationConfig {\n}\n";

const run = (body: string) =>
  Effect.runSyncExit(postProcess(`import * as Data from "effect/Data"\n${body}\n${CLIENT}`));

describe("postProcess", () => {
  it("makes response enumerations lenient but keeps the object discriminator closed", () => {
    expect(
      lenientEnumerations(
        'Schema.Struct({ "object": Schema.Literal("list"), "mode": Schema.Literals(["a", "b"]), "kind": Schema.Literal("x").annotate({}) })',
      ),
    ).toBe(
      'Schema.Struct({ "object": Schema.Literal("list"), "mode": Enumeration.fromWire(Schema.Literals(["a", "b"])), "kind": Enumeration.fromWire(Schema.Literals(["x"])).annotate({}) })',
    );
  });

  it("adds `| undefined` to every optional member, nested ones included", () => {
    expect(
      optionalUndefined(
        '{ readonly "a"?: string, readonly "b": number, readonly "c"?: { readonly "d"?: ReadonlyArray<{ readonly "e"?: "x, y" | "z" }> } & { readonly [x: string]: Schema.Json } }',
      ),
    ).toBe(
      '{ readonly "a"?: string | undefined, readonly "b": number, readonly "c"?: { readonly "d"?: ReadonlyArray<{ readonly "e"?: "x, y" | "z" | undefined }> | undefined } & { readonly [x: string]: Schema.Json } | undefined }',
    );
  });

  it("keeps only the request types, as optional-or-undefined, and drops their schemas", () => {
    const exit = run(
      [
        'export type PostThingsRequestFormUrlEncoded = { readonly "a"?: string }',
        'export const PostThingsRequestFormUrlEncoded = Schema.Struct({ "a": Schema.optionalKey(Schema.String) })',
      ].join("\n"),
    );
    expect(Exit.isSuccess(exit) && exit.value).toBe(
      'export type PostThingsRequestFormUrlEncoded = { readonly "a"?: string | undefined }',
    );
  });

  it("types a response as its schema's Type and marks the schema pure", () => {
    const exit = run(
      [
        'export type Thing = { readonly "mode": "a" | "b" }',
        'export const Thing = Schema.Struct({ "mode": Schema.Literals(["a", "b"]) })',
        "export const PostThings200 = Thing",
      ].join("\n"),
    );
    expect(Exit.isSuccess(exit) && exit.value).toBe(
      [
        "export type Thing = typeof Thing.Type",
        'export const Thing = /* @__PURE__ */ Schema.Struct({ "mode": Enumeration.fromWire(Schema.Literals(["a", "b"])) })',
        "export const PostThings200 = Thing",
      ].join("\n"),
    );
  });

  it("drops the generated client and its imports", () => {
    const exit = run("export const Thing = Schema.String");
    expect(Exit.isSuccess(exit) && exit.value).toBe(
      "export const Thing = /* @__PURE__ */ Schema.String",
    );
  });

  it("fails when the client marker is gone or a recursive schema appears", () => {
    const noClient = Effect.runSyncExit(postProcess("export const Thing = Schema.String"));
    const recursive = run("export const Thing = Schema.suspend(() => Other)");
    for (const exit of [noClient, recursive]) {
      expect(Exit.isFailure(exit)).toBe(true);
      const error = Exit.isFailure(exit)
        ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : undefined))[0]
        : undefined;
      expect(error).toBeInstanceOf(UnexpectedGeneratorOutput);
    }
  });
});
