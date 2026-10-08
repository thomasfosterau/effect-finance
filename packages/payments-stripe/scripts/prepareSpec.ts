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

/** Which side of the wire a schema describes: what we send, or what Stripe answers with. */
type Side = "request" | "response";

/**
 * A response schema without the constraints that can only turn a legitimate
 * answer into a decode failure. Stripe documents `maxLength` (5000) and
 * integer-ness for its own bookkeeping; a value outside them in a response
 * that has already succeeded (a non-idempotent create, say) must not fail the
 * decode, so response schemas keep their types and drop the checks. A request
 * schema keeps them: they describe what Stripe will accept.
 */
const withoutResponseChecks = (node: JsonObject): JsonObject => {
  const { maxLength: _max, minLength: _min, minimum: _lo, maximum: _hi, ...rest } = node;
  return rest["type"] === "integer" ? { ...rest, type: "number" } : rest;
};

/** The `pattern`s Stripe puts on list-URL templates, which describe no value. */
const URL_TEMPLATE_PATTERN = /^\^\/v1\//;

/**
 * The keys whose value is a map from a name chosen by the API (a property, a
 * schema) to a schema. Such a map is not itself a schema: a response property
 * called `maximum` is a field, and must neither be mistaken for the JSON
 * Schema keyword nor lose its entry.
 */
const NAME_MAPS = new Set(["properties", "schemas"]);

const rewrite = (node: Json, side: Side, isNameMap = false): Json => {
  if (Array.isArray(node)) return node.map((item) => rewrite(item, side));
  if (!isObject(node)) return node;
  const entries = Object.entries(node).flatMap(([key, value]): Array<[string, Json]> => {
    // The effect generator rejects a `pattern` it cannot revive (rc.117).
    // Only list-URL templates are dropped; `findUnsupportedPattern` has
    // already refused any other, so none reaches here.
    if (!isNameMap && key === "pattern" && typeof value === "string" && node["type"] === "string") {
      return [];
    }
    // What a path's operation answers with is the response side, even when
    // its schema is inline rather than a component.
    const valueSide = !isNameMap && key === "responses" ? "response" : side;
    return [[key, rewrite(value, valueSide, !isNameMap && NAME_MAPS.has(key))]];
  });
  const rewritten: JsonObject = Object.fromEntries(entries);
  if (isNameMap) return rewritten;
  if (rewritten["style"] === "deepObject") return optionalDeepObject(rewritten);
  const collapsed = EXPANSION in rewritten ? collapseExpansion(rewritten) : rewritten;
  // Stripe sends `null` for an absent nested object or enum value in a
  // response; a request never has to.
  return side === "request"
    ? collapsed
    : withoutResponseChecks(nullableEnum(nullableAnyOf(collapsed)));
};

/**
 * The first string `pattern` that is not a list-URL template, if any. Dropping
 * a pattern that does describe a value would silently widen what decodes, so
 * it fails the run instead.
 */
const findUnsupportedPattern = (node: Json): string | undefined => {
  if (Array.isArray(node))
    return node.map(findUnsupportedPattern).find((found) => found !== undefined);
  if (!isObject(node)) return undefined;
  const { pattern } = node;
  if (
    typeof pattern === "string" &&
    node["type"] === "string" &&
    !URL_TEMPLATE_PATTERN.test(pattern)
  ) {
    return pattern;
  }
  return Object.values(node)
    .map(findUnsupportedPattern)
    .find((found) => found !== undefined);
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

/** Stripe's error object, which a resource carries as its last error (`invoice.last_finalization_error`, …). */
const ERROR_SCHEMA = "api_errors";

/**
 * Stripe's error object with every resource it carries (`payment_intent`,
 * `setup_intent`, `payment_method`, `source`: a snapshot of what the failed
 * request involved) widened to an open JSON object, as an expansion is. Left
 * as `$ref`s, the error object and the intents form a cycle
 * (`payment_intent.last_payment_error` is an error object again), which the
 * generator can only emit as a recursive schema that a lenient enumeration
 * cannot type, and they would drag both intents' graphs into a slice whose
 * resource only reports its last error. The error's own fields stay typed.
 */
const openErrorResources = (components: Json | undefined): Json | undefined => {
  if (!isObject(components) || !isObject(components["schemas"])) return components;
  const schemas = components["schemas"];
  const error = schemas[ERROR_SCHEMA];
  if (!isObject(error) || !isObject(error["properties"])) return components;
  const isResource = (node: Json): boolean =>
    isObject(node) &&
    ("$ref" in node ||
      (Array.isArray(node["anyOf"]) &&
        node["anyOf"].every((member) => isObject(member) && "$ref" in member)));
  const properties = Object.fromEntries(
    Object.entries(error["properties"]).map(([name, node]): [string, Json] => {
      if (!isObject(node) || !isResource(node)) return [name, node];
      const { $ref: _ref, anyOf: _anyOf, ...rest } = node;
      return [name, { ...rest, ...EXPANDED_OBJECT }];
    }),
  );
  return { ...components, schemas: { ...schemas, [ERROR_SCHEMA]: { ...error, properties } } };
};

/** Raised when a pinned path is not in the spec (the pin and spec disagree). */
export class MissingPathError extends Schema.TaggedError<MissingPathError>()("MissingPathError", {
  path: Schema.String,
}) {}

/** Raised when the spec has a string `pattern` that is not a list-URL template. */
export class UnsupportedPatternError extends Schema.TaggedError<UnsupportedPatternError>()(
  "UnsupportedPatternError",
  { pattern: Schema.String },
) {}

/**
 * Keep only `paths` of `spec` (every method on them), strip list-URL
 * `pattern`s, collapse expansions (and the resources the error object
 * carries) and apply the response-side rewrites
 * (nullability, relaxed checks) to `components` only. Unreferenced `components` are left for
 * the generator to drop: it only emits what a kept operation reaches.
 */
export const prepareSpec = (
  spec: JsonObject,
  paths: ReadonlyArray<string>,
): Effect.Effect<JsonObject, MissingPathError | UnsupportedPatternError> =>
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
    const keptPaths = Object.fromEntries(kept);
    const unsupported = findUnsupportedPattern({
      paths: keptPaths,
      components: spec["components"] ?? null,
    });
    if (unsupported !== undefined)
      return yield* new UnsupportedPatternError({ pattern: unsupported });
    // Request schemas live inline under `paths`; response schemas are the
    // `components` they reference.
    const components = openErrorResources(spec["components"]);
    const prepared: JsonObject = {
      ...spec,
      paths: rewrite(keptPaths, "request"),
      ...(components === undefined ? {} : { components: rewrite(components, "response") }),
    };
    return prepared;
  });
