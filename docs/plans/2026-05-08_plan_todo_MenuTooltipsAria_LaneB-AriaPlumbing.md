# Lane B: aria + tooltip plumbing

**Status:** done (merged via PR #136)
**Created:** 2026-05-08
**Updated:** 2026-06-02
**Parent orchestrator:** [2026-05-08_plan_todo_MenuTooltipsAria_Orch.md](<2026-05-08_plan_todo_MenuTooltipsAria_Orch.md>)
**Branch:** `feature/menu-tooltips-aria-lane-b` (off `main`)
**Owner:** Claude
**Blocked by:** none. Independent of Lanes A, C, D.

## Goal

Wire `tooltip` and `aria-label` from `UIMenuItem_t` instances all the way to the rendered HTML, with a clean fallback chain and no overwriting of pre-existing hard-coded aria-labels in yaml templates.

## Workitems

* Type extension
  * [ ] In `src/types/UIMenu_t.ts`, add `ariaLabel?: string` to the `UIMenuItem_t` interface, alongside the existing `tooltip?: string`. Document the precedence in a JSDoc comment on the field: "Optional override for screen-reader label. If absent, falls back to `tooltip`, then `displayName`."
* Substitution dictionary
  * [ ] In `src/UIMenu.ts` around lines 303 to 322 (where `tooltipAttr` is currently built and `templateDictReplace(yaml.uimenu_item, replacementDict)` is called), add two keys to the `replacementDict`:
    * `tooltip`: resolves to `item.tooltip ?? ""`.
    * `aria_label`: resolves to `item.ariaLabel ?? item.tooltip ?? item.displayName ?? ""`.
  * [ ] If either resolved value is empty, omit the attribute entirely. Two patterns work; pick one and apply consistently:
    * Pattern 1: emit the full attribute string only when the value is non-empty (e.g., `tooltipAttr = item.tooltip ? \`data-{{ns_}}tooltip="${escape(item.tooltip)}"\` : ""`) and substitute `tooltipAttr` into the template at a placeholder spot.
    * Pattern 2: substitute the raw value into `data-{{ns_}}tooltip="{{tooltip}}"` and post-process the rendered HTML to strip empty attribute pairs. Pattern 1 is preferred for clarity.
  * [ ] Use the existing escape helper (verify by reading `src/Utils.ts`) to escape the tooltip and aria values before substitution; both attribute values can contain user-facing copy with quotes or apostrophes.
* HTML template
  * [ ] In `src/UIMenu.yaml`, find the `uimenu_item` block (the per-item HTML the menu builder substitutes into). Replace the existing `tooltipAttr` interpolation site so the template emits both:
    * `data-{{ns_}}tooltip="{{tooltip}}"` (or the attribute-pair string from Pattern 1 above).
    * `aria-label="{{aria_label}}"` (same caveat).
  * [ ] If the template currently has `aria-label="{{displayName}}"` baked in for menu items (verify by grep), reconcile: remove the hardcoded reference in favor of the new `{{aria_label}}` substitution, since the new resolver chain falls back to `displayName` anyway. Document the decision in the PR description.
* Aria audit
  * [ ] Enumerate every existing `aria-label="..."` and `aria-hidden="true"` site in `src/UIMenu.yaml`. Confirmed callouts to verify untouched:
    * Top-level toolbar button: `aria-label="{{displayName}}"` at `src/UIMenu.yaml:273`.
    * Toolbar grip: "Drag toolbar".
    * Dropdown-arrow: "Open ... menu".
    * Toolbar root: role + aria-label pair.
    * SVG icons: `aria-hidden="true"`.
  * [ ] For each, confirm the new menu-item template substitution does NOT duplicate or overwrite. If a duplication is found, the lane executor judges whether to keep the existing one or remove it in favor of the new substitution path; document the judgment in the PR description.
* Smoke
  * [ ] Build and load in EDH.
  * [ ] Inspect a menu-item element with DevTools: confirm one `data-{{ns_}}tooltip` and one `aria-label`, both with non-empty values when the item has them, both attributes absent when the item has neither.
  * [ ] Run `npm test` (unit only, per project convention).

## Failure routing

* Substitution emits `aria-label=""` or `data-{{ns_}}tooltip=""`: revert to Pattern 1 (conditional attribute-string assembly) and re-test. The empty-attribute anti-pattern is non-negotiable for screen-reader compatibility.
* Existing hard-coded `aria-label="{{displayName}}"` at line 273 starts emitting a duplicate label after the change: confirm the lane is editing the correct template block (`uimenu_item`, not the toolbar root). The toolbar-root and top-level button templates are different blocks.
* `templateDictReplace` does not resolve `{{aria_label}}`: check `src/Utils.ts:49-77` for the up-to-4-pass behavior; if the new keys are nested inside another `{{...}}` token, expansion order may matter. Add a debug log around line 322 in `src/UIMenu.ts` and trace.

## Acceptance

* `UIMenuItem_t` has the new `ariaLabel?: string` field with a precedence-documenting JSDoc.
* The menu-item HTML template renders both `data-{{ns_}}tooltip` and `aria-label` from the substitution dictionary; both are omitted entirely when their resolved value is empty.
* No pre-existing hard-coded aria-label in the yaml is overwritten or duplicated.
* `npm test` passes.
