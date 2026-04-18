# Lane 3: UI + Menu + Tab + WebView + VSCodeAPIs (PR #107 second pass)

**Status:** inProgress
**Created:** 2026-04-16
**Orchestrator:** [2026-04-16_plan_inProgress_PR107SecondPass_Orch.md](<2026-04-16_plan_inProgress_PR107SecondPass_Orch.md>)
**Branch:** `feature/gherkin-coverage`
**Comments:** 19

## File scope (edit only these)

* `features/support/steps/ui.ts`
* `features/support/steps/ui-coverage.ts`
* `features/support/steps/uimenumgr.ts`
* `features/support/steps/uimenumgr-coverage.ts`
* `features/support/steps/uimenumgr-coverage2.ts`
* `features/support/steps/uiwebview.ts`
* `features/support/steps/tabinspector.ts`
* `features/support/steps/vscodeapis.ts`
* `features/uimenumgr.feature`
* `features/vscodeapis.feature`

## Comment IDs

* `ui.ts`: 3097695144, 3097695485
* `ui-coverage.ts`: 3097695292
* `uimenumgr.ts`: 3097695138, 3097705748
* `uimenumgr-coverage.ts`: 3097695023, 3097695069, 3097705745
* `uimenumgr-coverage2.ts`: 3097696912, 3097696936
* `uiwebview.ts`: 3097695135, 3097695289
* `tabinspector.ts`: 3097695090, 3097696286
* `vscodeapis.ts`: 3097695566, 3097695575, 3097705760
* `uimenumgr.feature`: 3097695629
* `vscodeapis.feature`: 3097695634

## Notes

* The inert mock concern flagged in the third review is likely in `uimenumgr-coverage.ts` or `uiwebview.ts` — the test stubs `getMenuItemIdSelected` but the code path calls `handleSelection_HeaderFooter` directly. Fix means stubbing the actual code path OR asserting the real path with real data.
* `assert.ok(value)` failing on `0`/`false` is a common refrain — replace with explicit `assert.strictEqual` or `assert.notStrictEqual(value, undefined)`.

## Instructions

Follow the execution contract in the orchestrator. Verify each claim against the code before acting.
