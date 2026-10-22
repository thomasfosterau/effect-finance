/**
 * @copyright Thomas Foster
 *
 * Root workspace config. Owns the repo-wide format/lint/staged passes (read
 * statically by `vp fmt` / `vp lint` / `vp staged`) and the root `check` /
 * `docgen` / `test:coverage` aggregates. Every package's own tasks (`check`,
 * `test:unit`, `build`, `docgen`) live in that package's vite.config.ts via
 * ./vite.package.ts; this file deliberately compiles nothing.
 *
 * Copied from the effect-web library's root config (itself from the
 * effect-drizzle-ext library and the gardeneria application): every comment
 * that explains a load-bearing decision is part of the standard and travels
 * with the config.
 */

import { defineConfig } from "vite-plus";
import { recommended } from "@effect/tsgo/oxlint-presets";
import effect from "@mpsuesser/oxlint-plugin-effect";

export default defineConfig({
  // Staged-file checks run by `vp staged` (pre-commit).
  staged: {
    "*.{js,ts,css,json,md}": "vp check --fix",
  },
  fmt: {
    // `**/generated/**`: reserved for machine-written code that is not
    // formatted (none today: the Stripe resource modules, written by
    // packages/payments-stripe/scripts/generate-resources.ts, are formatted by
    // the generator itself, which `tests/resources.test.ts` checks).
    ignorePatterns: ["**/dist/**", "**/coverage/**", "**/generated/**", "pnpm-lock.yaml"],
    overrides: [
      {
        files: ["**/*.md"],
        options: {
          proseWrap: "never",
        },
      },
    ],
  },
  lint: {
    ignorePatterns: ["**/dist/**", "**/coverage/**", "**/generated/**", "**/node_modules/**"],
    extends: [recommended, effect.configs.recommended],
    categories: {
      correctness: "error",
    },
    rules: {
      "eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "eslint/prefer-const": "warn",
      // The `Buffer` global is typed `any` wherever a consumer loads
      // @cloudflare/workers-types next to @types/node (every application this
      // family serves), so every call on it is unchecked there. Use
      // Uint8Array / TextEncoder / DataView instead.
      "eslint/no-restricted-globals": [
        "error",
        {
          name: "Buffer",
          message:
            "The `Buffer` global is typed `any` wherever @cloudflare/workers-types is loaded. Use Uint8Array / TextEncoder / DataView.",
        },
      ],
      // `casting-awareness` is an awareness prompt, not a defect rule — it
      // fires on every `as`, including the narrowings a fake vendor client and
      // an unchecked vendor JSON body structurally require. Stays visible as a
      // warning.
      "effect/casting-awareness": "warn",
      // Hard-codes abbreviations (`Arr`, `P`, `R`, …) with no options, so it is
      // unsatisfiable under the full-name convention (`import * as Option from
      // "effect/Option"`) this family shares with its consumers.
      "effect/prefer-namespace-imports": "off",

      // ---- Effect preset: ported-code allowances ---------------------------
      // The modules under packages/*/src predate the Effect oxlint preset
      // (first written against Effect 3 and the Stripe SDK, ported to Effect 4
      // in #38). The rules below sit at `warn`
      // so the code stays committable while each site stays reported; a new
      // site is a defect, not headroom.
      "effect/imperative-loops": "warn",
      "effect/avoid-native-object-helpers": "warn",
      "effect/avoid-non-null-assertion": "warn",
      "effect/avoid-any": "warn",
      "effect/avoid-untagged-errors": "warn",
      "effect/avoid-direct-json": "warn",
      "effect/prefer-arr-match": "warn",
      "effect/no-length-comparison": "warn",
      "effect/prefer-arr-sort": "warn",
      "effect/avoid-try-catch": "warn",
      "effect/yield-in-for-loop": "warn",
      "effect/prefer-effect-is": "warn",
      "effect/avoid-expect-in-if": "warn",
      "effect/effect-run-in-body": "warn",
      "effect/prefer-effect-fn": "warn",
      "effect/avoid-direct-tag-checks": "warn",
      "effect/avoid-option-getorthrow": "warn",
      "effect/no-barrel-imports": "warn",
      "effect/throw-in-effect-gen": "warn",
      "effect/prefer-match-over-switch": "warn",
      "effect/avoid-mutable-state": "warn",
      "effect/no-conditional-empty-object-spread": "warn",
      // Fires on `new Date(vendorTimestamp)` / `Date.parse` in the mappers,
      // which parse a vendor value rather than read the clock.
      "effect/use-clock-service": "warn",
      // ---- Effect preset: rules this workspace's conventions cut across ----
      // `prefer-option-over-null` fires on `?: T | undefined`, which is the
      // ONLY spelling of an optional member `exactOptionalPropertyTypes` lets
      // a caller forward an optional of its own into — the spelling AGENTS.md
      // mandates — and on the `null`s of the neutral entities' `NullOr`
      // fields. Nearly every site is the convention, so the rule is off rather
      // than a wall of warnings that hides the real ones.
      "effect/prefer-option-over-null": "off",
      // `unknown` is the honest type at the vendor boundary: a thrown SDK
      // error handed to `handleStripeError`, a vendor error body before it is
      // mapped onto the neutral channel.
      "effect/no-unknown-parameters": "warn",
      // Same boundary, other direction: a vendor response body is `unknown`
      // until the provider maps it.
      "effect/no-unknown-returns": "warn",
      "effect/no-unsafe-dictionary-type": "warn",
      "effect/no-runtime-typeof": "warn",
      "typescript/no-explicit-any": "off",
      "typescript/no-empty-object-type": "off",
      "typescript/ban-ts-comment": "off",
      "unicorn/no-empty-file": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      // Build/test configs are evaluated by Vite and Vitest in bare Node,
      // before any Effect runtime exists — there is no `Config` provider to
      // read from and no `FileSystem` service to call, so `process.env` and
      // `node:*` are the only things that work there. The Effect preset's
      // service rules have no satisfiable fix in these files. The root
      // `scripts/` are task-graph helpers of the same kind (a step of a
      // package task, run by bare `node`).
      {
        files: ["**/vite.config.ts", "**/vitest.config.ts", "vite.package.ts", "scripts/*.ts"],
        rules: {
          "effect/avoid-node-imports": "off",
          "effect/avoid-sync-fs": "off",
          "effect/avoid-process-env": "off",
          "effect/use-console-service": "off",
          "effect/use-filesystem-service": "off",
          "effect/use-path-service": "off",
          "effect/avoid-native-fetch": "off",
          "effect/effect-promise-vs-trypromise": "off",
          // `...(process.env.X ? { x } : {})` is how a vitest option is left
          // unset under `exactOptionalPropertyTypes`.
          "effect/no-conditional-empty-object-spread": "off",
        },
      },
      // Type-level tests: the expect-error directives ARE the assertions
      // (a statement that must fail to compile), and every binding exists to
      // be asserted against, never to be read.
      {
        files: ["**/tests/**/*.types.ts"],
        rules: {
          "eslint/no-unused-vars": "off",
          "effect/avoid-ts-ignore": "off",
        },
      },
      // Vendor wire schemas decode a provider's JSON under the provider's own
      // field names (`active`, `livemode`, `has_more`); renaming them to
      // `is*` would decode nothing. The neutral entities they map onto keep
      // the rule.
      {
        files: ["packages/*/src/internal/mapping.ts"],
        rules: {
          "effect/require-is-prefix-for-boolean-schema-field": "off",
        },
      },
      // The examples are runnable scripts: the process edge, where the
      // program is run, logs to the terminal and reads its key from the
      // environment.
      {
        files: ["**/examples/**/*.ts"],
        rules: {
          "effect/effect-run-in-body": "off",
          "effect/use-console-service": "off",
          "effect/avoid-process-env": "off",
          "effect/use-clock-service": "off",
          "effect/require-safety-comment-for-type-assertion": "warn",
        },
      },
      // Test suites ARE the runtime boundary: `Effect.runPromise` in a test
      // body is the harness running the effect under test, and a bare
      // `new Error("boom")` there is a fixture standing in for whatever a
      // vendor SDK would have thrown. Fixture casts (a fake SDK client), a
      // wall-clock `Date` for a token expiry and a stubbed `fetch` stay
      // visible as warnings.
      {
        files: ["**/tests/**/*.ts"],
        rules: {
          "effect/effect-run-in-body": "off",
          "effect/avoid-untagged-errors": "off",
          "effect/avoid-native-fetch": "warn",
          // A fake SDK client is `{ … } as unknown as Stripe`: the fixture is
          // deliberately a partial shape.
          "effect/no-chained-type-assertions": "warn",
          // The webhook suite exercises the `Buffer` payload the SDK-based
          // verifier accepts; the WebCrypto verifier (#41) drops it.
          "eslint/no-restricted-globals": "warn",
          "effect/require-safety-comment-for-type-assertion": "warn",
          "effect/use-clock-service": "warn",
          "effect/avoid-process-env": "warn",
          "effect/require-effect-concurrency": "warn",
        },
      },
    ],
    // Type-aware linting is intentionally disabled: type checking stays the
    // `check` tasks' job (native tsc, Effect-patched).
    options: {
      typeAware: false,
      typeCheck: false,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  run: {
    tasks: {
      // The CI typecheck gate, as one task: every package's `check`, plus the
      // dist-consumer check that type-checks a consumer fixture against the
      // EMITTED declarations. A pure graph node. The packages are named
      // explicitly — a `from: "dependencies"` edge does not traverse the
      // workspace root's own devDependencies — so a new package adds itself
      // here.
      check: {
        command: "echo 'check: every type gate green'",
        dependsOn: [
          "@thomasfosterau/effect-payments#check",
          "@thomasfosterau/effect-payments-stripe#check",
          "@thomasfosterau/effect-payments-paypal#check",
          "@thomasfosterau/effect-payments-airwallex#check",
          "@effect-payments/dist-consumer#check",
        ],
        cache: false,
      },
      // Every package's docgen: type-checks AND RUNS each JSDoc `@example`
      // and each `ts` / `typescript` block of the package README against the
      // built `dist/`, then writes the API reference under that
      // package's (git-ignored) `docs/`. Same pure-graph-node shape as
      // `check`, so a new package adds itself here too.
      docgen: {
        command: "echo 'docgen: every example compiled and ran'",
        dependsOn: [
          "@thomasfosterau/effect-payments#docgen",
          "@thomasfosterau/effect-payments-stripe#docgen",
          "@thomasfosterau/effect-payments-paypal#docgen",
          "@thomasfosterau/effect-payments-airwallex#docgen",
        ],
        cache: false,
      },
      // Every package's unit suite under one Istanbul coverage map
      // (`coverage/coverage-final.json`), which `fallow audit` reads for exact
      // per-function CRAP scores (`health.coverage` in .fallowrc.json).
      // Without it fallow estimates every function as uncovered, and any
      // function with cyclomatic complexity ≥ 5 fails the gate on its own.
      // Run this before `fallow audit` (the Claude Code PreToolUse hook
      // `.claude/hooks/fallow-gate.sh` runs the audit before `git commit` /
      // `git push`; the git pre-commit hook runs only `vp staged`).
      "test:coverage": {
        command: "vp test run --coverage",
        // The provider suites resolve the core through its `exports` (its
        // `dist/`), which a cold tree does not have yet.
        dependsOn: ["@thomasfosterau/effect-payments#build"],
        cache: false,
      },
    },
  },
  test: {
    // One entry per package: each package's own vite.config.ts is a vitest
    // project, so the root run and the root coverage map cover them all.
    projects: ["packages/*/vite.config.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text-summary", "json-summary", "json"],
      reportsDirectory: "./coverage",
      // `examples/`: the runnable examples a package's suite executes
      // (payments-stripe's `tests/examples.test.ts`, #127) count too.
      include: ["packages/*/src/**/*.ts", "packages/*/examples/**/*.ts"],
      exclude: ["**/*.d.ts", "**/generated/**"],
    },
  },
});
