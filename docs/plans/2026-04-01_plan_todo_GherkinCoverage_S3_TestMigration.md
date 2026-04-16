# Swimlane 3: Test Migration - node:test to Gherkin

**Status:** IN PROGRESS (Batch 1 done: Coords, Diagnostics, Yaml migrated)
**Created:** 2026-04-01
**Updated:** 2026-04-16
**Orchestrator:** `2026-04-01_plan_todo_GherkinCoverage.md`
**Master Orchestrator:** `2026-04-01_plan_todo_Orchestrator.md` (Phase 2, Stream C3)
**Branch:** `feature/gherkin-migration`
**PR:** pending creation
**Parallel with:** Swimlane 2 (Coverage Gaps)
**Estimated Time:** 10-14 hours (Batch 1 complete, Batches 2-6 remaining)

---

## Objective

Convert all 33 existing `node:test` files (~343 tests) into Gherkin `.feature` files with reusable TypeScript step definitions. Migration is incremental - old and new tests coexist until each batch is fully verified.

---

## Migration Strategy

### Per-File Process

1. Read the existing `.test.ts` file
2. Identify the behaviors being tested (describe/it blocks → Scenarios)
3. Write the `.feature` file with Gherkin scenarios
4. Write or extend step definitions in `features/support/steps/`
5. Run both old test and new feature to confirm parity
6. Delete the old `.test.ts` file once the `.feature` is green
7. Verify coverage didn't drop

### Step Definition Reuse

Step definitions should be maximally reusable:

```gherkin
# This Given step is used in 20+ features
Given a new Print2Paper application

# This Then step works for any numeric property
Then the value should be {int}

# Parameterized steps cover many cases
When I set the {string} to {string}
```

**Goal:** Fewer than 15 step definition files covering all 33 test files.

---

## Batches (grouped by shared step definitions)

### Batch 1: Pure Unit Tests (simplest, build confidence)

These tests have simple input→output patterns with minimal mocking.

| File | Tests | Scenarios | Shared Steps |
| --- | --- | --- | --- |
| Coords.test.ts | 12 | 12 | coords.ts |
| Coords-PageLayout.test.ts | 8 | 8 | coords.ts |
| Diagnostics.test.ts | 15 | 10 | diagnostics.ts |
| Yaml.test.ts | 9 | 6 | common.ts |
| Utils (via EdgeCases) | 6 | 6 | common.ts |

**Total:** ~50 tests → ~42 scenarios
**New step files:** `coords.ts`, `diagnostics.ts`
**Estimated time:** 2 hours

**Example migration:**

Before (`Coords.test.ts`):

```typescript
describe('Coords', () => {
  it('should convert CSS pixels to PDF points', () => {
    assert.strictEqual(coords.cssPxToPdfPts(96), 72);
  });
});
```

After (`features/coords.feature`):

```gherkin
Feature: Coordinate Conversion
  Coords handles CSS pixel to PDF point conversion and Y-axis transformations.

  Scenario: Convert CSS pixels to PDF points
    Given a new Print2Paper application
    When I convert 96 CSS pixels to PDF points
    Then the result should be 72

  Scenario Outline: Pixel to point conversion table
    When I convert <pixels> CSS pixels to PDF points
    Then the result should be <points>

    Examples:
      | pixels | points |
      | 96     | 72     |
      | 0      | 0      |
      | 192    | 144    |
```

### Batch 2: Data & Persistence

| File | Tests | Scenarios | Shared Steps |
| --- | --- | --- | --- |
| Persist.test.ts | 8 | 6 | persist.ts |
| TabInspector.test.ts | 10 | 8 | common.ts |
| Registry.test.ts | 14 | 10 | registry.ts |
| App-Template.test.ts | 5 | 4 | common.ts |
| Namespace-Template-Replacement.test.ts | 4 | 3 | common.ts |

**Total:** ~41 tests → ~31 scenarios
**New step files:** `persist.ts`, `registry.ts`
**Estimated time:** 2 hours

### Batch 3: UI Components

| File | Tests | Scenarios | Shared Steps |
| --- | --- | --- | --- |
| UI.test.ts | 12 | 8 | ui.ts |
| UIMenu-IconSlotTriad.test.ts | 8 | 6 | menu.ts |
| UIMenu-Management.test.ts | 10 | 8 | menu.ts |
| UIMenuMgr.test.ts | 15 | 10 | menu.ts |
| UIWebView.test.ts | 12 | 8 | ui.ts |
| MenuHidden.test.ts | 6 | 4 | menu.ts |

**Total:** ~63 tests → ~44 scenarios
**New step files:** `ui.ts`, `menu.ts`
**Estimated time:** 3 hours

### Batch 4: PDF & Printing

| File | Tests | Scenarios | Shared Steps |
| --- | --- | --- | --- |
| PDF.test.ts | 18 | 12 | pdf.ts |
| PDF-HeaderFooter.test.ts | 10 | 8 | pdf.ts |
| PDF-MarkdownRendering.test.ts | 8 | 6 | pdf.ts |
| PDF-Object-Reuse.test.ts | 6 | 4 | pdf.ts |
| DocInfo_PDF.test.ts | 12 | 8 | pdf.ts |
| DocInfo_PaperPrinter.test.ts | 8 | 6 | paperprinter.ts |

**Total:** ~62 tests → ~44 scenarios
**New step files:** `pdf.ts`, `paperprinter.ts`
**Estimated time:** 3 hours

### Batch 5: Platform & Integration

| File | Tests | Scenarios | Shared Steps |
| --- | --- | --- | --- |
| OS.test.ts | 12 | 8 | os.ts |
| OS-Platform.test.ts | 8 | 6 | os.ts |
| OSMac-AppleScript.test.ts | 6 | 4 | os.ts |
| PaperPrinter.test.ts | 18 | 12 | paperprinter.ts |
| PaperPrinter-Integration.test.ts | 10 | 8 | paperprinter.ts |
| PaperPrinter-PageSize.test.ts | 8 | 6 | paperprinter.ts |
| PaperPrinter-Zoom.test.ts | 6 | 4 | paperprinter.ts |
| Zoom-Validation.test.ts | 4 | 3 | paperprinter.ts |

**Total:** ~72 tests → ~51 scenarios
**New step files:** `os.ts` (extend from S2)
**Estimated time:** 3 hours

### Batch 6: Cross-Cutting & Remaining

| File | Tests | Scenarios | Shared Steps |
| --- | --- | --- | --- |
| Integration-Components.test.ts | 12 | 8 | common.ts |
| VSCodeAPIs.test.ts | 15 | 10 | vscodeapis.ts |
| Stylize-Themes.test.ts | 10 | 8 | stylize.ts |
| EdgeCases.test.ts | 18 | 12 | common.ts |

**Total:** ~55 tests → ~38 scenarios
**New step files:** `vscodeapis.ts`, `stylize.ts` (extend from S2)
**Estimated time:** 2 hours

---

## Totals

| Metric | Before | After |
| --- | --- | --- |
| Test files | 33 `.test.ts` | ~20 `.feature` files |
| Test count | ~343 individual tests | ~250 scenarios (Scenario Outlines consolidate repetitive cases) |
| Step def files | N/A | ~12 files in `features/support/steps/` |
| Helper files | 2 (test-utils, test-helpers) | 1 (world.ts, incorporates both) |

**Note:** Fewer scenarios than tests is expected. Gherkin `Scenario Outline` with `Examples` tables replaces many repetitive `it()` blocks. Actual behavior coverage is equivalent.

---

## Migration Rules

1. **Never delete a .test.ts file until its .feature replacement passes and coverage is equal or better**
2. **Run `npm run test:all` after every file migration** to catch regressions
3. **Commit after each batch** - one batch = one commit
4. **Step definitions must be reusable** - if a step only works for one feature, refactor it
5. **Keep Gherkin business-readable** - implementation details go in step definitions, not feature files
6. **Preserve test intent** - some `it()` blocks test the same behavior from different angles. Consolidate into one Scenario with multiple Then assertions rather than losing coverage.

---

## Cleanup After Migration Complete

Once all batches are done:

1. Delete `tests/*.test.ts` files (all migrated)
2. Keep `tests/test-utils.ts` and `tests/test-helpers.ts` (used by World class)
3. Update npm scripts: remove `test` (old), rename `test:all` → `test`
4. Update CI workflow to use new test command
5. Update `tsconfig.json` if test output directory changes
6. Update `.vscodeignore` if test exclusion patterns change

---

## Verification Per Batch

```bash
# After migrating each batch:

# 1. Run only new features
npm run test:gherkin

# 2. Run everything together
npm run test:all

# 3. Check coverage hasn't dropped
npm run test:coverage

# 4. Compare to baseline
# Baseline: 85.18% stmts, 75.41% branch, 83.18% funcs
```
