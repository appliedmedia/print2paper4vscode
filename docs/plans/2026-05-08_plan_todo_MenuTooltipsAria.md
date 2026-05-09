# Menu tooltips, aria coverage, and CSS polish

**Status:** todo
**Created:** 2026-05-08
**Updated:** 2026-05-08
**Branch:** `feature/plans-menu-tooltips-aria` for the plan-doc PR. Each lane gets its own implementation branch (suggested names listed in each lane file). Lane PRs target `main` directly; there is no shared wave branch since the lanes are largely independent.

## Goal

Bring the toolbar menu UI up to parity on three accessibility and polish axes in a single coordinated wave: every menu item gets a static, human-authored `tooltip` string, every interactive element has a sensible `aria-label`, the existing tooltip CSS no longer mis-sizes itself in nested submenus, and clicking a menu item no longer leaves its tooltip stuck on screen behind the click outcome.

## Why

* Tooltip font is wrong size at depth 2+. The base `.menuItem .textEdit` rule hardcodes `font-size: 14px` at `src/UIMenu.yaml:193`, which breaks the em cascade for sub-sub menus and makes the `0.85em` tooltip render at the wrong relative size.
* Tooltips appear too eagerly. Current transition delay is `0.5s` at `src/UIMenu.yaml:43`; users hovering past a menu item to reach a sibling get flash-tooltips. Bumping to `1.5s` matches the platform feel.
* Tooltips stay visible during click. The hover rule is purely CSS at present; clicking a menu item triggers an action but the tooltip remains on screen because the cursor hasn't moved. We need a JS suppression hook tied to `handleMenuItemClick` and `closeAllMenus()`.
* Many menu items have no tooltip at all. The `kPrint`, `kPage`, `kHeader` declarations in `src/types/PaperPrinter_t.ts` plus the `⇤ ◇ ⇥` navigation triple at lines 195 to 215 carry no `tooltip:` field, even though the `tooltip?: string` slot already exists on `UIMenuItem_t`.
* Aria coverage is patchy. Some yaml templates hard-code `aria-label="{{displayName}}"`; menu items emitted via the substitution dictionary today get no aria-label at all. We want a default aria-label fallback path without overwriting the explicit ones already in the templates.

## Scope

* In scope
  * Static `tooltip:` string on every menu item declaration in `src/types/PaperPrinter_t.ts` and any other const file that contributes to the toolbar.
  * Optional `ariaLabel?: string` field on `UIMenuItem_t` for cases where the tooltip is too verbose for screen readers.
  * Substitution-dictionary plumbing in `src/UIMenu.ts` so the menu-item HTML template can render `data-{{ns_}}tooltip` and `aria-label` attributes from item fields.
  * CSS fixes in `src/UIMenu.yaml`: tooltip transition delay bump, font-size cascade fix, defensive `font-size: inherit` on `.{{ns_}}menuItem`, and a `[data-{{ns_}}tooltip-suppressed]:hover::after` rule.
  * JS suppression hook in `handleMenuItemClick` (yaml-injected script) plus a `closeAllMenus()` cleanup pass.
* Out of scope
  * Resolver unification. The `getValueOf...`, `getShortcutOf...`, `getIsHiddenOf...` per-field family stays as-is; tooltip stays a static string field, NOT a `getTooltipOf...` resolver. Documented as a separate future cleanup in [feedback_uimenu_resolver_generalization.md](<../../memory/feedback_uimenu_resolver_generalization.md>).
  * Dynamic tooltip content. Tooltips are static text only; no `{{currentPageSize}}`-style live values this wave.
  * Any change to existing hard-coded aria-labels in yaml templates. Lane B audits and confirms they remain untouched.
  * Functional behavior changes. All four lanes are presentation, accessibility metadata, and event timing only.

## Lanes

* [Lane A: CSS fixes](<2026-05-08_plan_todo_MenuTooltipsAria_LaneA-CssFixes.md>): transition-delay bump, font-size cascade fix, suppress-class CSS rule.
* [Lane B: aria + tooltip plumbing](<2026-05-08_plan_todo_MenuTooltipsAria_LaneB-AriaPlumbing.md>): `ariaLabel?` field, template attribute placeholders, substitution dictionary, audit of pre-existing aria-labels.
* [Lane C: click-suppress JS hook](<2026-05-08_plan_todo_MenuTooltipsAria_LaneC-ClickSuppress.md>): `data-{{ns_}}tooltip-suppressed` toggle in `handleMenuItemClick`, pointerleave clear, `closeAllMenus()` global cleanup.
* [Lane D: tooltip data entry](<2026-05-08_plan_todo_MenuTooltipsAria_LaneD-TooltipDataEntry.md>): populate `tooltip:` strings on every menu item; case-by-case `ariaLabel?` overrides.

## Coordination

* Lanes A, B, and D are independent in flight and can land in any order.
* Lane C's JS depends on Lane A's `[data-{{ns_}}tooltip-suppressed]:hover::after` rule for the visual effect, but the JS itself can land first; the suppression simply has no visible effect until Lane A merges.
* Lane B's `aria_label` substitution depends on the `ariaLabel?` field existing; that lane owns both edits.
* Lane D's tooltip strings depend on Lane B's substitution dictionary populating the `{{tooltip}}` and `{{aria_label}}` placeholders. If Lane D lands first, the strings sit dormant on the type instances and render once Lane B ships.

## Done when

* Hovering any toolbar menu item for >=1.5s shows a tooltip with human-authored copy.
* Tooltip font size reads cleanly at depth 1, 2, and 3+.
* Clicking a menu item hides its tooltip immediately and does not re-show it until the pointer leaves and re-enters.
* `closeAllMenus()` clears all suppression state.
* Every interactive toolbar element has an `aria-label`, either pre-existing in yaml or derived via the new resolution order (item.ariaLabel > item.tooltip > item.displayName).
* No empty `aria-label=""` or `data-{{ns_}}tooltip=""` attributes are emitted.

## File ownership snapshot

* Lane A: `src/UIMenu.yaml` (CSS rules only).
* Lane B: `src/types/UIMenu_t.ts` (`ariaLabel?` field), `src/UIMenu.yaml` (HTML template attribute placeholders), `src/UIMenu.ts` (substitution dictionary at lines 303 to 322).
* Lane C: `src/UIMenu.yaml` (`handleMenuItemClick` near line 443, plus `closeAllMenus()` cleanup hook).
* Lane D: `src/types/PaperPrinter_t.ts` (every menu-item declaration; especially `kPrint`, `kPage`, `kHeader`, plus the `begin`, `middle`, `end` navigation triple at lines 195 to 215 and their submenu options `title`, `page`, `total`, `pageTotal`). Possibly other const files; the lane executor enumerates.
