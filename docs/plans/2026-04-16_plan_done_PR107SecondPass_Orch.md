# Orchestrator: PR #107 Second Pass (CodeRabbit third review)

**Status:** inProgress
**Created:** 2026-04-16
**Branch:** `feature/gherkin-coverage`
**PR:** [#107](https://github.com/appliedmedia/print2paper4vscode/pull/107)
**Master Orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 2, Stream C2)

## Objective

Address the 59 new CodeRabbit inline comments that surfaced during the third review pass on PR #107, after the first ai01 cycle resolved the original 46 comments.

## Scope

* 59 inline comments, all from `coderabbitai[bot]`
* Comment ID list persisted at `/tmp/new_comments.json` on Andrew's workstation
* Themes: still-weak assertions (for example `assert.ok(value)` failing on `0`/`false`), `pdfState.headerRendered` coverage gap, inert mock on `getMenuItemIdSelected`, helper-extraction nits, residual module-level state

## Swimlanes

Comments are partitioned by file so that lanes share no files and can push to the same branch without conflict.

* [Lane 1: PaperPrinter/Stylize domain](<2026-04-16_plan_inProgress_PR107SecondPass_Lane1-PaperPrinterStylize.md>) (17 comments)
* [Lane 2: PDF/Utils/Registry](<2026-04-16_plan_inProgress_PR107SecondPass_Lane2-PdfUtilsRegistry.md>) (15 comments)
* [Lane 3: UI/Menu/Tab/WebView/VSCodeAPIs](<2026-04-16_plan_inProgress_PR107SecondPass_Lane3-UiMenuTab.md>) (19 comments)
* [Lane 4: OS/Coords](<2026-04-16_plan_inProgress_PR107SecondPass_Lane4-OsCoords.md>) (8 comments)

## Execution contract

Every lane agent must follow these rules.

* Work in an isolated git worktree checked out to `feature/gherkin-coverage`.
* Pull `origin/feature/gherkin-coverage` before first commit.
* Only edit files in the lane's file list. Do not touch files belonging to another lane.
* Before each push: `git pull --rebase origin feature/gherkin-coverage`. If rebase conflicts (should not happen given disjoint files), abort and report.
* Push to `origin feature/gherkin-coverage`. Retry up to 3 times with pull-rebase on push rejection.
* Post one inline reply per comment via `gh api -X POST repos/appliedmedia/print2paper4vscode/pulls/107/comments/{id}/replies` (the proxy workflow `action-proxy-reviewer-bot-comment.yml` was deleted from `main` in commit `85f1742`; direct REST is the current path).
* Reply format: `from 🤖 to @coderabbitai: {emoji} {text}. Commit {short-sha-link}`.
* Dispositions: 👍🏻 validate, 😎 already fixed, 🚫 won't do (requires SIGNIFICANT reason), ✅ fix applied.
* Verify locally after changes: `npm test` must report 0 failures.
* Do not create branches. Do not amend. Do not `--no-verify`.

## Coordination

* Top-level confirmation comment is posted by the orchestrator (Claude in main thread), not by lanes. Each lane returns the summary this doc defines.
* No cross-lane dependencies. All four lanes run in parallel.

## Lane return format

Each lane reports:

* Total comments processed
* Count by disposition (✅/😎/🚫/👍🏻)
* Commits pushed (sha and one-line message)
* Any comment IDs left unresolved and the reason
