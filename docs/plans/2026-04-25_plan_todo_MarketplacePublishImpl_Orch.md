# Orchestrator: Marketplace Publish Wave

**Status:** in-progress (Lane A merged via PR #113, Lane B closed via `a74ffa3`, DocsRefresh quality gate shipped via PR #115; Lane C kicked off 2026-05-08)
**Created:** 2026-04-25
**Updated:** 2026-05-08

## Decision log (newest first)

* 2026-05-08: Patched `publish.yml` release-trigger path to strip leading `v` from tag names (`VERSION="${VERSION#v}"`). Reason: previous decision-log entry noted vsce rejects raw `v1.0.0`; this patch makes the release-trigger path work for v1.0.1+. `workflow_dispatch` inputs and bare `patch`/`minor`/`major` are unaffected since the strip is a no-op when there's no leading `v`. Companion to 2026-05-08 publish-path decision below.
* 2026-05-08: Lane C kicked off. Publish date set to **2026-05-08**, version stays **1.0.0** (no bump; package.json already at 1.0.0). Plan: ship a placeholder-fix PR first (TODO date/release-tag markers in `CHANGELOG.md` and `docs/MARKETPLACE_CHANGELOG.md`), then publish.
* 2026-05-08: Publish path chosen: **manual `workflow_dispatch` of `publish.yml` with version input `1.0.0`**, NOT the release-trigger path. Reason: line 69 of `publish.yml` runs `vsce publish ${VERSION}` and on a release event `VERSION` becomes the raw tag name `v1.0.0`, which vsce rejects (vsce wants bare semver `1.0.0`, no `v` prefix). The dispatch path takes the input verbatim, so passing `1.0.0` works. After successful publish, create the `v1.0.0` release tag separately so the `[1.0.0]` changelog footnote link resolves. Future versions (1.0.1+) can either continue on dispatch or have `publish.yml` patched to strip the `v` prefix.
* 2026-06-02: Video support in the Marketplace README is renderer-dependent and not reliably supported across all viewing paths (Marketplace web, VS Code extension detail pane, VSIX install). For now, use the existing 7 PNG screenshots + walkthrough panel; add a GIF or test `<video>` tag support post-publish once the live listing can be validated. Not a publish blocker.

**Spec:** [2026-04-01_plan_todo_MarketplacePublish.md](<2026-04-01_plan_todo_MarketplacePublish.md>)
**Stale prereq:** [2025-12-11_plan_done_PackageJsonMetadata.md](<2025-12-11_plan_done_PackageJsonMetadata.md>)
**Quality gate:** [2026-04-26_plan_done_DocsRefresh_Orch.md](<2026-04-26_plan_done_DocsRefresh_Orch.md>) (Lanes A/B/C done; Lanes D/E remain — D/E do not block publish)
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

* [Lane A: package audit + VSIX dry run](<2026-04-25_plan_done_MarketplacePublishImpl_LaneA-PackageAudit.md>) (merged via PR #113, `4c913c2`)
* [Lane B: publisher + PAT setup, acoven manual](<2026-04-25_plan_done_MarketplacePublishImpl_LaneB-PublisherSetup.md>) (closed on `main` via `a74ffa3`)
* [Lane C: publish + verify](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>) (next; unblocked by docs refresh shipping in PR #115)

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
