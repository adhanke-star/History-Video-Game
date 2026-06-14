# HALT — Phase 4 hosting (your call)

**What's queued:** the GitHub Pages deploy is fully scaffolded and local-only. Everything is staged in a local git repo; `index.html` redirects to the game; `tools/deploy.sh` automates the rest; `gh` CLI is present.

**What I did NOT do (deliberately):** create a remote repo, push, or enable Pages — i.e. I did not publish the game to the web or change any sharing. That's account-level / outward-facing and yours to decide.

**Options:**
1. **(Recommended) Publish public via `gh`** — `bash tools/deploy.sh remote` (prompts; type `PUBLISH`). Fastest path to a shareable HTTPS URL that runs on Mac + iPad + iPhone. Why recommended: it's a game with no secrets, and HTTPS is what makes the 3D assets load on phones, not just localhost. Trade-off: the source becomes publicly visible.
2. **Publish via the GitHub web UI** — same result, clicking instead of CLI (steps in `DEPLOY.md`).
3. **Keep it local-only for now** — play via `play.command` / `tools/deploy.sh serve`; revisit hosting later.

**To proceed:** open `DEPLOY.md` and run the chosen path. Nothing else this run is blocked on it.
