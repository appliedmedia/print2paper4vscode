# Orchestrator: Marketplace Publish Wave

**Status:** todo
**Created:** 2026-04-25
**Spec:** [2026-04-01_plan_todo_MarketplacePublish.md](<2026-04-01_plan_todo_MarketplacePublish.md>)
**Stale prereq:** [2025-12-11_plan_done_PackageJsonMetadata.md](<2025-12-11_plan_done_PackageJsonMetadata.md>)
**Master orchestrator:** [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>) (Phase 1 Stream B)

## Objective

Take Print2Paper4VSCode from "builds locally" to "live on the VS Code Marketplace under publisher `appliedmedia`". The spec recipe is already written; this wave splits the recipe into lanes by who can execute each step (automated vs manual) so Claude work and acoven work can run in parallel.

## Why three lanes

* Lane A is purely automated work in the repo. Claude can finish it without external accounts.
* Lane B is a sequence of one-time human-only setup steps (Azure DevOps org, PAT, publisher account, GitHub secret). Claude has no credentials and no browser session to drive these. Only acoven can do them.
* Lane C is the joint publish + verify step. It can only run after both Lane A (clean VSIX) and Lane B (PAT + publisher exist) are done.

## Scope

* In scope
  * Audit `.config/template.package.json` against marketplace requirements.
  * Audit `dist/` build pipeline (`bash scripts/prepublish.sh`) for publish readiness.
  * `npx @vscode/vsce package` dry run + remediate any validation failure.
  * README marketplace-readiness pass (no Yeoman boilerplate, no non-HTTPS images, no SVG icons).
  * Add or confirm `icon.png` (128x128 PNG) and wire it into the template.
  * Supersede the stale 2025-12-11 PackageJsonMetadata plan once Lane A confirms reality.
  * Document the manual setup steps (Lane B) in a checklist acoven can tick.
* Out of scope
  * Any code change to runtime behavior. The wave is publish-readiness only; functional changes belong to Phase 3.
  * `publish.yml` workflow rewrite. Existing workflow already supports `VSCE_PAT`; do not touch unless Lane A surfaces a blocker.

## Branching

* Wave branch: `feature/marketplace-publish` (new, branched from `main` after PR #112 merges).
* Lane A branch: `feature/marketplace-publish-audit` (off the wave branch).
* Lane B has no branch. It is acoven-only manual work tracked by the lane's checklist.
* Lane C operates on the wave branch directly (one or two final commits: version bump if any, marketplace listing tweaks).

## Dependencies

* Lane A depends on PR #112 merging into `main` (wave branch must fork from a clean main).
* Lane B depends on nothing in this repo. acoven can start it any time, in parallel with Lane A.
* Lane C is gated on both Lane A merge and Lane B checklist complete.

## Lanes

* [Lane A: package audit + VSIX dry run](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneA-PackageAudit.md>)
* [Lane B: publisher + PAT setup, acoven manual](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneB-PublisherSetup.md>)
* [Lane C: publish + verify](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>)

## Coordination

* Lane A merges into `feature/marketplace-publish` first via PR to `main`. CodeRabbit reviews. After merge, the wave branch is the new `main`.
* Lane B is signed off by acoven flipping its checklist items in the lane plan and committing the update on `main` (or as part of Lane C).
* Lane C runs only after both predecessors are done. Failure in Lane C (e.g., 403 from vsce) routes back to Lane B, not Lane A.

## Done when

* Extension is visible at `https://marketplace.visualstudio.com/items?itemName=appliedmedia.print2paper4vscode`.
* Installing it from the marketplace (not VSIX) works on a fresh VS Code install.
* `VSCE_PAT` is configured as a GitHub Actions secret so future releases can publish via `publish.yml`.
* The 2025-12-11 PackageJsonMetadata plan is renamed `done` (or `superseded`) with a pointer to this wave.

## File ownership snapshot

* Lane A may edit
  * `.config/template.package.json`
  * `scripts/generate-package-json.mjs` (only if a marketplace field is missing from the template)
  * `README.md` and any image references it ships with
  * `icon.png` (new file at repo root)
  * Any `docs/plans/2025-12-11_plan_*` rename (status flip from todo to done/superseded)
* Lane B edits no source files. Output is checkbox state in the Lane B plan and a recorded PAT in acoven's password manager.
* Lane C edits at most a version bump in `template.package.json`, the master orchestrator's "Published" line, and the `MEMORY.md` project-overview pointer.
