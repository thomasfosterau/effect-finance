## Summary

Describe what changed and why. If this closes an issue, add `Closes #N` so it auto-closes on merge to `trunk`. For a port of application behaviour (gardeneria's `packages/billing` is the reference for #36), name the app files it supersedes — the app's adoption issue deletes them.

## Verification

Run the gates in [AGENTS.md → Verification](https://github.com/thomasfosterau/effect-stripe/blob/trunk/AGENTS.md#verification) and list each command with its final pass/fail. Name any gate that could not run, and why.

## Changeset

- [ ] A changeset under `.changeset/` for every change to a published package's behaviour, or "none needed" with the reason (docs, CI or tooling only).

## Notes

Anything reviewers should pay special attention to: exported signatures, peer ranges, `sideEffects: false` (no top-level statements in `dist/`), behaviour ported from an application that must stay compatible with what it serves today.
