# Orchestrator: A2+A3 Teardown Fixes and Platform Expansion

**Status:** done
**Created:** 2026-04-17
**Completed:** 2026-04-20 (PRs [#108](https://github.com/appliedmedia/print2paper4vscode/pull/108), [#110](https://github.com/appliedmedia/print2paper4vscode/pull/110), [#111](https://github.com/appliedmedia/print2paper4vscode/pull/111) merged)
**Master Orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 2 Stream C3 + Phase 3 Stream D)

## Objective

Close the two highest-priority items that remain before Marketplace publish readiness.

* A2: Resolve the three legitimate teardown fixes that were deferred from the first ai01 pass on PR #108 (`feature/gherkin-migration`).
* A3: Finish the Linux print smoke test that was left pending after PR #105 merged, and refresh the Windows print plan so it is actionable now that Stream A (Windows Fixes) has shipped.

## Scope

* No code changes outside the lane file lists below.
* No interaction with PR #107 (`feature/gherkin-coverage`), which is parked pending its own merge.
* Marketplace publish work remains blocked per the user's direction.

## Swimlanes

Comments and files are partitioned so the three lanes share no source files and can run in parallel.

* [Lane 1: PR #108 teardown fixes](<2026-04-17_plan_done_TeardownAndPlatforms_Lane1-PR108Teardown.md>) on branch `feature/gherkin-migration`
* [Lane 2: Linux smoke test](<2026-04-17_plan_done_TeardownAndPlatforms_Lane2-LinuxSmokeTest.md>) on new branch `feature/linux-smoke-test`
* [Lane 3: Windows print plan refresh](<2026-04-17_plan_done_TeardownAndPlatforms_Lane3-WindowsPrintPlan.md>) on new branch `docs/windows-print-plan-refresh`

## Execution contract

Rules that apply to every lane agent.

* Work in an isolated git worktree rooted at the lane's branch.
* Pull the lane's target branch before the first commit.
* Do not touch files that belong to another lane.
* `npm test` must report zero failures locally before pushing.
* Do not `--no-verify`. Do not amend. Do not force-push.
* Push with a normal `git push` (with `-u` on first push for new branches).

## Coordination

* Lane 2 and Lane 3 start from `main`. Lane 1 starts from `feature/gherkin-migration`.
* Lane 1 pushes additional commits to the existing PR #108.
* Lane 2 opens a new PR titled "Add Linux print smoke test".
* Lane 3 is docs-only; open a new PR titled "Refresh Windows print plan for post-fixes scope".
* No cross-lane dependencies. Lanes may run simultaneously.

## Lane return format

Each lane reports:

* Work item summary (one bullet per deliverable).
* Commits pushed with short sha and one-line message.
* PR number (for new lanes) or link to the commit range added (for PR #108).
* Any deferred follow-ups and the reason.

## Done when

* PR #108 has the three teardown fixes committed and `npm test` is green.
* A Linux smoke test PR exists with passing CI, or a `WONTFIX` decision with justification is filed.
* The Windows print plan doc is updated to reflect that OSWin.ts bugs are fixed and lists a concrete first implementation pass.
