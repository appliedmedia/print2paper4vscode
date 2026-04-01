# Master Orchestrator - Print2Paper4VSCode Roadmap

**Status:** TODO
**Created:** 2026-04-01
**Updated:** 2026-04-01
**Scope:** All active and planned work for the extension

---

## Current State (2026-04-01)

| Metric | Value |
| --- | --- |
| Branch | `main` at 870d7b5 |
| Tests | 361 passing (91 suites) |
| Coverage | 85.18% stmts, 75.41% branch |
| Build | Compiles clean, esbuild bundles to dist/ |
| Published | No - not yet on VS Code Marketplace |
| Platform | macOS complete, Windows has 5 bugs, Linux stubs only |

---

## Work Streams

All work is done on **feature branches** with **PRs to main**. Every PR goes through **CodeRabbit automated review**. No merges without passing CI + CodeRabbit approval.

### Branch & PR Workflow

```text
For each work stream:

1. git checkout -b feature/<stream-name> main
2. Implement changes, commit incrementally
3. Push: git push -u origin feature/<stream-name>
4. Create PR: gh pr create --base main
5. CodeRabbit reviews automatically
6. Address review comments
7. CI passes (compile, lint, test, coverage)
8. Merge PR
9. Delete branch
```

---

## Stream Map

```text
                      PHASE 1                    PHASE 2                PHASE 3
                   (Unblock publish)         (Quality & coverage)    (Platform expansion)
                   ──────────────────        ────────────────────    ──────────────────────

Stream A ──────►   [Windows Fixes]
(Critical bugs)    branch: feature/windows-fixes
                   PR → CodeRabbit → merge
                          │
                          ▼
Stream B ──────►   [Marketplace Publish]
(Go live)          Manual steps (account setup)
                   + branch: feature/marketplace-prep
                   PR → CodeRabbit → merge
                   Then: vsce publish
                                               │
Stream C ──────►                          [Gherkin Infra]
(Test quality)                             branch: feature/gherkin-infrastructure
                                           PR → CodeRabbit → merge
                                                  │
                                          ┌───────┴────────┐
                                          ▼                ▼
                                   [Gherkin Coverage] [Gherkin Migration]
                                   branch: feature/   branch: feature/
                                   gherkin-coverage    gherkin-migration
                                   PR → CR → merge     PR → CR → merge
                                          │                │
                                          └───────┬────────┘
                                                  ▼
                                          Coverage ≥ 95%

Stream D ──────►                                              [Linux Print]
(Platforms)                                                    branch: feature/linux-print
                                                               PR → CR → merge

                                                              [Windows Print]*
                                                               branch: feature/windows-print
                                                               PR → CR → merge

Stream E ──────►                                              [Web Presence]
(Marketing)                                                    See appliedmedia/ops

Stream F ──────►                                              [VSC Integration Tests]
(Polish)                                                       branch: feature/vsc-int-tests
                                                               PR → CR → merge
```

*Windows Print (from Dec 2025 plan) is superseded by Windows Fixes — the bugs must be fixed before adding new print features.

---

## Phase 1: Unblock Publish (Priority: NOW)

Goal: Fix critical bugs and get the extension on the VS Code Marketplace.

### Stream A: Windows Fixes

| Field | Value |
| --- | --- |
| **Plan** | `2026-04-01_plan_todo_WindowsFixes.md` |
| **Branch** | `feature/windows-fixes` |
| **Blocks** | Stream B (Marketplace Publish) |
| **Estimate** | 3-4 hours |

**What:**
- Fix 5 bugs in OSWin.ts (double-escaping, wrong DLL, backslash handling)
- Rewrite `escapePath()`, `filePrint()`, convert to `execFileAsync`
- Add unit tests for command construction (runnable on macOS)
- Add `windows-latest` to CI matrix

**PR scope:**
- `src/OSWin.ts` — rewritten
- `tests/OSWin.test.ts` — new/updated tests
- `.github/workflows/ci.yml` — add Windows matrix
- `package.json` scripts — cross-platform `compile` command

**Done when:** Tests pass on both ubuntu-latest and windows-latest in CI.

### Stream B: Marketplace Publish

| Field | Value |
| --- | --- |
| **Plan** | `2026-04-01_plan_todo_MarketplacePublish.md` |
| **Branch** | `feature/marketplace-prep` (for any code changes) |
| **Blocked by** | Stream A (Windows Fixes) |
| **Estimate** | 30-45 min manual steps + small PR |

**What:**
1. Create Azure DevOps org + PAT (manual)
2. Create publisher "appliedmedia" on marketplace (manual)
3. Verify `package.json` publisher field matches
4. Build, package, test VSIX locally
5. `vsce publish`
6. Add `VSCE_PAT` secret to GitHub repo
7. Verify extension live on marketplace

**PR scope (if needed):**
- `.config/template.package.json` — publisher field, metadata tweaks
- `package.json` — regenerated

**Done when:** Extension searchable and installable from VS Code Marketplace.

---

## Phase 2: Quality & Coverage

Goal: Convert test suite to Gherkin and raise coverage from 85% to 95%+.

### Stream C: Gherkin Migration & Coverage

| Field | Value |
| --- | --- |
| **Orchestrator** | `2026-04-01_plan_todo_GherkinCoverage.md` |
| **Blocked by** | Nothing (can start in parallel with Phase 1) |

Three sequential/parallel branches:

#### C1: Infrastructure

| Field | Value |
| --- | --- |
| **Plan** | `2026-04-01_plan_todo_GherkinCoverage_S1_Infrastructure.md` |
| **Branch** | `feature/gherkin-infrastructure` |
| **Blocks** | C2, C3 |
| **Estimate** | 2-3 hours |

**PR scope:**
- `package.json` — new devDeps (@cucumber/node, tsx), new scripts
- `features/support/world.ts` — World class
- `features/support/steps/common.ts` — shared steps
- `features/smoke.feature` — first feature file

#### C2: Coverage Gaps

| Field | Value |
| --- | --- |
| **Plan** | `2026-04-01_plan_todo_GherkinCoverage_S2_CoverageGaps.md` |
| **Branch** | `feature/gherkin-coverage` |
| **Blocked by** | C1 |
| **Parallel with** | C3 |
| **Estimate** | 6-8 hours |

**PR scope:**
- `features/*.feature` — new feature files for 7 coverage gap batches
- `features/support/steps/*.ts` — step definitions
- Coverage delta: 85% → 95%+

#### C3: Test Migration

| Field | Value |
| --- | --- |
| **Plan** | `2026-04-01_plan_todo_GherkinCoverage_S3_TestMigration.md` |
| **Branch** | `feature/gherkin-migration` |
| **Blocked by** | C1 |
| **Parallel with** | C2 |
| **Estimate** | 10-14 hours |

**PR scope:**
- `features/*.feature` — converted feature files
- `features/support/steps/*.ts` — step definitions
- Deleted: `tests/*.test.ts` (replaced by features)
- Updated: npm scripts, CI workflow

---

## Phase 3: Platform Expansion (Future)

Goal: Full cross-platform support and professional polish.

### Stream D: Platform Printing

| Stream | Plan | Branch | Blocked by | Estimate |
| --- | --- | --- | --- | --- |
| Linux Print | `2025-12-25_plan_todo_LinuxPrint.md` | `feature/linux-print` | Nothing | 4-6 hours |
| Windows Print | `2025-12-25_plan_todo_WinPrint.md` | `feature/windows-print` | Stream A | 4-6 hours |

### Stream E: Web Presence

| Field | Value |
| --- | --- |
| **Plan** | `2025-12-12_plan_todo_WebPresence.md` |
| **Location** | Cross-org, see `appliedmedia/ops` |
| **Blocked by** | Stream B (need marketplace URL first) |

### Stream F: VS Code Integration Tests

| Field | Value |
| --- | --- |
| **Plan** | `2025-12-25_plan_todo_VSCIntTests.md` |
| **Branch** | `feature/vsc-int-tests` |
| **Priority** | Low |
| **Estimate** | 4-6 hours |

---

## Completed Plans (Reference)

| Date | Plan | What |
| --- | --- | --- |
| 2025-11-27 | NamespaceFixes | Template system with `{{ns}}` tokens |
| 2025-11-29 | NamedParamsRefactor | `args: { ... }` pattern, dx.require() |
| 2025-12-07 | Registry | DI with Registry pattern |
| 2025-12-09 | MarkdownPrint | Dual-mode markdown rendering |
| 2025-12-11 | CICD | GitHub Actions ci.yml + publish.yml |
| 2025-12-16 | MenuHidden | Menu visibility by language ID |

---

## Superseded Plans

| Plan | Superseded by | Reason |
| --- | --- | --- |
| `PackageJsonMetadata.md` | MarketplacePublish | Metadata already applied; remaining work folded into publish recipe |
| `PrepareForDeploy.md` | This orchestrator | Deployment readiness tracked here now |
| `WinPrint.md` (partially) | WindowsFixes | Must fix existing bugs before adding features |

---

## PR Checklist (Every PR)

Every PR in this project must satisfy:

- [ ] **Branch:** Created from latest `main`
- [ ] **CI passes:** Compile + lint + test on ubuntu-latest (and windows-latest after Stream A)
- [ ] **Coverage:** Does not decrease from baseline (currently 85.18%)
- [ ] **CodeRabbit:** Automated review addressed — all critical/major comments resolved
- [ ] **Tests:** New/changed code has corresponding tests
- [ ] **No secrets:** No tokens, credentials, or `.env` files
- [ ] **Commit messages:** Clear, descriptive, reference plan if applicable

---

## Decision Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-04-01 | Use `@cucumber/node` for Gherkin | Native `node --test` integration, incremental migration, c8 works unchanged |
| 2026-04-01 | One branch per swimlane | Fewer PRs, coherent CodeRabbit reviews per work stream |
| 2026-04-01 | Fix Windows bugs before publishing | Don't ship known-broken platform code |
| 2026-04-01 | Publish as "appliedmedia" | Organization publisher on VS Code Marketplace |

---

## How to Use This Document

1. **Starting work?** Find your stream, read its plan file, create the branch.
2. **Checking dependencies?** Look at the stream map — don't start blocked streams.
3. **Done with a PR?** Update the stream status here after merge.
4. **Adding work?** Add a new stream section, create its plan file, link it here.
