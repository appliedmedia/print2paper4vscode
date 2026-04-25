# Master Orchestrator - Print2Paper4VSCode Roadmap

**Status:** TODO
**Created:** 2026-04-01
**Updated:** 2026-04-01
**Scope:** All active and planned work for the extension

---

## Current State (updated 2026-04-16)

* **Main branch:** 386 unit + 8 Gherkin smoke tests, 85.69% stmts
* **Coverage branch (PR #107):** 1238 tests (386 unit + 852 Gherkin), 95.03% stmts
* **Migration branch (PR pending):** 623 tests (342 unit + 281 Gherkin), Batch 1 done
* **Build:** Compiles clean, esbuild bundles to dist/
* **Published:** No: not yet on VS Code Marketplace
* **Platform:** macOS complete, Windows bugs fixed (PR #103), Linux partial (PR #105)

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

Stream D ──────►                                              [Linux Print] ✓
(Platforms)                                                    branch: feature/linux-print
                                                               merged: PR #105 + smoke test PR #110

                                                              [Windows Print] ✓
                                                               branch: feature/windows-print
                                                               merged: PR #112 (2026-04-25)

Stream E ──────►                                              [Web Presence]
(Marketing)                                                    See appliedmedia/ops

Stream F ──────►                                              [VSC Integration Tests]
(Polish)                                                       branch: feature/vsc-int-tests
                                                               PR → CR → merge
```

*Windows Print: implementation tracked by `2026-04-17_plan_done_WindowsPrint.md` (spec) and the wave orchestrator `2026-04-24_plan_done_WindowsPrintImpl_Orch.md`. Stream A (Windows Fixes, PR #103) merged, then PR #112 (real `System.Windows.Forms.PrintDialog` + `filePrint` failure-mode handling) merged on 2026-04-25 as `bc93025`. Stream D is now done.

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

* Fix 5 bugs in OSWin.ts (double-escaping, wrong DLL, backslash handling)
* Rewrite `escapePath()`, `filePrint()`, convert to `execFileAsync`
* Add unit tests for command construction (runnable on macOS)
* Add `windows-latest` to CI matrix

**PR scope:**

* `src/OSWin.ts` — rewritten
* `tests/OSWin.test.ts` — new/updated tests
* `.github/workflows/ci.yml` — add Windows matrix
* `package.json` scripts — cross-platform `compile` command

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

* `.config/template.package.json` — publisher field, metadata tweaks
* `package.json` — regenerated

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

#### C1: Infrastructure -- DONE

* **Plan:** `2026-04-01_plan_todo_GherkinCoverage_S1_Infrastructure.md`
* **Branch:** `feature/gherkin-infrastructure` (merged as PR #104)
* **Status:** DONE

#### C2: Coverage Gaps -- IN PROGRESS (95.03% stmts)

* **Plan:** `2026-04-01_plan_todo_GherkinCoverage_S2_CoverageGaps.md`
* **Branch:** `feature/gherkin-coverage`
* **PR:** #107 (open)
* **Status:** 95.03% stmts achieved (target met). 852 Gherkin tests added across 17 feature files.
* **Remaining:** Branch coverage 83.86% (target 90%), some per-file gaps in UIMenuMgr, PDF, Registry

#### C3: Test Migration -- IN PROGRESS (Batch 1 of 6)

* **Plan:** `2026-04-01_plan_todo_GherkinCoverage_S3_TestMigration.md`
* **Branch:** `feature/gherkin-migration`
* **PR:** pending creation
* **Status:** Batch 1 complete (Coords, Coords-PageLayout, Diagnostics, Yaml). 44 node:test tests replaced by 273 Gherkin scenarios.
* **Remaining:** Batches 2-6 (Persist, TabInspector, Registry, UI, PDF, PaperPrinter, OS, etc.)

---

## Phase 3: Platform Expansion (Future)

Goal: Full cross-platform support and professional polish.

### Stream D: Platform Printing

Status: done.

* **Linux Print:** done. Merged via PR #105 + smoke test PR #110. Spec: `2025-12-25_plan_todo_LinuxPrint.md`.
* **Windows Print:** done (2026-04-25). Merged via PR #112 as `bc93025`. Spec: `2026-04-17_plan_done_WindowsPrint.md`. Wave orchestrator: `2026-04-24_plan_done_WindowsPrintImpl_Orch.md` with two lanes (`LaneA-PrintDialog`, `LaneB-FailureModes`).

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

---

## PR Checklist (Every PR)

Every PR in this project must satisfy:

* [ ] **Branch:** Created from latest `main`
* [ ] **CI passes:** Compile + lint + test on ubuntu-latest (and windows-latest after Stream A)
* [ ] **Coverage:** Does not decrease from baseline (currently 85.18%)
* [ ] **CodeRabbit:** Automated review addressed — all critical/major comments resolved
* [ ] **Tests:** New/changed code has corresponding tests
* [ ] **No secrets:** No tokens, credentials, or `.env` files
* [ ] **Commit messages:** Clear, descriptive, reference plan if applicable

**Docs-only PRs:** For PRs that only change documentation files (`.md`, `.txt`, plan files), the CI, Coverage, and Tests checkboxes are automatically satisfied. CI linting for docs (e.g., `npm run lint:md`) is the only required check. Coverage and test requirements do not apply to documentation-only changes.

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
