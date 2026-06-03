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

## Workitems (as-delivered, 2026-06-02)

Original plan deferred: populating `tooltip:` on all menu items was superseded by PR #132 (scope restriction) then PR #135 (partial revert + position-item tooltips added there). General tooltip population is not planned.

Delivered in PR #136:

* [x] `ariaLabel` overrides for header/footer position items (⇤ ◇ ⇥): reuse tooltip strings added in PR #135.
* [x] `ariaLabel` overrides for HeaderFooter content items: `page` (#) → "Current page number"; `pageTotal` (#+Total) → "Page number and total".
* [x] `ariaLabel` overrides for About menu items: `shortcut` → "Change keyboard shortcut"; `about` → "About Print2Paper"; `logBug` → "Report a problem".
* [x] 6 new tests in `tests/PaperPrinter.test.ts` verify overrides are non-glyph and non-ellipsis.

Deferred from original plan (no current owner):

* [ ] General tooltip population on all menu items (kPrint, kPage, etc.) — deferred; not blocked.
* [ ] VoiceOver smoke test — manual step; owed by acoven on fresh install.

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
