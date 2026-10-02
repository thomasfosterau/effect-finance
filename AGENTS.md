# AGENTS.md

`CLAUDE.md` is a symlink to this file. This repository publishes the **`@thomasfosterau/effect-payments` package family**: a vendor-neutral payments core for Effect plus provider implementations. The GitHub repository is still named `effect-stripe`; renaming it to `effect-payments` is an owner action (see [PUBLISHING.md](PUBLISHING.md#renaming-the-repository)). The direction is set by epic #36 (and the extraction index website#2015). The first consumer is `thomasfosterau/gardeneria`, whose `packages/billing` is the **behavioural spec and the test corpus, not code to transplant**: port its behaviour and its tests into the idiomatic Effect shape, never its files.

| Package | Directory | Purpose / boundary |
| --- | --- | --- |
| `@thomasfosterau/effect-payments` | `packages/payments` | The vendor-neutral core: capability services, neutral entities, `Money`, `Page`, `IdempotencyKey`, `Stub` and the `PaymentsError` channel. Peer: `effect` only. |
| `@thomasfosterau/effect-payments-stripe` | `packages/payments-stripe` | Stripe: the neutral capabilities as `Layer`s (`StripePayments`) plus the Stripe resource modules as a provider escape hatch, over the fetch-only `StripeHttp` transport. The `stripe` SDK is an optional peer (types of the resource modules not yet migrated to generated Schemas, #81; an alternative SDK transport). |
| `@thomasfosterau/effect-payments-paypal` | `packages/payments-paypal` | PayPal REST: `Products`, `Prices` (billing plans), `PaymentIntents` (orders), `Subscriptions`, `Refunds`. No `Customers`: PayPal has no customer resource. |
| `@thomasfosterau/effect-payments-airwallex` | `packages/payments-airwallex` | Airwallex payment acceptance: `Customers`, `PaymentIntents`, `Refunds`. |

A new package adds a row here, a `CLAUDE.md` of its own, its `#check` edge in the root `vite.config.ts`, its `#build` edge and `paths` in `tests/dist-consumer/` (`vite.config.ts`, `tsconfig.json`), its zone in `.fallowrc.json`, and a `workspace:*` devDependency in the root `package.json`.

## Common pitfalls

- **Never edit a version in a `package.json`.** Every external version lives in [`pnpm-workspace.yaml`](pnpm-workspace.yaml) under `catalog:` (peer ranges under `catalogs.peers`), and `catalogMode: strict` rejects anything else at install. After editing the catalog, run `pnpm install` and commit the regenerated `pnpm-lock.yaml`; a stale lockfile fails CI with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. `@effect/tsgo`, `@typescript/native` and `vite-plus` move together (the tsgo patch hard-errors at install on an unsupported `tsc` or `oxlint`); read the comments on those entries before bumping any of the three.
- **Effect 4, pinned.** The `effect` pin in `pnpm-workspace.yaml` moves in lockstep with the consuming applications and the sibling libraries; the published peer range is its floor (rc.118 moved every `effect/unstable/<x>` module to `effect/<x>`, and `httpapi` to `http-api`, so a build against it cannot load on rc.117 or earlier). A new Effect release reaches this repository through the ordinary dependency-update flow: the PR that moves the pin runs the full CI gates against it before merge (once CI triggers on the default branch, #105).
- **HTTP goes through `effect/http`.** The PayPal and Airwallex clients and the Stripe `StripeHttp` transport require `HttpClient.HttpClient` and never touch `globalThis.fetch`; tests stub `FetchHttpClient.Fetch`. Which Stripe module may load the SDK is in `packages/payments-stripe/CLAUDE.md`.
- **`dist/` is the product.** Each package is a `vp pack` (tsdown) library with one ESM bundle + `.d.ts` per subpath; `exports` points at `dist/` and is also the list `vite.package.ts` derives the pack entries from. A provider consumes the core through its `dist/`, so every provider task carries a `{ task: "build", from: "dependencies" }` edge, and `tests/dist-consumer` type-checks a consumer fixture against the emitted declarations.
- **One flat module per subpath.** `src/<Name>.ts` is published as `./<Name>` (`src/Treasury.FinancialAccount.ts` → `./Treasury.FinancialAccount`). A new public module is a new `exports` entry; `src/internal/**` is never exported.
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
- **Every export is documented** with a doc comment whose first sentence says what it is for. Nothing executes `@example` blocks yet (#94), so type-check an example you add or change by hand.

## Commands

- `pnpm install` — dependencies plus the Vite+ git hooks (pre-commit runs `vp staged`: format + lint on staged files) and the `prepare` step that patches the native `tsc` / `oxlint` with `@effect/tsgo`. No pre-push hook: run the gates yourself.
- `vp check` — format + lint (Oxfmt + Oxlint). `vp run check` — the type gate: every package's `src` + `tests` (plus `payments-stripe`'s `examples` and `scripts`) under the Effect-patched native `tsc`, plus the dist-consumer check (which builds `dist/` and asserts the emitted types). They are different commands.
- `vp run -r test:unit` — unit tests (every vendor seam stubbed; nothing needs a credential).
- `vp run -r build` — `vp pack` → every package's `dist/`.
- `vp run test:coverage` — every package's unit suite under one Istanbul map at `coverage/coverage-final.json`, which `fallow audit` reads for exact per-function CRAP scores. Run it before the audit.
- `vp run --filter ./packages/payments-stripe generate:schemas` (network) — regenerate `packages/payments-stripe/src/internal/generated/schemas.ts` from the pinned Stripe OpenAPI spec (`scripts/stripe-spec.json`); offline, set `STRIPE_SPEC_FILE` to the pinned `spec3.json`. Never hand-edit the generated file.
- `pnpm changeset` — add a changeset (see [Branches and pull requests](#branches-and-pull-requests)).

Invoke everything through `vp` (`vp exec` instead of `npx`; `vp run <task>` instead of bare `pnpm`). The sanctioned non-`vp` invocations: `pnpm install` (`--frozen-lockfile` in CI), `pnpm changeset` / `pnpm publish` on the release path.

## Verification

Before you report work as done, run the gates below in order and quote each command with its final pass/fail. If a gate can't run here, say which and why in the PR body; never imply it ran.

1. `vp check`
2. `vp run check`
3. `vp run -r test:unit`
4. `vp run -r build`
5. If you touched `packages/payments-stripe/scripts/` or the spec pin: `vp run --filter ./packages/payments-stripe generate:schemas && git diff --exit-code -- packages/payments-stripe/src/internal/generated`. CI runs it; it fetches the spec from GitHub, so where the network is blocked set `STRIPE_SPEC_FILE` to the pinned `spec3.json`.
6. `vp run test:coverage`, then `fallow audit --base origin/main` (the fallow gate; see [Agent sessions](#agent-sessions)).

CI runs 1–5 plus `pnpm audit --audit-level high`. For CI parity, start from a clean tree: `rm -rf node_modules packages/*/node_modules packages/*/dist && pnpm install --frozen-lockfile`. A warm local tree hides a missing peer: a required peer of a dependency must be a declared dependency, or CI fails on a fresh runner while the local tree passes.

## Branches and pull requests

- Branch off `main`; PR against `main`; squash-merge with a conventional prefix (`feat:`, `fix:`, `docs:`, `chore:`). Rebase onto `origin/main` before opening or updating a PR; never merge `main` into your branch (GitHub's Update-branch button merges).
- Agent work uses git worktrees under `.claude/worktrees/`, one per branch, named `issue-<n>-<slug>` for issue-linked work. Start every command that targets a worktree with an explicit `cd` and confirm with `git log -1` before committing. The linked `vp` at `~/.local/bin/vp` re-execs the nearest project-local `node_modules/vite-plus/bin/vp`, so a worktree needs its own `pnpm install` first.
- Every change to a published package's behaviour carries a changeset (`pnpm changeset`); docs-, CI- and tooling-only changes need none. Never publish or version by hand: the Release workflow opens the "Version Packages" PR and the owner merges it ([PUBLISHING.md](PUBLISHING.md)).
- These are standing approvals: open a PR once a branch has a pushed commit, watch it to merge or close (investigate CI failures and review comments; rebase when it goes conflicting), and keep the PR body current with what the branch does.
- GitHub writes go to `thomasfosterau/effect-stripe` only; pass `-R thomasfosterau/effect-stripe` whenever the cwd might be another checkout. Use the `gh` CLI for GitHub operations, even when GitHub MCP tools are available. If another repository needs something, say so in the PR body.

## Work tracker

- Issues are the backlog: when you find work you can't do now, file an issue rather than leaving a TODO. Epic #36 carries the plan; its open sub-issues are the remaining slices. Adoption by an application is tracked in that application's tracker (gardeneria#1269).
- The issue is the spec — read its comments; later comments override the body. Decisions recorded on #36 and website#2015 override anything older. Re-verify code claims against current `main` (and gardeneria's current `trunk` for the behavioural spec) before editing.
- Record decisions and findings as issue comments.
- Stop-and-report is a valid outcome: on a blocker outside the issue's scope, comment the evidence on the issue and stop. Scope cut mid-PR becomes a linked issue before merge.

## Effect

Consult effect-solutions before writing Effect code (`vp exec effect-solutions list`, then `vp exec effect-solutions show <topic>…`: basics, services-and-layers, data-modeling, error-handling, config, testing); never guess at an Effect pattern. The guides track Effect 4 as a whole, so check an API exists in the pinned version (`node_modules/effect/dist/*.d.ts`) before relying on it.

## Agent sessions

- The SessionStart hook (`.claude/hooks/session-start.sh`) installs dependencies against the lockfile and puts `vp` and `fallow` on PATH for non-interactive shells. It hydrates no secrets: nothing here needs one, and nothing here can publish.
- `.claude/settings.json` also formats every file an Edit / Write touches (`vp fmt --write`), and a PreToolUse hook (`.claude/hooks/fallow-gate.sh`) runs `fallow audit --base origin/main` before `git commit` / `git push` and blocks on a `fail` verdict. The git pre-commit hook runs only `vp staged`.
- Won't run in an agent session without network: `generate:schemas` (fetches the spec; use `STRIPE_SPEC_FILE`). Say so in the PR body.

## Documentation surfaces

The root `README.md` is the landing page; each package `README.md` is the API reference consumers read on npm; each package `CLAUDE.md` carries its boundary, invariants and terms; `CONTRIBUTING.md` carries human setup and procedures; `PUBLISHING.md` and `SECURITY.md` the release pipeline and its one-time setup. No `docs/` tree; decisions go in issue comments.

---

## Fallow local gate

Before any `git commit` or `git push`, run `vp run test:coverage` and then `fallow audit --format json --quiet --explain --gate-marker agent` (the commit hook runs the audit; the coverage map is what makes its CRAP scores real). If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking. Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict.

## Fallow task map

| When the agent is about to... | Run |
| --- | --- |
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>` |
| delete an "unused" dependency | `fallow dead-code --trace-dependency <name>` |
| commit or open a PR | `fallow audit --base <ref>` |
| check which architecture rules apply to a file before changing it | `fallow guard <files>` |
| understand a finding | `fallow explain <issue-type>` |
