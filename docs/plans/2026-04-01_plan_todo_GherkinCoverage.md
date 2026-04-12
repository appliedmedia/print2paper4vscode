# Gherkin Migration & Coverage Improvement - Stream C Orchestrator

**Status:** TODO
**Created:** 2026-04-01
**Priority:** High - test quality and coverage improvement
**Type:** Stream orchestrator (coordinates swimlane plans)
**Master Orchestrator:** `2026-04-01_plan_todo_Orchestrator.md` (Phase 2, Stream C)

## Branch & PR Strategy

Each swimlane is one branch → one PR → CodeRabbit review → merge to main.

| Swimlane | Branch | Blocked By |
| --- | --- | --- |
| S1 Infrastructure | `feature/gherkin-infrastructure` | Nothing |
| S2 Coverage Gaps | `feature/gherkin-coverage` | S1 merged |
| S3 Test Migration | `feature/gherkin-migration` | S1 merged |

---

## Objective

Convert the test suite from `node:test` to Gherkin `.feature` files and raise code coverage from **85% to 95%+** in a single coordinated effort.

## Current State

| Metric | Value |
| --- | --- |
| **Tests** | 361 passing (91 suites, 33 files) |
| **Runner** | `node:test` (Node.js built-in) |
| **Coverage tool** | `c8` (V8-based) |
| **Statement coverage** | 85.18% |
| **Branch coverage** | 75.41% |
| **Function coverage** | 83.18% |
| **Line coverage** | 85.18% |

### Coverage Gaps (files below 80%)

| File | Stmts | Branch | Funcs | Reason |
| --- | --- | --- | --- | --- |
| OSMac.ts | 55.04% | 100% | 41.66% | AppleScript methods untested |
| OSWin.ts | 58.82% | 100% | 33.33% | Windows stubs |
| Stylize.ts | 63.92% | 53.48% | 75% | Theme loading paths |
| OSLinux.ts | 65.78% | 100% | 33.33% | Linux stubs |
| UIMenuMgr.ts | 75.39% | 87.71% | 76% | Menu selection tracking |
| VSCodeAPIs.ts | 75.76% | 67.27% | 86.48% | Workspace/dialog wrappers |
| UI.ts | 77.94% | 75% | 87.5% | CSS generation, templates |
| PaperPrinter.ts | 79.61% | 69.09% | 97.5% | Print workflow branches |

## Target State

| Metric | Current | Target |
| --- | --- | --- |
| **Statement coverage** | 85.18% | 95%+ |
| **Branch coverage** | 75.41% | 90%+ |
| **Function coverage** | 83.18% | 95%+ |
| **Test format** | node:test (describe/it) | Gherkin .feature files |
| **Runner** | `node --test` | `node --import @cucumber/node/bootstrap --test` |
| **Step definitions** | N/A | TypeScript, reusable across features |

## Technology Choice: @cucumber/node

**Package:** `@cucumber/node` v0.6.1 (official Cucumber project)

**Why this over alternatives:**

1. **Native `node --test` integration** - `.feature` files run through the same runner as existing tests. No runner migration needed.
2. **Incremental migration** - Run both `.test.js` and `.feature` in one command. Convert file by file, no big-bang cutover.
3. **c8 works unchanged** - `c8 node --import @cucumber/node/bootstrap --test` produces combined coverage for both test types.
4. **Official Cucumber team** - Same organization behind Cucumber.js. Active development (6 releases since Feb 2025).

**Risk:** Pre-1.0.0 (API may change). Acceptable for this project size.

**Do not replace with `@cucumber/cucumber`** — this is a deliberate architectural choice to preserve the project's single-runner (`node --test`) architecture, not an oversight.

**Rejected alternatives:**

| Option | Why rejected |
| --- | --- |
| @cucumber/cucumber (classic) | Separate runner — can't coexist in same `node --test` invocation; requires separate coverage pipeline |
| QuickPickle | Requires full migration to Vitest |
| jest-cucumber | Requires Jest; step defs not reusable across features |
| @amiceli/vitest-cucumber | Requires Vitest 4.x; tiny community |

---

## Swimlane Overview

```text
                Week 1              Week 2              Week 3
Swimlane 1     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Infrastructure  Setup, first        Done
                .feature runs

Swimlane 2     ░░░░░░░░████████████████████░░░░░░░░░░░░░░░░░░
CoverageGaps              New Gherkin tests    Done
                          for uncovered code

Swimlane 3     ░░░░░░░░████████████████████████████████████████
TestMigration             Convert existing     Continue     Done
                          node:test → Gherkin  in batches
```

### Dependencies

```text
Swimlane 1 (Infrastructure)
    ├──→ Swimlane 2 (Coverage Gaps)      [blocked until S1 complete]
    └──→ Swimlane 3 (Test Migration)     [blocked until S1 complete]

Swimlane 2 ←→ Swimlane 3                [independent, run in parallel]
```

### Swimlane Files

| Swimlane | File | Summary |
| --- | --- | --- |
| 1. Infrastructure | `2026-04-01_plan_todo_GherkinCoverage_S1_Infrastructure.md` | Install @cucumber/node, create World, first .feature, npm scripts |
| 2. Coverage Gaps | `2026-04-01_plan_todo_GherkinCoverage_S2_CoverageGaps.md` | New Gherkin tests for files below 80% coverage |
| 3. Test Migration | `2026-04-01_plan_todo_GherkinCoverage_S3_TestMigration.md` | Convert existing 33 test files to .feature + step definitions |

---

## Critical Path

1. **Swimlane 1 must complete first** - everything depends on infrastructure
2. **Swimlane 2 and 3 then run in parallel** - independent batches of work
3. **Coverage verification** runs continuously after each batch

## File Structure (Target)

```text
features/
  support/
    world.ts              # Custom World with TestApp integration
    steps/
      common.ts           # Shared Given steps (app creation, mocking)
      coords.ts           # Coordinate conversion steps
      pdf.ts              # PDF generation steps
      paperprinter.ts     # Print workflow steps
      ui.ts               # UI component steps
      menu.ts             # Menu system steps
      os.ts               # OS platform steps
      persist.ts          # Persistence steps
      registry.ts         # DI registry steps
      stylize.ts          # Syntax highlighting steps
  coords.feature
  pdf.feature
  pdf-headers.feature
  paperprinter.feature
  paperprinter-zoom.feature
  ...etc
```

## npm Scripts (Target)

```json
{
  "test": "node --test 'out/tests/*.test.js'",
  "test:gherkin": "node --import @cucumber/node/bootstrap --import tsx --test 'features/**/*.feature'",
  "test:all": "node --import @cucumber/node/bootstrap --import tsx --test 'out/tests/*.test.js' 'features/**/*.feature'",
  "test:coverage": "c8 --reporter=text --reporter=html --reporter=json-summary npm run test:all"
}
```

## Success Criteria

- [ ] @cucumber/node installed and configured
- [ ] At least one .feature file runs alongside existing tests
- [ ] All existing 361 tests still pass during migration
- [ ] Statement coverage >= 95%
- [ ] Branch coverage >= 90%
- [ ] Function coverage >= 95%
- [ ] All 33 test files migrated to .feature files
- [ ] Step definitions are reusable across features
- [ ] c8 produces combined coverage report
- [ ] CI pipeline updated to run Gherkin tests

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| @cucumber/node breaking change | High | Pin version, monitor releases |
| Step definition discovery path hardcoded | Medium | Use default `features/` directory |
| Coverage regression during migration | High | Run both old and new tests until migration batch is complete |
| OS platform files can't reach 95% | Medium | Set per-file exceptions for stub files (OSWin, OSLinux) |

---

## References

- [@cucumber/node docs](https://cucumber.github.io/cucumber-node)
- [@cucumber/node GitHub](https://github.com/cucumber/cucumber-node)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [c8 coverage tool](https://github.com/bcoe/c8)
- VS Code extension: `CucumberOpen.cucumber-official` (step autocomplete, go-to-definition)
