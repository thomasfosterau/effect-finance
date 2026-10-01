import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit } from "effect";
import { type JsonObject, MissingPathError, prepareSpec } from "../scripts/prepareSpec.ts";

const spec: JsonObject = {
  openapi: "3.0.0",
  paths: {
    "/kept": {
      get: {
        parameters: [
          {
            in: "query",
            name: "details",
            required: false,
            style: "deepObject",
            schema: {
              type: "object",
              properties: { email: { type: "string" } },
              required: ["email"],
            },
          },
        ],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/thing" } } },
          },
          default: {
            content: { "application/json": { schema: { $ref: "#/components/schemas/error" } } },
          },
        },
      },
    },
    "/dropped": { get: {} },
  },
  components: {
    schemas: {
      thing: {
        type: "object",
        properties: {
          url: { type: "string", pattern: "^/v1/things", maxLength: 10 },
          customer: {
            anyOf: [{ type: "string", maxLength: 5000 }, { $ref: "#/components/schemas/customer" }],
            nullable: true,
            "x-expansionResources": { oneOf: [{ $ref: "#/components/schemas/customer" }] },
          },
          after: { anyOf: [{ $ref: "#/components/schemas/customer" }], nullable: true },
          status: { type: "string", enum: ["a", "b"], nullable: true },
          closed: { type: "string", enum: ["a"] },
        },
      },
    },
  },
};

const prepare = (paths: ReadonlyArray<string>) => Effect.runSync(prepareSpec(spec, paths));
const schema = (prepared: JsonObject, name: string) =>
  ((prepared["components"] as JsonObject)["schemas"] as JsonObject)[name] as JsonObject;
const property = (prepared: JsonObject, name: string) =>
  (schema(prepared, "thing")["properties"] as JsonObject)[name] as JsonObject;

describe("prepareSpec", () => {
  it("keeps only the pinned paths and drops the error response", () => {
    const prepared = prepare(["/kept"]);
    expect(Object.keys(prepared["paths"] as JsonObject)).toEqual(["/kept"]);
    const responses = (
      ((prepared["paths"] as JsonObject)["/kept"] as JsonObject)["get"] as JsonObject
    )["responses"] as JsonObject;
    expect(Object.keys(responses)).toEqual(["200"]);
  });

  it("collapses an expandable field to its id or an open object, and drops the ref list", () => {
    const customer = property(prepare(["/kept"]), "customer");
    expect(customer["x-expansionResources"]).toBeUndefined();
    expect(customer["anyOf"]).toEqual([
      { type: "string", maxLength: 5000 },
      { type: "object", additionalProperties: true },
      { nullable: true, enum: [null] },
    ]);
  });

  it("lets a nullable anyOf and a nullable enum be null", () => {
    const prepared = prepare(["/kept"]);
    expect(property(prepared, "after")["anyOf"]).toEqual([
      { $ref: "#/components/schemas/customer" },
      { nullable: true, enum: [null] },
    ]);
    expect(property(prepared, "status")["enum"]).toEqual(["a", "b", null]);
    expect(property(prepared, "closed")["enum"]).toEqual(["a"]);
  });

  it("strips string patterns but keeps other constraints", () => {
    expect(property(prepare(["/kept"]), "url")).toEqual({ type: "string", maxLength: 10 });
  });

  it("keeps an optional deepObject query parameter optional", () => {
    const parameter = (
      (((prepare(["/kept"])["paths"] as JsonObject)["/kept"] as JsonObject)["get"] as JsonObject)[
        "parameters"
      ] as ReadonlyArray<JsonObject>
    )[0]!;
    expect((parameter["schema"] as JsonObject)["required"]).toBeUndefined();
  });

  it("fails on a pinned path the spec does not have", () => {
    const exit = Effect.runSyncExit(prepareSpec(spec, ["/kept", "/missing"]));
    expect(Exit.isFailure(exit)).toBe(true);
    const error = Exit.isFailure(exit)
      ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : undefined))[0]
      : undefined;
    expect(error).toBeInstanceOf(MissingPathError);
    expect(error).toMatchObject({ path: "/missing" });
  });
});
