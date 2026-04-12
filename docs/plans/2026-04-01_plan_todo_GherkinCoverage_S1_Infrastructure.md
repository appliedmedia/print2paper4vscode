# Swimlane 1: Infrastructure Setup

**Status:** TODO
**Created:** 2026-04-01
**Orchestrator:** `2026-04-01_plan_todo_GherkinCoverage.md`
**Master Orchestrator:** `2026-04-01_plan_todo_Orchestrator.md` (Phase 2, Stream C1)
**Branch:** `feature/gherkin-infrastructure`
**PR Target:** `main` (CodeRabbit review required)
**Blocks:** Swimlane 2 (Coverage Gaps), Swimlane 3 (Test Migration)
**Estimated Time:** 2-3 hours

---

## Objective

Install and configure `@cucumber/node` so that `.feature` files run alongside existing `node:test` tests with combined c8 coverage.

---

## Tasks

### Task 1: Install Dependencies

```bash
npm install --save-dev @cucumber/node tsx
```

**Packages:**
- `@cucumber/node` - Gherkin runner for node:test
- `tsx` - TypeScript execution (recommended by @cucumber/node docs for TS step definitions)

### Task 2: Create Directory Structure

```bash
mkdir -p features/support/steps
```

```text
features/
  support/
    world.ts          # Custom World class
    steps/
      common.ts       # Shared step definitions
  smoke.feature       # First test feature
```

### Task 3: Create Custom World

**File:** `features/support/world.ts`

The World class bridges Gherkin steps to the existing TestApp infrastructure.

```typescript
import { World } from '@cucumber/node';
import { createTestApp, mockContext, mockVSCode } from '../../out/tests/test-utils.js';
import type { TestApp } from '../../out/tests/test-utils.js';

export class P2PWorld extends World {
  app!: TestApp;
  result: any;
  error: Error | null = null;

  createApp() {
    this.app = createTestApp({ context: mockContext, vscode: mockVSCode });
    return this.app;
  }

  cleanup() {
    if (this.app) {
      this.app.done();
    }
  }
}
```

**Note:** Exact API depends on @cucumber/node's World mechanism. Verify against current docs before implementing.

### Task 4: Create First Step Definitions

**File:** `features/support/steps/common.ts`

```typescript
import { Given, When, Then } from '@cucumber/node';
import assert from 'node:assert';
import { P2PWorld } from '../world.js';

Given('a new Print2Paper application', function (this: P2PWorld) {
  this.createApp();
});

Given('the application is initialized', function (this: P2PWorld) {
  this.createApp();
  assert.ok(this.app, 'App should be created');
});

Then('the application should have {int} registered components', function (this: P2PWorld, count: number) {
  // Verify component count via registry
  assert.ok(this.app.reg, 'Registry should exist');
});

Then('no errors should occur', function (this: P2PWorld) {
  assert.strictEqual(this.error, null, `Unexpected error: ${this.error}`);
});
```

### Task 5: Create Smoke Test Feature

**File:** `features/smoke.feature`

```gherkin
Feature: Application Smoke Test
  Verify that the Print2Paper extension initializes correctly.

  Scenario: Application creates without errors
    Given a new Print2Paper application
    Then no errors should occur

  Scenario: Application has registered components
    Given the application is initialized
    Then the application should have the "pdf" component
    And the application should have the "ui" component
    And the application should have the "os" component
```

### Task 6: Update npm Scripts

**In `.config/template.package.json`:**

```json
{
  "scripts": {
    "test": "node --test 'out/tests/*.test.js'",
    "test:gherkin": "node --import @cucumber/node/bootstrap --import tsx --test 'features/**/*.feature'",
    "test:all": "node --import @cucumber/node/bootstrap --import tsx --test 'out/tests/*.test.js' 'features/**/*.feature'",
    "test:coverage": "c8 --reporter=text --reporter=html --reporter=json-summary npm run test:all",
    "test:coverage:check": "c8 --reporter=text --reporter=html --reporter=json-summary --check-coverage --lines 80 --functions 80 --branches 80 --statements 80 npm run test:all"
  }
}
```

Also regenerate root `package.json` from template after editing.

### Task 7: Verify Combined Runner

```bash
# Gherkin only
npm run test:gherkin

# Both test types in one invocation
npm run test:all

# Combined coverage
npm run test:coverage
```

**Success criteria for this task:**
- smoke.feature passes
- All 361 existing tests still pass
- c8 shows combined coverage from both test types
- Single coverage report, not two separate ones

### Task 8: Update .gitignore

Ensure `features/` is NOT in `.gitignore` (it should be committed).
Ensure generated step definition output isn't ignored unless needed.

---

## Verification Checklist

- [ ] `@cucumber/node` and `tsx` installed
- [ ] `features/support/world.ts` creates TestApp successfully
- [ ] `features/smoke.feature` runs and passes
- [ ] `npm run test:gherkin` works
- [ ] `npm run test:all` runs both .test.js and .feature files
- [ ] `npm run test:coverage` shows combined coverage
- [ ] Existing 361 tests unaffected
- [ ] Coverage % unchanged from baseline (85.18% stmts)

## Completion Signal

When all checks pass, Swimlanes 2 and 3 are unblocked.

---

## Notes

- @cucumber/node step/support file discovery is hardcoded to `features/**/*.{cjs,js,mjs,cts,mts,ts}`. Use that default path.
- If @cucumber/node's World API differs from what's shown above, adapt accordingly - the key is integrating with `createTestApp()`.
- The VS Code extension `CucumberOpen.cucumber-official` provides step autocomplete and go-to-definition for `.feature` files.
