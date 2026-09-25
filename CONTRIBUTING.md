# Contributing

Maintained by Thomas Foster, with a workflow meant to be approachable for both humans and coding agents. Conventions are in [AGENTS.md](AGENTS.md).

## Branch model

`main` plus short-lived feature branches, PR against `main`, squash-merge with a conventional prefix (`feat:`, `fix:`, `docs:`, `chore:`). Rebase onto `origin/main` before opening a PR; never merge `main` into a feature branch (GitHub's "Update branch" button does a merge — avoid it).

## Git hooks

Hooks are managed by Vite+; the editable [.vite-hooks/pre-commit](.vite-hooks/pre-commit) is committed. **pre-commit** runs `vp staged` (format + lint on staged files). There is no pre-push hook.

## CI expectations

[ci.yml](.github/workflows/ci.yml) runs one job: `vp check` (format + lint), `vp run check` (every package's `src` + `tests` type gate plus the dist-consumer check against the emitted declarations), `vp run -r test:unit`, `vp run -r build`, `pnpm audit --audit-level high`. [release.yml](.github/workflows/release.yml) runs changesets/action on `main`: it opens the version PR while unreleased changesets exist and publishes to npmjs once it merges, via OIDC trusted publishing (see [PUBLISHING.md](PUBLISHING.md)). [effect-canary.yml](.github/workflows/effect-canary.yml) re-runs the type, test and build gates weekly against `effect@rc` and files an issue when they go red.

## Pre-PR checklist

1. `vp check`
2. `vp run check`
3. `vp run -r test:unit`
4. `vp run -r build`
5. `vp run test:coverage`, then `fallow audit --base origin/main` (the coverage map is what makes fallow's CRAP scores real)
6. A changeset (`pnpm changeset`) for every change to a published package's behaviour.
7. `git fetch origin main && git rebase origin/main`
8. Docs: the package `README.md` for any exported change; the package `CLAUDE.md` for a new term or invariant.

## Running individual checks

```sh
vp lint                                               # oxlint
vp fmt                                                # oxfmt
vp run check                                          # the whole type gate (builds dist/ for the declaration check)
vp run --filter ./packages/payments-stripe check      # one package's type gate
vp run -r test:unit                                   # unit tests
vp test run tests/Webhook.test.ts                     # single file (from inside the package)
vp run -r build                                       # emit dist/
vp run test:coverage                                  # one Istanbul map for fallow
vp run fallow:audit                                   # change-set review (not a CI gate)
```
