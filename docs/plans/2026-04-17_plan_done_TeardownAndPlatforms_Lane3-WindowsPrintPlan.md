# Lane 3: Windows Print Plan Refresh

**Status:** done
**Created:** 2026-04-17
**Completed:** 2026-04-20 via [PR #111](https://github.com/appliedmedia/print2paper4vscode/pull/111)
**Branch:** `docs/windows-print-plan-refresh` (new, branched from `main`)
**Related merged PR:** [#103](https://github.com/appliedmedia/print2paper4vscode/pull/103) (Windows Fixes)
**Orchestrator:** [2026-04-17_plan_done_TeardownAndPlatforms_Orch.md](<2026-04-17_plan_done_TeardownAndPlatforms_Orch.md>)

## Objective

Bring the Windows Print plan out of its "superseded" state now that Stream A (Windows Fixes, PR #103) has merged, and rewrite it to match the current OSWin.ts implementation so an engineer can start it cold.

## File list

* `docs/plans/2025-12-25_plan_todo_WinPrint.md` (rewrite in place, rename if dating policy requires)
* `docs/plans/2026-04-01_plan_todo_Orchestrator.md` (remove Windows Print from the "Superseded Plans" section)
* Optional: new file `docs/plans/2026-04-17_plan_todo_WindowsPrint.md` if renaming is preferred. If a rename happens, delete the 2025-12-25 copy in the same PR.

## Work items

### 1. Audit current OSWin.ts

* Before writing, read `src/OSWin.ts` as it stands after PR #103 and list which print-related methods are still stubs, which are implemented, and which need rewrites.
* Capture this audit as the "Current state" section of the refreshed plan so it is specific, not generic.

### 2. Rewrite the plan

* Replace the superseded framing with a real action plan grounded in the post-fixes code.
* Keep the markdown-hygiene rules (no tables, `*` bullets, no trailing whitespace, extended link format).
* Sections to include.
  * Objective
  * Current state (from step 1)
  * Deliverables (print dialog, direct print, error paths, tests)
  * Implementation order
  * Test strategy (unit-only, windows-latest CI)
  * Success criteria
  * Out of scope

### 3. Update master orchestrator

* Remove the Windows Print row from the "Superseded Plans" section.
* Under Phase 3 Stream D, update the Windows Print row to reference the refreshed plan filename and mark it `unblocked`.

## Verification

* `npm run lint:md` passes on every changed file.
* No behavior changes in source code; this PR is docs-only.
* The refreshed plan has zero tables and zero trailing whitespace.

## PR

* Title: "Refresh Windows print plan for post-fixes scope"
* Base: `main`
* Label as docs-only. Per the orchestrator's PR checklist, test and coverage gates auto-pass for docs-only PRs.

## Out of scope

* Any src/ changes.
* Implementing Windows print methods. That work is the subject of the refreshed plan, not this PR.

## Return format

* Summary of the audit's findings (one bullet per OSWin print method).
* Diff summary for each edited doc.
* PR number.
