# UI Redesign Research Packet

Date: 2026-06-27

Purpose: define the next frontend direction for "The Civil War" after Aaron's explicit call to move beyond the current broadsheet interface.

## Sources Checked

- Game Developer, "UI Strategy Game Design: Dos and Don'ts" - https://www.gamedeveloper.com/design/ui-strategy-game-design-dos-and-don-ts
- Justinmind, "Game UI Design" - https://www.justinmind.com/ui-design/game
- GDC Vault, "From Persona to Metaphor: ReFantazio" - https://gdcvault.com/play/1035332/From-Persona-to-Metaphor-ReFantazio
- W3C, WCAG 2.2 Quick Reference - https://www.w3.org/WAI/WCAG22/quickref/
- Library of Congress, Civil War photographs collection - https://www.loc.gov/pictures/collection/cwp/

## Useful Takeaways

1. Strategy UI needs a stable hierarchy more than decorative period texture. The player should see the current objective, risk, resources, and next high-leverage action without parsing newspaper blocks.
2. Dense information should be layered: HUD/status summary first, expandable detail second, codex/provenance third. The current game has the data depth; the redesign should change how it is staged.
3. Game UI convention favors icon-led controls, clear state changes, panels that slide or anchor consistently, and visible feedback for mode changes, orders, warnings, and confirmations.
4. RPG-like menus can be dramatic without becoming unclear. Persona/Metaphor-style lessons that transfer here: bold composition, strong silhouette, large subject imagery, animated state transitions, and confident color blocks. The non-transferable part is tonal flash that would trivialize war deaths or Confederate ideology.
5. Diegetic/historical surfaces should be used selectively. Broadsheet remains excellent for press/editorial systems, dispatches, codex excerpts, and provenance cards. It should not be the whole shell.
6. The game already has a public-domain imagery pipeline. The redesign should center real photographs/illustrations where they clarify place, people, or stakes, with caption/credit/provenance rules already used by H1.
7. Accessibility is a design input, not a later CSS pass: WCAG 2.2 AA contrast, keyboard focus, reduced motion, CVD-safe redundance, visible labels, and screen-reader narration must be baked into each new shell component.
8. The Intel UHD-617 floor rules out heavyweight cinematic shells. Prefer CSS/DOM composition, already-embedded imagery, lightweight transforms, cached canvases, and optional enhanced motion.

## Recommended Direction

Shift from "newspaper as app shell" to "historical command game shell":

- A dramatic central stage for the current layer: war desk, battlefield briefing, battle result, codex/person card, or campaign map.
- Brightened, rounder, more tactile surfaces: compact control bars, icon buttons, segment controls, resource chips, state badges, and consistent drawer/panel behavior.
- Public-domain imagery as first-viewport signal: battlefield photos on briefings, portraits on command/codex, maps/illustrations for campaign state, with dignity-sensitive treatment for casualty imagery.
- Broadsheet reserved for in-world media: press reactions, dispatches, newspaper headlines, and archival/provenance cards.
- A reusable token/system layer: colors, type scale, spacing, focus rings, panel radius, elevation/shadow, icon treatment, rarity/state chips, CVD-safe patterns, reduced-motion variants.
- Redesign the most-used screens first: main menu, President's Desk overview, between-battle interstitial, battle briefing/side choice, tactical HUD/settings, after-action/final report.

## Acceptance Criteria For The Future Redesign Milestone

- A committed design law in `DECISIONS.md` supersedes broadsheet-everywhere and preserves Civil War gravity.
- A concrete milestone checklist names target screens, shared components/tokens, probes, screenshots, and rollout order.
- No unclear-license assets; public-domain imagery must come from the existing provenance/embedding discipline or a reviewed extension of it.
- Screens remain keyboard navigable and WCAG 2.2 AA; every new animation honors `reduceMotion`.
- Browser probes verify no pageerrors, readable layout at desktop/tablet/phone widths, non-overlapping text, visible focus, and stable screenshots for the redesigned screens.
