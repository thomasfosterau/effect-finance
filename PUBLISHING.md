# Publishing & releases

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm via [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) — there is no `NPM_TOKEN`. See [SECURITY.md](./SECURITY.md) for the security rationale behind the pipeline. (Copied from the effect-web library, itself from the effect-jsonapi library.)

## The release flow

1. **Add a changeset with your change.** Run `pnpm changeset`, pick the packages and the bump (`patch` / `minor` / `major`) and write a user-facing summary, then commit the generated file alongside your change. (Changes that don't affect a published package — docs, CI — need no changeset.)
2. **Merge to `main`.** The [`Release`](./.github/workflows/release.yml) workflow runs and, while changesets are pending, opens or updates a **"Version Packages"** PR that applies the version bumps and rolls the changesets into each package's `CHANGELOG.md`. The version step is `changeset version && vp fmt && pnpm install --lockfile-only`, with `"format": false` in `.changeset/config.json`: Changesets 3 otherwise auto-detects the `oxfmt` binary Vite+ installs and runs `oxfmt --write` on the new changelogs, but that binary is Vite+'s IDE-only shim and exits 1 outside LSP mode, which fails the release before the PR is opened. `vp fmt` formats the changelogs instead, so the Version Packages PR passes `vp check`.
3. **Merge the "Version Packages" PR.** With no changesets left, the workflow builds every package and publishes the bumped ones to npm (with provenance) via trusted publishing, then tags the commits and creates the GitHub releases.

The publish step runs `pnpm -r publish`, which rewrites each package's `workspace:` and `catalog:` specifiers to concrete ranges and then shells out to `npm publish`; it is the npm CLI (>= 11.5.1, upgraded in the job) that performs the OIDC exchange, so `pnpm publish` itself needs no OIDC support. `changeset tag` then emits the `New tag:` lines the Changesets action uses to push the tags and create the GitHub releases.

## Maintainer setup (one-time)

None of the four packages (`@thomasfosterau/effect-payments`, `-stripe`, `-paypal`, `-airwallex`) has been published. Until the toolchain migration (#37) they were configured for GitHub Packages (`.npmrc`, `publishConfig.registry: https://npm.pkg.github.com`, `NODE_AUTH_TOKEN: GITHUB_TOKEN`); all of that is gone, and nothing in the repo reads a registry token any more. Remove any GitHub Packages or npm token secrets left in the repository settings.

1. **Allow Actions to open the Version Packages PR.** In the repo: **Settings → Actions → General → Workflow permissions** → enable **"Allow GitHub Actions to create and approve pull requests"**. Without this the built-in `GITHUB_TOKEN` is forbidden from opening pull requests and the workflow fails at the PR-creation step — even though the job already grants `pull-requests: write`.
2. **Bootstrap each package on npm.** A trusted publisher can only be configured on a package that already exists, so the very first version of each package is published by hand from a clean checkout (`vp run -r build && pnpm --filter <name> publish --access public --provenance`, with an npm login that has publish rights on the `@thomasfosterau` scope), or the first `Release` run is given a short-lived granular token via a `NODE_AUTH_TOKEN` step that is removed afterwards.
3. **Configure the trusted publisher** on npmjs.com for each package → **Settings → Trusted Publisher**:
   - Provider: **GitHub Actions**
   - Repository: `thomasfosterau/effect-stripe` (update it if the repository is renamed to `effect-payments` — the binding is by repository name)
   - Workflow: `release.yml`
   - Environment: `release`

   Then remove any classic automation tokens for the package.

4. **Protect the `release` environment.** **Settings → Environments → `release`** → enable **Required reviewers** (yourself) and restrict deployment to the `main` branch, so publishing pauses for manual approval.
5. **Protect `main`.** Require pull requests and passing CI before merge, and disallow direct pushes, so a release can only be triggered by merging the reviewed "Version Packages" PR.

## Renaming the repository

The repository is due to be renamed `effect-stripe` → `effect-payments` (#36). Three places name it and must move in the same change as the rename, or the release silently stops: the fork guard `if: github.repository == 'thomasfosterau/effect-stripe'` in [release.yml](./.github/workflows/release.yml) (the job is skipped on any other name), the `repo` option of the changelog generator in [.changeset/config.json](./.changeset/config.json), and the trusted-publisher binding on npmjs.com (step 3 above). The `repository` / `homepage` / `bugs` URLs in each `package.json` follow GitHub's redirect but should be updated too.
