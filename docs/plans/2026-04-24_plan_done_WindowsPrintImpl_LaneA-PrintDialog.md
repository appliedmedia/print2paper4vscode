# Lane A: fileOpenPrintDialog Rewrite

**Status:** done
**Created:** 2026-04-24
**Closed:** 2026-04-25
**Merged into:** `feature/windows-print` as commit `ff23b1c` (then squash-merged to `main` via PR #112 as `bc93025`)
**Branch:** `feature/windows-print-dialog` (deleted post-merge)
**Parent branch:** `feature/windows-print` (deleted post-merge)
**Orchestrator:** [2026-04-24_plan_done_WindowsPrintImpl_Orch.md](<2026-04-24_plan_done_WindowsPrintImpl_Orch.md>)
**Spec:** [2026-04-17_plan_done_WindowsPrint.md](<2026-04-17_plan_done_WindowsPrint.md>) sections "Print dialog" and "Tests"

## Objective

Replace the stub `fileOpenPrintDialog(path)` in `src/OSWin.ts` with a real programmatic print flow, and update the matching describe block in `tests/OSWin.test.ts`.

## In scope

* `src/OSWin.ts`
  * Method `fileOpenPrintDialog`. Rewrite the body. Add a block comment that documents the chosen PowerShell approach so a future maintainer does not regress to the `fileOpenInDefaultApp` delegation.
  * One new import line is acceptable if needed; do not reorganize existing imports.
* `tests/OSWin.test.ts`
  * `describe('fileOpenPrintDialog', ...)` block (currently starts line 163). Replace its contents.
  * Delete the existing `should delegate to fileOpenInDefaultApp` test, which is load-bearing on the stub.

## Approach

Per spec, choose one of:

* `Start-Process -Verb PrintTo` invoked through `execFileAsync('powershell', [...])`. Forces the user to pick a printer via the OS chooser.
* PowerShell one-liner that instantiates `System.Windows.Forms.PrintDialog`, and on OK calls `Start-Process -Verb Print`. Gives a richer dialog.

Either is acceptable. Whichever is chosen, the method must:

* Use `execFileAsync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script])`. No shell interpolation.
* Double single quotes inside `path` for the PowerShell string literal, mirroring the pattern already used by `filePrint`.
* Treat user cancellation as a no-op; do not throw or surface an error to `fn.ui.showErrorMessage`.

## Out of scope

* Anything inside `filePrint`. That is Lane B.
* Failure-mode error messages for `fileOpenPrintDialog`. Lane B introduces the shared stderr-to-message helper; once Lane B lands, a follow-up can route this method through it. Do not preempt that decision in Lane A.
* Custom dialog UX, copy-count, orientation pickers. Per spec.
* Touching `escapePath`. Per spec.

## Tests

All tests stub `execFileAsync` on the `OSWin` instance and assert the recorded `(file, args)` tuples. Pattern matches existing `filePrint` tests.

* New test: `fileOpenPrintDialog` calls `execFileAsync('powershell', ...)` with `-NoProfile`, `-NonInteractive`, and `-Command` flags.
* New test: the PowerShell script body matches the chosen approach (assert on a substring like `PrintDialog` or `-Verb PrintTo`).
* New test: single quotes in the path are doubled inside the script body.
* New test: user-cancel path resolves without calling `fn.ui.showErrorMessage`. (If Lane A's chosen approach cannot distinguish cancel from success at this layer, document why in a comment and skip this test; Lane B will pick it up.)
* Delete: `should delegate to fileOpenInDefaultApp`.

## Implementation order

1. Pull `feature/windows-print`, branch to `feature/windows-print-dialog`.
2. Rewrite `fileOpenPrintDialog` in `src/OSWin.ts`. Add the documenting block comment.
3. Replace the describe block in `tests/OSWin.test.ts`. Delete the delegation test.
4. `npm test`, `npm run lint`, `npm run lint:md` all green.
5. Commit. Push with `-u`.
6. Open a fast-forward merge into `feature/windows-print` (not a PR; the wave PR is the public review surface).

## Done when

* `fileOpenPrintDialog` no longer references `fileOpenInDefaultApp`.
* The describe block reflects the new contract.
* `npm test` green locally on macOS.
* CI green on `windows-latest`.

## Return format

Report back with:

* One bullet per deliverable above, marked done or deferred.
* Commit shas with one-line messages.
* Branch name and parent.
* Any deferred follow-ups and the reason.
