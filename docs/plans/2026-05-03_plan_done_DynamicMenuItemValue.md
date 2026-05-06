# Dynamic Menu Item Value: lazy refresh on menu open

**Status:** done (shipping via PR #121)
**Created:** 2026-05-03
**Updated:** 2026-05-05
**Master orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (out-of-band quality fix; not on a roadmap stream)
**Motivating context:** [PR #120 fix/about-shortcut-rebind-detection](<https://github.com/appliedmedia/print2paper4vscode/pull/120>) (merged 2026-05-03) corrected the lookup logic so that `getShortcutForCommand` reports the right key whenever it is invoked, but the toolbar still bakes the result into static HTML at toolbar-creation time. If the user opens VS Code's keybindings editor from About > Shortcut and changes the key, the displayed value stays stale until something else triggers a full webview redraw.

## Objective

Introduce a generic, opt-in mechanism for menu items whose displayed value can drift between toolbar-render time and the moment the user next looks at it.
When such an item is rendered, the toolbar emits both the resolved-at-render value (so first paint is correct) and a marker attribute indicating that the value should be re-resolved on menu-open.
When the user clicks the menu's top button to open the dropdown, the webview asks the extension for a fresh value via a new `getDynamicValueForMenuItemIdOfMenuId(menuId, menuItemId)` round-trip and patches the corresponding DOM element.

The mechanism rests on a per-item invariant: an item declares at most one dynamic field. The dispatcher does not need a `field` discriminator from the caller because it can find the function-typed field on the item itself. Today the only producer is the About menu's "Shortcut" item, whose `shortcut` is a `UIMenuShortcutFxn_t`. No other menu item in the codebase has a value that drifts between toolbar-render and the user looking at it (audit in "Scope" below).

## Scope

In scope:

* The single producer is the About menu's "Shortcut" item: `item.shortcut` is a function. No other menu item in the codebase has a function-typed field on a per-item basis today, so the marker logic and the dispatcher both bottom out at the same single case at runtime.
* Generic dispatcher `UIMenuMgr.getDynamicValueForMenuItemIdOfMenuId({ menuId, menuItemId })` that looks up the menu item, finds the function-typed dynamic field on it (today: `item.shortcut`), and invokes it. No `field` discriminator from the caller. Internally the dispatcher reuses the existing `getShortcutOfMenuItemIdForMenuId` per-field method so the resolver execution path is shared with first-paint rendering.
* Per-item invariant: at most one dynamic field per item. Future dynamic fields slot in by extending the dispatcher's "find the function-typed field" lookup; callers do not change. If an item ever needs multiple dynamic values, that is a redesign signal, not an extension of this API.
* New extension to webview send infrastructure (does not exist today). All webview to extension postMessage paths already exist; only the reverse direction is new.
* Construction-time marker emission in `UIMenu.getItemHTML` whenever the item has any function-typed dynamic field. Today the only check is `typeof item.shortcut === 'function'`; if a future item adds another function-typed field, this check expands but the marker shape does not change.
* Webview JS hook on the existing menu-open dropdown handler that finds marked items and posts a `getDynamicValue` request, plus a `message` listener that patches the corresponding DOM element on response.
* Cash in the deferred resolver-generalization: lift the shared "build dict, run resolver, catch and fallback" body of the three private helpers (`getValueOfMenuFxnByCalcShortcut`, `getValueOfMenuFxnByCalcIsHidden`, `getValueOfMenuFxnByCalcValue`) into one private `runMenuFxn(fn, fallback)`. The three per-field public methods stay as thin wrappers preserving their return types.

Out of scope:

* `value` and `isHidden` field resolvers. Audit shows neither has a user-interaction-time drift problem: `value` resolvers (`fitWidth`, `fitPage` in `kZoomLevel`) re-evaluate when the user clicks the item via `getValueOfMenuItemIdSelected`, not at display time; `isHidden` (only `kMd`) gates whether the menu button is rendered at all, so a click-to-recompute trigger is not applicable. Both keep their existing render-time evaluation.
* Whole `menuItems` list rebuilds (Text-font insertion, Theme list). These are construction-time dynamic only; they refresh on the next full toolbar redraw, which is acceptable for both motivating cases (changing editor font and installing themes are rare and the user rarely keeps the print panel open across them).
* `handleSelection_About` does not change. The trigger for refresh is the user clicking the About menu top button to open the dropdown, not the act of picking the Shortcut item. This means the user can rebind the key, close the keybindings editor, then on next click of the About menu the displayed shortcut updates, even if they never re-pick "Shortcut" from the menu.

## Current state

Audit on `main` at commit `4c012ff`:

* `UIMenu.ts:262-265, UIMenu.ts:589-596` resolve `shortcut` per render via `UIMenuMgr.getShortcutOfMenuItemIdForMenuId`. The `<span class="menu-item-shortcut">` carries the resolved string as a static text node.
* `UIMenuMgr.ts:440-449` defines `getShortcutOfMenuItemIdForMenuId({ menuId, menuItemId })` and `UIMenuMgr.ts:453-471` defines the private `getValueOfMenuFxnByCalcShortcut` helper. Both already invoke the resolver fresh; no caching, no staleness inside the helper itself.
* `UIWebView.ts:262-264` registers handlers for `dragEnd`, `menuItemSelected`, `dx`. There is no `getDynamicValue` handler and no extension to webview send path.
* `VSCodeAPIs.ts` exposes `getOrCreateWebviewPanel`, `removePanel`, but no `postMessageToWebviewPanel`. The underlying `panel.webview.postMessage` is unused in our codebase.
* `UIMenu.yaml` registers handlers for menu-item click and toolbar drag. There is no `window.addEventListener('message', ...)` listener on the webview side.
* `PaperPrinter.ts:599-620` constructs the About menu items. The `shortcut: UIMenuShortcutFxn_t` resolver for the `'shortcut'` item is the only function-typed `shortcut` in the codebase.

## Deliverables

All deliverables land in a single PR on branch `feature/dynamic-menu-item-value` with base `main`.

### Extension side

* New types in `src/types/UI_t.ts`:
  * `SendToExt_getDynamicValue = { type: 'getDynamicValue', menuId: MenuId_t, menuItemId: MenuItemId_t }` and add to `SendToExt_t` union.
  * `SendFromExt_dynamicValue = { type: 'dynamicValue', menuId: MenuId_t, menuItemId: MenuItemId_t, value: string | number | boolean | undefined }`.
  * Add a `SendFromExt_t` union (does not exist today).
  * No `field` discriminator on either type. The receiver locates the marked DOM element by the `menuId` and `menuItemId` pair only.

* New method in `src/UIMenuMgr.ts`:
  * `getDynamicValueForMenuItemIdOfMenuId(args: { menuId: MenuId_t; menuItemId: MenuItemId_t }): string | number | boolean | undefined`.
  * Body looks up the menu item by id, then inspects it for the first function-typed dynamic field. Today only `shortcut` qualifies, so the implementation reduces to: `if (typeof item.shortcut === 'function') return getShortcutOfMenuItemIdForMenuId({ menuId, menuItemId })`. If no function-typed field is found, return `undefined` and log via `dx.error` (this is a signal that the marker was emitted incorrectly).
  * Per-field public methods (`getShortcutOfMenuItemIdForMenuId`, `getValueOfMenuItemIdForMenuId`, `getIsHiddenOfMenuId`) stay. They remain typed and callable by `UIMenu.getHTML` for first-paint resolution. The dispatcher reuses them so the execution path between first-paint and on-open refresh is the same code.

* Resolver consolidation in `src/UIMenuMgr.ts`:
  * Add a private `runMenuFxn<T>(fn: (dict: UIMenuItemDict_t) => T, fallback: T, errorContext: string): T` that builds the dict via the existing `buildUIMenuItemDict()`, invokes `fn`, returns the result, and on throw logs the error and returns `fallback`.
  * Rewrite `getValueOfMenuFxnByCalcShortcut`, `getValueOfMenuFxnByCalcIsHidden`, `getValueOfMenuFxnByCalcValue` as thin one-liners over `runMenuFxn`, preserving each public method's return type.

* New send-to-webview infrastructure in `src/VSCodeAPIs.ts`:
  * `postMessageToWebviewPanel(args: { panelId: WebviewPanelId_t; message: SendFromExt_t }): Promise<boolean>` that looks up the panel by id and calls `panel.webview.postMessage(message)`. Returns the postMessage promise. Logs and returns `false` if the panel is not found.
  * Register the new method via `Registry`.

* New message handler in `src/UIWebView.ts`:
  * `handleGetDynamicValue(msg: SendToExt_getDynamicValue)` calls `uimenumgr.getDynamicValueForMenuItemIdOfMenuId({ menuId, menuItemId, field })`, then `vscodeapis.postMessageToWebviewPanel({ panelId: this.panelId, message: { type: 'dynamicValue', menuId, menuItemId, field, value } })`.
  * Wire registration and unregistration in the existing `registerMessageHandlers` and `done` blocks alongside the other three handlers.

### Render-time marker

* In `src/UIMenu.ts` `getItemHTML`:
  * When the item has any function-typed dynamic field (today: `typeof item.shortcut === 'function'`), emit the existing `<span class="menu-item-shortcut">` with two data attributes: `data-{{ns_}}dynamicMenuId="<menuId>"` and `data-{{ns_}}dynamicMenuItemId="<menuItemId>"`. Presence of the pair is the marker; no `field` attribute is needed because the dispatcher infers it from the item.
  * The text content stays the resolved-at-render value so first paint is correct.
  * Static-string and undefined `shortcut` cases are unchanged.

### Webview side

* In `src/UIMenu.yaml`:
  * Identify the existing dropdown-open handler (the click handler on the menu top button that toggles the dropdown's open state).
  * On the open transition, query the dropdown for `[data-{{ns_}}dynamicMenuItemId]` elements. For each, read the menuId and menuItemId from the data attrs and post `{ type: 'getDynamicValue', menuId, menuItemId }` to the extension using the existing `vscode.postMessage` global.
  * Add a `window.addEventListener('message', ...)` listener that switches on `msg.data.type === 'dynamicValue'`. On match, find the element with matching `data-{{ns_}}dynamicMenuId` and `data-{{ns_}}dynamicMenuItemId`, then update its `textContent` (or remove the span if the response is the empty string, to mirror the unbound-key behavior in the at-render path).
  * No bookkeeping needed: requests are idempotent and DOM patches are last-write-wins.

## Implementation order

1. Add `SendToExt_getDynamicValue`, `SendFromExt_dynamicValue`, and the `SendFromExt_t` union in `types/UI_t.ts`. Run `tsc --noEmit` to confirm the union additions do not break existing handlers.
2. Add `runMenuFxn` private helper in `UIMenuMgr.ts` and rewrite the three existing private helpers as one-liners. Run unit tests; confirm no behavior change. This isolates the consolidation from the new feature so the diff is bisectable.
3. Add `getDynamicValueForMenuItemIdOfMenuId` public dispatcher. Add unit tests for the `shortcut` resolver case and the no-function-field error path.
4. Add `postMessageToWebviewPanel` in `VSCodeAPIs.ts` with a Registry binding. Add unit tests with a mocked panel.
5. Add `handleGetDynamicValue` handler in `UIWebView.ts`. Wire registration and unregistration. Add a unit test that asserts the round-trip: a synthesized `getDynamicValue` message produces a `dynamicValue` post via the mocked `postMessageToWebviewPanel`.
6. Add the marker emission in `UIMenu.getItemHTML`. Add a UIMenu unit test that asserts the rendered HTML carries the two `data-{{ns_}}dynamicMenuId` and `data-{{ns_}}dynamicMenuItemId` attributes when `shortcut` is a function and does not carry them when `shortcut` is a string or undefined.
7. Add the webview-side hook and message listener in `UIMenu.yaml`. No unit test coverage (yaml strings are not unit-tested today); manual smoke test via `F5` debug session below.
8. Manual smoke test:
   1. Run with `F5`, open Print2Paper on any file.
   2. Open the About menu, confirm the Shortcut row shows the default key.
   3. Click Shortcut, edit the keybinding in VS Code's editor, save.
   4. Click back to the print panel, click About again.
   5. Confirm the new key shows in the Shortcut row without any other interaction (no zoom, no theme change, no Alt+P).
   6. Repeat with the user unbinding the key entirely; confirm the row collapses.

## Test strategy

* Unit tests for `runMenuFxn`: dict shape, resolver invocation, error path returns fallback, error path logs.
* Unit tests for `getDynamicValueForMenuItemIdOfMenuId`: function-typed `shortcut` dispatches to `getShortcutOfMenuItemIdForMenuId`; item with no function-typed field returns `undefined` and logs.
* Unit tests for `postMessageToWebviewPanel`: panel found path calls `panel.webview.postMessage` with the right payload, panel-not-found path returns `false` and logs.
* Unit tests for `handleGetDynamicValue`: synthesized request produces a single `postMessageToWebviewPanel` call with the resolved value.
* UIMenu render test: function-typed `shortcut` emits the two dynamic-marker data attributes; static-string and undefined cases do not.
* No new Gherkin scenarios. The end-to-end behavior (rebind key in the editor and see the toolbar update) requires VS Code keybindings UI manipulation that is outside the unit-test boundary; the smoke test above covers it.

## Risks and mitigations

* Risk: webview message listener leaks across panel disposals. Mitigation: registration and unregistration of the new message handler ride alongside the existing three handlers in `UIWebView.registerMessageHandlers` and `UIWebView.done`. The webview-side `addEventListener('message', ...)` is in toolbar JS that is regenerated each panel creation, so it does not leak.
* Risk: round-trip latency makes the shortcut text flicker on every menu open. Mitigation: first paint already shows the resolver-evaluated value, so the displayed text is correct before the round-trip starts. The post-open patch only changes the text when keybindings.json has actually changed since render. In the no-change case the patch is a no-op.
* Risk: the consolidation in step 2 changes behavior. Mitigation: order step 2 first as a behavior-preserving refactor with full unit-test coverage before any new feature code lands. If a regression appears, the diff is bisectable down to a single commit.
* Risk: `panel.webview.postMessage` rejects when the webview is no longer visible. Mitigation: the new send method returns the promise; the `handleGetDynamicValue` handler awaits it and ignores rejection. A failed post during a panel transition is a no-op; the user will see the right value on the next menu open after the panel is fully reattached.

## Out-of-scope follow-ups

These are not blockers for shipping this PR. Listed so a future planner sees the natural extensions.

* `field: 'menuItems'` to support whole-list rebuilds for Text-font and Theme menus on menu open. Different response shape (array, not scalar); webview JS would replace dropdown children rather than patch a text node. Add only if a real staleness complaint appears for those menus.
* `field: 'isHidden'` requires a different trigger than menu-open (a hidden menu has no clickable button). If the active-editor language change should make `kMd` appear or disappear without a full redraw, the trigger would be a `vscode.window.onDidChangeActiveTextEditor` listener that posts a refresh request to the webview.
* Generic placeholder content for the very brief moment between menu open and the round-trip resolution, in case keybindings.json is on a slow filesystem. Not needed for the local file scenario.
