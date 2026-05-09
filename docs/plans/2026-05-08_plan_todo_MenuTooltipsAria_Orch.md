# Orchestrator: Menu tooltips and aria wave

**Status:** todo
**Created:** 2026-05-08
**Updated:** 2026-05-08

## Decision log (newest first)

* 2026-05-08: Three architecture questions resolved with acoven before lane work begins.
  * Q1: Resolver unification. Decision: **no**, not this wave. The `getValueOf...`, `getShortcutOf...`, `getIsHiddenOf...` family stays per-field. Tooltip is a static string field on each menu item, NOT a `getTooltipOf...` resolver. Rationale: scope discipline; the per-field generalization is its own cleanup tracked in [feedback_uimenu_resolver_generalization.md](<../../memory/feedback_uimenu_resolver_generalization.md>) and the menu-tooltip wave should not bundle a refactor with a polish pass.
  * Q2: Aria-label strategy. Decision: **optional `ariaLabel?` override on `UIMenuItem_t`, with a default fallback chain**. Resolution order in the substitution dictionary: `item.ariaLabel` > `item.tooltip` > `item.displayName`. If the resolved value is empty, the attribute is omitted entirely (never emit `aria-label=""`, which is a screen-reader anti-pattern). Pre-existing hard-coded aria-labels in yaml templates (the top-level toolbar button at `src/UIMenu.yaml:273` with `aria-label="{{displayName}}"`, the toolbar grip's "Drag toolbar", the dropdown-arrow's "Open ... menu", the toolbar role+label, and any `aria-hidden="true"` on SVGs) are NOT to be overwritten or duplicated. Lane B audits and documents.
  * Q3: Tooltip dynamism. Decision: **fully static**. Each menu-item declaration carries a literal `tooltip:` string. The yaml HTML template gets `data-{{ns_}}tooltip="{{tooltip}}"` and `aria-label="{{aria_label}}"` placeholders. The menu builder in `src/UIMenu.ts` populates these in the substitution dictionary at lines 303 to 322. No `{{currentPageSize}}`-style live values; if a state-bearing tooltip is ever needed, it's a separate future wave with its own resolver design.
* 2026-05-08: Architectural-map findings that informed Q1 to Q3.
  * Tooltip CSS already lives in `src/UIMenu.yaml:11-60` with selector `[data-{{ns_}}tooltip]` and `::after` pseudo-element. Transition delay at `src/UIMenu.yaml:43` is `0.5s`; bumping to `1.5s` is a one-line change.
  * The font-size bug is at `src/UIMenu.yaml:193`: `.{{ns_}}menuItem .{{ns_}}textEdit` hardcodes `font-size: 14px` and breaks the em cascade for nested menus. Tooltip itself uses `0.85em` at `src/UIMenu.yaml:38`; fixing the cascade may require bumping to `0.9em` or `0.95em` for legibility (judgment call by Lane A executor).
  * Menu-item HTML emission flows through `src/UIMenu.ts:303-305` (where `tooltipAttr` is built) and `templateDictReplace(yaml.uimenu_item, replacementDict)` at line 322. `templateDictReplace` (in `src/Utils.ts:49-77`) supports nested `{{key}}` substitution with up to 4 passes, so `data-{{ns_}}tooltip="{{tooltip}}"` resolves cleanly.
  * `tooltip?: string` already exists on `UIMenuItem_t` in `src/types/UIMenu_t.ts`; it's just unused for most items. Adding `ariaLabel?: string` next to it is the minimal type change.
  * The `⇤ ◇ ⇥` navigation triple at `src/types/PaperPrinter_t.ts:195-215` (header/footer position menus) and their submenu options (`title`, `page`, `total`, `pageTotal`) carry no tooltip text today and are the most visually opaque items in the toolbar. They are top priority for Lane D's data entry.
  * Click handler at `src/UIMenu.yaml:443+` (`handleMenuItemClick`) is the right hook for suppression; tooltip is currently 100% CSS `:hover`-driven, so JS has to set an attribute the CSS can read. `closeAllMenus()` is the existing cleanup function and the natural place for the global suppression-clear pass.

**Spec:** [2026-05-08_plan_todo_MenuTooltipsAria.md](<2026-05-08_plan_todo_MenuTooltipsAria.md>)
**Master orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 2 polish track)

## Lanes

* [Lane A: CSS fixes](<2026-05-08_plan_todo_MenuTooltipsAria_LaneA-CssFixes.md>): transition delay bump, font-size cascade fix, suppress-class CSS rule.
* [Lane B: aria + tooltip plumbing](<2026-05-08_plan_todo_MenuTooltipsAria_LaneB-AriaPlumbing.md>): `ariaLabel?` field, template attribute placeholders, substitution dictionary, aria audit.
* [Lane C: click-suppress JS hook](<2026-05-08_plan_todo_MenuTooltipsAria_LaneC-ClickSuppress.md>): `data-{{ns_}}tooltip-suppressed` toggle in click handler, pointerleave clear, global cleanup on `closeAllMenus()`.
* [Lane D: tooltip data entry](<2026-05-08_plan_todo_MenuTooltipsAria_LaneD-TooltipDataEntry.md>): populate every menu-item `tooltip:` string; targeted `ariaLabel?` overrides.

## Coordination

* Lanes A, B, and D are independent in flight. Each lane opens its own PR off `main`.
* Lane C's PR can land before Lane A; the suppression attribute is set but has no visual effect until Lane A's CSS rule lands. Lane C's PR description should call this out so the reviewer doesn't expect a visible change pre-Lane-A.
* Lane B and Lane D both touch tooltip-adjacent strings, but in different files (Lane B in `src/types/UIMenu_t.ts` and `src/UIMenu.ts` and the yaml HTML template; Lane D in `src/types/PaperPrinter_t.ts`). They do not conflict at the file level.
* Sequencing recommendation: A first (smallest, riskless CSS), then B (enables D's strings to render), then D (data entry; possibly large diff), then C (JS hook; benefits from A and B already in tree for end-to-end smoke).

## Dependencies

* Lane A: none.
* Lane B: none. (Lane B's resolution order documents the fallback to `displayName`, so the aria-label path works even before Lane D fills in tooltips.)
* Lane C: visual effect depends on Lane A's `[data-{{ns_}}tooltip-suppressed]:hover::after` CSS rule landing. The JS itself does not depend on it.
* Lane D: rendering of tooltip strings depends on Lane B's substitution dictionary populating `{{tooltip}}`. Strings can land before B and sit dormant on the type instances.

## Done when

* All four lane PRs are merged into `main`.
* Smoke test on a fresh extension install: hover delay feels right, tooltips render at correct size at all menu depths, click suppresses the active item's tooltip, navigation arrows have descriptive tooltips, every interactive element has an aria-label.
* This orchestrator's status flips from `todo` to `done`, and each lane file is renamed to `_done_`.
