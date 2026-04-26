# Orchestrator: Docs Refresh Wave

**Status:** todo
**Created:** 2026-04-26
**Master orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 1 quality gate before publish)
**Blocks:** [2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>) (publish should not happen against the current dev-facing README)

## Objective

The README that the marketplace shows is the same `README.md` shipped in the VSIX, which is the same file GitHub renders on the repo landing page.
Today that file is written for contributors, not users: it leads with `docs/AGENTS.md` (a link broken in the marketplace because `docs/**` is excluded), tells visitors to `apt-get install nodejs`, and hides the actual usage in line 127 of a 409-line dev guide.
The single user-facing section is also factually wrong about keybindings and command names.
This wave fixes that and, while we are in there, brings every other piece of repo documentation into agreement with what the extension actually does as of 2026-04-26.

## Scope

* In scope
  * Rewrite `README.md` to serve marketplace users first, contributors second (with a clear pointer to dev docs).
  * Rewrite `CHANGELOG.md` 1.0.0 entry to reflect what actually shipped (correct date, accurate platform-support claims, drop "Future Roadmap" items that are now done).
  * Split developer-only content out of the root README into new `docs/CONTRIBUTING.md` (setup + build + test) and `docs/ARCHITECTURE.md` (component flow, three-library pipeline, execution paths).
  * Audit the existing `docs/AGENTS.md`, `docs/VSCodeAPIs.md`, `docs/INSTALL.md`, `docs/EXECUTION_ORDER_ANALYSIS.md`, `docs/2026-04-12_info_DeveloperGuide.md` for accuracy against current code; update or delete as needed.
  * Add a `contributes.walkthroughs` entry plus `walkthroughs/*.md` step files so first install in VS Code, Cursor, or any VSCodium fork pops a Get Started panel that teaches Alt+P.
  * Capture at least one product screenshot for the README and one short GIF for the walkthrough.
* Out of scope
  * Any change to runtime behavior. This wave is documentation and onboarding only.
  * Marketplace listing categories, gallery banner, sidebar metadata. Lane C of the publish wave already covers those.
  * Marketing copy beyond what fits a marketplace README. The polished landing page lives at `appliedmedia/ops` per the master orchestrator.

## Why this blocks publish

* Lane C of the marketplace wave was about to run `vsce publish` against a VSIX whose README would have rendered as a contributor's developer guide. First impressions on the marketplace are essentially permanent (search ranking, install velocity, rating bias). Pausing for one wave of doc work is cheap; recovering from a bad launch is not.
* The walkthrough work in Lane D is the difference between "user installs and stares at the empty editor" and "user installs and the IDE pops a panel telling them what to press". This is the standard polish bar for paid-tier marketplace presence and is genuinely cheap to add now versus retrofit later.

## Branching

* Wave branch: `feature/docs-refresh` (new, branched from the tip of `feature/marketplace-publish` so the in-flight `.vscodeignore` + `.gitignore` build fixes ride along).
* Lanes do not need their own sub-branches; they touch mostly disjoint files and can land as ordered commits on the wave branch. If two Claude sessions run in parallel, they can each take a sub-branch off the wave (`feature/docs-refresh-laneA`, etc.) and PR back into the wave.
* When the wave is done, one PR `feature/docs-refresh` → `main`. After merge, the marketplace wave's Lane C resumes by branching `feature/marketplace-publish` fresh from the new `main`.

## Lanes

* [Lane A: marketplace-facing README rewrite](<2026-04-26_plan_todo_DocsRefresh_LaneA-MarketplaceREADME.md>)
* [Lane B: CHANGELOG accuracy + format pass](<2026-04-26_plan_todo_DocsRefresh_LaneB-Changelog.md>)
* [Lane C: developer docs split + audit](<2026-04-26_plan_todo_DocsRefresh_LaneC-DevDocsSplit.md>)
* [Lane D: walkthrough Get Started experience](<2026-04-26_plan_todo_DocsRefresh_LaneD-Walkthrough.md>)
* [Lane E: verification + cross-link audit](<2026-04-26_plan_todo_DocsRefresh_LaneE-Verify.md>)

## Dependencies

* Lanes A, B, C, D are mutually independent: A rewrites root `README.md` from scratch; B rewrites `CHANGELOG.md` from scratch; C creates new `docs/CONTRIBUTING.md` + `docs/ARCHITECTURE.md` from a snapshot of the old README plus audits the existing `docs/*.md` set; D adds `walkthroughs/` + edits `.config/template.package.json` + `.vscodeignore`. The only shared file is `.vscodeignore` (Lane D adds a `!walkthroughs/**` allow-rule), so Lane D should land last among A-D or rebase the one-line `.vscodeignore` change.
* Lane E (verification) depends on A, B, C, D all complete. It rebuilds the VSIX, inspects the rendered README + walkthrough, and validates every internal link.

## Coordination

* Wave branch lives off `feature/marketplace-publish`. First commit on the wave is the planning docs themselves (this Orch + 5 lanes).
* Each lane lands as one or more commits on the wave branch with a clear `Lane X: <title>` prefix in the commit message.
* Lane E runs last and produces the green light for the wave PR.
* Wave PR to `main` should ride a CodeRabbit + ai01 pass before merge, same as every other wave.

## Done when

* `README.md` reads as a marketplace user guide; contributor content is gone or one click away in `docs/CONTRIBUTING.md`.
* `CHANGELOG.md` 1.0.0 entry is factually accurate as of publish day.
* Every file under `docs/` either reflects current code or is intentionally archival (with a header saying so).
* Fresh install in an Extension Development Host pops the Get Started walkthrough automatically.
* `npx @vscode/vsce package` produces a VSIX whose contents match the agreed file list (8 base files + walkthrough media), with no `.claude/`, no badges, no broken links.
* `markdownlint` passes on every changed `.md` file with the project's existing rules.

## File ownership snapshot

* Lane A may edit
  * `README.md`
  * `images/` (new screenshot file, e.g., `images/screenshot-preview.png`)
* Lane B may edit
  * `CHANGELOG.md`
* Lane C may edit
  * `docs/CONTRIBUTING.md` (new)
  * `docs/ARCHITECTURE.md` (new)
  * `docs/AGENTS.md` (audit)
  * `docs/VSCodeAPIs.md` (audit)
  * `docs/INSTALL.md` (audit; possibly delete or merge)
  * `docs/EXECUTION_ORDER_ANALYSIS.md` (audit; possibly merge into ARCHITECTURE)
  * `docs/2026-04-12_info_DeveloperGuide.md` (audit; possibly merge into CONTRIBUTING)
* Lane D may edit
  * `.config/template.package.json` (add `contributes.walkthroughs`)
  * `walkthroughs/` (new directory with markdown step files and media)
  * `.vscodeignore` (add `!walkthroughs/**` allow-rule)
* Lane E edits no source files. Output is the wave's verification report and any small fix-ups that surface during verify.

## After this wave merges

* The marketplace wave's [Lane C](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>) resumes from a fresh wave branch off the new `main`. The publish step there now ships a properly user-facing extension on day one.
* The master orchestrator's Phase 1 status flips: docs refresh becomes a recorded prerequisite to the publish line, not a known gap.
