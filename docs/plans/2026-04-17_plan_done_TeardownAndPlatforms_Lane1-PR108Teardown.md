# Lane 1: PR #108 Deferred Teardown Fixes

**Status:** done
**Created:** 2026-04-17
**Closed:** 2026-04-20
**Branch:** `feature/gherkin-migration`
**PR:** [#108](<https://github.com/appliedmedia/print2paper4vscode/pull/108>)
**Orchestrator:** [2026-04-17_plan_todo_TeardownAndPlatforms_Orch.md](<2026-04-17_plan_todo_TeardownAndPlatforms_Orch.md>)

## Objective

Apply the three teardown fixes that the first ai01 pass identified as legitimate but deferred.

## File list

* `features/support/steps/diagnostics.ts`
* `features/support/steps/yaml.ts`
* `features/support/world.ts` (only if a global After hook is added there)

## Work items

### 1. Diagnostics After hook

* Problem: `startCapture` patches `console.log`. If a scenario throws between `startCapture` and `stopCapture`, `console.log` stays patched and leaks into the next scenario.
* Fix: Register an `After` hook (either in `diagnostics.ts` or colocated in `world.ts`) that restores `console.log` from `world.originalLog` if it is still captured, and nulls the field so subsequent scenarios start clean.
* Accept: Run the diagnostics feature with a forced throw in a scenario and verify the next scenario's output is not suppressed.

### 2. Yaml tempDir cleanup

* Problem: Each Given step creates a `tempDir` under `os.tmpdir()` but nothing removes it. Repeated local runs leak dirs.
* Fix: Register an `After` hook in `yaml.ts` that, if `world.tempDir` is set and exists, calls `fs.rmSync(world.tempDir, { recursive: true, force: true })`, then clears the field.
* Accept: After a full `npm run test:gherkin` run, `ls $TMPDIR/yaml-test-*` returns nothing.

### 3. Yaml dot-path guard

* Problem: The step "the YAML result should have nested key {string} equal to {string}" walks `dotPath.split('.')` without checking that intermediates are objects. On a missing segment it throws `TypeError: Cannot read properties of undefined (reading '...')` instead of a readable assertion failure.
* Fix: Walk one key at a time. On any non-object intermediate or missing key, call `assert.fail` with a message like "Expected nested path \"a.b.c\" to exist but hit undefined at segment \"b\"".
* Accept: Construct a feature scenario that asserts a nonexistent nested key and confirm the failure message names the missing segment.

## Verification

* `npm test` (the unit suite) passes.
* `npm run test:gherkin` passes and does not leak `yaml-test-*` temp dirs.
* No changes to `src/` or other step files.

## Commits

Three small commits, one per work item, pushed to `feature/gherkin-migration`. Do not squash locally; let the PR merge do that.

## Return format

* Item, short sha, one-line message.
* Confirmation that `npm test` and `npm run test:gherkin` are green.
* Anything discovered along the way that justifies a follow-up plan.

## Outcome

All three deferred teardown fixes shipped inside PR [#108](<https://github.com/appliedmedia/print2paper4vscode/pull/108>) before merge. The squash-merge commit that introduced them on `main` is `e4ea318` ("Migrate Batch 1 unit tests to Gherkin (Coords, Diagnostics, Yaml) (#108)"). No follow-up branch or PR was opened.

* Diagnostics After hook: landed at `features/support/steps/diagnostics.ts:38-45`. The hook calls `stopCapture(world)` only when `world.originalLog` is still set, restoring `console.log` and clearing the field, then resets `Diagnostics` global state.
* Yaml tempDir cleanup: landed at `features/support/steps/yaml.ts:138-144`. The After hook removes `world.tempDir` recursively when it exists and clears the field.
* Yaml dot-path guard: landed at `features/support/steps/yaml.ts:114-125`. The walker advances one segment at a time and calls `assert.fail` with a message naming the missing segment when an intermediate is non-object, null, or undefined.

`world.ts` was not modified; the hooks were colocated in `diagnostics.ts` and `yaml.ts`, which the plan permitted.
