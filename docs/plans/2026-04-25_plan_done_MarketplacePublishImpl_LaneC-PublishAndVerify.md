# Lane C: Publish + verify

**Status:** todo (unblocked 2026-04-28; remaining prerequisites all shipped as of 2026-05-04: Lane A merged via PR #113, Lane B closed via `a74ffa3`, DocsRefresh quality gate via PR #115, DocsRefresh Lane E verify via PR #117, walkthrough + real hero via PR #119, About-shortcut rebind detection via PR #120)
**Created:** 2026-04-25
**Updated:** 2026-05-04
**Parent orchestrator:** [2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md](<2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md>)
**Branch:** new branch off `main` (the original `feature/marketplace-publish` is stale; rebranch from current `main` at `4c012ff` or later so all marketplace prereqs are in scope)
**Owner:** acoven, with Claude assisting on artifact prep, listing copy, and post-publish updates.
**Blocked by:** none. All code/docs prerequisites merged.

## Pre-publish checklist (must run before `vsce publish`)

* Replace `TODO(date)` placeholders in `CHANGELOG.md` 1.0.0 entry and `docs/MARKETPLACE_CHANGELOG.md` with the actual planned publish date.
* Replace `TODO(release-tag)` placeholder in `CHANGELOG.md` footnote link with the real `v1.0.0` GitHub release tag URL (or commit to creating the tag as part of this lane).
* Real hero screenshot: done via PR #119. `docs/MARKETPLACE.md` hero is `assets/p2p4vsc-screenshots/p2p4vsc_screenshot_toolbar_05_zoom.png` (no `images/screenshot-preview.png` 1×1 placeholder remains).
* DocsRefresh Lane E verification: done via PR #117 (merged 2026-05-01). VSIX integrity, marketplace-doc shipping flags, and broken-link sweep all confirmed.
* DocsRefresh Lane D walkthrough: done via PR #119 (merged 2026-05-03). 7-step `contributes.walkthroughs` block ships in the VSIX. EDH auto-open smoke test (acoven, one-time) is the only piece still owed; it can run as part of this lane's "Verify listing" step on a fresh install.

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
