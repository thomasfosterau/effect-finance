/**
 * The deterministic text step after `@effect/openapi-generator`: turn its
 * output (one `export type` and one `export const` per schema, request and
 * response alike, plus an HttpClient this package does not use) into the
 * module the resource modules import.
 *
 * - **Request side** (`Get…Params`, `Post…RequestFormUrlEncoded`): only the
 *   type is kept, as `?: T | undefined` for every optional member (the
 *   repository's convention under `exactOptionalPropertyTypes`: a caller
 *   forwarding an optional of its own must still compile). The runtime schema
 *   would never be used, since requests are form-encoded, not encoded through
 *   a schema.
 * - **Response side**: every enumeration becomes the lenient
 *   `Enumeration.fromWire` (`Known | Other(raw)`) of the core, so a value
 *   Stripe adds later never fails the decode of a response whose request has
 *   already taken effect; the `object` discriminators stay closed. The type is
 *   `typeof X.Type`, so it follows the lenient schema. Every top-level schema
 *   is marked `@__PURE__` so a bundler can drop the ones a consumer's
 *   entry points do not reach.
 *
 * @module
 */

import { Effect, Schema } from "effect";

/** Raised when the generator's output no longer has the shape this step transforms. */
export class UnexpectedGeneratorOutput extends Schema.TaggedError<UnexpectedGeneratorOutput>()(
  "UnexpectedGeneratorOutput",
  { message: Schema.String },
) {}

/**
 * Where the generator's schema section ends and its HttpClient section begins
 * (the first declaration `toImplementation` emits). Pinned with the generator
 * version; a bump that moves it fails the run instead of emitting a client.
 */
const CLIENT_SECTION = "export interface OperationConfig {";

/** The names the generator gives a request's parameters / form body. */
const REQUEST_NAME = /^(?:Get|Post|Put|Patch|Delete)\w*(?:Params|RequestFormUrlEncoded)$/;

const STRING_LITERAL = String.raw`"(?:[^"\\]|\\.)*"`;
const LITERALS = new RegExp(
  String.raw`Schema\.Literals\(\[((?:${STRING_LITERAL}(?:, )?)+)\]\)`,
  "g",
);
const SINGLE_LITERAL = new RegExp(
  String.raw`(?<!"object": )Schema\.Literal\((${STRING_LITERAL})\)`,
  "g",
);

/** Wrap every enumeration of a response schema in `Enumeration.fromWire`. */
export const lenientEnumerations = (runtime: string): string =>
  runtime
    .replace(LITERALS, (literals) => `Enumeration.fromWire(${literals})`)
    .replace(
      SINGLE_LITERAL,
      (_whole, value: string) => `Enumeration.fromWire(Schema.Literals([${value}]))`,
    );

const OPENING = "{[(<";
const CLOSING = "}])>";

/** The index just past the string literal that opens at `start`. */
const endOfString = (type: string, start: number): number => {
  let index = start + 1;
  while (type[index] !== '"') index += type[index] === "\\" ? 2 : 1;
  return index + 1;
};

/**
 * Where the member type that starts at `start` ends: before the first `,` or
 * closing bracket at its own nesting depth, ignoring trailing whitespace.
 */
const endOfMember = (type: string, start: number): number => {
  let depth = 0;
  let index = start;
  while (index < type.length) {
    const char = type.charAt(index);
    if (char === '"') {
      index = endOfString(type, index);
      continue;
    }
    if (OPENING.includes(char)) depth++;
    else if (CLOSING.includes(char)) {
      if (depth === 0) break;
      depth--;
    } else if (char === "," && depth === 0) break;
    index++;
  }
  while (type[index - 1] === " ") index--;
  return index;
};

/**
 * Add `| undefined` to every optional member (`readonly "k"?: T`) of a
 * generated type.
 */
export const optionalUndefined = (type: string): string =>
  [...type.matchAll(/"\?: /g)]
    .map((match) => endOfMember(type, match.index + match[0].length))
    // Insert from the end so earlier positions stay valid (a nested member
    // ends before the member that contains it).
    .toSorted((a, b) => b - a)
    .reduce((text, at) => `${text.slice(0, at)} | undefined${text.slice(at)}`, type);

const DECLARATION = /^export (type|const) ([A-Za-z0-9_]+) = (.*)$/;

/**
 * Cut the generator's output down to the schema module body (declarations
 * only, no imports) and apply the request/response rewrites above.
 */
export const postProcess = (generated: string): Effect.Effect<string, UnexpectedGeneratorOutput> =>
  Effect.gen(function* () {
    const cut = generated.indexOf(CLIENT_SECTION);
    if (cut === -1) {
      return yield* new UnexpectedGeneratorOutput({
        message: `The generator output has no "${CLIENT_SECTION}" to cut at`,
      });
    }
    const schemas = generated
      .slice(0, cut)
      .split("\n")
      .filter((line) => !line.startsWith("import "));
    if (schemas.some((line) => line.includes("Schema.suspend"))) {
      // A recursive schema is typed `Schema.Codec<T>` (Type = Encoded), which a
      // lenient enumeration (string in, `Known | Other` out) cannot satisfy.
      return yield* new UnexpectedGeneratorOutput({
        message: "The generator output has a recursive schema (Schema.suspend)",
      });
    }
    const lines: Array<string> = [];
    for (const line of schemas) {
      const declaration = DECLARATION.exec(line);
      if (declaration === null) {
        lines.push(line);
        continue;
      }
      const [, kind, name = "", rest = ""] = declaration;
      if (REQUEST_NAME.test(name)) {
        if (kind === "type") lines.push(`export type ${name} = ${optionalUndefined(rest)}`);
        continue;
      }
      if (kind === "type") {
        lines.push(`export type ${name} = typeof ${name}.Type`);
        continue;
      }
      const runtime = lenientEnumerations(rest);
      const call = /^(?:Schema|Enumeration)\./.test(runtime) ? "/* @__PURE__ */ " : "";
      lines.push(`export const ${name} = ${call}${runtime}`);
    }
    return lines.join("\n").trim();
  });
