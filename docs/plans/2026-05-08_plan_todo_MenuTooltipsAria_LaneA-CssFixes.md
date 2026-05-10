# Lane A: CSS fixes

**Status:** todo
**Created:** 2026-05-08
**Updated:** 2026-05-08
**Parent orchestrator:** [2026-05-08_plan_todo_MenuTooltipsAria_Orch.md](<2026-05-08_plan_todo_MenuTooltipsAria_Orch.md>)
**Branch:** `feature/menu-tooltips-aria-lane-a` (off `main`)
**Owner:** Claude
**Blocked by:** none. Fully independent.

## Goal

Make the existing tooltip CSS behave correctly at all menu depths and prepare the visual hook that Lane C's JS suppression will toggle. All edits live in `src/UIMenu.yaml`.

## Workitems

* Tooltip transition delay
  * [ ] At `src/UIMenu.yaml:43`, change `transition: opacity 0.12s 0.5s` to `transition: opacity 0.12s 1.5s`. The fade-in remains snappy at 120ms; the wait-before-fade goes from 0.5s to 1.5s so brief hover-throughs do not flash a tooltip.
* Font-size cascade
  * [ ] At `src/UIMenu.yaml:193`, replace the hardcoded `font-size: 14px` on `.{{ns_}}menuItem .{{ns_}}textEdit` with `font-size: inherit`. This is the root cause of the wrong-size tooltip at depth 2+; the em cascade was being broken by the explicit px reset on every text-edit at every level.
  * [ ] On the base `.{{ns_}}menuItem` rule near `src/UIMenu.yaml:83`, add an explicit `font-size: inherit` declaration as a defensive measure in case any ancestor specifies px and would otherwise wreck the cascade.
* Tooltip legibility check
  * [ ] After the cascade fix, re-evaluate `font-size: 0.85em` at `src/UIMenu.yaml:38`. Capture screenshots at depth 1, 2, and 3+. If text reads too small, bump to `0.9em` or `0.95em`. Lane executor decides; document the decision in the PR description.
* Suppress-class CSS rule
  * [ ] Add a new rule alongside the existing tooltip rules near `src/UIMenu.yaml:11-60`:
    * `[data-{{ns_}}tooltip-suppressed]:hover::after { opacity: 0 !important; }`
    * Also override the corresponding `::before` if the existing tooltip uses both pseudo-elements; verify by reading the existing rule block.
    * The `!important` is justified because we are intentionally overriding the standard hover behavior; the suppression is short-lived and attribute-driven.
* Smoke
  * [ ] Build the extension locally and load in the Extension Development Host.
  * [ ] Open the toolbar, hover items at depth 1 and depth 2, confirm tooltip waits ~1.5s and renders at the same visual size.
  * [ ] Manually toggle `data-{{ns_}}tooltip-suppressed=""` in DevTools on a hovered element and confirm the tooltip vanishes (this verifies Lane C's eventual hook will work).

## Failure routing

* Cascade fix breaks an unrelated text-edit rendering: route to a follow-up CSS investigation; do not revert. The hardcoded `14px` was the bug, not the workaround.
* `0.85em` is unreadable after cascade fix on a particular VS Code theme: bump to `0.9em` and re-screenshot. If still unreadable, escalate to acoven for a font-stack discussion.

## Acceptance

* Tooltip wait time is 1.5s.
* Tooltip text renders at the same effective size at depths 1, 2, and 3+.
* `[data-{{ns_}}tooltip-suppressed]:hover::after` rule is present and proven to suppress on a manually-toggled attribute.
* No emoji, no en-dash, no trailing whitespace in the edited yaml. Existing yaml hygiene preserved.
