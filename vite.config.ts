/**
 * @copyright Thomas Foster
 *
 * Root workspace config. Owns the repo-wide format/lint/staged passes (read
 * statically by `vp fmt` / `vp lint` / `vp staged`) and the root `check` /
 * `test:coverage` aggregates. Every package's own tasks (`check`, `test:unit`,
 * `build`) live in that package's vite.config.ts via ./vite.package.ts; this
 * file deliberately compiles nothing.
 *
 * Copied from the effect-web library's root config (itself from the
 * effect-drizzle-ext library and the gardeneria application): every comment
 * that explains a load-bearing decision is part of the standard and travels
 * with the config.
 */

import { defineConfig } from "vite-plus";
import { recommended } from "@effect/tsgo/oxlint-presets";

export default defineConfig({
  // Staged-file checks run by `vp staged` (pre-commit).
  staged: {
    "*.{js,ts,css,json,md}": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["**/dist/**", "**/coverage/**", "pnpm-lock.yaml"],
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
    ignorePatterns: ["**/dist/**", "**/coverage/**", "**/node_modules/**"],
    // The siblings also extend `@mpsuesser/oxlint-plugin-effect`'s
    // `configs.recommended` and tune its `effect/*` rules (see the effect-web
    // library's vite.config.ts). That plugin, and the effect-oxlint it builds
    // on, import Effect 4 modules at load (`effect/Result`), so it cannot run
    // in a workspace still on Effect 3 — `vp lint` fails to resolve this
    // config. It comes back, with the siblings' `effect/*` rule tuning and
    // overrides, in the v4 migration (#38).
    extends: [recommended],
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
      "typescript/no-explicit-any": "off",
      "typescript/no-empty-object-type": "off",
      "typescript/ban-ts-comment": "off",
      "unicorn/no-empty-file": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
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
      // Every package's unit suite under one Istanbul coverage map
      // (`coverage/coverage-final.json`), which `fallow audit` reads for exact
      // per-function CRAP scores (`health.coverage` in .fallowrc.json).
      // Without it fallow estimates every function as uncovered, and any
      // function with cyclomatic complexity ≥ 5 fails the gate on its own.
      // Run this before `fallow audit` (the commit hook runs the audit).
      "test:coverage": {
        command: "vp test run --coverage",
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
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.d.ts"],
    },
  },
});
