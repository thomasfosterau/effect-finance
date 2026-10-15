# AGENTS.md

`CLAUDE.md` is a symlink to this file. This repository publishes the **`@thomasfosterau/effect-payments` package family**: a vendor-neutral payments core for Effect plus provider implementations. The direction is set by epic #36 (and the extraction index website#2015). The first consumer is `thomasfosterau/gardeneria`, whose `packages/billing` is the **behavioural spec and the test corpus, not code to transplant**: port its behaviour and its tests into the idiomatic Effect shape, never its files.

| Package | Directory | Purpose / boundary |
| --- | --- | --- |
| `@thomasfosterau/effect-payments` | `packages/payments` | The vendor-neutral core: capability services, neutral entities, `Money`, `Page`, `IdempotencyKey`, `Stub` and the `PaymentsError` channel. Peer: `effect` only. |
| `@thomasfosterau/effect-payments-stripe` | `packages/payments-stripe` | Stripe: the neutral capabilities as `Layer`s (`StripePayments`) over Distilled's operations (`@distilled.cloud/stripe`, a pinned dependency, #146), plus the Stripe resource modules as a provider escape hatch: generated thin wrappers of every Distilled operation on each resource, over the same `StripeHttp` client. The `stripe` SDK is an optional peer (only the types of the SDK-based `Webhook.constructEvent*` verifier). |
| `@thomasfosterau/effect-payments-paypal` | `packages/payments-paypal` | PayPal REST: `Products`, `Prices` (billing plans), `PaymentIntents` (orders), `Subscriptions`, `Refunds` as `Layer`s (`PayPalPayments`) over Distilled's operations (`@distilled.cloud/paypal`, a pinned dependency, #146), authenticated by the package's own (internal) OAuth login. No REST client of its own: for calls the capabilities do not cover, use `@distilled.cloud/paypal` directly. No `Customers`: PayPal has no customer resource. |
| `@thomasfosterau/effect-payments-airwallex` | `packages/payments-airwallex` | Airwallex payment acceptance: `Customers`, `PaymentIntents`, `Refunds`. |

A new package adds a row here, a `CLAUDE.md` of its own, a `docgen.json`, its `#check` and `#docgen` edges in the root `vite.config.ts`, its `#build` edge and `paths` in `tests/dist-consumer/` (`vite.config.ts`, `tsconfig.json`), its zone in `.fallowrc.json`, and a `workspace:*` devDependency in the root `package.json`.

## Common pitfalls

- **Never edit a version in a `package.json`.** Every external version lives in [`pnpm-workspace.yaml`](pnpm-workspace.yaml) under `catalog:` (peer ranges under `catalogs.peers`, and the `effect` range of a package on Distilled under `catalogs.peers-distilled`), and `catalogMode: strict` rejects anything else at install. After editing the catalog, run `pnpm install` and commit the regenerated `pnpm-lock.yaml`; a stale lockfile fails CI with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. `@effect/tsgo`, `@typescript/native` and `vite-plus` move together (the tsgo patch hard-errors at install on an unsupported `tsc` or `oxlint`); read the comments on those entries before bumping any of the three.
- **Effect 4, pinned.** The `effect` pin in `pnpm-workspace.yaml` moves in lockstep with the consuming applications and the sibling libraries; the published peer range is its floor (rc.118 moved every `effect/unstable/<x>` module to `effect/<x>`, and `httpapi` to `http-api`, so a build against it cannot load on rc.117 or earlier). A new Effect release reaches this repository through the ordinary dependency-update flow: the PR that moves the pin runs the full CI gates against it before merge (once CI triggers on the default branch, #105).
- **HTTP goes through `effect/http`.** The Airwallex client, PayPal's OAuth login, the Stripe `StripeHttp` client and the Distilled operations `StripePayments`, the Stripe resource modules and `PayPalPayments` run on require `HttpClient.HttpClient` and never touch `globalThis.fetch`; tests stub `FetchHttpClient.Fetch`. No Stripe module loads the SDK (`packages/payments-stripe/CLAUDE.md`).
- **`dist/` is the product.** Each package is a `vp pack` (tsdown) library with one ESM bundle + `.d.ts` per subpath; `exports` points at `dist/` and is also the list `vite.package.ts` derives the pack entries from. A provider consumes the core through its `dist/`, so every provider task carries a `{ task: "build", from: "dependencies" }` edge, and `tests/dist-consumer` type-checks a consumer fixture against the emitted declarations.
- **One flat module per subpath.** `src/<Name>.ts` is published as `./<Name>` (`src/Treasury.FinancialAccount.ts` → `./Treasury.FinancialAccount`). A new public module is a new `exports` entry; `src/internal/**` is never exported.
- **`vp run docgen` executes your examples.** `@effect/docgen` type-checks every fenced `ts` / `typescript` block in a JSDoc comment (an `@example` or a description) under the native `tsc`, then runs them all with `tsx` (`"runExamples": true` in each `packages/*/docgen.json`; docgen alone only type-checks). An example imports packages by name, so it resolves through `exports` to `dist/` (the task's build edge). It must be complete (import everything it uses; no `declare const`, which has no runtime value) and must not throw. It must also be hermetic: one that would call a provider builds the program and stops short of running it (`const run = () => Effect.runPromise(…)`, never invoked), or runs it over a stubbed `FetchHttpClient.Fetch`. docgen also reads a file's module doc as the doc of its first statement: an `index.ts` that opens with `export * as X from …` runs its module example twice (harmless), and one that opens with `export * from "./X.js"` fails on an example file name containing `/`, so the core's `index.ts` opens with a named export.
- **`"sideEffects": false` is a claim about `dist/`.** Every emitted `.js` must be pure declarations: no top-level statements with effects.
- **`effect` is a peer, never a dependency.** Two copies break `Context` / `Layer` / `Schema` identity; the consuming app owns the singleton.
- **No vendor vocabulary in the core, no application vocabulary anywhere.** Provider-specific shapes stay in the provider that maps the neutral model onto them; nothing here names gardeneria's plans, entitlements or database tables.
- **A secret never reaches an error message or a log line.** Vendor error bodies are mapped onto the neutral error channel; the API key stays in the client.

Package-local terms, invariants and import boundaries live in each package's `CLAUDE.md`.

## Conventions

- **Effect 4 idioms.** Services are `Context.Service` classes with explicit accessor functions (`Effect.flatMap(Customers, (service) => service.create(params))`); errors are `Schema.TaggedError<Self>()(tag, fields)` classes (rc.118's spelling; `Schema.TaggedErrorClass` is the beta-line name and does not exist here), yielded directly (`return yield* new PaymentConfigError({ … })`); configuration is read through `Config`; vendor JSON is decoded with `Schema` at the boundary.
- **Resource-centric API.** Programs import a resource module and call it (`Customer.create(params)`), never reach through a client service. Each resource module exposes `create` / `retrieve` / `update` / `del` / `list` as applicable (`del` because `delete` is reserved).
- **Optional members are declared `?: T | undefined`, never bare `?: T`.** The workspace compiles with `exactOptionalPropertyTypes`, and a consumer forwarding an optional of its own must still compile. (SDK-bound option objects: see `packages/payments-stripe/CLAUDE.md`.)
- **Relative imports in `src/` carry `.js`** (`./Money.js`); tests import the module under test as `../src/<Module>.ts`.
- **Tests import from `vite-plus/test`**, never `vitest`, and live in `packages/<name>/tests/`. Every vendor seam is stubbed (a fake SDK client, a stubbed `fetch`); no test reaches a live account.
- **Every export is documented** with a doc comment whose first sentence says what it is for. `vp run docgen` type-checks and runs every `@example` (see [Common pitfalls](#common-pitfalls)).

## Commands

- `pnpm install` — dependencies plus the Vite+ git hooks (pre-commit runs `vp staged`: format + lint on staged files) and the `prepare` step that patches the native `tsc` / `oxlint` with `@effect/tsgo`. No pre-push hook: run the gates yourself.
- `vp check` — format + lint (Oxfmt + Oxlint). `vp run check` — the type gate: every package's `src` + `tests` (plus `payments-stripe`'s `examples` and `scripts`) under the Effect-patched native `tsc`, plus the dist-consumer check (which builds `dist/` and asserts the emitted types). They are different commands.
- `vp run -r test:unit` — unit tests (every vendor seam stubbed; nothing needs a credential).
- `vp run -r build` — `vp pack` → every package's `dist/`.
- `vp run docgen` — every package's `@effect/docgen`: type-checks and runs each JSDoc example against `dist/` (it builds first), and writes the git-ignored API reference to `packages/*/docs/`.
- `vp run test:coverage` — every package's unit suite under one Istanbul map at `coverage/coverage-final.json`, which `fallow audit` reads for exact per-function CRAP scores. Run it before the audit.
- `vp run --filter ./packages/payments-stripe generate:resources` (offline) — regenerate the Stripe resource modules (`packages/payments-stripe/src/<Resource>.ts`) from the installed `@distilled.cloud/stripe` and `scripts/resources.ts`; run it after a Distilled bump or a change to `scripts/`. Never hand-edit a generated module: `tests/resources.test.ts` (a unit test) fails when one differs from the generator's output.
- `pnpm changeset` — add a changeset (see [Branches and pull requests](#branches-and-pull-requests)).

Invoke everything through `vp` (`vp exec` instead of `npx`; `vp run <task>` instead of bare `pnpm`). The sanctioned non-`vp` invocations: `pnpm install` (`--frozen-lockfile` in CI), `pnpm changeset` / `pnpm publish` on the release path.

## Verification

Before you report work as done, run the gates below in order and quote each command with its final pass/fail. If a gate can't run here, say which and why in the PR body; never imply it ran.

1. `vp check`
2. `vp run check`
3. `vp run -r test:unit`
4. `vp run -r build`
5. `vp run docgen`
6. `vp run test:coverage`, then `fallow audit --base origin/trunk` (the fallow gate; see [Agent sessions](#agent-sessions)).

CI runs 1–5 plus `pnpm audit --audit-level high`. (The generated Stripe resource modules need no gate of their own: gate 3 runs `tests/resources.test.ts`, which fails when one is stale.) For CI parity, start from a clean tree: `rm -rf node_modules packages/*/node_modules packages/*/dist && pnpm install --frozen-lockfile`. A warm local tree hides a missing peer: a required peer of a dependency must be a declared dependency, or CI fails on a fresh runner while the local tree passes.

## Branches and pull requests

- Branch off `trunk`; PR against `trunk`; squash-merge with a conventional prefix (`feat:`, `fix:`, `docs:`, `chore:`). Rebase onto `origin/trunk` before opening or updating a PR; never merge `trunk` into your branch (GitHub's Update-branch button merges).
- Agent work uses git worktrees under `.claude/worktrees/`, one per branch, named `issue-<n>-<slug>` for issue-linked work. Start every command that targets a worktree with an explicit `cd` and confirm with `git log -1` before committing. The linked `vp` at `~/.local/bin/vp` re-execs the nearest project-local `node_modules/vite-plus/bin/vp`, so a worktree needs its own `pnpm install` first.
- Every change to a published package's behaviour carries a changeset (`pnpm changeset`); docs-, CI- and tooling-only changes need none. Never publish or version by hand: the Release workflow opens the "Version Packages" PR and the owner merges it ([PUBLISHING.md](PUBLISHING.md)).
- These are standing approvals: open a PR once a branch has a pushed commit, watch it to merge or close (investigate CI failures and review comments; rebase when it goes conflicting), and keep the PR body current with what the branch does.
- GitHub writes go to `thomasfosterau/effect-finance` only; pass `-R thomasfosterau/effect-finance` whenever the cwd might be another checkout. Use the `gh` CLI for GitHub operations, even when GitHub MCP tools are available. If another repository needs something, say so in the PR body.

## Work tracker

- Issues are the backlog: when you find work you can't do now, file an issue rather than leaving a TODO. Epic #36 carries the plan; its open sub-issues are the remaining slices. Adoption by an application is tracked in that application's tracker (gardeneria#1269).
- The issue is the spec — read its comments; later comments override the body. Decisions recorded on #36 and website#2015 override anything older. Re-verify code claims against current `trunk` (and gardeneria's current `trunk` for the behavioural spec) before editing.
- Record decisions and findings as issue comments.
- Stop-and-report is a valid outcome: on a blocker outside the issue's scope, comment the evidence on the issue and stop. Scope cut mid-PR becomes a linked issue before merge.

## Effect

Consult effect-solutions before writing Effect code (`vp exec effect-solutions list`, then `vp exec effect-solutions show <topic>…`: basics, services-and-layers, data-modeling, error-handling, config, testing); never guess at an Effect pattern. The guides track Effect 4 as a whole, so check an API exists in the pinned version (`node_modules/effect/dist/*.d.ts`) before relying on it.

## Agent sessions

- The SessionStart hook (`.claude/hooks/session-start.sh`) installs dependencies against the lockfile and puts `vp` and `fallow` on PATH for non-interactive shells. It hydrates no secrets: nothing here needs one, and nothing here can publish.
- `.claude/settings.json` also formats every file an Edit / Write touches (`vp fmt --write`), and a PreToolUse hook (`.claude/hooks/fallow-gate.sh`, generated by `fallow hooks install --target agent --agent claude`; never hand-edit it) runs `fallow audit` against `origin/trunk` before `git commit` / `git push` and blocks on a `fail` verdict. That base is pinned by `FALLOW_AUDIT_BASE` in the `env` of `.claude/settings.json`, which loads at session start: restart a session after pulling a change to it. The git pre-commit hook runs only `vp staged`.

## Documentation surfaces

The root `README.md` is the landing page; each package `README.md` is the API reference consumers read on npm; each package `CLAUDE.md` carries its boundary, invariants and terms; `CONTRIBUTING.md` carries human setup and procedures; `PUBLISHING.md` and `SECURITY.md` the release pipeline and its one-time setup. No `docs/` tree is committed (`packages/*/docs/` is git-ignored docgen output); decisions go in issue comments.

---

## Fallow local gate

Before any `git commit` or `git push`, run `vp run test:coverage` and then `fallow audit --format json --quiet --explain --gate-marker agent --base origin/trunk` (the Claude Code PreToolUse hook `.claude/hooks/fallow-gate.sh` runs this audit before `git commit` / `git push`, taking its base from `FALLOW_AUDIT_BASE`, and blocks on `fail`; the git pre-commit hook runs only `vp staged`; the coverage map is what makes its CRAP scores real). If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking. Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict.

## Fallow task map

| When the agent is about to... | Run |
| --- | --- |
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>` |
| delete an "unused" dependency | `fallow dead-code --trace-dependency <name>` |
| commit or open a PR | `fallow audit --base <ref>` |
| check which architecture rules apply to a file before changing it | `fallow guard <files>` |
| understand a finding | `fallow explain <issue-type>` |
