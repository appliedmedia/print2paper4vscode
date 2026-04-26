# Lane C: Repo README accuracy fixes + dev docs audit

**Status:** in-progress
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh`
**Owner:** Claude
**Blocked by:** none

## Goal

The repo `README.md` stays as the developer / contributor entry point on GitHub. Two responsibilities for this lane:

1. Fix the factual inaccuracies in the repo `README.md` (wrong keybinding claims, wrong command names, dead "Quick Links" pointing at relocated docs, claims about platform support that are now stale).
2. Audit the existing `docs/*.md` files for accuracy against current code as of 2026-04-26 and either update, merge, or delete each.

After this lane, `README.md` plus the `docs/` set should be a coherent, accurate developer-facing surface. Lane A handles the separate marketplace README at `docs/MARKETPLACE.md`; Lane C does NOT extract content out of `README.md` because the repo README is staying.

## Workitems

* Repo `README.md` factual fixes (developer audience)
  * [x] Quick Links: dropped reference to non-existent `docs/plans/2025-12-11_plan_inProgress_CICD.md`; added pointer to `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md` so contributors know where the marketplace files live
  * [x] Platform Support: rewrote "Windows & Linux (Planned)" section to reflect shipped reality (PR #112 for Windows, PRs #105 + #110 for Linux)
  * [x] Quick Start: replaced Linux-only `apt-get` commands with cross-platform Node.js install guidance
  * [x] Using the Extension: rewrote completely. Old version cited non-existent commands ("Print Selection", "Print Current Tab") and wrong shortcuts (`Cmd+Shift+P` is the Command Palette, not a print command). New version cites real `p2p4vsc.print2paper` (Alt+P) and `p2p4vsc.persistClear` commands
  * [x] Known Limitations: dropped "Print commands currently optimized for macOS only" (false); kept Font Support and Preview Tabs
  * [x] Documentation section: dropped broken `docs/plans/2025-12-11_plan_inProgress_CICD.md` link; dropped link to deleted `docs/INSTALL.md`; added marketplace file pointers
  * [x] Future Improvements: dropped "Cross-platform support (Windows/Linux)" (shipped)
* `docs/` audit
  * [x] `docs/INSTALL.md`: deleted via `git rm`. Cited stale "35 tests / 6 suites" and a non-existent "Capture Preview Content" command. End-user install lives on the marketplace; dev install lives in the README's Quick Start
  * [x] `docs/EXECUTION_ORDER_ANALYSIS.md`: deleted via `git rm`. Postmortem from a specific bug fix; cited the old `print2paper4vscode.printDoc` command (real is `p2p4vsc.print2paper`); not reference documentation
  * [x] `docs/2026-04-12_info_DeveloperGuide.md`: kept with archival header noting it is a 2026-04-12 snapshot; called out that the project structure listing predates `OSLinux.ts` and the "macOS optimized" framing predates Windows/Linux shipping
  * [ ] `docs/AGENTS.md`: deferred deep audit (large file; canonical AI / agent context). Leave for a follow-up commit
  * [ ] `docs/VSCodeAPIs.md`: deferred deep audit (62 KB file). Leave for a follow-up commit
  * [x] `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md` owned by Lanes A and B; not touched by this lane
* Cross-link sweep
  * [x] `README.md` references resolve on disk after the documentation-section rewrite (no more dead `docs/plans/2025-12-11_plan_inProgress_CICD.md` link, no more dead `docs/INSTALL.md` link)
  * [x] `CONTRIBUTING.md` updated to drop reference to deleted `docs/INSTALL.md`; now points to the README's Quick Start section and includes a "Packaging the extension locally" section that documents the marketplace `--readme-path` / `--changelog-path` flags
  * [ ] Full cross-link audit of all surviving `docs/*.md` files deferred to Lane E (verification)

## Acceptance

* Repo `README.md` is factually accurate as of 2026-04-26: real keybinding, real command names, no broken "Quick Links", honest platform support status, current or generic test/coverage numbers.
* Repo `README.md` includes a short pointer telling readers where the marketplace user docs live (`docs/MARKETPLACE.md`).
* `docs/AGENTS.md` and `docs/VSCodeAPIs.md` are accurate as of 2026-04-26 (or any inaccuracy is fixed).
* `docs/INSTALL.md`, `docs/EXECUTION_ORDER_ANALYSIS.md`, `docs/2026-04-12_info_DeveloperGuide.md` are either updated, merged, or deleted via `git rm`, with no orphaned stale files left.
* `markdownlint` passes on every changed `.md` file.

## Notes

* The audit subtasks (AGENTS, VSCodeAPIs, INSTALL, EXECUTION_ORDER_ANALYSIS, info_DeveloperGuide) can each take 5 to 30 minutes depending on how stale they are. If acoven wants to time-box, do the README accuracy fixes first (those are user-visible on GitHub) and treat the audits as a follow-up commit.
* Use `git mv` not bare `mv` for any rename. Use `git rm` not bare `rm` for any deletion.
* Repo `README.md` may end up larger than `docs/MARKETPLACE.md` because the developer audience genuinely needs more detail. That is fine. The two files have different audiences and different sizes are correct.
