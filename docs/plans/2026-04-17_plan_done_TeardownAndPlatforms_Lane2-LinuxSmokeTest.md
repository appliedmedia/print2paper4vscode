# Lane 2: Linux Print Smoke Test

**Status:** done
**Created:** 2026-04-17
**Completed:** 2026-04-20 via [PR #110](https://github.com/appliedmedia/print2paper4vscode/pull/110)
**Branch:** `feature/linux-smoke-test` (new, branched from `main`)
**Related merged PR:** [#105](https://github.com/appliedmedia/print2paper4vscode/pull/105)
**Orchestrator:** [2026-04-17_plan_done_TeardownAndPlatforms_Orch.md](<2026-04-17_plan_done_TeardownAndPlatforms_Orch.md>)

## Objective

Add an automated smoke test that exercises the Linux printing path shipped in PR #105 without requiring a real printer, and wire it into CI on `ubuntu-latest`.

## Current state (post PR #105)

* `src/OSLinux.ts` implements `fileOpenPrintDialog` (viewer iteration with `which` probe, fallback to `fileOpenInDefaultApp`), `filePrint` (CUPS `lp` with ENOENT -> friendly error), `fileReveal`, and `getDir_Documents`.
* No Linux-specific test file exists in the repo.
* No CI matrix entry exercises the Linux print path.

## File list

* `tests/OSLinux.test.ts` (new)
* `.github/workflows/ci.yml` (add smoke test step gated to `ubuntu-latest`)
* `README.md` (add one line under platform support confirming the smoke test is in place)

## Work items

### 1. Unit smoke test

* Create `tests/OSLinux.test.ts` using the existing `node:test` harness.
* Tests must run on any platform; skip body on non-Linux with a `console.log('skipping')` and early return.
* Cover four cases.
  * `fileOpenPrintDialog` returns without throwing when at least one viewer is present. Stub `execFileAsync` via a registry/fn swap so no real process is spawned.
  * `fileOpenPrintDialog` falls back to `fileOpenInDefaultApp` when every viewer probe fails.
  * `filePrint` rethrows a friendly CUPS error when `execFileAsync` throws `ENOENT`.
  * `getDir_Documents` returns a non-empty string (no spawn assertion needed).

### 2. CI integration

* In `.github/workflows/ci.yml`, add a step that runs only on `runs-on: ubuntu-latest` and executes `npm test -- --test-name-pattern OSLinux`.
* Do not add new CUPS system packages to the runner; the smoke test uses stubs and must not require CUPS.

### 3. Documentation

* In `README.md`, under the Linux platform row, add a single note: "Smoke test exercises viewer selection and CUPS error paths in CI."

## Verification

* `npm test` is green locally (macOS).
* Tests are listed and pass on `ubuntu-latest` in the PR's CI run.
* Tests are listed and skip on `macos-latest` and `windows-latest`.

## PR

* Title: "Add Linux print smoke test"
* Base: `main`

## Out of scope

* Any test that requires a live CUPS server, a real printer, or a graphical session.
* Integration tests that spawn real viewer processes.

## Return format

* Smoke test names added, one per bullet.
* CI run URL.
* PR number.
