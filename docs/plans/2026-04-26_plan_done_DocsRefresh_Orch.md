# Orchestrator: Docs Refresh Wave

**Status:** in-progress (Lanes A/B/C shipped; Lanes D/E remain)
**Created:** 2026-04-26
**Updated:** 2026-04-28
**Master orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 1 quality gate before publish)
**Blocks:** [2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>) (publish should not happen against the current dev-facing README)
**Shipped via:** PR #115 (`63940fe`, merged 2026-04-28) — Lanes A, B, C plus a ride-along UIMenu dynamic shortcut/isHidden resolver refactor

## Objective

Today, `vsce publish` would ship the repo-root `README.md` and `CHANGELOG.md` as the marketplace listing.
Those files are written for contributors: leading with `docs/AGENTS.md` (a link broken in the marketplace because `docs/**` is excluded), telling visitors to `apt-get install nodejs`, hiding usage in line 127 of a 409-line dev guide.
The single user-facing section is also factually wrong about keybindings and command names.

This wave keeps the repo `README.md` and `CHANGELOG.md` as the developer / contributor surface they have always been (with factual fixes), and adds a separate marketplace-only pair at `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md` that `vsce publish` ships via `--readme-path` and `--changelog-path` flags. While we are in the docs anyway, bring every other piece of repo documentation into agreement with what the extension actually does as of 2026-04-26.

See memory `feedback_marketplace_readme_split.md` for the convention this wave codifies.

## Scope

* In scope
  * Create `docs/MARKETPLACE.md`: marketplace-audience README (what does it do, what do I press, what does it look like).
  * Create `docs/MARKETPLACE_CHANGELOG.md`: marketplace-audience changelog.
  * Wire `vsce publish` (and any local manual `vsce package` invocation) to use `--readme-path docs/MARKETPLACE.md --changelog-path docs/MARKETPLACE_CHANGELOG.md`.
  * Apply factual accuracy fixes to repo-root `README.md` (correct keybindings, command names, dead Quick Links, stale platform-support claims) and `CHANGELOG.md` (correct date, correct platform-support claims, replace stale test count, trim Future Roadmap).
  * Audit the existing `docs/AGENTS.md`, `docs/VSCodeAPIs.md`, `docs/INSTALL.md`, `docs/EXECUTION_ORDER_ANALYSIS.md`, `docs/2026-04-12_info_DeveloperGuide.md` for accuracy against current code; update or delete as needed.
  * Add a `contributes.walkthroughs` entry plus `walkthroughs/*.md` step files so first install in VS Code, Cursor, or any VSCodium fork pops a Get Started panel that teaches Alt+P.
  * Capture at least one product screenshot for the marketplace README and one short GIF for the walkthrough.
* Out of scope
  * Any change to runtime behavior. This wave is documentation and onboarding only.
  * Splitting the repo `README.md` into multiple files. The repo README stays whole as the developer entry point.
  * Marketplace listing categories, gallery banner, sidebar metadata. Lane C of the publish wave already covers those.
  * Marketing copy beyond what fits a marketplace README. The polished landing page lives at `appliedmedia/ops` per the master orchestrator.

## Why this blocks publish

* Lane C of the marketplace wave was about to run `vsce publish` against a VSIX whose README would have rendered as a contributor's developer guide. First impressions on the marketplace are essentially permanent (search ranking, install velocity, rating bias). Pausing for one wave of doc work is cheap; recovering from a bad launch is not.
* The walkthrough work in Lane D is the difference between "user installs and stares at the empty editor" and "user installs and the IDE pops a panel telling them what to press". This is the standard polish bar for paid-tier marketplace presence and is genuinely cheap to add now versus retrofit later.

## Branching

* Wave branch: `feature/docs-refresh` (already created off `feature/marketplace-publish` so the in-flight `.vscodeignore` + `.gitignore` build fixes ride along).
* Lanes do not need their own sub-branches; they touch mostly disjoint files and can land as ordered commits on the wave branch.
* When the wave is done, one PR `feature/docs-refresh` → `main`. After merge, the marketplace wave's Lane C resumes by branching `feature/marketplace-publish` fresh from the new `main`.

## Lanes

* [Lane A: marketplace-facing README (separate file)](<2026-04-26_plan_done_DocsRefresh_LaneA-MarketplaceREADME.md>) — done (PR #115)
* [Lane B: marketplace CHANGELOG (separate file) + repo CHANGELOG accuracy](<2026-04-26_plan_done_DocsRefresh_LaneB-Changelog.md>) — done (PR #115)
* [Lane C: repo README accuracy fixes + dev docs audit](<2026-04-26_plan_done_DocsRefresh_LaneC-DevDocsSplit.md>) — done (PR #115)
* [Lane D: walkthrough Get Started experience](<2026-04-26_plan_todo_DocsRefresh_LaneD-Walkthrough.md>) — todo
* [Lane E: verification + cross-link audit](<2026-04-26_plan_done_DocsRefresh_LaneE-Verify.md>) — done (2026-05-01)

## Dependencies

* Lanes A, B, C, D are mutually independent.
  * A creates `docs/MARKETPLACE.md` + screenshot + publish.yml `--readme-path` flag.
  * B creates `docs/MARKETPLACE_CHANGELOG.md` + publish.yml `--changelog-path` flag + accuracy fixes to repo `CHANGELOG.md`.
  * C applies accuracy fixes to repo `README.md` + audits `docs/*.md`.
  * D adds `walkthroughs/` + edits `.config/template.package.json` + `.vscodeignore`.
  * The only shared file is `.github/workflows/publish.yml` (Lanes A and B both add a flag); land them as separate commits or coordinate the edit.
* Lane E (verification) depends on A, B, C, D all complete. It rebuilds the VSIX, inspects the rendered README + walkthrough, and validates every internal link.

## Coordination

* Wave branch lives off `feature/marketplace-publish`. First commit on the wave is the planning docs themselves (this Orch + 5 lanes).
* Each lane lands as one or more commits on the wave branch with a clear `Lane X: <title>` prefix in the commit message.
* Lane E runs last and produces the green light for the wave PR.
* Wave PR to `main` should ride a CodeRabbit + ai01 pass before merge, same as every other wave.

## Done when

* `docs/MARKETPLACE.md` reads as a marketplace user guide; `docs/MARKETPLACE_CHANGELOG.md` reads as a user-facing changelog; both are wired through `vsce publish` flags.
* Repo `README.md` and `CHANGELOG.md` are factually accurate as of 2026-04-26 (keybindings, command names, platform support, test count) and remain the developer / contributor surface on GitHub.
* Every file under `docs/` either reflects current code or is intentionally archival (with a header saying so).
* Fresh install in an Extension Development Host pops the Get Started walkthrough automatically.
* `npx @vscode/vsce package --readme-path docs/MARKETPLACE.md --changelog-path docs/MARKETPLACE_CHANGELOG.md` produces a VSIX whose contents match the agreed file list (8 base files + walkthrough media), with no `.claude/`, no badges, no broken links.
* `markdownlint` passes on every changed `.md` file with the project's existing rules.

## File ownership snapshot

* Lane A may edit
  * `docs/MARKETPLACE.md` (new)
  * `images/` (new screenshot file, e.g., `images/screenshot-preview.png`)
  * `.github/workflows/publish.yml` (add `--readme-path docs/MARKETPLACE.md` to the `vsce publish` line)
* Lane B may edit
  * `docs/MARKETPLACE_CHANGELOG.md` (new)
  * `CHANGELOG.md` (factual fixes; file stays as developer-facing)
  * `.github/workflows/publish.yml` (add `--changelog-path docs/MARKETPLACE_CHANGELOG.md` to the `vsce publish` line)
* Lane C may edit
  * `README.md` (factual fixes; file stays as developer-facing)
  * `docs/AGENTS.md` (audit)
  * `docs/VSCodeAPIs.md` (audit)
  * `docs/INSTALL.md` (audit; possibly delete or merge)
  * `docs/EXECUTION_ORDER_ANALYSIS.md` (audit; possibly merge)
  * `docs/2026-04-12_info_DeveloperGuide.md` (audit)
* Lane D may edit
  * `.config/template.package.json` (add `contributes.walkthroughs`)
  * `walkthroughs/` (new directory with markdown step files and media)
  * `.vscodeignore` (add `!walkthroughs/**` allow-rule)
* Lane E edits no source files. Output is the wave's verification report and any small fix-ups that surface during verify.

## After this wave merges

* The marketplace wave's [Lane C](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>) resumes from a fresh wave branch off the new `main`. The publish step there now ships a properly user-facing extension on day one (via `--readme-path` and `--changelog-path` to the marketplace-only files).
* The master orchestrator's Phase 1 status flips: docs refresh becomes a recorded prerequisite to the publish line, not a known gap.

## Recovery note (2026-04-26)

* Initial Lane A draft incorrectly rewrote `README.md` itself into a marketplace README (commit `0605098`), instead of creating a separate marketplace file. acoven flagged it; the work was reverted and redone correctly: repo `README.md` restored to its dev-facing 409-line form, marketplace content moved to `docs/MARKETPLACE.md`, `--readme-path` flag wired in `publish.yml`. Memory `feedback_marketplace_readme_split.md` captures the convention so this does not repeat.

## Shipped via PR #115 (2026-04-28)

PR `feature/docs-refresh` → `main` merged as commit `63940fe`. What landed:

* Lane A: `docs/MARKETPLACE.md` (80 lines), `--readme-path docs/MARKETPLACE.md` wired in `.github/workflows/publish.yml`. Hero screenshot remains a placeholder; acoven's actual capture follows as a fix-up commit when convenient. See [Lane A](<2026-04-26_plan_done_DocsRefresh_LaneA-MarketplaceREADME.md>).
* Lane B: `docs/MARKETPLACE_CHANGELOG.md` (39 lines) with `TODO(date)` placeholder, `--changelog-path` wired, repo `CHANGELOG.md` factual fixes (date, platform-support claims, test-count line, Future Roadmap trim), `CONTRIBUTING.md` updated with packaging instructions. See [Lane B](<2026-04-26_plan_done_DocsRefresh_LaneB-Changelog.md>).
* Lane C: repo `README.md` factual fixes (real `p2p4vsc.print2paper` / Alt+P, dropped macOS-only contradictions, dropped dead `docs/INSTALL.md` and `docs/plans/2025-12-11_plan_inProgress_CICD.md` links), `docs/INSTALL.md` and `docs/EXECUTION_ORDER_ANALYSIS.md` deleted via `git rm`, `docs/2026-04-12_info_DeveloperGuide.md` updated with archival header. `docs/VSCodeAPIs.md` deep audit deferred. See [Lane C](<2026-04-26_plan_done_DocsRefresh_LaneC-DevDocsSplit.md>).
* Ride-along (UIMenu dynamic shortcut + isHidden resolvers, plus parser cleanups):
  * `UIMenuShortcutFxn_t` resolver type added; `UIMenuMgr.getShortcutOfMenuItemIdForMenuId` and `UIMenu` gutter detection now resolve function shortcuts type-safely.
  * `VSCodeAPIs.formatKeybindingForDisplay` is chord-aware (whitespace-separated chord groups).
  * `scripts/generate-package-json.mjs` uses a brace-counting `extractObjectBody` helper instead of regex; JSONC parser uses a string-aware state machine.
  * Surfaced during the ai01 PR review and merged in the same wave. See memory `feedback_uimenu_resolver_generalization.md` for the next round of cleanup.

## Remaining

* [Lane D](<2026-04-26_plan_todo_DocsRefresh_LaneD-Walkthrough.md>) (walkthroughs) was not part of PR #115. It can land as its own PR off `main` whenever capacity exists. Lane D is the only remaining DocsRefresh work item.

## Lane E completion (2026-05-01)

[Lane E](<2026-04-26_plan_done_DocsRefresh_LaneE-Verify.md>) ran on a fresh `feature/docs-refresh-verify-lane-e` branch off `main`. It surfaced and fixed:

* Three vsce packaging traps: `.vscodeignore` exceptions for the marketplace pair; removal of root README/CHANGELOG exceptions to avoid case-insensitive collision; conversion of `[Title](<url>)` to bare-URL form in marketplace docs since vsce mangles the angle-bracket form.
* Three broken `docs/AGENTS.md` references in user-facing docs.

EDH walkthrough smoke test was deferred until Lane D ships; `TODO(date)` / `TODO(release-tag)` placeholders were deferred to publish day.
