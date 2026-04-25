# Lane A: Package audit + VSIX dry run

**Status:** todo
**Created:** 2026-04-25
**Parent orchestrator:** [2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md](<2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md>)
**Branch:** `feature/marketplace-publish-audit` (off `feature/marketplace-publish`)
**Owner:** Claude (automated)

## Goal

Confirm `.config/template.package.json` and the build pipeline produce a VSIX that passes `vsce` validation. Land any fixes before acoven runs `vsce publish` in Lane C.

## Why this lane exists separately

The spec recipe ([MarketplacePublish](<2026-04-01_plan_todo_MarketplacePublish.md>)) interleaves automated steps (vsce package, README check) with manual ones (Azure DevOps, PAT). Splitting them lets the automated work proceed without waiting for credentialed steps. The 2025-12-11 PackageJsonMetadata plan was written before the template-driven `package.json` workflow existed and is partly stale; Lane A reconciles plan and reality.

## Workitems

* Audit `.config/template.package.json` against the marketplace required-fields list
  * `name`, `displayName`, `description`, `version`, `publisher`, `engines.vscode`, `categories`, `repository`, `bugs`, `homepage`, `keywords`, `license`, `main`, `activationEvents`, `contributes`
  * Confirm `publisher` is exactly `appliedmedia`
  * Confirm `repository.url` resolves (`https://p2p4vsc.dev` redirects to GitHub) or replace with the canonical GitHub URL
  * Confirm `bugs.url` resolves
  * Confirm `keywords` count is in [5, 30]
* Run `bash scripts/prepublish.sh` and confirm `dist/extension.js` is produced
* Run `npx @vscode/vsce package` and confirm a valid `.vsix` is produced with zero validation errors
  * If `vsce` complains, fix the template field, regenerate, and retry
  * Save the resulting VSIX as a build artifact for Lane C smoke install
* Icon
  * If `icon.png` does not exist at the repo root, decide with acoven whether to ship without an icon or commission one
  * If shipping without, confirm template does not reference an icon path
  * If shipping with, add `icon.png` (128x128 PNG, transparent background) and the `"icon": "icon.png"` field
* README marketplace-readiness sweep
  * No Yeoman boilerplate text
  * No `<img>` tags with non-HTTPS sources
  * No inline SVG references
  * Renders sensibly at <https://github.com/appliedmedia/print2paper4vscode>
* Reconcile [2025-12-11_plan_todo_PackageJsonMetadata.md](<2025-12-11_plan_todo_PackageJsonMetadata.md>)
  * If every field it lists is already in the template, rename it `*_plan_done_*` with a top-line note pointing to this wave
  * If anything is genuinely missing, fix the template in this lane and then close the older plan

## Acceptance

* `npm run compile`, `npm test`, `npm run lint`, `npm run lint:md` all green
* `bash scripts/prepublish.sh && npx @vscode/vsce package` succeeds with zero warnings
* Resulting VSIX installs cleanly via `code --install-extension <vsix>` and Alt+P still works
* The older PackageJsonMetadata plan is closed out (renamed to done or superseded)

## Hand-off to Lane C

Drop the produced `.vsix` path and the validation summary into the Lane C plan as a "ready to publish" note before requesting Lane C be started.
