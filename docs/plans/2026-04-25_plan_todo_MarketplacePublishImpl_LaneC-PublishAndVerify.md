# Lane C: Publish + verify

**Status:** todo
**Created:** 2026-04-25
**Parent orchestrator:** [2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md](<2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md>)
**Branch:** `feature/marketplace-publish` (wave branch; no separate child branch)
**Owner:** acoven, with Claude assisting on artifact prep, listing copy, and post-publish updates.
**Blocked by:** Lane A merged into wave branch; Lane B checklist fully ticked.

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
