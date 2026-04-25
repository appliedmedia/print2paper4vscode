# Orchestrator: Windows Print Implementation Wave

**Status:** todo
**Created:** 2026-04-24
**Spec:** [2026-04-17_plan_inProgress_WindowsPrint.md](<2026-04-17_plan_inProgress_WindowsPrint.md>)
**Master orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 3 Stream D)

## Objective

Execute the [WindowsPrint spec](<2026-04-17_plan_inProgress_WindowsPrint.md>) in two coordinated lanes that ship together as a single PR on `feature/windows-print`. The spec lists two largely independent workstreams: rewriting the print-dialog method, and adding failure-mode handling to the direct-print method. Both edit the same source and test files, so the lanes are partitioned by method, not by file.

## Scope

* Source file in scope: `src/OSWin.ts` only.
* Test file in scope: `tests/OSWin.test.ts` only.
* No changes to `OSMac`, `OSLinux`, `Coords`, or any caller of `OSWin`.
* No Gherkin scenarios. Stream C owns format migration; this wave contributes node:test cases.
* No changes to `escapePath`. The spec calls this out explicitly.

## Swimlanes

Lanes are partitioned by method-and-describe-block. Both lanes touch the same two files; the orchestrator serializes them at the source level (Lane A merges into the wave branch first, Lane B rebases).

* [Lane A: fileOpenPrintDialog rewrite](<2026-04-24_plan_todo_WindowsPrintImpl_LaneA-PrintDialog.md>)
* [Lane B: filePrint failure-mode handling](<2026-04-24_plan_todo_WindowsPrintImpl_LaneB-FailureModes.md>)

## File partition

* Lane A owns
  * `src/OSWin.ts` method `fileOpenPrintDialog` (currently lines 60..end of method).
  * `tests/OSWin.test.ts` describe block `fileOpenPrintDialog` (currently starts line 163).
* Lane B owns
  * `src/OSWin.ts` method `filePrint` (currently lines 52..end of method) plus any new private helper added for stderr-to-message translation.
  * `tests/OSWin.test.ts` describe block `filePrint` (currently starts line 101) plus any new describe block for the helper.
* Neither lane edits constructors, imports, or unrelated methods. If a lane needs a new import, it adds one line and the other lane rebases past it.

## Branching

* Wave branch: `feature/windows-print` (new, branched from `main`).
* Lane A branch: `feature/windows-print-dialog` (branched from `feature/windows-print`).
* Lane B branch: `feature/windows-print-failure-modes` (branched from `feature/windows-print`).
* Lane A merges into `feature/windows-print` first via fast-forward. Lane B rebases onto `feature/windows-print` and then merges. The wave branch is what becomes PR #N to `main`.

## Execution contract

Rules that apply to every lane agent.

* Work in an isolated git worktree rooted at the lane's branch.
* Pull the lane's parent branch before the first commit.
* Do not touch files or methods that belong to the other lane.
* `npm test` must report zero failures locally before pushing.
* `npm run lint` and `npm run lint:md` must pass with zero warnings.
* Do not `--no-verify`. Do not amend. Do not force-push.
* Push with a normal `git push` (with `-u` on first push for new branches).

## Coordination

* Lane A goes first. Lane B waits for Lane A's merge into `feature/windows-print`, then rebases.
* The wave PR title is "Windows print: real dialog + failure-mode handling".
* The wave PR description links both Lane plan files and the spec.
* CodeRabbit review happens on the wave PR; lane branches are not separately reviewed.

## Lane return format

Each lane reports:

* Work item summary (one bullet per deliverable).
* Commits pushed with short sha and one-line message.
* Lane branch name and parent.
* Any deferred follow-ups and the reason.

## Done when

* `feature/windows-print` contains both lanes' work and is open as a PR to `main`.
* `fileOpenPrintDialog` triggers a programmatic print flow, no longer delegating to `fileOpenInDefaultApp`.
* `filePrint` surfaces user-visible messages for the four failure modes named in the spec.
* `tests/OSWin.test.ts` covers the rewritten method and all four failure paths; the legacy delegation test is deleted.
* `npm test`, `npm run lint`, and `npm run lint:md` are green locally and on `windows-latest` in CI.
