/**
 * The deterministic spec-to-spec step of the schema generator: cut Stripe's
 * OpenAPI document down to the paths one slice migrates, and normalise the two
 * constructs the Effect generator cannot (or should not) carry through. Pure
 * and offline, so it is unit-tested (`tests/prepareSpec.test.ts`) without the
 * 7 MB spec.
 *
 * @module
 */

import { Effect, Schema } from "effect";

/** A JSON value, as found in an OpenAPI document. */
export type Json = null | boolean | number | string | ReadonlyArray<Json> | JsonObject;

/** A JSON object. */
export interface JsonObject {
  readonly [key: string]: Json;
}

const isObject = (value: Json | undefined): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The marker Stripe puts on a field that is a string id OR the expanded object. */
const EXPANSION = "x-expansionResources";

/**
 * The schema an expanded object decodes as. The resource behind an expansion
 * belongs to another migrated module (or none yet), so pulling it in here
 * would drag the whole of Stripe's resource graph into every slice. An
 * expansion therefore keeps its string-id branch exactly and widens its object
 * branch to an open JSON object.
 */
const EXPANDED_OBJECT: JsonObject = { type: "object", additionalProperties: true };

/**
 * `anyOf: [ {type: string}, {$ref}, … ]` with the `$ref` members folded into
 * one open object. Anything else about the node (description, nullable, …)
 * is kept.
 */
const collapseExpansion = (node: JsonObject): JsonObject => {
  // `x-expansionResources` lists the same `$ref`s; left in, it would keep the
  // generator's reachability walk on the graph the collapse exists to cut.
  const { [EXPANSION]: _resources, ...rest } = node;
  const { anyOf } = rest;
  if (!Array.isArray(anyOf)) return rest;
  const kept = anyOf.filter((member) => !(isObject(member) && "$ref" in member));
  return { ...rest, anyOf: kept.length === anyOf.length ? anyOf : [...kept, EXPANDED_OBJECT] };
};

/**
 * A `deepObject` query parameter is itself optional, but the generator flattens
 * it into `name[key]` members and marks each of the schema's `required` keys
 * required on the whole query. Dropping the inner `required` keeps an absent
 * parameter absent.
 */
const optionalDeepObject = (parameter: JsonObject): JsonObject => {
  const { schema } = parameter;
  if (!isObject(schema) || parameter["required"] === true) return parameter;
  const { required: _required, ...rest } = schema;
  return { ...parameter, schema: rest };
};

/** The OpenAPI 3.0 spelling of "or null" as a union member. */
const NULL_MEMBER: JsonObject = { nullable: true, enum: [null] };

/**
 * Stripe spells a nullable object field `anyOf: [{$ref}], nullable: true`.
 * The generator reads `nullable` on a typed node but drops it from an `anyOf`
 * wrapper, so a field Stripe answers with `null` (`"after_expiration": null`)
 * would fail to decode. The union gets an explicit null member instead.
 */
const nullableAnyOf = (node: JsonObject): JsonObject => {
  const { anyOf } = node;
  if (node["nullable"] !== true || !Array.isArray(anyOf)) return node;
  return { ...node, anyOf: [...anyOf, NULL_MEMBER] };
};

/**
 * Stripe's `nullable: true` string enums do not list `null` among their
 * values (OpenAPI 3.0 requires it to), so the generator closes the union
 * without it and a legitimate `null` would fail to decode.
 */
const nullableEnum = (node: JsonObject): JsonObject => {
  const values = node["enum"];
  if (node["nullable"] !== true || !Array.isArray(values) || values.includes(null)) return node;
  return { ...node, enum: [...values, null] };
};

const rewrite = (node: Json): Json => {
  if (Array.isArray(node)) return node.map(rewrite);
  if (!isObject(node)) return node;
  const entries = Object.entries(node).flatMap(([key, value]): Array<[string, Json]> => {
    // The effect generator rejects a `pattern` it cannot revive (rc.117), and
    // Stripe's patterns only describe list-URL templates, never a value.
    if (key === "pattern" && typeof value === "string" && node["type"] === "string") return [];
    return [[key, rewrite(value)]];
  });
  const rewritten: JsonObject = Object.fromEntries(entries);
  if (rewritten["style"] === "deepObject") return optionalDeepObject(rewritten);
  return nullableEnum(
    nullableAnyOf(EXPANSION in rewritten ? collapseExpansion(rewritten) : rewritten),
  );
};

/**
 * An operation without its `default` response. That is Stripe's error
 * envelope, which the transport classifies (`internal/error.ts`); decoding it
 * here would pull every resource an error can carry (`payment_intent`, `card`,
 * …) into the graph.
 */
const withoutErrorResponse = (operation: Json): Json => {
  if (!isObject(operation)) return operation;
  const { responses } = operation;
  if (!isObject(responses)) return operation;
  const { default: _error, ...rest } = responses;
  return { ...operation, responses: rest };
};

/** Raised when a pinned path is not in the spec (the pin and spec disagree). */
export class MissingPathError extends Schema.TaggedError<MissingPathError>()("MissingPathError", {
  path: Schema.String,
}) {}

/**
 * Keep only `paths` of `spec` (every method on them), strip unsupported
 * `pattern`s and collapse expansions. Unreferenced `components` are left for
 * the generator to drop: it only emits what a kept operation reaches.
 */
export const prepareSpec = (
  spec: JsonObject,
  paths: ReadonlyArray<string>,
): Effect.Effect<JsonObject, MissingPathError> =>
  Effect.gen(function* () {
    const all = spec["paths"];
    if (!isObject(all)) return yield* new MissingPathError({ path: "(paths)" });
    const kept: Array<[string, Json]> = [];
    for (const path of paths) {
      const operations = all[path];
      if (operations === undefined) return yield* new MissingPathError({ path });
      kept.push([
        path,
        isObject(operations)
          ? Object.fromEntries(
              Object.entries(operations).map(([method, operation]) => [
                method,
                withoutErrorResponse(operation),
              ]),
            )
          : operations,
      ]);
    }
    const prepared = rewrite({ ...spec, paths: Object.fromEntries(kept) });
    return isObject(prepared) ? prepared : spec;
  });
