# Lane C: click-suppress JS hook

**Status:** done (merged via PR #124, 2026-05-09)
**Created:** 2026-05-08
**Updated:** 2026-05-09
**Parent orchestrator:** [2026-05-08_plan_done_MenuTooltipsAria_Orch.md](<2026-05-08_plan_done_MenuTooltipsAria_Orch.md>)
**Branch:** `feature/menu-tooltips-aria-lane-c` (off `main`)
**Owner:** Claude
**Blocked by:** Visual effect depends on Lane A's `[data-{{ns_}}tooltip-suppressed]:hover::after` CSS rule. The JS itself can land before Lane A; the suppression is silent until A merges. Document this in the PR.

## Goal

Hide a menu-item's tooltip the moment it is clicked, and keep it hidden until the pointer leaves the item's flyout subtree. Clean up suppression state on `closeAllMenus()`.

## Workitems

* Click-time set
  * [ ] In `src/UIMenu.yaml` around line 443 (the `handleMenuItemClick` script block), set `data-{{ns_}}tooltip-suppressed=""` on the clicked element.
  * [ ] If the clicked element opens a flyout (i.e., it has a `data-{{ns_}}flyout` or equivalent indicator; verify by reading the existing handler), also set the attribute on every descendant in that flyout subtree that has a `data-{{ns_}}tooltip` attribute. Use a single `querySelectorAll('[data-{{ns_}}tooltip]')` scoped to the flyout container.
  * [ ] Important scoping rule: suppression is per-clicked-item plus its OWN flyout subtree. Do NOT suppress sibling items, ancestor items, or unrelated flyouts. The intent is "the thing I just clicked stops nagging me", not "the whole menu goes silent".
* Pointerleave clear
  * [ ] Add a `pointerleave` (or `mouseleave` for compatibility; pick `pointerleave` if the existing handler ecosystem already uses pointer events) handler on the flyout container, NOT on each individual item. Per-item leave fires too aggressively when the user moves between sibling items.
  * [ ] On leave, remove `data-{{ns_}}tooltip-suppressed` from every descendant inside the container. Implementation sketch: `container.querySelectorAll('[data-{{ns_}}tooltip-suppressed]').forEach(el => el.removeAttribute('data-{{ns_}}tooltip-suppressed'))`.
* Global cleanup on closeAllMenus
  * [ ] In the existing `closeAllMenus()` function (location: same yaml, separate block), append a sweep that removes `data-{{ns_}}tooltip-suppressed` from every element under the toolbar root.
  * [ ] Use the toolbar-root selector that `closeAllMenus()` already uses (verify; do not introduce a new root reference).
* Test scenarios documented in the PR description
  * [ ] Hover a button, wait 1.5s, tooltip shows. Click the button, tooltip hides immediately and stays hidden until the pointer leaves the item and re-enters.
  * [ ] Click a flyout button (one that opens a submenu). Descend into a sub-item. The sub-item's tooltip DOES show after delay. (Suppression is scoped to the literal clicked element and its OWN flyout subtree, not parent paths.)
  * [ ] Open a menu, click an item that closes the menu. `closeAllMenus()` runs and the suppression attribute is gone from every prior-clicked element.
  * [ ] Open a menu, click an item, then click outside to close. Same global cleanup; verify with DevTools.
* Smoke
  * [ ] Build and load in EDH.
  * [ ] Walk through all four scenarios above with DevTools open watching the attribute toggle.
  * [ ] Confirm the visual suppression works once Lane A's CSS rule lands. If Lane A is not yet merged, manually inject the CSS rule via DevTools `<style>` panel for the smoke test.
  * [ ] Run `npm test`.

## Failure routing

* Suppression leaks across sibling items (sibling tooltip stays hidden after pointer moves to it): the click-time `querySelectorAll` is scoped too broadly. Tighten to the clicked element's own flyout subtree only, not the parent menu.
* Suppression never clears: pointerleave is bound on the wrong element. Verify it is on the flyout container, not on individual items, and not on `document`.
* `closeAllMenus()` cleanup misses elements: the toolbar-root selector is wrong. Verify by `console.log`-ing the queried node count before and after the sweep.

## Acceptance

* All four documented test scenarios pass on a local EDH build.
* `closeAllMenus()` always returns the toolbar to a no-suppression state.
* `npm test` passes.
* PR description explicitly notes that the visual effect requires Lane A to ship.
