# Lane C: Developer docs split + audit

**Status:** todo
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh` (or sub-branch `feature/docs-refresh-laneC`)
**Owner:** Claude
**Blocked by:** none (Lane A and Lane C can run in parallel; Lane C reads the *old* README before Lane A's commit lands, so timing matters only if both want to share a sub-branch)

## Goal

Two responsibilities:

1. Pull developer-only content out of the soon-to-be-rewritten root README and put it where it belongs: `docs/CONTRIBUTING.md` for setup / build / test, and `docs/ARCHITECTURE.md` for the three-library pipeline + execution flow diagrams.
2. Audit the four existing `docs/*.md` files for accuracy against current code as of 2026-04-26, and either update, merge, or delete each.

After this lane, `docs/` should be a coherent set of files with no stale claims and no overlap.

## Workitems

* Snapshot the old README
  * [ ] Before Lane A's commit lands (or by reading the file at HEAD on `feature/docs-refresh` if Lane A has not yet started), identify the sections to migrate:
    * `## Quick Start` → into `docs/CONTRIBUTING.md` (rewritten to strip the `apt-get install nodejs` Linux-specific lines and generalize for macOS / Windows / Linux)
    * `## Installation` (the "Local Development Installation" subsection) → into `docs/CONTRIBUTING.md`
    * `### Prerequisites` → into `docs/CONTRIBUTING.md`
    * `## Development`, `## Testing`, `## Debugging Notes` → into `docs/CONTRIBUTING.md`
    * `## How It Actually Works`, `## Technical Implementation`, `## Execution Flow Architecture`, `## Architecture Overview` → into `docs/ARCHITECTURE.md`
    * `## Current Status`, `### Working Components`, `### Known Limitations` → drop entirely (the README's new Platform Support and Known Limitations sections, plus CHANGELOG, cover the user-facing equivalents; the dev-facing "Working Components" list is what `docs/ARCHITECTURE.md` exists for)
    * `## Future Improvements` → drop (Lane B's CHANGELOG decision covers roadmap)
    * `## Documentation` → drop (the new README has its own Contributing section that points to `docs/`)
* Create `docs/CONTRIBUTING.md`
  * [ ] H1: Contributing to Print2Paper4VSCode
  * [ ] Sections: Prerequisites, Setup, Build, Test, Run in dev host, Submitting changes, Code style
  * [ ] All commands cross-platform where possible; flag platform-specific installs (e.g., GitHub CLI on Linux uses apt; on macOS use `brew install gh`; on Windows use `winget install GitHub.cli`)
  * [ ] Reference real npm scripts from `.config/template.package.json` not from any old `package.json` snapshot
  * [ ] Link to `docs/ARCHITECTURE.md` for "want to understand the codebase?"
* Create `docs/ARCHITECTURE.md`
  * [ ] H1: Print2Paper4VSCode Architecture
  * [ ] Sections: Three-library pipeline (Shiki + jsPDF + PDF.js), Activation flow, Print command path, Component responsibilities, State management, Diagnostics, Test architecture
  * [ ] Re-use the existing ASCII flow diagrams from the old README (they are accurate; they just do not belong on the marketplace listing)
  * [ ] Verify file paths in diagrams against current code (e.g., `src/-entrypoint.ts` should still exist; component class names should match)
* Audit `docs/AGENTS.md`
  * [ ] Read end-to-end; flag any reference to deleted files, renamed classes, or pre-Phase-2 architecture
  * [ ] Verify it still matches what the project asks of AI agents (npm test scope, coverage scope, linter rules, plan doc naming)
  * [ ] Update or leave; do not delete (it is the canonical AI / agent context)
* Audit `docs/VSCodeAPIs.md`
  * [ ] Cross-reference against current `src/VSCodeAPIs.ts` (or wherever the wrapper lives) for accuracy
  * [ ] Update API surface descriptions if they have drifted
  * [ ] If the file overlaps with `docs/ARCHITECTURE.md`, either merge into ARCHITECTURE or keep separate with clear scoping headers
* Audit `docs/INSTALL.md`
  * [ ] Read; decide one of: (a) it is end-user install instructions, in which case delete because the marketplace listing covers that; (b) it is dev install instructions, in which case merge into `docs/CONTRIBUTING.md` and delete; (c) it is something else worth keeping, in which case update for accuracy
* Audit `docs/EXECUTION_ORDER_ANALYSIS.md`
  * [ ] Read; this looks like an architecture / flow analysis. Most likely outcome: merge into `docs/ARCHITECTURE.md` and delete the standalone file
* Audit `docs/2026-04-12_info_DeveloperGuide.md`
  * [ ] Read; this is a dated info doc. Decide: (a) merge salvageable parts into `docs/CONTRIBUTING.md` and delete, (b) keep as a snapshot with a header noting "as of 2026-04-12" if archival
* Cross-link sweep
  * [ ] Every file under `docs/` that survives this lane should link to its peers via `[Title](<relative-path>)` so a reader can navigate without going back to the README
  * [ ] No file under `docs/` should link to `docs/plans/*` (those are working docs, not reference docs); planning links live only inside `docs/plans/`

## Acceptance

* `docs/CONTRIBUTING.md` exists, runs cleanly through `markdownlint`, and is sufficient for a new contributor to clone + build + test on macOS, Windows, or Linux.
* `docs/ARCHITECTURE.md` exists, runs cleanly through `markdownlint`, and accurately describes the current three-library pipeline + activation + print command flow.
* `docs/AGENTS.md`, `docs/VSCodeAPIs.md` are accurate as of 2026-04-26 (or any inaccuracy is fixed).
* `docs/INSTALL.md`, `docs/EXECUTION_ORDER_ANALYSIS.md`, `docs/2026-04-12_info_DeveloperGuide.md` are either updated, merged, or deleted via `git rm`, with no orphaned stale files left.
* The new root README's "Contributing" pointer link to `docs/CONTRIBUTING.md` resolves.

## Notes

* The audit subtasks (AGENTS, VSCodeAPIs, INSTALL, EXECUTION_ORDER_ANALYSIS, info_DeveloperGuide) can each take 5 to 30 minutes depending on how stale they are. If acoven wants to time-box, do CONTRIBUTING + ARCHITECTURE first (those unblock the README's pointer link) and treat the audits as a follow-up commit.
* Use `git mv` not bare `mv` for any rename or merge that ends with deletion of an old file. Use `git rm` not bare `rm` for any deletion.
