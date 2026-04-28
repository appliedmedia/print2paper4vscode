# Lane C: Publish + verify

**Status:** todo (unblocked 2026-04-28: Lane A merged via PR #113, Lane B closed via `a74ffa3`, DocsRefresh quality gate shipped via PR #115)
**Created:** 2026-04-25
**Updated:** 2026-04-28
**Parent orchestrator:** [2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md](<2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md>)
**Branch:** new branch off `main` (the original `feature/marketplace-publish` is stale; rebranch from the post-PR #115 `main` so the marketplace-only README + changelog flags are in scope)
**Owner:** acoven, with Claude assisting on artifact prep, listing copy, and post-publish updates.
**Blocked by:** none. Lane A merged, Lane B done, docs refresh shipped.

## Pre-publish checklist (must run before `vsce publish`)

* Replace `TODO(date)` placeholders in `CHANGELOG.md` 1.0.0 entry and `docs/MARKETPLACE_CHANGELOG.md` with the actual planned publish date.
* Replace `TODO(release-tag)` placeholder in `CHANGELOG.md` footnote link with the real `v1.0.0` GitHub release tag URL (or commit to creating the tag as part of this lane).
* (Optional but recommended) Capture the real hero screenshot at `images/screenshot-preview.png` to replace the 1×1 placeholder shipped in PR #115 (see DocsRefresh Lane A closeout for capture spec).
* Confirm `feature/docs-refresh` Lane E (verification) has either run or been waived — the marketplace VSIX should be smoke-tested in an Extension Development Host before publish even if Lane D (walkthrough) has not landed.

## Goal

Push the audited VSIX to the marketplace, smoke-install it from the marketplace, and update repo metadata so future releases ride the existing CI publish pipeline.

## Workitems

* Final VSIX
  * [ ] On the wave branch, run `bash scripts/prepublish.sh && npx @vscode/vsce package`
  * [ ] Confirm the `.vsix` filename matches `print2paper4vscode-{version}.vsix` and the version matches `.config/template.package.json`
* Publish
  * [ ] `npx @vscode/vsce publish` (interactive) **OR** `VSCE_PAT=<pat> npx @vscode/vsce publish` (one-shot)
  * [ ] Wait for Microsoft's automated virus scan (typically a few minutes)
* Verify listing
  * [ ] <https://marketplace.visualstudio.com/items?itemName=appliedmedia.print2paper4vscode> renders the README and screenshots
  * [ ] In VS Code Extensions view, search "Print2Paper" finds the extension
  * [ ] `code --install-extension appliedmedia.print2paper4vscode` succeeds
  * [ ] Alt+P opens the preview on a code file and theme switching, page sizes, fonts, save-PDF, and print all work
* Repo follow-ups
  * [ ] Update master orchestrator [2026-04-01_plan_todo_Orchestrator.md](<2026-04-01_plan_todo_Orchestrator.md>): Phase 1 Stream B → done; "Published" line flips to yes
  * [ ] Update memory project_overview to reflect "Published to marketplace as appliedmedia.print2paper4vscode"
  * [ ] Mark this wave's plan files as `done` (rename Orch + Lane A + Lane B + Lane C status from todo to done)
  * [ ] Confirm `publish.yml` is wired to `VSCE_PAT` so a GitHub release auto-publishes the next version

## Failure routing

* `403 Forbidden`: PAT scoped to one org; route back to Lane B step "Create PAT", recreate with All accessible organizations
* `401 Unauthorized`: PAT missing Marketplace → Manage scope; route back to Lane B
* "publisher not found": template `publisher` field doesn't match the publisher ID in the marketplace; route back to Lane A
* SVG icon rejected: route back to Lane A icon step
* Yeoman boilerplate detected in README: route back to Lane A README sweep

## Acceptance

* Extension installable from the marketplace by anyone, not just acoven.
* `npx @vscode/vsce show appliedmedia.print2paper4vscode` returns the new listing.
* All wave plan files renamed to `done`.
