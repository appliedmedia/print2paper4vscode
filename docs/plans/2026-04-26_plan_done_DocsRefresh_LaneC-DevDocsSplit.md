# Lane C: Repo README accuracy fixes + dev docs audit

**Status:** done (shipped via PR #115, 2026-04-28; with explicit deferral of `docs/VSCodeAPIs.md` deep audit)
**Created:** 2026-04-26
**Updated:** 2026-04-28
**Parent orchestrator:** [2026-04-26_plan_done_DocsRefresh_Orch.md](<2026-04-26_plan_done_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh` (merged)
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
  * [x] `docs/AGENTS.md`: not present in the repo (deleted by PR #104 long before this wave). The original Lane C plan referenced it from a stale memory; no work to do
  * [ ] `docs/VSCodeAPIs.md`: deferred deep audit (62 KB file). Leave for a follow-up commit
  * [x] `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md` owned by Lanes A and B; not touched by this lane
* Cross-link sweep
  * [x] `README.md` references resolve on disk after the documentation-section rewrite (no more dead `docs/plans/2025-12-11_plan_inProgress_CICD.md` link, no more dead `docs/INSTALL.md` link)
  * [x] `CONTRIBUTING.md` updated to drop reference to deleted `docs/INSTALL.md`; now points to the README's Quick Start section and includes a "Packaging the extension locally" section that documents the marketplace `--readme-path` / `--changelog-path` flags
  * [ ] Full cross-link audit of all surviving `docs/*.md` files deferred to Lane E (verification)

## Acceptance

* Repo `README.md` is factually accurate as of 2026-04-26: real keybinding, real command names, no broken "Quick Links", honest platform support status, current or generic test/coverage numbers.
* Repo `README.md` includes a short pointer telling readers where the marketplace user docs live (`docs/MARKETPLACE.md`).
* `docs/VSCodeAPIs.md` deep-audit is **deferred** to a follow-up commit (the workitems explicitly defer it; this lane only owns README / INSTALL / EXECUTION_ORDER_ANALYSIS / info_DeveloperGuide). `docs/AGENTS.md` is not present (deleted by PR #104).
* `docs/INSTALL.md`, `docs/EXECUTION_ORDER_ANALYSIS.md`, `docs/2026-04-12_info_DeveloperGuide.md` are either updated, merged, or deleted via `git rm`, with no orphaned stale files left.
* `markdownlint` passes on every changed `.md` file.

## Notes

* The audit subtasks (AGENTS, VSCodeAPIs, INSTALL, EXECUTION_ORDER_ANALYSIS, info_DeveloperGuide) can each take 5 to 30 minutes depending on how stale they are. If acoven wants to time-box, do the README accuracy fixes first (those are user-visible on GitHub) and treat the audits as a follow-up commit.
* Use `git mv` not bare `mv` for any rename. Use `git rm` not bare `rm` for any deletion.
* Repo `README.md` may end up larger than `docs/MARKETPLACE.md` because the developer audience genuinely needs more detail. That is fine. The two files have different audiences and different sizes are correct.

## Closeout (2026-04-28, PR #115)

Shipped as part of the docs refresh wave merged via `63940fe`:

* Repo `README.md` factual fixes landed:
  * Real `p2p4vsc.print2paper` (Alt+P) and `p2p4vsc.persistClear` commands; dropped the `Cmd+Shift+P` / "Print Selection" / "Print Current Tab" misclaims.
  * Dropped "macOS only" Known Limitations entry.
  * Rewrote Platform Support to reflect PR #112 (Windows) + PRs #105 + #110 (Linux).
  * Replaced Linux-only `apt-get` Quick Start with cross-platform Node.js install.
  * Dropped dead `docs/INSTALL.md` and `docs/plans/2025-12-11_plan_inProgress_CICD.md` links; added pointers to `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md`.
* `docs/INSTALL.md` and `docs/EXECUTION_ORDER_ANALYSIS.md` deleted via `git rm` (cited stale "35 tests / 6 suites" and the old `print2paper4vscode.printDoc` command, respectively).
* `docs/2026-04-12_info_DeveloperGuide.md` updated with archival header and significant content refresh (358 lines changed), called out that the project structure listing predates `OSLinux.ts` and the "macOS optimized" framing predates Windows/Linux shipping.
* `CONTRIBUTING.md` no longer references the deleted `docs/INSTALL.md`; now points to README Quick Start and includes a "Packaging the extension locally" section documenting the `--readme-path` / `--changelog-path` flags.

Deferred to follow-up commits (not blockers for marketplace publish):

* `docs/VSCodeAPIs.md` deep audit (62 KB file). Surfaced as a known limitation in the wave Orch closeout.
* Full cross-link audit of all surviving `docs/*.md` files belongs to Lane E (verification).

Out of scope after the fact:

* `docs/AGENTS.md` was already deleted by PR #104 long before this wave. The original plan workitem was based on a stale memory and is closed as not-applicable.
