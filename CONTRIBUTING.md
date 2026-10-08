# Contributing

Maintained by Thomas Foster, with a workflow meant to be approachable for both humans and coding agents.

Branch model, pre-PR gates and changeset rules: [AGENTS.md](AGENTS.md#branches-and-pull-requests) and [Verification](AGENTS.md#verification).

## Setup

```sh
pnpm install   # dependencies, git hooks, and the Effect-patched tsc / oxlint
```

## Git hooks

Hooks are managed by Vite+; the editable [.vite-hooks/pre-commit](.vite-hooks/pre-commit) is committed. **pre-commit** runs `vp staged` (format + lint on staged files). There is no pre-push hook.

## CI expectations

[ci.yml](.github/workflows/ci.yml) runs one job: `vp check` (format + lint), `vp run check` (the type gate, including the dist-consumer check against the emitted declarations), `vp run -r test:unit`, `vp run -r build`, `vp run docgen` (type-checks and runs every JSDoc `@example` against `dist/`), a regenerate-and-diff of `packages/payments-stripe/src/internal/generated` (`generate:schemas`; fetches the pinned spec), and `pnpm audit --audit-level high`. [release.yml](.github/workflows/release.yml) runs changesets/action on `trunk`: it opens the version PR while unreleased changesets exist and publishes to npmjs once it merges, via OIDC trusted publishing (see [PUBLISHING.md](PUBLISHING.md)).

## Docs to update with a change

The package `README.md` for any exported change (it is the API reference npm shows); the package `CLAUDE.md` for a new term or invariant.

## Running individual checks

```sh
vp lint                                               # oxlint
vp fmt                                                # oxfmt
vp run check                                          # the whole type gate (builds dist/ for the declaration check)
vp run --filter ./packages/payments-stripe check      # one package's type gate
vp run -r test:unit                                   # unit tests
vp test run tests/Webhook.test.ts                     # single file (from inside the package)
vp run -r build                                       # emit dist/
vp run docgen                                         # type-check and run every JSDoc @example
vp run test:coverage                                  # one Istanbul map for fallow
vp run fallow:audit                                   # change-set review (not a CI gate)
```
