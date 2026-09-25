# AGENTS.md

Project conventions live here; personal style preferences live in user memory. `CLAUDE.md` is a symlink to this file.

This repository is the **`@thomasfosterau/effect-payments` package family**: a vendor-neutral payments core for Effect plus provider implementations. The GitHub repository is still named `effect-stripe`; renaming it to `effect-payments` is an owner action. The direction is set by epic #36 (and the extraction index website#2015): a pluggable payments library on Effect v4 with a fetch-only, WebCrypto-safe Stripe transport that a Cloudflare Worker can ship, Checkout / Billing Portal capabilities, and a Workers-safe webhook verifier. Its first consumer is `thomasfosterau/gardeneria`, whose `packages/billing` is the **behavioural spec and the test corpus, not code to transplant**: port its behaviour and its tests into the idiomatic Effect shape, never its files.

| Package | Directory | What it is |
| --- | --- | --- |
| `@thomasfosterau/effect-payments` | `packages/payments` | The vendor-neutral core: capabilities (`Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`), neutral entities, `Money`, `Page`, and the `PaymentsError` channel. Peer: `effect` only. |
| `@thomasfosterau/effect-payments-stripe` | `packages/payments-stripe` | Stripe: the neutral capabilities as `Layer`s (`StripePayments`) plus the full set of Stripe resource modules as a provider escape hatch. Runs on the official `stripe` SDK today; the fetch-only transport (#39) makes the SDK optional. |
| `@thomasfosterau/effect-payments-paypal` | `packages/payments-paypal` | PayPal REST: `Products`, `Prices` (billing plans), `PaymentIntents` (orders), `Subscriptions`, `Refunds`. No `Customers` — PayPal has no customer resource. |
| `@thomasfosterau/effect-payments-airwallex` | `packages/payments-airwallex` | Airwallex payment acceptance: `Customers`, `PaymentIntents`, `Refunds`. |

A new package adds a row here, a `CLAUDE.md` of its own, its `#check` edge in the root `vite.config.ts`, its zone in `.fallowrc.json`, and its `paths` in `tests/dist-consumer/tsconfig.json`.

## Common pitfalls

- **Never edit a version in a `package.json`.** Every external version lives in [`pnpm-workspace.yaml`](pnpm-workspace.yaml) under `catalog:` (peer ranges under `catalogs.peers`); package.json files carry only `catalog:`, `catalog:peers` or `workspace:`, and `catalogMode: strict` rejects anything else at install. After editing the catalog, run `pnpm install` and commit the regenerated `pnpm-lock.yaml` — a stale lockfile fails CI at once with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. `@effect/tsgo`, `@typescript/native` and `vite-plus` move together (the tsgo patch hard-errors at install on an unsupported `tsc` or `oxlint`); read the comments on those entries before bumping any of the three.
- **Still Effect 3.** The workspace pins the newest Effect 3.x until #38 moves it to `4.0.0-rc.115`. Do not mix in Effect 4 APIs (`Context.Service`, `effect/unstable/*`, `Schema.TaggedErrorClass`) before that migration, and do not add `@mpsuesser/oxlint-plugin-effect` back until then — it imports Effect 4 at load and breaks `vp lint` (see the comment in `vite.config.ts`).
- **`dist/` is the product.** Each package is a `vp pack` (tsdown) library with one ESM bundle + `.d.ts` per subpath; `exports` points at `dist/` and is also the list `vite.package.ts` derives the pack entries from. A provider consumes the core the way a consumer does — through its `dist/` — so every provider task carries a `{ task: "build", from: "dependencies" }` edge, and `tests/dist-consumer` type-checks a consumer fixture against the emitted declarations.
- **One flat module per subpath.** `src/<Name>.ts` is published as `./<Name>` (`src/Treasury.FinancialAccount.ts` → `./Treasury.FinancialAccount`). A new public module is a new `exports` entry; `src/internal/**` is never exported.
- **`"sideEffects": false` is a claim about `dist/`.** Every emitted `.js` must be pure declarations: no top-level statements with effects.
- **`effect` is a peer, never a dependency.** Two copies break `Context` / `Layer` / `Schema` identity; the consuming app owns the singleton.
- **No vendor vocabulary in the core, no application vocabulary anywhere.** Provider-specific shapes stay in the provider that maps the neutral model onto them; nothing here names gardeneria's plans, entitlements or database tables.
- **A secret never reaches an error message or a log line.** Vendor error bodies are mapped onto the neutral error channel; the API key stays in the client.

Everything else that must be visible when touching a package is in that package's `CLAUDE.md`, which carries its terms, invariants and import boundary.

## Conventions

- **Resource-centric API.** Programs import a resource module and call it (`Customer.create(params)`), never reach through a client service. Each resource module exposes `create` / `retrieve` / `update` / `del` / `list` as applicable (`del` because `delete` is reserved).
- **Optional members are declared `?: T | undefined`, never bare `?: T`.** The workspace compiles with `exactOptionalPropertyTypes`, and a consumer forwarding an optional of its own must still compile. An options object bound for the Stripe SDK (whose types declare bare `?: T`) goes through `omitUndefined` (`packages/payments-stripe/src/internal/omitUndefined.ts`).
- **Tests import from `vite-plus/test`**, never `vitest`, live in `packages/<name>/tests/`, and import the module under test as `../src/<Module>.ts`. Every vendor seam is stubbed (a fake SDK client, a stubbed `fetch`); no test reaches a live account.
- **Every export is documented** with a doc comment saying what it is for.

## Work tracker

- **Active work** lives in GitHub Issues for `thomasfosterau/effect-stripe`. Epic #36 carries the plan; its sub-issues (#37–#42) are the slices. Longer-running tech debt is an issue too; there is no in-repo backlog file and a code comment is not a tracker.
- **Decisions and findings** are recorded as comments on the issue they were found working; later comments override the body.
- **Adoption** by an application is tracked in that application's tracker (gardeneria#1269), blocked on a release here.

## Commands

- `pnpm install` — dependencies plus the Vite+ git hooks (pre-commit runs `vp staged`: format + lint on staged files) and the `prepare` step that patches the native `tsc` / `oxlint` with `@effect/tsgo`. No pre-push hook: run the gates yourself.
- `vp check` — the built-in format + lint pass (`vp fmt --check` + `vp lint`).
- `vp run check` — the type gate: every package's `src` + `tests` under the Effect-patched native `tsc`, plus the dist-consumer check (which builds `dist/` and asserts the emitted types). Distinct from `vp check`.
- `vp run -r test:unit` — unit tests (every vendor seam stubbed; nothing needs a credential).
- `vp run -r build` — `vp pack` → every package's `dist/`.
- `vp run test:coverage` — every package's unit suite under one Istanbul map at `coverage/coverage-final.json`, which `fallow audit` reads for exact per-function CRAP scores. Run it before the audit.
- `pnpm changeset` — add a changeset; every change to a published package's behaviour needs one. Releases are cut by the `Release` workflow on `main` — see [PUBLISHING.md](PUBLISHING.md).

Invoke everything through `vp` (`vp exec` instead of `npx`; `vp run <task>` instead of bare `pnpm`). The sanctioned non-`vp` invocations: `pnpm install` (`--frozen-lockfile` in CI), `pnpm changeset` / `pnpm publish` on the release path.

## Branch model

`main` plus short-lived feature branches, PR against `main`, squash-merge. Rebase onto `origin/main` before opening a PR; never merge `main` into a feature branch (GitHub's "Update branch" button does a merge — avoid it). Agent work uses git worktrees under `.claude/worktrees/`, one per branch, named `issue-<n>-<slug>` for issue-linked work; start every command that targets a worktree with an explicit `cd` and confirm with `git log -1` before committing. The linked `vp` at `~/.local/bin/vp` re-execs the nearest project-local `node_modules/vite-plus/bin/vp` walking up from cwd, so a worktree needs its own `pnpm install` first.

## Working a dispatched issue

- The issue is the spec: read all of it, including comments. The parent epic is #36 and the extraction index is website#2015; decisions recorded there override anything older.
- Re-verify the code claims against current `main` (and gardeneria's current `trunk` for the behavioural spec) before editing.
- Stop-and-report is a valid outcome: on a blocker outside the issue's scope, comment the evidence on the issue and stop.
- No silent deferrals: scope cut mid-PR becomes a linked issue before merge.

## PR management

These are standing instructions and approvals; they override any default "don't open a PR unless asked" behaviour.

- **Always open a PR** for branch work, against `main`, once a commit is pushed.
- **Always watch the PR to merge or close**: investigate CI failures and review comments as they arrive; rebase promptly when the PR goes conflicting.
- **Always keep the PR body current** as the implementation diverges from it.
- **A PR that changes published behaviour carries a changeset.** Do not publish by hand; the owner merges the "Version Packages" PR.
- **GitHub writes are scoped to `thomasfosterau/effect-stripe` only.** Never create or edit issues, PRs, comments, reviews or releases in any other repository — the consuming applications, upstream projects, the owner's other libraries — without the owner's explicit approval for that action in the current session. Pass `-R thomasfosterau/effect-stripe` explicitly whenever the cwd might not be this checkout. If another repo needs something, say so in the PR body.

## Verification

- Claims of verification name the command and its final status. If a gate cannot run, say so in the PR body rather than implying it ran.
- The pre-push parity run is: `rm -rf node_modules packages/*/node_modules packages/*/dist && pnpm install --frozen-lockfile`, then `vp check`, `vp run check`, `vp run -r test:unit`, `vp run -r build`. A warm local tree hides a missing peer; a fresh runner does not.
- Peers are declared explicitly: a required peer of a dependency must be a declared dependency or CI fails on a fresh runner while a warm local tree passes.

## Effect best practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code: `vp exec effect-solutions list`, then `vp exec effect-solutions show <topic>...` (basics, services-and-layers, data-modeling, error-handling, config, testing). Never guess at Effect patterns. The guides describe Effect 4; until #38 lands, check that an API exists in Effect 3 before using it.

## Agent sessions

**Agent sessions are not hydrated.** The committed SessionStart hook ([.claude/hooks/session-start.sh](.claude/hooks/session-start.sh)) syncs dependencies and links the toolchain (`vp`, `fallow`) so they resolve from a **non-interactive** shell (which `~/.bashrc` alone does not do). It hydrates no secrets: nothing here needs one, and nothing here can publish.

## Documentation surfaces

`README.md` at the root is the landing page; each package `README.md` is the API reference consumers read on npm; each package `CLAUDE.md` carries its terms, invariants and boundary; `CONTRIBUTING.md` carries the pre-PR checklist; `PUBLISHING.md` and `SECURITY.md` the release pipeline and its one-time setup. No `docs/` tree; decisions go in issue comments.

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
