/**
 * The pin check of the schema generator: the spec that is about to be
 * generated from must be byte-for-byte the one `stripe-spec.json` names.
 *
 * @module
 */

import { Effect, Schema } from "effect";

/** Raised when the spec obtained is not the pinned one. */
export class SpecHashMismatch extends Schema.TaggedError<SpecHashMismatch>()("SpecHashMismatch", {
  expected: Schema.String,
  actual: Schema.String,
}) {}

/** The lowercase hex SHA-256 of `text`'s UTF-8 bytes. */
export const sha256Hex = (text: string): Effect.Effect<string> =>
  Effect.tryPromise(() =>
    globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
  ).pipe(
    Effect.orDie,
    Effect.map((digest) =>
      Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    ),
  );

/** Succeed with `raw` when its SHA-256 is `expected`, else fail with {@link SpecHashMismatch}. */
export const verifySpecHash = (
  raw: string,
  expected: string,
): Effect.Effect<string, SpecHashMismatch> =>
  sha256Hex(raw).pipe(
    Effect.flatMap((actual) =>
      actual === expected
        ? Effect.succeed(raw)
        : Effect.fail(new SpecHashMismatch({ expected, actual })),
    ),
  );
