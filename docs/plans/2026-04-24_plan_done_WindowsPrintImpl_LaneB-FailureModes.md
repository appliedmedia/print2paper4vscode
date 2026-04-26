# Lane B: filePrint Failure-Mode Handling

**Status:** done
**Created:** 2026-04-24
**Closed:** 2026-04-25
**Merged into:** `feature/windows-print` as commits `f80174c` + `b431b25` (then squash-merged to `main` via PR #112 as `bc93025`)
**Branch:** `feature/windows-print-failure-modes` (deleted post-merge)
**Parent branch:** `feature/windows-print` (deleted post-merge)
**Orchestrator:** [2026-04-24_plan_done_WindowsPrintImpl_Orch.md](<2026-04-24_plan_done_WindowsPrintImpl_Orch.md>)
**Spec:** [2026-04-17_plan_done_WindowsPrint.md](<2026-04-17_plan_done_WindowsPrint.md>) sections "Direct print", "Error paths", and "Tests"

## Objective

Add explicit failure-mode handling to `filePrint(path)` in `src/OSWin.ts` so users see actionable messages through `fn.ui.showErrorMessage` rather than raw PowerShell stderr blobs. Cover each failure mode with a unit test.

## In scope

* `src/OSWin.ts`
  * Method `filePrint`. Keep the existing argv shape; wrap the call so PowerShell exit codes and `stderr` strings are mapped to user-facing messages.
  * Optional new private method (for example `mapPowerShellErrorToMessage(stderr, code)`) that translates failure signatures to user-visible strings. Keep it on the `OSWin` class. No new files.
* `tests/OSWin.test.ts`
  * Extend the `describe('filePrint', ...)` block (currently starts line 101). Add a new test per failure mode.
  * If a helper is introduced, add a small describe block for it adjacent to `filePrint`.

## Failure modes

Per spec, each must surface a friendly message via `fn.ui.showErrorMessage`. Do not change PowerShell behavior; only translate its output.

* No default printer
  * Detection: PowerShell error string mentions `default printer` or `Get-CimInstance Win32_Printer` style failure.
  * Message: name the Settings page the user needs to visit (Settings > Bluetooth & devices > Printers & scanners). Do not deep-link; user runs whatever Windows version they run.
* Print verb not supported by the associated handler
  * Detection: PowerShell stderr mentions `verb` and `Print` (case-insensitive) or `not supported`.
  * Message: tell the user to install a PDF reader that advertises the Print verb. Name examples (Microsoft Edge, Adobe Reader, Foxit) without recommending one.
* PowerShell execution-policy block
  * Detection: stderr mentions `execution policy`, `cannot be loaded`, or `disabled`.
  * Message: link to `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` guidance. Do not change the policy from inside the extension.
* User cancels the print dialog
  * Treat as a no-op. Do not call `fn.ui.showErrorMessage`. Resolve normally.

## Out of scope

* Anything inside `fileOpenPrintDialog`. Lane A owns it.
* Changing the argv shape of `filePrint`. The spec requires keeping it.
* Probing the file system from inside `OSWin`. Per spec, callers supply real paths.
* `escapePath`. Per spec.
* Localizing message strings. English only; localization is future work.

## Tests

All tests stub `execFileAsync` and `fn.ui.showErrorMessage` on the `OSWin` instance.

* New test per failure mode: simulate the matching stderr/exit code, assert that `fn.ui.showErrorMessage` is called with a substring that identifies the mode.
* New test: success path does not call `fn.ui.showErrorMessage` (covers the no-op case for cancel and for clean success).
* If a helper method is introduced, add direct unit tests for it.

## Implementation order

1. Wait for Lane A to merge into `feature/windows-print`.
2. Pull `feature/windows-print`, branch to `feature/windows-print-failure-modes`.
3. Add helper if useful, then update `filePrint` to invoke it on stderr/exit code.
4. Add the four failure-mode tests plus the success no-op test.
5. `npm test`, `npm run lint`, `npm run lint:md` all green.
6. Commit. Push with `-u`.
7. Fast-forward merge into `feature/windows-print`.
8. Open the wave PR from `feature/windows-print` to `main` titled "Windows print: real dialog + failure-mode handling".

## Done when

* All four failure modes route through `fn.ui.showErrorMessage` with mode-specific strings.
* User-cancel is a no-op.
* `tests/OSWin.test.ts` covers each failure mode.
* `npm test` green locally on macOS, CI green on `windows-latest`.
* Wave PR is open.

## Return format

Report back with:

* One bullet per deliverable above, marked done or deferred.
* Commit shas with one-line messages.
* Wave PR number and URL.
* Any deferred follow-ups and the reason.
