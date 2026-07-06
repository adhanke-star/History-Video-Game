# Main-Menu Redesign — Design Law (Q-D270-4)

**Status:** AARON-LOCKED design law (popup, 2026-07-06) — planning slice complete; BUILD NOT STARTED.
**Provenance:** Aaron's D270 mid-session directive (main-menu redesign, planning slice first — approved as next queue item 2026-07-06 alongside the batch checkpoint). Planning ran as a 10-agent workflow (`wf_33a40cf9-1f5`): 4 Sonnet repo readers (menu-surface contracts · H0 design system · probe teeth · E61 nudge data) → 3 independent Opus design candidates (cinematic War Room · Situation Board dashboard · The Front console game-feel) → 3 adversarial Opus judge lenses (contract/regression safety · WCAG-AA/perf floor · design quality/gravity/directive). No candidate swept; the law below is the judged hybrid. All load-bearing judge claims were re-verified first-hand in the main loop (probe teeth lines, recovery-state fields).

**Aaron's three locks (popup 2026-07-06):**
1. **Direction = HYBRID SYNTHESIS** (over pure Front / Situation Board / War Room).
2. **Campaign-chain tracker IN SCOPE** for this milestone (war-effort chips beyond the existing three and any Soldier's Story slot stay OUT — judged scope creep).
3. **Casualty-photograph policy = ALLOW, SOMBER-STATIC** — full-bleed permitted for photographs of the dead (Bloody Lane class) with the somber treatment locked: static, grayscale-leaning grade, provenance caption/credit always legible. **No motion over the dead, ever.**

---

## §1 The design (what ships)

One module rewrite: the presentation layer of `src/98-h0-main-menu.js` (h0BuildMenuHtml + h0InjectCss + normalizer class hooks). The menu graduates from the boxed-hero prototype to a full-bleed historical command screen:

- **Backdrop:** the next battle's PD scene photo (`__ASSETS["scenes/"+key]`, existing `h0SceneKey` fallback chain) promoted to a full-bleed `position:absolute;inset:0` layer inside `.h0-menu` — `aria-hidden="true"`, cold grayscale-leaning grade (reuse the existing filter vocabulary), heavy static vignette + bottom scrim. **STATIC — no ken-burns/push-in** (judged a WCAG 2.2.2 AA failure: auto-motion >5s with no pause control for the no-OS-flag majority; reduceMotion alone does NOT satisfy 2.2.2). Imageless battles keep the existing procedural fallback plate, full-bleed.
- **Text contrast architecture (the War Room graft):** ALL copy sits on near-opaque (≥.90) dark-glass panels so contrast is independent of the photo — never text directly over a gradient-scrimmed image (the judged fatal in The Front). High-contrast mode (`html[data-a11y-contrast="high"]`) force-hides the backdrop entirely.
- **Structure (the Situation Board graft):** the `.h0-top` three-column skeleton and every load-bearing id/selector survives — `.h0-command` (title lockup, status chips, campaign action cards), `.h0-stage` (now a translucent field-readout panel: a smaller framed **provenance plate** keeps the `img[alt]` + figcaption caption/credit as the informative element while the backdrop carries the drama, plus `#gnFree`), `.h0-notices` aside (settings/utilities). The oversized title treatment and confident icon-led cards deliver the "assertive war-video-game" read.
- **Injected-button organization (The Front graft):** `#gnFree` lives inside a labeled **"Field Operations"** group panel in the stage column — the T0→T1→T2→T6→T11 sibling-insertion chain then clusters under that heading (contract unchanged: same anchor id, same parentNode/nextSibling mechanics); the group gets `max-height` + internal `overflow:auto` so 6+ scenario buttons never blow the viewport. The `.h0-notices` aside renders as a low-emphasis **"Command Utilities"** rail — `.gn-classifieds` stays inside the LAST `.gn-col` so gnPlayStyle/gnA11y/gnHelp/gnTour observer-appends land exactly as today.
- **Campaign-chain tracker (the Situation Board signature, Aaron-locked in):** a full-width procedural rail replacing the "H0 prototype" footer — one segment per `CHAINS[C.side]` battle (name/year from `BATTLES`, theater-tinted), fought = filled, current = ringed (static or one-shot ≤400ms pulse, NOT looping), ahead = dimmed. `aria-hidden` decoration paired with a visually-hidden SR text summary ("Battle 9 of 31: Antietam, 1862"). Horizontally scrollable inside its own `overflow-x:auto` container at narrow widths. Suppressed in the no-save state.
- **New-player state:** with no campaign save the tracker and identity surfaces suppress; the two muster cards (gnNewUS/gnNewCS) become the dominant first-viewport signal.
- **Motion budget:** one-shot entrance fade/translate ≤400ms total, honoring BOTH `G.settings.reduceMotion` (is-reduced-motion class) and `prefers-reduced-motion`. Nothing loops. Nothing moves over casualty photographs (lock 3).

## §2 Contracts that MUST hold (verified first-hand; a red here is a build bug, not a re-anchor)

- **Ids/click paths:** `#gnContinue #gnWarDept #gnNewUS #gnNewCS #gnFree #gnSettings #gnLoad` — h0WireMenu re-queries by id after every openSheet; injectors key off `#gnFree` (T0-field-sandbox.js:2378 sibling chain → T1 scenario buttons → T2 `#fldSkirmishBtn` → T6 `#fldPresetBtn`; T11:811 places `#fldCustomBuilderBtn` last) and `.gn-col:last-child .gn-classifieds` (95-playstyle.js:293, 97-accessibility.js:424, 92-help-overlay.js:337 — `col3.parentNode.appendChild`).
- **Normalizer markup:** injected buttons need `.gn-hl` + `.gn-deck` inner spans preserved; `h0InjectedButtonSpec` keys off id strings (src/98:100-141).
- **Probe teeth that stay green by construction:** `probe-h0-main-menu.mjs:94` hasGridOverlay (`repeating-linear-gradient` must survive somewhere in the CSS — keep the command-grid texture as a faint layer OVER the backdrop); `:123` shared accent token pins (`--h0-green:#5f9273 --h0-red:#b35a50 --h0-muted:#c5cdc3`); `:128` `.h0-actions` flexGrow===1. Tokens stay LITERAL per the D232 six-shell canon; new scrim/backdrop values are literal rgba, not new CSS variables.
- **openSheet model:** full innerHTML replace per open (base.html:2319); `.sheet` is the scroll container (`max-height:94vh;overflow:auto`) — the full-bleed backdrop must live INSIDE `.h0-menu` (absolute within the sheet's flow), not fixed to the viewport.
- **D74:** presentation-only. The module reads `loadLocal().campaign`, `CHAINS`, `BATTLES`, `__ASSETS`, `SCENE_IMG`, `_gorDatelineYear` and the §3 recovery fields; it writes NOTHING to G.campaign/save state. Zero embedded-asset additions (2.42MB raw already over the 1.5MB soft budget — any new bytes need the Priority-2 media-budget decision first).

## §3 The E61 nudge (the honest half, folded in per Aaron 2026-07-06)

Read-only consumption of state base.html ALREADY writes: `C.recoveryLossCount` / `C.recoveryMode` / `C.recovery` (build/base.html:2547-2549 init, :2715-2718 reset on win, :2739-2741 loss path). When a saved campaign is in `recoveryMode` with `recoveryLossCount >= 2`, the stage column renders a **take-command guidance card**: names the walled battle (`CHAINS[C.side][C.idx]` → `BATTLES` name), says plainly that the delegated commander cannot carry this field and that taking field command (or the political path) is the honest out — guidance, not nagging; renders once per menu open, no dismissal state persisted, no save writes. The **collapse-terminal half of E61 stays OPEN** in REVIEW-QUEUE (strategic-layer design fork, explicitly out of scope here).

## §4 Scope boundary

**In:** `src/98-h0-main-menu.js` (one module) + `tools/probe-h0-main-menu.mjs` (re-anchor + new teeth) + docs. **Out:** other H0 shells; war-effort chip expansion; Soldier's Story slot (reaches into unshipped journey shape); any base.html edit; any data/ change; any new embedded asset; the E61 collapse terminal; LLM-opponent (Q-D270-5, own planning slice next).

## §5 Probe plan

- **Deliberate re-anchors** (layout moved): screenshot teeth + any geometry assertions in `probe-h0-main-menu.mjs`; keep SLOW_MAC budgets.
- **NEW teeth:** (1) `.h0-backdrop[aria-hidden="true"]` coexists with a still-rendering provenance `img[alt]` + figcaption (locks lock-3's caption-always-legible); (2) chain tracker: SR summary text present + rail inside an `overflow-x:auto` container + suppressed in no-save state; (3) E61 nudge two-state (fake recoveryMode campaign → card present + names the battle; fresh/no-save → absent); (4) D74 no-write tripwire: grep the generated region for `C.<field>=` assignments; (5) two-state screenshots (saved-campaign vs no-save) at desktop/tablet/phone; (6) extend the token pin to the full sixth-surface canon (brass #d8b458 / focus #ffe27a added).
- **Adjacent gates:** menuprobe · probe-help-overlay · probe-tutorial · probe-save-slots · probe-custom-battle-builder (token-canon tooth) · probe-presets · bootprobe. All 0 pageerrors.

## §6 Build-slice gates (D160/D176 focused)

`node --check` on touched files → `node tools/build.mjs` GATE OK → focused probe-h0-main-menu (re-anchored) ×2 → adjacents above → JSON/pageerror readback → screenshot visual readback (both states, three widths) → WCAG pass on new surfaces (contrast arithmetic on every new pair; keyboard walk; SR labels) → Opus default-refute pre-commit panel (UI-slice scale, D233 pattern) → `git diff --check` → commit/push → docs trail.

## §7 Paste-ready build prompt

> **ultracode — xhigh.** You are Claude Fable 5 in `~/Desktop/Video Game`. Build the AARON-LOCKED main-menu redesign per `docs/design/main-menu-redesign-design.md` (this file is LAW — honor §1-§6 verbatim; the three Aaron locks are non-negotiable). Read first: START-HERE.md → this design doc → src/98-h0-main-menu.js → tools/probe-h0-main-menu.mjs → the §2 contract sites (T0:2378 · T11:811 · 95-playstyle:293 · 97-accessibility:424 · 92-help-overlay:337 · base.html:2319/2547-2741). One module + one probe + docs; presentation-only (D74); no new embedded bytes; never edit build/base.html. Gate per §6; fix root causes, never weaken a probe. Commit/push only after the focused gate is green; then update DECISIONS/RUN-LOG/REVIEW-QUEUE (E61 nudge-half → SHIPPED, terminal-half stays open)/V1-CHECKLIST/HANDOFF/WAKE-UP and stop at the D171 boundary with the next-chat prompt.
