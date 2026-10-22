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
# commit) and `tsx` (docgen's example runner, and the way to run a one-off
# TypeScript script) are in `node_modules/.bin`, which is on nobody's PATH.
#
# Rather than fight PATH — which this script cannot export into its caller —
# it writes small re-exec shims for the tools into `~/.local/bin`, a directory
# already on PATH in the devcontainer image and writable by the session user.
# A file there survives where an `export` cannot.
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

# The shims bake this path in, so resolve it to an absolute physical path: a
# relative or symlinked CLAUDE_PROJECT_DIR would otherwise be baked in as is.
PROJECT_DIR="$(CDPATH='' cd -- "${CLAUDE_PROJECT_DIR:-$(dirname "${BASH_SOURCE[0]}")/../..}" 2>/dev/null && pwd -P)" \
  || PROJECT_DIR=""
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
  # A fresh temporary file (mktemp creates it, O_EXCL), so a symlink planted
  # at a predictable path is never written through.
  if ! tmp="$(mktemp "$LOCAL_BIN/.$1.XXXXXX" 2>/dev/null)"; then
    log "could not write $1 shim"
    return 0
  fi
  if ! { { printf '#!/usr/bin/env bash\n%s\n' "$marker" && cat; } >"$tmp" 2>/dev/null \
    && chmod 755 "$tmp" 2>/dev/null && mv -f "$tmp" "$dest" 2>/dev/null; }; then
    rm -f "$tmp" 2>/dev/null
    log "could not write $1 shim"
  fi
}

# Both shims below share this preamble (#177, #189). It resolves the project
# and $PWD to physical paths (`pwd -P`, so a symlink cannot smuggle a foreign
# directory past a prefix check) and sets `tree` to the live, registered
# `.claude/worktrees/<name>` worktree that $PWD is inside, or leaves it empty.
# "Live" means both directions agree: the project's
# `git worktree list --porcelain -z` names the directory exactly (NUL-split,
# so a newline in a directory name cannot forge a match), and the directory's
# `.git` file still points into $PROJECT_DIR/.git/worktrees/ (so a registered
# worktree whose directory was replaced by another repository does not count).
# It only reads paths and asks the project's own git for its worktree list, so
# it never runs git inside a foreign checkout. The body is a quoted heredoc,
# pasted into each shim verbatim; only `project=` and `bin=` are baked in.
SHIM_PREAMBLE="$(
  cat <<'PREAMBLE'
root="$(cd "$project" 2>/dev/null && pwd -P)" || root=""
here="$(pwd -P 2>/dev/null)" || here=""
# Is $1 a live worktree of $root? The project's git must list it exactly, and
# its .git file must still point into $root/.git/worktrees/.
live_worktree() {
  listed=""
  while IFS= read -r -d '' entry; do
    [ "$entry" = "worktree $1" ] && listed=1
  done < <(git -C "$root" worktree list --porcelain -z 2>/dev/null)
  [ -n "$listed" ] && [ -f "$1/.git" ] || return 1
  # Read the whole file: the path it names may itself contain a newline.
  line=""
  IFS= read -r -d '' line <"$1/.git"
  line="${line%$'\n'}"
  gitdir="${line#gitdir: }"
  [ "$gitdir" != "$line" ] || return 1
  case "$gitdir" in /*) ;; *) gitdir="$1/$gitdir" ;; esac
  gitdir="$(cd "$gitdir" 2>/dev/null && pwd -P)" || return 1
  case "${gitdir#"$root/.git/worktrees/"}" in
    "$gitdir" | "" | */*) return 1 ;;
  esac
}
tree=""
if [ -n "$root" ] && [ -n "$here" ]; then
  case "$here/" in
    "$root/.claude/worktrees/"?*/*)
      rest="${here#"$root/.claude/worktrees/"}"
      candidate="$root/.claude/worktrees/${rest%%/*}"
      live_worktree "$candidate" && tree="$candidate"
      ;;
  esac
fi
PREAMBLE
)"

# `vp` gets a re-exec shim rather than a plain symlink. A symlink always
# resolves to $PROJECT_DIR's node_modules/vite-plus, even when invoked with
# cwd inside a `.claude/worktrees/*` checkout — so the CLI process loads the
# primary tree's vitest while the worktree's test modules resolve the
# worktree's own copy. Two physical instances of the same vitest version
# corrupt its module-level suite-collector state, and every describe() in the
# worktree throws `Cannot read properties of undefined (reading 'config')`
# (gardeneria #1663). So the shim runs the vite-plus of the tree it is invoked
# in, but only inside an allowed root (#189), so a foreign checkout's
# `node_modules` is never executed:
#
# - inside a live `.claude/worktrees/<name>` (the preamble's `tree`) with its
#   own install, that install;
# - inside a session scratchpad, the nearest `node_modules/vite-plus` found
#   walking up from $PWD, stopping at the scratchpad directory itself. This
#   keeps a PR clone under the scratchpad on its own pinned vite-plus;
# - anywhere else (the primary checkout, a worktree without an install, a
#   foreign repository nested in the project, or outside every allowed root),
#   $PROJECT_DIR's install. Only the project's root installs vite-plus, so the
#   primary checkout needs no walk.
#
# The scratchpad root: no environment variable names it, and the hook writes
# one shim for every session in the container, so a path baked in at session
# start would be wrong for the next session anyway. Claude Code puts each
# session's scratchpad at /tmp/claude-<uid>/<project-slug>/<session-id>/scratchpad,
# so the shim matches exactly that shape at run time, for the invoking user:
# $PWD must lie in a directory named `scratchpad` exactly two levels below
# /tmp/claude-<uid>. /tmp is world-writable, so that prefix alone proves
# nothing (another local user could create /tmp/claude-<uid> first): the
# directory must also be owned by the invoking user and writable by nobody
# else, as Claude Code creates it (mode 0700), so everything under it was
# written by this user. The project slug is not pinned: Claude Code derives it
# from the launch directory (a session started in a worktree has its own), and
# a mismatch would silently send a clone back to the project's vite-plus, the
# failure the shim exists to prevent.
VP_SHIM_MARKER="# generated-by: .claude/hooks/session-start.sh (vp re-exec shim, gardeneria issue #1663)"
write_vp_shim() {
  project_q="$(printf '%q' "$PROJECT_DIR")"
  write_shim vp "$VP_SHIM_MARKER" <<SHIM
project=$project_q
bin=node_modules/vite-plus/bin/vp
$SHIM_PREAMBLE
if [ -n "\$tree" ] && [ -x "\$tree/\$bin" ]; then
  exec "\$tree/\$bin" "\$@"
fi
# A session scratchpad: \$here inside /tmp/claude-<uid>/<slug>/<session>/scratchpad,
# with /tmp/claude-<uid> owned by this user and writable by nobody else.
scratch="\$(cd "/tmp/claude-\$(id -u)" 2>/dev/null && pwd -P)" || scratch=""
if [ -n "\$scratch" ] && [ -n "\$here" ] && [ -O "\$scratch" ] \\
  && [ -z "\$(find "\$scratch" -maxdepth 0 \\( -perm -020 -o -perm -002 \\) -print 2>/dev/null)" ]; then
  case "\$here/" in
    "\$scratch/"?*/?*/scratchpad/*)
      rest="\${here#"\$scratch/"}"
      slug="\${rest%%/*}" && rest="\${rest#*/}"
      session="\${rest%%/*}" && rest="\${rest#*/}"
      if [ "\${rest%%/*}" = scratchpad ]; then
        pad="\$scratch/\$slug/\$session/scratchpad"
        dir="\$here"
        while :; do
          if [ -x "\$dir/\$bin" ]; then
            exec "\$dir/\$bin" "\$@"
          fi
          [ "\$dir" = "\$pad" ] && break
          dir="\$(dirname "\$dir")"
        done
      fi
      ;;
  esac
fi
exec "\$project/\$bin" "\$@"
SHIM
}

# `fallow` gets a re-exec shim too (#177). A symlink always runs $PROJECT_DIR's
# install, so the fallow gate, which `cd`s into the audited tree before it runs
# the `fallow` on PATH, audited a `.claude/worktrees/*` checkout with whatever
# version the primary checkout happened to have installed rather than the one
# the worktree pins. The shim runs the install of the tree it is invoked in,
# but, stricter than `vp`, it never leaves this project (not even for the
# scratchpad), so another repository's `node_modules` is never executed
# (#176): with $PWD inside a live `.claude/worktrees/<name>` (the preamble's
# `tree`) that has its own install, it runs that install; anywhere else (the
# primary checkout, a foreign repository nested in it, or outside the project)
# it runs $PROJECT_DIR's.
FALLOW_SHIM_MARKER="# generated-by: .claude/hooks/session-start.sh (fallow re-exec shim, issue #177)"
write_fallow_shim() {
  project_q="$(printf '%q' "$PROJECT_DIR")"
  write_shim fallow "$FALLOW_SHIM_MARKER" <<SHIM
project=$project_q
bin=node_modules/.bin/fallow
$SHIM_PREAMBLE
if [ -n "\$tree" ] && [ -x "\$tree/\$bin" ]; then
  exec "\$tree/\$bin" "\$@"
fi
if [ -x "\$project/\$bin" ]; then
  exec "\$project/\$bin" "\$@"
fi
printf 'fallow: no install at %s; run pnpm install --frozen-lockfile in %s\\n' "\$project/\$bin" "\$project" >&2
exit 127
SHIM
}

# `tsx` gets the plainest shim: it runs $PROJECT_DIR's install and nothing
# else, so it never executes a foreign repository's `node_modules` (#176).
TSX_SHIM_MARKER="# generated-by: .claude/hooks/session-start.sh (tsx re-exec shim)"
write_tsx_shim() {
  project_q="$(printf '%q' "$PROJECT_DIR")"
  write_shim tsx "$TSX_SHIM_MARKER" <<SHIM
project=$project_q
if [ -x "\$project/node_modules/.bin/tsx" ]; then
  exec "\$project/node_modules/.bin/tsx" "\$@"
fi
printf 'tsx: no install at %s; run pnpm install --frozen-lockfile in %s\\n' "\$project/node_modules/.bin/tsx" "\$project" >&2
exit 127
SHIM
}

# ── 1. Repo binaries the documented workflows invoke directly ─────────────────
# AGENTS.md's fallow gate runs `fallow audit …` before every commit; it resolves
# only from node_modules/.bin. `vp` is included for the remote/web runner,
# where the global launcher does not exist; `tsx` runs docgen's examples. All
# three are shims (above), written even before the install: they resolve the
# binary when they run.
if [ -n "$PROJECT_DIR" ]; then
  write_fallow_shim
  write_vp_shim
  write_tsx_shim
else
  log "cannot resolve the project directory; not writing the fallow, vp and tsx shims"
fi

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
