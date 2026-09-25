## Summary

Describe what changed and why. If this closes an issue, add `Closes #N` so it auto-closes on merge to `main`. For a port of application behaviour (gardeneria's `packages/billing` is the reference for #36), name the app files it supersedes — the app's adoption issue deletes them.

## Validation

Tick what you ran. Pre-commit covers format + lint; there is no pre-push hook.

- [ ] `vp check` (`vp fmt --check` + `vp lint`)
- [ ] `vp run check` (every package's `src` + `tests`, plus the dist-consumer declaration check)
- [ ] `vp run -r test:unit`
- [ ] `vp run -r build`
- [ ] `vp run test:coverage` then `fallow audit --base origin/main`
- [ ] A changeset under `.changeset/` for every published-package change

## Notes

Anything reviewers should pay special attention to: exported signatures, peer ranges, `sideEffects: false` (no top-level statements in `dist/`), behaviour ported from an application that must stay compatible with what it serves today.
