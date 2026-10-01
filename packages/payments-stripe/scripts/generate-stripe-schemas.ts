/**
 * Regenerates `src/internal/generated/schemas.ts`: the Effect `Schema`s (and
 * their types) for the Stripe resources the resource modules have migrated off
 * the `stripe` package's types (#56).
 *
 * The input is pinned in `scripts/stripe-spec.json`: one tag of
 * `github.com/stripe/openapi`, its commit and the SHA-256 of `spec3.json`. The
 * run downloads that file (or reads `STRIPE_SPEC_FILE`, for an offline run),
 * refuses anything whose hash differs from the pin, cuts it down to the pinned
 * paths (`prepareSpec.ts`) and hands it to `@effect/openapi-generator`'s
 * schema generator. Only the schema part of the generator's output is kept:
 * the generated HttpClient it also emits is not used, since the fetch
 * transport (`StripeHttp`) is the client.
 *
 * Run it with `vp run --filter ./packages/payments-stripe generate:schemas`.
 * The output is a pure function of the pin and the pinned generator version.
 *
 * @module
 */

import { Config, Console, Effect, FileSystem, Layer, Option, Path, Schema } from "effect";
import { FetchHttpClient, HttpClient } from "effect/unstable/http";
import type { OpenAPISpec } from "effect/unstable/httpapi/OpenApi";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as OpenApiGenerator from "@effect/openapi-generator/OpenApiGenerator";
import { type JsonObject, prepareSpec } from "./prepareSpec.ts";

/** The pinned input, `scripts/stripe-spec.json`. */
const Pin = Schema.Struct({
  apiVersion: Schema.String,
  repository: Schema.String,
  tag: Schema.String,
  commit: Schema.String,
  specPath: Schema.String,
  sha256: Schema.String,
  paths: Schema.Array(Schema.String),
});

/** Raised when the spec obtained is not the pinned one. */
class SpecHashMismatch extends Schema.TaggedError<SpecHashMismatch>()("SpecHashMismatch", {
  expected: Schema.String,
  actual: Schema.String,
}) {}

/** Raised when the generator's output no longer has the shape this script cuts. */
class UnexpectedGeneratorOutput extends Schema.TaggedError<UnexpectedGeneratorOutput>()(
  "UnexpectedGeneratorOutput",
  { message: Schema.String },
) {}

/**
 * Where the generator's schema section ends and its HttpClient section begins
 * (the first declaration `toImplementation` emits). Pinned with the generator
 * version; a bump that moves it fails the run instead of emitting a client.
 */
const CLIENT_SECTION = "export interface OperationConfig {";

const sha256Hex = (text: string): Effect.Effect<string> =>
  Effect.tryPromise(() =>
    globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
  ).pipe(
    Effect.orDie,
    Effect.map((digest) =>
      Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    ),
  );

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const here = path.dirname(path.resolve(import.meta.filename));
  const pin = yield* fs
    .readFileString(path.join(here, "stripe-spec.json"))
    .pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(Pin))));

  const local = yield* Config.String("STRIPE_SPEC_FILE").pipe(Config.option);
  const raw = yield* Option.match(local, {
    onSome: (file) => fs.readFileString(file),
    onNone: () => {
      const url = `https://raw.githubusercontent.com/${pin.repository}/${pin.tag}/${pin.specPath}`;
      return Console.log(`Downloading ${url}`).pipe(
        Effect.andThen(HttpClient.get(url)),
        Effect.flatMap((response) => response.text),
      );
    },
  });
  const actual = yield* sha256Hex(raw);
  if (actual !== pin.sha256) {
    return yield* new SpecHashMismatch({ expected: pin.sha256, actual });
  }

  const spec = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Json))(raw).pipe(
    // SAFETY: `Schema.Json` accepts exactly the JSON values `JsonObject` is
    // built from; the document root is an object (prepareSpec checks `paths`).
    Effect.flatMap((json) => prepareSpec(json as JsonObject, pin.paths)),
  );

  const generator = yield* OpenApiGenerator.OpenApiGenerator;
  const warnings: Array<string> = [];
  // SAFETY: the pinned document is an OpenAPI 3.0 document (the generator
  // reads `openapi`, `paths` and `components`), which `OpenAPISpec` describes.
  // oxlint-disable-next-line effect/no-chained-type-assertions -- `JsonObject` and `OpenAPISpec` do not overlap enough for a single assertion
  const generated = yield* generator.generate(spec as unknown as OpenAPISpec, {
    name: "Stripe",
    format: "httpclient",
    onWarning: (warning) => warnings.push(`[${warning.code}] ${warning.message}`),
  });
  yield* Effect.forEach(warnings, (line) => Console.error(`WARNING ${line}`), {
    concurrency: 1,
    discard: true,
  });

  const cut = generated.indexOf(CLIENT_SECTION);
  if (cut === -1) {
    return yield* new UnexpectedGeneratorOutput({
      message: `The generator output has no "${CLIENT_SECTION}" to cut at`,
    });
  }
  // The schema section imports only `Schema`; replace the client's imports.
  const body = generated
    .slice(0, cut)
    .split("\n")
    .filter((line) => !line.startsWith("import "))
    .join("\n")
    .trim();

  const header = [
    "/**",
    " * GENERATED FILE - DO NOT EDIT.",
    " *",
    " * Effect Schemas for the Stripe resources migrated off the `stripe` package's",
    " * types, generated by scripts/generate-stripe-schemas.ts with",
    " * `@effect/openapi-generator` from Stripe's OpenAPI spec:",
    ` *   repository  ${pin.repository}`,
    ` *   tag         ${pin.tag} (${pin.commit})`,
    ` *   API version ${pin.apiVersion}`,
    ` *   spec sha256 ${pin.sha256}`,
    ` *   paths       ${pin.paths.join(", ")}`,
    " * Regenerate with `vp run --filter ./packages/payments-stripe generate:schemas`.",
    " */",
    "// @effect-diagnostics schemaNumber:off",
    "",
  ].join("\n");

  const out = path.join(here, "..", "src", "internal", "generated", "schemas.ts");
  yield* fs.makeDirectory(path.dirname(out), { recursive: true });
  yield* fs.writeFileString(out, `${header}\nimport * as Schema from "effect/Schema"\n\n${body}\n`);
  yield* Console.log(`Wrote ${out} (${body.length} characters)`);
});

program.pipe(
  Effect.provide(
    Layer.mergeAll(
      OpenApiGenerator.layerTransformerSchema,
      FetchHttpClient.layer,
      NodeServices.layer,
    ),
  ),
  NodeRuntime.runMain,
);
