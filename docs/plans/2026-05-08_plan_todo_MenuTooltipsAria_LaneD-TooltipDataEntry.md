# Lane D: tooltip data entry

**Status:** done (merged via PR #136)
**Created:** 2026-05-08
**Updated:** 2026-06-02
**Parent orchestrator:** [2026-05-08_plan_todo_MenuTooltipsAria_Orch.md](<2026-05-08_plan_todo_MenuTooltipsAria_Orch.md>)
**Branch:** `feature/menu-tooltips-aria-lane-d` (off `main`)
**Owner:** Claude
**Blocked by:** none in flight. Strings render once Lane B's substitution dictionary is live; if Lane D lands before B, the strings sit dormant on the type instances and surface as soon as B merges.

## Scope note (2026-06-02)

Original goal (populate tooltip on all items) was superseded by PR #132 (scope restriction) and PR #135 (partial revert + polish). Final delivered scope: `ariaLabel?` overrides on items whose `displayName` is a glyph or ellipsis-truncated string. Tooltip strings for position items were added in PR #135. No general-item tooltip population was done or is needed.

## Goal

Populate `ariaLabel?` overrides on menu items where `displayName` is insufficient for screen readers.

## Workitems

* Enumerate the targets
  * [ ] In `src/types/PaperPrinter_t.ts`, find every menu-item literal. Confirmed top-level groups: `kPrint`, `kPage`, `kHeader`, plus all their nested `menuItems[]` arrays.
  * [ ] Confirm the `⇤ ◇ ⇥` navigation triple at `src/types/PaperPrinter_t.ts:195-215` (header/footer position menus, ids `begin`, `middle`, `end`) and their submenu options (`title`, `page`, `total`, `pageTotal`).
  * [ ] Grep the rest of `src/` for any other const file housing menu items (e.g., a footer config). Add them to the audit list before writing strings.
* Style guide for tooltip text
  * [ ] Concise, action-oriented, sentence-case, no trailing period.
  * [ ] Imperative for actions: "Print the current file", "Save preview as PDF".
  * [ ] Descriptive for state-bearing items: "Page size: choose paper dimensions", "Orientation: portrait or landscape".
  * [ ] Where the action implies a hidden subtlety, include it. The `⇤ ◇ ⇥` triple is the canonical example: "Jump to first page", "Move to previous page", "Move to next page", "Jump to last page". Today these glyphs are visually opaque; the tooltip is the user's only context.
  * [ ] Avoid restating the displayName verbatim if it adds nothing; in that case the resolver chain on the aria side falls back to `displayName` anyway.
* Populate tooltips
  * [ ] Walk `kPrint`, `kPage`, `kHeader`, and every nested `menuItems[]`. Add `tooltip:` to each entry.
  * [ ] Walk the `begin`, `middle`, `end` navigation triple plus their `title`, `page`, `total`, `pageTotal` submenu options. Add `tooltip:` to each.
  * [ ] Walk any other const file flagged in the enumeration step.
* Targeted aria overrides
  * [ ] After the substitution chain resolves to `item.ariaLabel ?? item.tooltip ?? item.displayName`, only add `ariaLabel:` where the tooltip would be too verbose or context-loaded for a screen reader. Examples to consider:
    * A tooltip that includes UI affordance hints ("Click to open the print dialog with current settings") may want a tighter aria override ("Open print dialog").
    * A tooltip that uses unicode glyphs in the prose may want an aria override that spells them out.
  * [ ] Do NOT blanket-add `ariaLabel` to every item. Most should rely on the tooltip fallback.
* Smoke
  * [ ] Build and load in EDH.
  * [ ] Hover every top-level button and at least one item in each menu; confirm the new tooltip text appears.
  * [ ] Hover the `⇤ ◇ ⇥` triple in both header and footer position menus; confirm "Jump to first page", "Move to previous page", etc.
  * [ ] Run a screen-reader pass (VoiceOver on macOS, since acoven is on darwin) on a sample of items; confirm the spoken aria-label is sensible.
  * [ ] Run `npm test`.

## Failure routing

* Some tooltips do not render: Lane B has not yet merged. The strings are still on disk and correct; smoke test resumes once Lane B lands.
* A tooltip exceeds a reasonable line length and wraps awkwardly: shorten the copy. Tooltip width is constrained by the existing CSS rule near `src/UIMenu.yaml:11-60`; treat 60 chars as a soft cap.
* Aria override and tooltip diverge in a confusing way: the override is wrong; revert and rely on the tooltip fallback. The override exists to suppress noise, not to introduce contradictions.

## Acceptance

* Every menu item in the enumerated targets has a non-empty `tooltip:` string.
* The `⇤ ◇ ⇥` navigation triple has descriptive tooltips that explain the glyph.
* `ariaLabel?` is present only on the small subset of items where the override genuinely improves the screen-reader experience.
* `npm test` passes.
* No tooltip ends with a period; no tooltip is title case; no tooltip restates `displayName` verbatim without adding context.
