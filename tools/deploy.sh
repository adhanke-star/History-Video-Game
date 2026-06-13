#!/usr/bin/env bash
# GitHub Pages deploy helper for The Civil War (Vol. I).
# DEFAULT-SAFE: local-only ops by default. The `remote` action — which creates a
# PUBLIC repo, pushes, and turns on Pages (i.e. makes the game shareable on the web) —
# is HALT-gated: it never runs without you typing it, and it prompts before acting.
set -uo pipefail
cd "$(dirname "$0")/.."
REPO_NAME="${2:-civil-war-saga}"

case "${1:-}" in
  check)
    command -v git >/dev/null && echo "git: $(git --version)" || { echo "git MISSING"; exit 1; }
    if command -v gh >/dev/null; then echo "gh: $(gh --version | head -1)"; else
      echo "gh: NOT installed (optional — needed only for the one-command remote path; else use the GitHub web UI)"; fi
    [ -d .git ] && echo ".git: present" || echo ".git: none yet (run: $0 init)"
    echo "entry: index.html → civil_war_generals.html"
    echo "assets: Three.js via jsdelivr CDN (https-ok); terrain PNGs + future assets/3d/*.glb,*.hdr are RELATIVE (subpath-safe on Pages)"
    ;;
  init)
    [ -d .git ] || git init
    git add -A
    echo "Staged (node_modules + non-milestone shots ignored). Review: git status"
    echo "Then commit locally:  git commit -m 'Civil War saga — Pages scaffold'"
    ;;
  serve)   # local test that mirrors a Pages SUBPATH (https://user.github.io/<repo>/)
    PORT="${2:-8765}"
    echo "Serving at http://localhost:$PORT/  (open index.html → game)"
    python3 -m http.server "$PORT"
    ;;
  remote)  # ⚠ HALT-GATED — creates a PUBLIC repo + pushes + enables Pages. Aaron-only.
    command -v gh >/dev/null || { echo "Install gh first: brew install gh && gh auth login"; exit 1; }
    git rev-parse --git-dir >/dev/null 2>&1 || { echo "Run '$0 init' and commit first."; exit 1; }
    git rev-parse HEAD >/dev/null 2>&1 || { echo "Make a commit first: git commit -m '...'"; exit 1; }
    echo "This will PUBLISH the game to the public web as repo '$REPO_NAME':"
    echo "  gh repo create $REPO_NAME --public --source=. --remote=origin --push"
    echo "  + enable GitHub Pages (branch main / root)"
    printf "Type 'PUBLISH' to proceed: "; read -r ans
    [ "$ans" = "PUBLISH" ] || { echo "Aborted."; exit 1; }
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
    gh api -X POST "repos/{owner}/$REPO_NAME/pages" -f "source[branch]=main" -f "source[path]=/" \
      || echo "If that failed, enable it manually: repo Settings → Pages → Branch: main / root."
    echo "Live URL (after Pages builds, ~1 min): https://<your-gh-username>.github.io/$REPO_NAME/"
    ;;
  *)
    echo "usage: $0 {check|init|serve|remote} [repo-name|port]"
    echo "  check  — verify tooling + entry + asset paths (safe)"
    echo "  init   — git init + stage, local only (safe)"
    echo "  serve  — local http server to test (safe)"
    echo "  remote — ⚠ HALT-GATED: create PUBLIC repo + push + Pages (Aaron runs this)"
    ;;
esac
