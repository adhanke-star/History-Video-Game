# OPUS-PLAYBOOK — top-model operating playbook (D336; D361 helper clarification; D514 completion loop; filename retained)

How to run the ChatGPT/Codex main loop as **5.6 Sol**. This is the canonical behavior/routing supplement for `START-HERE.md`, `AGENTS.md`, and `AUTONOMOUS-RUN.md`; `AUDIT-PROMPT.md` applies it directly. Historical Opus/Fable references below record prior runs and are not directives for a new ChatGPT task.

## 1 · Model surface & the effort ladder
- Select **5.6 Sol** in ChatGPT. Use **Ultra** (the highest effort shown in that UI) for multi-system design, historic research verification, complex debugging, adversarial audits, and final release decisions; use a lower effort only when speed matters and the work is clearly bounded. Do not claim unsupported API IDs or settings from this UI label.
- Use a lower tier when the surface exposes one and a lower-quality result cannot affect gameplay, appearance, historical truth, accessibility, or integration. Configure model and effort explicitly.
- **No-control exception (Aaron, 2026-07-10):** a ChatGPT/Codex surface with no per-helper model or effort controls may spawn inheriting helpers for bounded, output-insensitive evidence work. Good uses are read-only greps and inventories, log/artifact summaries, gate execution, and independent mechanical audits. State once that the helpers inherit; do not claim a tier the surface did not expose. The Ultra main loop keeps every quality-bearing decision and verifies the evidence.
- A helper packet must name its goal, reason, exact files, constraints, acceptance checks, commands, and do-not-touch list. The main loop reads the evidence and owns the decision.

## 2 · Narration — default to silence
- Write text between tool calls only when you find something load-bearing, change direction, or hit a blocker — one sentence each. No "I'll now…", "Let me…", "First, I will…" preambles; no narrating routine actions. (This is also Aaron's standing terse/direct preference.)

## 3 · Autonomy — decide the small stuff, surface the real forks
- For small reversible decisions (naming, which of two equivalent approaches, a default value), pick a reasonable option, note it in one line, and proceed. Stop only for destructive/irreversible actions, spending, account creation, publishing, unclear licensing/provenance, or a fork that genuinely contradicts shipped history/design.

## 4 · Delegation, memory, search
- Delegate when task-specific strength or independent coverage improves the result. Use explicit lower tiers for fully packeted mechanical work when controls exist. Under the no-control exception, keep inheriting helpers read-only or mechanically verifiable and outside shipped-output ownership. The 5.6 Sol Ultra main loop owns final verification and integration.
- **Use durable repo records** — `DECISIONS.md`, `RUN-LOG.md`, `HANDOFF.md`, and `WAKE-UP.md` — for lessons and live state, never hidden assumptions.
- **Search current sources when facts can drift** — model capability, provider terms, licenses, availability, and historical primary-source locators. State the reason for each research/delegation request.

## 5 · Adversarial panels & code review — report everything, filter downstream
- Ask every review/refute/judge lens to report all findings with confidence and severity. A default-refute pass must try to disprove each finding and treat uncertainty as refuted; the main loop adjudicates. Use read-only lenses when sharing a worktree.

## 6 · Long-horizon runs
- **You have the full spec in the kickoff; execute it end-to-end.** Don't re-derive settled facts, don't re-litigate cleared scope (`DECISIONS.md` is append-only law). When you have enough to act, act.
- **D514 supersedes D171/D307's ordinary stop cadence:** a clean committed+pushed milestone, phase change, browser/full-suite gate, or reversible design fork is a checkpoint, not a session end. Reload `V1-CHECKLIST.md`, unresolved `REVIEW-QUEUE.md`, and live lane ownership; immediately take the next dependency-ready item. Quarantine a blocked item and continue independent work. Stop only when the ledger is empty, every remaining item shares one hard blocker, destructive/paid/account/licensing authority is required, a genuine source/design contradiction cannot be resolved conservatively, or provider capacity requires a clean load-bearing relay. Never trim verification to keep running; finish and prove each slice before selecting again.

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
> You are operating autonomously; Aaron is not watching in real time, so "Shall I…?" blocks the work. For reversible actions inside the cleared scope, proceed. After every complete-and-gated, committed, pushed milestone, reload the completion ledger and do the next eligible item; a milestone is not an endpoint. Before ending your turn, check your last paragraph: if it is a plan, a question, or a promise about authorized work not yet done, do that work now. End only at D514's terminal/hard-stop conditions or a clean capacity relay.

**(f) Probe-pin preflight (D412; the D411 loot-probe `Sources (4)` collision class).**
> Before landing any contracted change, grep ALL `tools/probe-*.mjs` for literal pins touching the files or values you will change — not just the probes named in the take — and declare every hit in the take/lane up front. A pin discovered mid-take forces a surfaced allowlist exception; a pin discovered by the gate is a red you should have predicted.

**(g) Clone-local git identity (D412).**
> At session startup, after the fetch/status/HEAD boundary check, set the clone-local identity so commits neither warn nor guess: `git config user.name "Aaron Hanke" && git config user.email "adhanke@gmail.com"` (config only — never committed).

**(h) COORDINATION lane-parse convention (D412).**
> The plan probes parse a lane by its FIRST `**State:**` and FIRST `**Owning tool:**` bullets (regex on the lane slice, first match wins). When rewriting a lane at release, put the release block — new State/Owner — ABOVE the retained history, never below it; a stale first match reads as the live state.

## 8 · Give the reason, and lean into the hard range
- **Give the reason, not only the request.** Kickoff prompts and helper packets should carry the one-line "why" (who the feature teaches, what the milestone unlocks), not just the task.
- **Scope the slice to the gate, not to model timidity.** Use the top model for the hard range — multi-system audits, whole-war journey features, and cross-module integration. Do not pre-slice work below what safe verification requires.

## 9 · Session-start checklist for a ChatGPT/Codex run
1. Confirm **5.6 Sol** and choose **Ultra** (highest available effort).
2. Read order per `START-HERE.md` ⭐ (trimmed, D412): START-HERE → `COORDINATION.md` relevant lane → **`HANDOFF.md` top ⚡ block (THE live head)** → task law docs/probes → latest `DECISIONS.md` entry. Set the clone-local git identity (§7g) at startup.
3. Kickoff prompt embeds the §7 snippets — including the probe-pin preflight (§7f) and lane-parse convention (§7h) — and the one-line "why."
4. Helpers: use only for a task-specific strength or independent coverage; packet and configure them when controls exist, or state the no-control inheritance exception (§4).
5. Narrate sparingly (§2); decide small reversible forks and log them (§3); delegate/search aggressively (§4).
6. D514 work-conserving completion loop active (§6); §8 quality floor and hard-stop charter unchanged.

## 10 · D367 chartered-session kickoff — the LANE-004 Sol session (2026-07-10)

One full ChatGPT 5.6 Sol (Ultra) session, helpers enabled, spending its entire usage window on
the four LANE-004 phases: **A** genre-elite audit → `docs/design/genre-elite-audit-2026-07.md`
(+ ratified priority ladder + REVIEW-QUEUE rows) · **B** the standing `AUDIT-PROMPT.md` run ·
**C** small cleared elite-basics/QoL quick wins only (focused gate + commit per slice; never
D74 inputs, the save envelope, or LANE-003 files) · **D** LANE-002 5b batches (918-row
inventory) until the window closes. Read `COORDINATION.md` LANE-004 for the full contract; take
DRIVE on LANE-004 + LANE-002-5b in one committed edit at session start; LANE-003 is READ-ONLY
(Fable owns its deferred release battery). The paste-ready kickoff prompt was delivered in the
D367 chat; rebuild it from the LANE-004 contract if lost — the lane, not the chat, is the record.
