import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit } from "effect";
import { sha256Hex, SpecHashMismatch, verifySpecHash } from "../scripts/verifySpec.ts";

describe("verifySpecHash", () => {
  it("passes a spec whose SHA-256 is the pinned one through unchanged", async () => {
    const raw = '{"openapi":"3.0.0"}';
    const hash = await Effect.runPromise(sha256Hex(raw));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await Effect.runPromise(verifySpecHash(raw, hash))).toBe(raw);
  });

  it("fails with SpecHashMismatch, naming both hashes, for any other spec", async () => {
    const pinned = await Effect.runPromise(sha256Hex('{"openapi":"3.0.0"}'));
    const exit = await Effect.runPromiseExit(verifySpecHash('{"openapi":"3.1.0"}', pinned));
    expect(Exit.isFailure(exit)).toBe(true);
    const error = Exit.isFailure(exit)
      ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : undefined))[0]
      : undefined;
    expect(error).toBeInstanceOf(SpecHashMismatch);
    expect(error).toMatchObject({ expected: pinned });
    expect((error as SpecHashMismatch).actual).not.toBe(pinned);
  });
});
