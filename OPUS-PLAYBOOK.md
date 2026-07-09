# OPUS-PLAYBOOK — top-model operating playbook (D336, 2026-07-09; filename retained)

How to run the ChatGPT/Codex main loop as **5.6 Sol**. This is the canonical behavior/routing supplement for `START-HERE.md`, `AGENTS.md`, and `AUTONOMOUS-RUN.md`; `AUDIT-PROMPT.md` applies it directly. Historical Opus/Fable references below record prior runs and are not directives for a new ChatGPT task.

## 1 · Model surface & the effort ladder
- Select **5.6 Sol** in ChatGPT. Use **high** for normal autonomous implementation and **xhigh** for multi-system design, historic research verification, complex debugging, adversarial audits, or final release decisions. Do not claim unsupported API IDs or settings from this UI label.
- Use a lower tier only if the current surface explicitly makes one available and only where a lower-quality result cannot affect gameplay, appearance, historical truth, accessibility, or integration. The default is no delegation when the job is small enough for the main loop.
- A helper packet must name its goal, reason, exact files, constraints, acceptance checks, commands, and do-not-touch list. The main loop reads the evidence and owns the decision.

## 2 · Narration — default to silence
- Write text between tool calls only when you find something load-bearing, change direction, or hit a blocker — one sentence each. No "I'll now…", "Let me…", "First, I will…" preambles; no narrating routine actions. (This is also Aaron's standing terse/direct preference.)

## 3 · Autonomy — decide the small stuff, surface the real forks
- For small reversible decisions (naming, which of two equivalent approaches, a default value), pick a reasonable option, note it in one line, and proceed. Stop only for destructive/irreversible actions, spending, account creation, publishing, unclear licensing/provenance, or a fork that genuinely contradicts shipped history/design.

## 4 · Delegation, memory, search
- Delegate when it materially improves independent coverage or offloads exact mechanical work; do not add helpers by ritual. If the active surface exposes lower tiers, use them only for fully packeted mechanical work and set model/effort explicitly. The 5.6 Sol main loop is the final verifier.
- **Use durable repo records** — `DECISIONS.md`, `RUN-LOG.md`, `HANDOFF.md`, and `WAKE-UP.md` — for lessons and live state, never hidden assumptions.
- **Search current sources when facts can drift** — model capability, provider terms, licenses, availability, and historical primary-source locators. State the reason for each research/delegation request.

## 5 · Adversarial panels & code review — report everything, filter downstream
- Ask every review/refute/judge lens to report all findings with confidence and severity. A default-refute pass must try to disprove each finding and treat uncertainty as refuted; the main loop adjudicates. Use read-only lenses when sharing a worktree.

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
- **Scope the slice to the gate, not to model timidity.** Use the top model for the hard range — multi-system audits, whole-war journey features, and cross-module integration. Do not pre-slice work below what safe verification requires.

## 9 · Session-start checklist for a ChatGPT/Codex run
1. Confirm **5.6 Sol** and choose high/xhigh effort.
2. Read order per `START-HERE.md`; `HANDOFF.md` + `WAKE-UP.md` top blocks for the live head.
3. Kickoff prompt embeds the §7 snippets and the one-line "why."
4. Helpers: use only if beneficial; packet and configure them explicitly when the surface permits (§4).
5. Narrate sparingly (§2); decide small reversible forks and log them (§3); delegate/search aggressively (§4).
6. D171 boundary discipline active (§6); §8 HALT charter unchanged.
