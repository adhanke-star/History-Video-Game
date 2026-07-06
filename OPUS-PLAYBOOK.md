# OPUS-PLAYBOOK — operating Claude Opus 4.8 on this project (D286, 2026-07-06)

How to run the Claude Code main loop as **Claude Opus 4.8** (`claude-opus-4-8` / `opus[1m]`). Canonical alongside the D145 routing law; `START-HERE.md`, `CLAUDE.md`, `AGENTS.md`, and `AUTONOMOUS-RUN.md` all point here. The ready-made full-spectrum audit kickoff that applies all of this is **`AUDIT-PROMPT.md`**. *(Replaces `FABLE-5-PLAYBOOK.md`, retired to `legacy/` when Fable left the subscription — D286.)*

## 1 · Model surface & the effort ladder
- The Claude Code main loop runs **Opus 4.8 + xhigh**, set via `/model opus[1m]` and persisted in `~/.claude/settings.json` (`effortLevel:"xhigh"`). Opus 4.8 is the permanent top model on this machine (Fable left the subscription; D286).
- **Adaptive thinking only.** Opus 4.8 rejects/removes the old knobs: never add `budget_tokens`, `temperature`/`top_p`/`top_k`, or an explicit `thinking:{type:"disabled"}` — they are gone on 4.8.
- **Effort is the intelligence/latency lever.** `high` is the general default; **`xhigh` for the hardest coding/agentic work** — this main build loop runs xhigh. Helpers get **low/medium**. Do **not** reflexively use `max` — 4.8 can overthink at the ceiling, so reserve it for genuinely gnarly problems, not routine work.

## 2 · Narration — default to silence
- **4.8 narrates more by default; counter it.** Write text between tool calls only when you find something load-bearing, change direction, or hit a blocker — one sentence each. No "I'll now…", "Let me…", "First, I will…" preambles; no narrating routine actions. (This is also Aaron's standing terse/direct preference.)

## 3 · Autonomy — decide the small stuff, surface the real forks
- **4.8 tends to ask "Want me to also…?" on minor choices.** For small reversible decisions (naming, which of two equivalent approaches, a default value) pick a reasonable option, note it in one line, and proceed. Still stop first for destructive actions, scope changes, money/publishing, or a fork that contradicts a shipped decision (the §8 HALT charter + D171 boundary bind unchanged).

## 4 · Delegation, memory, search — 4.8 UNDER-reaches, so push
- **Delegate aggressively.** 4.8 under-uses subagents; keep fanning out with Workflow/`Agent` for readers, adversarial panels, and parallel coverage. The D145 routing law is the frame: explicit `model` + `effort` on every `Agent`/Workflow `agent()` call — **Sonnet low/medium** (search, summaries, mechanical transforms, WCAG, first-pass gathering), **Haiku** (pure greps/reads/sizing), **Opus high/xhigh** (bug-hunt finders/verifiers/critic, design/judge panels, citation-grade research-verify). The Opus main loop is the final verifier on top. *(The old "never Fable on a helper" clause is retired — Fable no longer exists.)*
- **Use file-memory for durable lessons** — the repo's `DECISIONS.md`/`RUN-LOG.md`/handoff docs (never hidden memory), and the `~/.claude` project memory dir for machine-level facts.
- **Search the web when current facts matter** — provider endpoints, free tiers, model IDs, and pricing drift; re-verify, never answer from training memory. **State the reason with each helper/search request, not just the ask** — 4.8 performs better knowing intent.

## 5 · Adversarial panels & code review — report EVERYTHING, filter downstream
- **4.8 follows "only report high-severity" too literally, which depresses recall.** Prompt every review/refute/judge lens to report **everything with a confidence + severity**, then filter downstream. A default-refute panel should try to REFUTE each finding and default to refuted-if-uncertain; the main loop adjudicates. (Read-only lenses only when the panel shares a working tree — the D281 panel-race lesson.)

## 6 · Long-horizon runs
- **You have the full spec in the kickoff; execute it end-to-end.** Don't re-derive settled facts, don't re-litigate cleared scope (`DECISIONS.md` is append-only law). When you have enough to act, act.
- **D171 boundary stands exactly as written:** at a clean committed+pushed milestone, near ~70-80% context consumed, or before a browser-heavy batch gate on a strained window, finish the current bounded slice, refresh `HANDOFF.md` + `WAKE-UP.md`, and return a paste-ready continuation prompt. Don't trim quality/scope mid-milestone out of context worry — finish the slice, then stop clean.

## 7 · Standard run-prompt snippets — embed in every long/autonomous kickoff
Brief steering beats enumerated micro-management. Quote these (or a tightened equivalent) in kickoff prompts rather than re-listing behaviors:

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

## 8 · Give the reason, and lean into the hard range
- **Give the reason, not only the request.** Kickoff prompts and helper packets should carry the one-line "why" (who the feature teaches, what the milestone unlocks), not just the task.
- **Scope the slice to the gate, not to model timidity.** Opus 4.8's range is widest on the hardest work — multi-system audits, whole-war-journey features, cross-module integration. Don't reflexively pre-slice work smaller than the gate needs.

## 9 · Session-start checklist for an Opus run
1. Confirm the model string (statusline or `/model`) — expect `opus[1m]` (`claude-opus-4-8`) + `effortLevel:"xhigh"`.
2. Read order per `START-HERE.md`; `HANDOFF.md` + `WAKE-UP.md` top blocks for the live head.
3. Kickoff prompt embeds the §7 snippets and the one-line "why."
4. Helpers: explicit model + effort (§4), Opus only on reasoning legs.
5. Narrate sparingly (§2); decide small reversible forks and log them (§3); delegate/search aggressively (§4).
6. D171 boundary discipline active (§6); §8 HALT charter unchanged.
