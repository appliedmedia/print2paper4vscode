# Master Orchestrator - Print2Paper4VSCode Roadmap

**Status:** TODO
**Created:** 2026-04-01
**Updated:** 2026-05-04
**Scope:** All active and planned work for the extension

---

## Current State (updated 2026-05-04)

* **Main branch:** ~95% statement coverage (per repo CHANGELOG); 349 unit tests, 345 passing, 4 skipped (Gherkin scenarios from coverage replay PR #109). TS target/lib bumped to ES2023 via PR #116 (2026-05-01). HEAD: `4c012ff`
* **Build:** Compiles clean, esbuild bundles to `dist/extension.js`; `.vscodeignore` excludes `.claude/` + `.cursor/`; `*.vsix` no longer tracked in git
* **Published:** No: not yet on VS Code Marketplace. MarketplacePublishImpl Lane C is the only remaining gate; all code and docs prerequisites are merged
* **Platform:** macOS / Windows (PR #112) / Linux (PRs #105 + #110) all shipped
* **Docs:** Marketplace-only README at `docs/MARKETPLACE.md` and changelog at `docs/MARKETPLACE_CHANGELOG.md` (both use bare-URL form per vsce link-rewriter constraint); repo `README.md` and `CHANGELOG.md` are dev-facing; `CONTRIBUTING.md` documents `--readme-path` / `--changelog-path` flags. Walkthrough Get Started panel shipped via PR #119 (7 steps, one per toolbar menu); Lane E verify completed 2026-05-01 via PR #117

## Recent merges since 2026-05-01

* **PR #117** (2026-05-01, `f97ce45`): DocsRefresh Lane E verify; corrected `.vscodeignore` exceptions, fixed broken `docs/AGENTS.md` references, confirmed VSIX integrity (8 files, 2 MB)
* **PR #118** (zoom-and-print-fixes, `a90e32a`): added 300% zoom level + clamp to 3.0; refocus existing webview panel on Alt+P reuse; UIMenu gutter-after spacing; lookupUserKeybinding refactor (single-regex text-grep replacing JSON.parse, with trailing-comma tolerance)
* **PR #119** (2026-05-03, `ce42f16`): marketplace screenshots + walkthrough; 7 toolbar PNGs in `assets/p2p4vsc-screenshots/`; `contributes.walkthroughs` block in `.config/template.package.json`; MARKETPLACE.md "Toolbar tour" section + real hero image. Closes DocsRefresh Lane D
* **PR #120** (2026-05-03, `4c012ff`): About-menu shortcut detection when user rebinds + unbinds default; lookupUserKeybinding split into one-step-per-line form for readability

## Queued out-of-band quality work (not on a roadmap stream)

* [DynamicMenuItemValue](<2026-05-03_plan_todo_DynamicMenuItemValue.md>): lazy on-menu-open refresh of menu item values that drift between toolbar render and the user looking. Today the only producer is the About > Shortcut row (PR #120 made the resolver correct on every call but the toolbar still bakes the value at render time). Plan exists, no code yet, no branch yet. Not a publish blocker

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
| **Wave orchestrator** | `2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md` |
| **Branch** | `feature/marketplace-publish` (Lane A merged via PR #113; Lane B ticked on `main` via `a74ffa3`; Lane C pending) |
| **Blocked by** | DocsRefresh wave Lanes A/B/C (shipped 2026-04-28 via PR #115) — **now unblocked** |
| **Estimate** | 30-45 min manual steps + small PR |

**Status (2026-04-28):**

* Lane A (package audit + VSIX dry run) merged via PR #113 (`4c913c2`).
* Lane B (publisher + PAT setup) ticked off by acoven via `a74ffa3` ("Lane B closeout: publisher + PAT setup done").
* DocsRefresh quality gate shipped via PR #115 (`63940fe`). Marketplace listing will now ship `docs/MARKETPLACE.md` + `docs/MARKETPLACE_CHANGELOG.md` instead of the dev-facing root README.
* Lane C (`vsce publish` + verify listing) is **next**. Resolve `TODO(date)` + `TODO(release-tag)` in `CHANGELOG.md` and `docs/MARKETPLACE_CHANGELOG.md` immediately before publish.

**Done when:** Extension searchable and installable from VS Code Marketplace.

### Stream B-Quality: Docs Refresh (publish prerequisite)

| Field | Value |
| --- | --- |
| **Wave orchestrator** | `2026-04-26_plan_done_DocsRefresh_Orch.md` |
| **Branch** | `feature/docs-refresh` (merged 2026-04-28) |
| **Status** | All lanes done. A/B/C via PR #115; E via PR #117 (2026-05-01); D via PR #119 (2026-05-03) with redesigned 7-step shape |

**Why this exists:** Without it, `vsce publish` would have shipped the contributor-facing repo `README.md` as the marketplace listing (broken `docs/AGENTS.md` reference, `apt-get install nodejs` instructions, wrong keybinding claims). Lane C of Stream B was paused for one wave of docs work to avoid a permanent first-impression problem on the marketplace.

**What shipped (PR #115, 2026-04-28, `63940fe`):**

* Lane A: marketplace-only README at `docs/MARKETPLACE.md`, wired via `--readme-path` flag.
* Lane B: marketplace-only changelog at `docs/MARKETPLACE_CHANGELOG.md`, wired via `--changelog-path` flag; repo `CHANGELOG.md` factual fixes (date placeholder, platform-support claims, test-count line, Future Roadmap trim).
* Lane C: repo `README.md` factual fixes (real commands, real keybinding, dropped macOS-only contradictions); `docs/INSTALL.md` and `docs/EXECUTION_ORDER_ANALYSIS.md` removed; `CONTRIBUTING.md` updated.
* Ride-along: `UIMenuShortcutFxn_t` resolver type + dynamic isHidden resolver, JSONC state-machine parser, brace-counting `extractObjectBody` helper. Surfaced during the ai01 PR review and merged in the same wave.

**What remains:**

* Nothing. [Lane D](<2026-04-26_plan_done_DocsRefresh_LaneD-Walkthrough.md>) shipped via PR #119 (2026-05-03) with a redesigned 7-step shape (one step per toolbar menu, PNG screenshots inline in `.config/template.package.json` instead of the original 4-step `walkthroughs/*.md` design). EDH auto-open smoke test is owed by acoven on first marketplace install (deferred to MarketplacePublish Lane C).

**Lane E verify (done 2026-05-01):**

* VSIX integrity confirmed: 8 files, 2 MB; marketplace docs ship correctly via `--readme-path` / `--changelog-path`.
* `.vscodeignore` corrected: added `!docs/MARKETPLACE.md` / `!docs/MARKETPLACE_CHANGELOG.md` exceptions, removed `!README.md` / `!CHANGELOG.md` exceptions to avoid case-insensitive collision with vsce's lowercase output.
* Marketplace docs converted from `[Title](<url>)` to bare-URL form because vsce's link-rewriter mangles the angle-bracket form into broken nested URLs.
* Broken `docs/AGENTS.md` references replaced in `README.md`, `CONTRIBUTING.md`, and `docs/2026-04-12_info_DeveloperGuide.md` (file deleted by PR #104; references were stale).
* `npm test` passing (345/0/4); markdownlint clean on all user-facing docs.
* EDH walkthrough smoke test deferred until Lane D ships. `TODO(date)` / `TODO(release-tag)` placeholders deferred until publish day.
* See [Lane E plan](<2026-04-26_plan_done_DocsRefresh_LaneE-Verify.md>) for the full completion record.

---

## Phase 2: Quality & Coverage

Goal: Convert test suite to Gherkin and raise coverage from 85% to 95%+.

### Stream C: Gherkin Migration & Coverage

| Field | Value |
| --- | --- |
| **Orchestrator** | `2026-04-01_plan_todo_GherkinCoverage.md` |
| **Blocked by** | Nothing (can start in parallel with Phase 1) |

Three sequential/parallel branches:

#### C1: Infrastructure: DONE

* **Plan:** `2026-04-01_plan_todo_GherkinCoverage_S1_Infrastructure.md`
* **Branch:** `feature/gherkin-infrastructure` (merged as PR #104)
* **Status:** DONE

#### C2: Coverage Gaps: IN PROGRESS (95.03% stmts)

* **Plan:** `2026-04-01_plan_todo_GherkinCoverage_S2_CoverageGaps.md`
* **Branch:** `feature/gherkin-coverage`
* **PR:** #107 (open)
* **Status:** 95.03% stmts achieved (target met). 852 Gherkin tests added across 17 feature files.
* **Remaining:** Branch coverage 83.86% (target 90%), some per-file gaps in UIMenuMgr, PDF, Registry

#### C3: Test Migration: IN PROGRESS (Batch 1 of 6)

* **Plan:** `2026-04-01_plan_todo_GherkinCoverage_S3_TestMigration.md`
* **Branch:** `feature/gherkin-migration`
* **PR:** pending creation
* **Status:** Batch 1 complete (Coords, Coords-PageLayout, Diagnostics, Yaml). 44 node:test tests replaced by 273 Gherkin scenarios.
* **Remaining:** Batches 2-6 (Persist, TabInspector, Registry, UI, PDF, PaperPrinter, OS, etc.)

---

## Phase 3: Platform Expansion (Future)

Goal: Full cross-platform support and professional polish.

### Stream D: Platform Printing: DONE

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
| 2026-04-26 | Split marketplace docs from repo docs | Repo `README.md` and `CHANGELOG.md` stay developer-facing; marketplace gets dedicated `docs/MARKETPLACE.md` + `docs/MARKETPLACE_CHANGELOG.md` shipped via `vsce publish --readme-path` / `--changelog-path`. Different audiences, different sizes. See memory `feedback_marketplace_readme_split.md`. |

---

## How to Use This Document

1. **Starting work?** Find your stream, read its plan file, create the branch.
2. **Checking dependencies?** Look at the stream map — don't start blocked streams.
3. **Done with a PR?** Update the stream status here after merge.
4. **Adding work?** Add a new stream section, create its plan file, link it here.
