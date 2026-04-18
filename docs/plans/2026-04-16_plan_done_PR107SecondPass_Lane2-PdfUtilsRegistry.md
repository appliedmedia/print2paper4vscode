# Lane 2: PDF + Utils + Registry (PR #107 second pass)

**Status:** inProgress
**Created:** 2026-04-16
**Orchestrator:** [2026-04-16_plan_inProgress_PR107SecondPass_Orch.md](<2026-04-16_plan_inProgress_PR107SecondPass_Orch.md>)
**Branch:** `feature/gherkin-coverage`
**Comments:** 15

## File scope (edit only these)

* `features/support/steps/pdf-coverage.ts`
* `features/support/steps/pdf-coverage2.ts`
* `features/support/steps/utils-coverage.ts`
* `features/support/steps/registry.ts`
* `features/support/steps/registry-coverage.ts`
* `features/utils-coverage.feature`
* `package.json`

## Comment IDs

* `pdf-coverage.ts`: 3097694577, 3097694717, 3097694822, 3097705726
* `pdf-coverage2.ts`: 3097696091, 3097696317, 3097705734
* `utils-coverage.ts`: 3097696979, 3097697037, 3097705752
* `utils-coverage.feature`: 3097697059
* `registry.ts`: 3097694727
* `registry-coverage.ts`: 3097696396, 3097696454
* `package.json`: 3097695697

## Notes

* The `package.json` comment (3097695697) concerns npm scripts on Windows. If the fix would break the `action-proxy-reviewer-bot-comment.yml` cleanup or conflict with existing CI, mark 🚫 with a specific reason.
* The `pdfState.headerRendered` coverage gap flagged in the third review is in `pdf-coverage.ts`. Fix means actually asserting `setFontSize`/`doc.text` was called, not just checking a boolean flag.

## Instructions

Follow the execution contract in the orchestrator. Verify each claim against the code before acting.
