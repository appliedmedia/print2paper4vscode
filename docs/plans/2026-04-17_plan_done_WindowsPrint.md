# Windows Printing Implementation Plan

**Status:** done
**Created:** 2026-04-17
**Picked up:** 2026-04-24
**Closed:** 2026-04-25
**Supersedes:** `2025-12-25_plan_todo_WinPrint.md` (deleted in the same PR that introduces this file)
**Related merged PR:** [#103 Windows Fixes](<https://github.com/appliedmedia/print2paper4vscode/pull/103>)
**Implementation PR:** [#112 Windows print: real dialog + failure-mode handling](<https://github.com/appliedmedia/print2paper4vscode/pull/112>)
**Master orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 3 Stream D)
**Wave orchestrator:** [2026-04-24_plan_done_WindowsPrintImpl_Orch.md](<2026-04-24_plan_done_WindowsPrintImpl_Orch.md>)

## Closure note (2026-04-25)

Implementation landed in PR #112 (squash-merged as `bc93025` on `main`). Both spec lanes shipped: Lane A rewrote `fileOpenPrintDialog` as a real `System.Windows.Forms.PrintDialog` (PowerShell-invoked); Lane B added explicit failure-mode handling to `filePrint` via a new `mapPowerShellErrorToMessage` helper covering the four spec'd modes (no default printer, Print verb unsupported, execution policy block, user cancel). 348 unit tests pass; CI green on `ubuntu-latest` and `windows-latest`; CodeRabbit clean after one ai01 pass.

## Objective

Finish Windows printing support in `src/OSWin.ts` so that the extension can ship on `windows-latest` with the same behavioral contract as `OSMac.ts`. PR #103 resolved the five correctness bugs flagged in the original `2025-12-25_plan_todo_WinPrint.md`; what remains is a real print-dialog path, error-path handling, and expanded unit coverage. This plan is scoped so an engineer can pick it up cold from `main`.

## Current state

Audit of `src/OSWin.ts` as of commit `204b4d6` on `main` (post PR #103).

* `escapePath(path)`
  * **Status:** implemented.
  * Escapes `"` to `""`, `%` to `%%`, and strips `\r` / `\n`. Intentionally does not escape `\` because it is not a cmd.exe metacharacter inside double quotes. This method is kept for any future code path that still needs a cmd.exe-safe string; none of the four Print2Paper entry points currently consume it because PR #103 converted them to `execFileAsync` (argv-based, no shell).
* `fileOpenInDefaultApp(path)`
  * **Status:** implemented.
  * Uses `execFileAsync('cmd', ['/c', 'start', '""', path])`. Passes the path as a separate argv element, so spaces and special characters are handled by Windows itself rather than by a shell. Covered by unit tests in `tests/OSWin.test.ts`.
* `fileReveal(path)`
  * **Status:** implemented.
  * Uses `execFileAsync('explorer.exe', ['/select,' + path])`. Concatenation with `/select,` is required because `explorer.exe` parses the switch and path as a single argument. Covered by unit tests.
* `filePrint(path)`
  * **Status:** implemented (happy path only).
  * Uses `execFileAsync('powershell', [...])` with `-NoProfile -NonInteractive -Command` and a `Start-Process -FilePath '<path>' -Verb Print` script body. Single quotes inside the path are doubled so the PowerShell string literal stays well-formed.
  * The command succeeds when a default PDF handler and default printer are configured, but it does not surface actionable error messages for the common failure modes: no default printer, Print verb not supported by the associated handler, PowerShell execution-policy blocks, user cancellation.
  * Covered by happy-path and shell-escaping unit tests; no failure-mode tests yet.
* `fileOpenPrintDialog(path)`
  * **Status:** needs rewrite.
  * Current body delegates to `fileOpenInDefaultApp`, which opens the PDF in the default viewer and relies on the user to invoke Print from the viewer UI. This is a stub in everything but name. A real implementation must invoke a programmatic print flow. Covered by a single delegation test that must be replaced when the method is rewritten.
* `getDir_Documents()`
  * **Status:** implemented, non-print.
  * Out of scope for this plan; mentioned only so the file-level audit is complete.
* `getOSKeys()` and `done()`
  * **Status:** implemented, non-print.
  * Out of scope for this plan.

## Deliverables

All deliverables land in a single PR on branch `feature/windows-print` with base `main`.

* Print dialog
  * Rewrite `fileOpenPrintDialog(path)` so it triggers a real print dialog rather than just opening the default viewer. Preferred approach is `Start-Process -Verb PrintTo` with a printer-selection UI, or a PowerShell one-liner that instantiates `System.Windows.Forms.PrintDialog` and on OK calls `Start-Process -Verb Print`. Both approaches must be invoked via `execFileAsync('powershell', [...])`; no shell interpolation.
  * Document the chosen approach in a block comment on the method so the next maintainer does not reintroduce the `fileOpenInDefaultApp` delegation.
* Direct print
  * Keep the existing `filePrint(path)` argv shape. Add explicit handling for the common failure modes listed in the audit so the user sees a message through `fn.ui.showErrorMessage` rather than a raw PowerShell stderr blob.
  * Treat PowerShell exit codes and `stderr` strings as the source of truth for failure. Do not probe for `fs.existsSync` from inside `OSWin`; callers are responsible for supplying a real path.
* Error paths
  * No default printer: surface a friendly message that names the Settings page the user needs to visit.
  * Print verb not supported by the associated handler: surface a message telling the user to install a PDF reader that advertises the Print verb (Edge, Adobe Reader, Foxit).
  * PowerShell execution-policy block: surface a message linking to `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` guidance. Do not change the policy from inside the extension.
  * User cancels the print dialog: treat as a no-op, not an error.
* Tests
  * Extend `tests/OSWin.test.ts` with unit tests for the rewritten `fileOpenPrintDialog` (argv shape, PowerShell command string, single-quote escaping).
  * Add unit tests for each of the four error paths above. Tests assert the `fn.ui.showErrorMessage` contract, not the underlying Windows behavior.
  * Delete the `fileOpenPrintDialog` delegation test; it is load-bearing on the current stub and will mislead the next reader.
  * Keep all new tests hermetic: stub `execFileAsync` and `fn.ui.showErrorMessage`; do not shell out.

## Implementation order

1. Snapshot `tests/OSWin.test.ts` coverage and capture the current passing test list.
2. Rewrite `fileOpenPrintDialog` with the chosen PowerShell approach. Land tests alongside.
3. Add failure-mode handling to `filePrint` and `fileOpenPrintDialog`. Land failure-mode tests alongside.
4. Delete the legacy `fileOpenPrintDialog` delegation test.
5. Run `npm test` locally on macOS (unit-only; argv assertions are platform-agnostic).
6. Push the branch and let CI exercise the same tests on `windows-latest`.

## Test strategy

* Unit-only. Do not add integration tests that shell out to real `powershell.exe` or `explorer.exe`.
* All new tests stub `execFileAsync` on the `OSWin` instance and assert the recorded `(file, args)` tuples. This matches the pattern already in `tests/OSWin.test.ts`.
* CI must exercise the suite on `windows-latest` in addition to `ubuntu-latest`. PR #103 already added the Windows matrix; this plan inherits that.
* Coverage must not regress from the current `main` baseline (85.69% stmts on `main`, 95.03% stmts on the PR #107 coverage branch). Add enough tests that the rewritten methods stay inside the project coverage gate.
* Do not add Gherkin scenarios for this work. Stream C (Gherkin Migration) owns the test-format decision for `OSWin`; this plan contributes node:test cases so Stream C can migrate them as part of its normal migration batches.

## Success criteria

* `src/OSWin.ts` has no methods annotated as stubs, best-effort delegations, or "rely on user" behavior.
* `fileOpenPrintDialog` produces a programmatic print flow that does not require the user to click Print inside a viewer window.
* Each failure mode listed in "Error paths" has a dedicated unit test and a user-visible message routed through `fn.ui.showErrorMessage`.
* `npm test` is green locally on macOS and on `windows-latest` in CI.
* `npm run lint` and `npm run lint:md` pass with zero warnings.
* No regressions in `OSMac` or `OSLinux` test files.

## Out of scope

* Linux printing. Tracked separately in [2025-12-25_plan_todo_LinuxPrint.md](<2025-12-25_plan_todo_LinuxPrint.md>).
* Printer-selection UI beyond what `PrintDialog` or `Start-Process -Verb PrintTo` offers out of the box. Custom dialogs, copy-count UX, and orientation pickers are future work.
* Changes to `escapePath`. PR #103 intentionally left it in place for future cmd.exe consumers; do not remove or rewrite it as part of this plan.
* Marketplace publish steps. Tracked in [2026-04-01_plan_todo_MarketplacePublish.md](<2026-04-01_plan_todo_MarketplacePublish.md>).
* Migrating `tests/OSWin.test.ts` to Gherkin. Owned by Stream C.
