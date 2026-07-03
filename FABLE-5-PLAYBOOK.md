# FABLE-5-PLAYBOOK — operating Claude Fable 5 on this project (D223, 2026-07-03)

Distilled from Anthropic's "Prompting Claude Fable 5" guidance (2026) down to what this repo actually needs. Canonical alongside the D145 routing law; `START-HERE.md`, `CLAUDE.md`, `AGENTS.md`, `AUTONOMOUS-RUN.md`, and `OVERNIGHT-RUN-PROMPT.md` all point here. The ready-made full-spectrum audit kickoff that applies all of this is **`FABLE-AUDIT-PROMPT.md`**.

## 1 · What changed (and how to undo it)
- The Claude Code main loop now runs **Claude Fable 5** (`claude-fable-5[1m]` — the 1M-context variant), set via `/model` and persisted in `~/.claude/settings.json`. Fable is the Mythos-class tier above Opus; it is included in Aaron's subscription **as of 2026-07-03** — that inclusion may end.
- **Rollback:** `backups/pre-fable-2026-07-03/RESTORE.md` (local-only, gitignored — it contains user-level `~/.claude` snapshots). Fastest path: `/model claude-opus-4-8`; every D223 doc change is also revertible via `git revert` of the D223 commit.
- `effortLevel: "xhigh"` predates Fable and stays (Aaron's deliberate setting). All D145/D63 helper-routing law stands; see §4.

## 2 · Effort and turn length
- **Effort is the primary intelligence/latency/cost lever on Fable.** The main loop stays xhigh — never silently downgrade it. On Fable, `high`/`medium`/`low` each outperform the same tier on prior models, so helper tiers (Sonnet low/medium, Haiku) still land above their old quality bar.
- **Turns run longer by default.** A single Fable turn on a hard task can run many minutes of context-gathering, building, and self-verifying, and autonomous stretches can run for hours. Do not mistake a long turn for a hang; keep heavy probe batches serialized as before (8 GB Mac).
- At high effort Fable can over-gather on routine work and over-tidy code. The §3(b) scope snippet is the standing counterweight; the D160 focused-gate discipline (smallest safe slice, focused probes) already enforces the same instinct.

## 3 · Standard run-prompt snippets — embed in every long/autonomous kickoff prompt
Fable follows brief steering better than enumerated rule lists. These five snippets are the project-standard steering; quote them (or a tightened equivalent) rather than re-enumerating behaviors:

**(a) Act, don't overplan.**
> When you have enough information to act, act. Do not re-derive facts already established, re-litigate a decision already made (DECISIONS.md is append-only law), or narrate options you will not pursue. If weighing a choice, give a recommendation, not a survey.

**(b) Scope discipline (pairs with the D160 focused-gate law and "no broad refactors").**
> Don't add features, refactor, or introduce abstractions beyond what the slice requires. Do the simplest thing that works well; no premature abstraction, no speculative error handling, no feature flags where you can just change the code — except that new tactical work MUST still use the repo's guarded no-op-when-inactive seams (that is the project's byte-identity law, not premature abstraction).

**(c) Grounded progress claims (pairs with the Reporting-discipline standard).**
> Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for (probe JSON, gate output, git log); if something is not yet verified, say so explicitly. If tests fail, say so with the output; if a step was skipped, say that.

**(d) Checkpoint rule (pairs with the §8 HALT charter).**
> Pause for Aaron only when the work genuinely requires him: an irreversible/destructive action, money/external accounts/publishing, a real scope change, or a new fork that contradicts a shipped decision. If you hit one, ask and end the turn cleanly — never end on an unexecuted promise.

**(e) Autonomous-pipeline reminder (overnight/looping runs).**
> You are operating autonomously; Aaron is not watching in real time, so "Shall I…?" blocks the work. For reversible actions inside the cleared scope, proceed. Before ending your turn, check your last paragraph: if it is a plan, a question, or a promise about work not yet done, do that work now. End only when the milestone is complete-and-gated or you are HALT-blocked.

## 4 · Subagents and workflows under Fable
- Fable dispatches parallel subagents **more readily** than prior models — good, but it makes the D145 law MORE load-bearing: **explicit `model` + `effort` on every `Agent` call and every Workflow `agent()` call, and never Fable on a helper.** An unlabeled helper now inherits xhigh + Fable, the most expensive possible inheritance.
- Tiers unchanged: **Sonnet low/medium** (search, summaries, mechanical transforms, WCAG sweeps, first-pass gathering) · **Haiku** (pure greps/reads/sizing) · **Opus high/xhigh** (bug-hunt finders/verifiers/critic, design panels, citation-grade research-verify). The Fable main loop is the final verifier on top.
- Keep the adversarial bug-hunt workflow before commits even though Fable's own bug-finding recall is higher — fresh-context verifiers still outperform self-critique, and the workflow is what caught the D105 fabricated-citation HIGH.
- Prefer long-lived helpers continued via SendMessage over re-spawning where a helper's context is reusable.

## 5 · Context budget — D171 interplay
Fable can preemptively suggest wrapping up, summarizing, or trimming scope when it worries about context. **The D171 fresh-chat boundary stands exactly as written** (stop at a clean committed+pushed boundary near ~70-80% consumed and surface a paste-ready continuation prompt). What Fable must NOT do: trim quality or scope mid-milestone because of context worry, or hand off before the current bounded slice is gated. Finish the slice, then stop clean. Auto-condense stays a safety net, never the queue runner.

## 6 · Refusals and classifiers
- Fable runs safety classifiers on **offensive cybersecurity**, **biology/life-sciences methods**, and **reasoning-extraction** (asking the model to echo its internal thinking). A turn can end with a refusal stop instead of output.
- This game's content — Civil War history, combat simulation, casualty modeling, medicine/disease teaching systems — is not in those domains, but a false positive is conceivable (e.g., a deep period-disease-mechanism research leg). If a leg refuses: reword/re-scope it first; if it persists, run that one leg on Opus 4.8 (`/model claude-opus-4-8`, do the leg, switch back) and note it in the run log.
- **Never instruct any prompt, skill, or workflow agent to "show/echo/transcribe your reasoning"** — that is the reasoning-extraction trigger. The `~/.claude/skills/` library was audited 2026-07-03: clean, no such instructions.

## 7 · Prompts and skills under Fable
- **Over-prescriptive legacy prompts can now DEGRADE output.** Fable's instruction-following is strong enough that brief steering beats enumerated micro-management. When a legacy run prompt or skill reads as step-by-step hand-holding for things Fable does well by default, trim it — and record the trim in `DECISIONS.md` (repo-visible lessons, non-negotiable #5).
- **Give the reason, not only the request.** Fable performs better knowing intent — kickoff prompts should carry the one-line "why" (who the feature teaches, what the milestone unlocks), not just the task.
- **Memory:** Fable leans harder on recorded lessons. This project's law already fits (lessons live in `DECISIONS.md`/`RUN-LOG.md`/handoff docs, never hidden memory); the `~/.claude` auto-memory stays for machine-level facts only.
- **Start at the top of the difficulty range.** Fable's range is widest on the hardest work — multi-system audits, whole-war-journey features, cross-module integration. Don't reflexively slice work to prior-model size; scope the slice to the gate, not to model timidity.

## 8 · Session-start checklist for a Fable run
1. Confirm the model string (statusline or `/model`) — expect `claude-fable-5[1m]`; if Fable is gone from the subscription, apply §1 rollback and use Opus 4.8.
2. Read order per `START-HERE.md`; `HANDOFF.md` + `WAKE-UP.md` top blocks for the live head.
3. Kickoff prompt embeds the §3 snippets and the one-line "why."
4. Helpers: explicit model+effort, never Fable (§4).
5. D171 boundary discipline active (§5); §8 HALT charter unchanged.
