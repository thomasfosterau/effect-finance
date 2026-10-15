#!/usr/bin/env bash
#
# Provision a checkout for NON-INTERACTIVE use.
#
# One file, two callers — the Claude Code SessionStart hook and a container's
# `postCreateCommand` (which can invoke this file directly) — so a container
# shell and an agent session are provisioned identically. Copied from the
# effect-email library (itself from the effect-drizzle-ext library and the
# gardeneria application).
#
# ## The problem it solves
#
# `~/.bashrc` opens with Debian's standard guard:
#
#     case $- in
#         *i*) ;;
#           *) return;;
#     esac
#
# and the line that puts the toolchain on PATH — `. "$HOME/.vite-plus/env"` —
# sits *below* it. So the environment is correct for a human at a prompt and
# broken for every non-interactive shell, which is what an agent's tool calls
# and a git hook both are. `fallow` (which AGENTS.md requires before every
# commit) is in `node_modules/.bin`, which is on nobody's PATH.
#
# Rather than fight PATH — which this script cannot export into its caller —
# it links the tools into `~/.local/bin`, a directory already on PATH in the
# devcontainer image and writable by the session user. A symlink survives
# where an `export` cannot.
#
# ## Node, and why this repairs rather than clobbers
#
# `~/.vite-plus/bin/node` is a shim pointing at the `vp` launcher, which
# resolves a Node version and installs it under `~/.vite-plus/js_runtime`. That
# directory is `root:root` from image build while the session user is `vp`, so
# when the resolved version drifts past the cached one the shim fails:
#
#     vp: Failed to install Node 24.19.0: Permission denied (os error 13)
#
# Anything routed through `vp` still works; bare `node` does not — which breaks
# the pre-commit hook repo-wide, because `vp staged` shells out to it
# (gardeneria #1462). There is no root in a session, so the directory cannot
# be chowned here.
#
# This script therefore *tests* `node --version` and only replaces the shim
# when it is already broken, pointing it at a real cached binary. A working
# shim is left alone, so `vp env use` keeps functioning wherever it functions
# today. The repair is deliberately conditional: unconditionally replacing a
# working shim would trade one breakage for another.
#
# ## Secrets
#
# This hook hydrates NO secrets. Sessions get no vendor credentials; the unit
# suites never reach a vendor (every HTTP seam is stubbed), so nothing here
# needs one.
#
# ## Contract
#
# Idempotent, and never fatal. Every failure path logs and continues, because
# the SessionStart hook must not block a session and a half-provisioned
# container is more useful than a container that refused to start. Callers
# that want hard failure should check the tools themselves afterwards.
#
# Untrusted-content note: this script reads only fixed, hardcoded paths. It
# takes no input from repo content, issue or PR bodies, or anything an agent
# could have been persuaded to write earlier in a session. Do not add such
# input without revisiting this note — it runs on every session start and
# container create.

set -uo pipefail

log() { printf '[session-start] %s\n' "$1" >&2; }

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
LOCAL_BIN="${HOME:-/home/vp}/.local/bin"

mkdir -p "$LOCAL_BIN" 2>/dev/null || log "cannot create $LOCAL_BIN; continuing"

# Link a binary into ~/.local/bin, replacing a stale link but never a real file.
link_tool() {
  src="$1"
  name="$(basename "$src")"
  dest="$LOCAL_BIN/$name"
  [ -x "$src" ] || return 0
  # Leave a real (non-symlink) binary alone: something deliberately installed it.
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    return 0
  fi
  ln -sfn "$src" "$dest" 2>/dev/null || log "could not link $name"
}

# Write a generated re-exec shim (its body on stdin) to ~/.local/bin/<name>.
# Leave a real, non-generated file alone: something deliberately installed it.
# A stale symlink or a shim we generated earlier is fair game to regenerate —
# the embedded fallback path can change across containers.
write_shim() {
  dest="$LOCAL_BIN/$1"
  marker="$2"
  if [ -e "$dest" ] && [ ! -L "$dest" ] \
    && ! grep -qF "$marker" "$dest" 2>/dev/null; then
    return 0
  fi
  if ! { { printf '#!/usr/bin/env bash\n%s\n' "$marker" && cat; } >"$dest.tmp" 2>/dev/null \
    && chmod +x "$dest.tmp" 2>/dev/null && mv -f "$dest.tmp" "$dest" 2>/dev/null; }; then
    rm -f "$dest.tmp" 2>/dev/null
    log "could not write $1 shim"
  fi
}

# `vp` gets a re-exec shim rather than a plain symlink. A symlink always
# resolves to $PROJECT_DIR's node_modules/vite-plus, even when invoked with
# cwd inside a `.claude/worktrees/*` checkout — so the CLI process loads the
# primary tree's vitest while the worktree's test modules resolve the
# worktree's own copy. Two physical instances of the same vitest version
# corrupt its module-level suite-collector state, and every describe() in the
# worktree throws `Cannot read properties of undefined (reading 'config')`
# (gardeneria #1663). The shim instead walks up from $PWD for the nearest
# project-local vite-plus and re-execs that, falling back to the primary
# checkout's when none is found above cwd.
VP_SHIM_MARKER="# generated-by: .claude/hooks/session-start.sh (vp re-exec shim, gardeneria issue #1663)"
write_vp_shim() {
  write_shim vp "$VP_SHIM_MARKER" <<SHIM
dir="\$PWD"
while [ -n "\$dir" ]; do
  if [ -x "\$dir/node_modules/vite-plus/bin/vp" ]; then
    exec "\$dir/node_modules/vite-plus/bin/vp" "\$@"
  fi
  [ "\$dir" = "/" ] && break
  dir="\$(dirname "\$dir")"
done
exec "$PROJECT_DIR/node_modules/vite-plus/bin/vp" "\$@"
SHIM
}

# `fallow` gets a re-exec shim too (#177). A symlink always runs $PROJECT_DIR's
# install, so the fallow gate, which `cd`s into the audited tree before it runs
# the `fallow` on PATH, audited a `.claude/worktrees/*` checkout with whatever
# version the primary checkout happened to have installed rather than the one
# the worktree pins. The shim runs the install of the tree it is invoked in,
# but unlike the `vp` walk it never leaves this project, so another
# repository's `node_modules` is never executed (#176): with $PWD inside a
# `.claude/worktrees/<name>` that is registered as a worktree of $PROJECT_DIR
# and has its own install, it runs that install; anywhere else (the primary
# checkout, a foreign repository nested in it, or outside the project) it runs
# $PROJECT_DIR's. It only reads paths and asks the project's own git for its
# worktree list, so it never runs git inside a foreign checkout either.
FALLOW_SHIM_MARKER="# generated-by: .claude/hooks/session-start.sh (fallow re-exec shim, issue #177)"
write_fallow_shim() {
  project_q="$(printf '%q' "$PROJECT_DIR")"
  write_shim fallow "$FALLOW_SHIM_MARKER" <<SHIM
project=$project_q
bin=node_modules/.bin/fallow
root="\$(cd "\$project" 2>/dev/null && pwd -P)" || root=""
here="\$(pwd -P 2>/dev/null)" || here=""
if [ -n "\$root" ] && [ -n "\$here" ]; then
  case "\$here/" in
    "\$root/.claude/worktrees/"?*/*)
      rest="\${here#"\$root/.claude/worktrees/"}"
      tree="\$root/.claude/worktrees/\${rest%%/*}"
      if [ -x "\$tree/\$bin" ] \\
        && git -C "\$root" worktree list --porcelain 2>/dev/null | grep -qxF "worktree \$tree"; then
        exec "\$tree/\$bin" "\$@"
      fi
      ;;
  esac
fi
if [ -x "\$project/\$bin" ]; then
  exec "\$project/\$bin" "\$@"
fi
printf 'fallow: no install at %s; run pnpm install --frozen-lockfile in %s\\n' "\$project/\$bin" "\$project" >&2
exit 127
SHIM
}

# ── 1. Repo binaries the documented workflows invoke directly ─────────────────
# AGENTS.md's fallow gate runs `fallow audit …` before every commit; it resolves
# only from node_modules/.bin. `vp` is included for the remote/web runner,
# where the global launcher does not exist. Both are shims (above), written
# even before the install: they resolve the binary when they run.
write_fallow_shim
write_vp_shim

# ── 2. Bare `node` (gardeneria #1462) ─────────────────────────────────────────
# Only repair a shim that is already failing — see the header for why this is
# conditional. `command -v node` is not enough: the shim exists and resolves,
# then dies on use, so the version call is the real test.
if ! node --version >/dev/null 2>&1; then
  VP_BIN_DIR="${VP_HOME:-${HOME:-/home/vp}/.vite-plus}/bin"
  # Newest cached runtime wins; `sort -V` so 24.9 does not beat 24.18.
  REAL_NODE="$(
    find "${VP_HOME:-${HOME:-/home/vp}/.vite-plus}/js_runtime/node" \
      -maxdepth 3 -type f -name node -perm -u+x 2>/dev/null | sort -V | tail -1
  )"
  if [ -n "$REAL_NODE" ]; then
    log "bare \`node\` is broken; pointing it at $REAL_NODE"
    # The shim lives in a vp-owned directory even though the runtime cache
    # beneath it is root-owned, so this needs no privileges.
    ln -sfn "$REAL_NODE" "$VP_BIN_DIR/node" 2>/dev/null \
      || link_tool "$REAL_NODE"
  else
    log "bare \`node\` is broken and no cached runtime was found; \`vp\`-routed commands still work"
  fi
fi

# ── 3. Dependencies ──────────────────────────────────────────────────────────
# Unconditional, not only when node_modules is absent: a prebaked container can
# carry a tree built from an OLDER lockfile, and stale dependencies masquerade
# as breakage on `trunk`. `--frozen-lockfile` is a sub-second no-op when in sync.
if [ -f "$PROJECT_DIR/pnpm-lock.yaml" ]; then
  log "syncing dependencies against the lockfile…"
  (cd "$PROJECT_DIR" && vp install --frozen-lockfile >/dev/null 2>&1) \
    || (cd "$PROJECT_DIR" && pnpm install --frozen-lockfile >/dev/null 2>&1) \
    || (cd "$PROJECT_DIR" && corepack pnpm install --frozen-lockfile >/dev/null 2>&1) \
    || log "dependency install failed; continuing"
fi

exit 0
