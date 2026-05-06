# Lane D: Walkthrough Get Started experience

**Status:** done (shipped via PR #119, merged 2026-05-03; final shape differs from this plan, see "Closeout note 2026-05-04" below)
**Created:** 2026-04-26
**Updated:** 2026-05-04
**Parent orchestrator:** [2026-04-26_plan_done_DocsRefresh_Orch.md](<2026-04-26_plan_done_DocsRefresh_Orch.md>)
**Branch:** `feature/marketplace-screenshots-walkthrough` (merged via PR #119)
**Owner:** Claude (drafts), acoven (screenshot capture + Extension Development Host smoke test)
**Blocked by:** none structurally

## Closeout note 2026-05-04

PR #119 satisfies the lane's goal (Get Started panel auto-opens after install and gives a guided tour) with a redesigned step list. The plan below is preserved as written so the design discussion is not lost; the "as-shipped" delta is:

* Step count: 7 (one per toolbar menu) instead of 4 (Open, Print, Customize, Save). The 7-step shape matches the 7 toolbar menus the user will actually click after pressing Alt+P, so the walkthrough doubles as a toolbar legend.
* Media: 7 PNG screenshots in `assets/p2p4vsc-screenshots/` (~2.5 MB total) instead of 4 GIFs in `walkthroughs/media/`. Static PNGs avoided the GIF-capture step that was the original blocker, and the toolbar-menu shapes are static enough that animation adds little.
* Step bodies: inline `description` strings on each `steps[]` entry in `.config/template.package.json` instead of separate `walkthroughs/*.md` step files. Smaller VSIX, no `walkthroughs/` directory needed, no `.vscodeignore` rule.
* Completion events: hero step uses `onCommand:{{extId}}.{{cmdPrint}}`; remaining steps use `onStepSelected` (auto-checks when the user clicks the step header). The "no reliable event for toolbar interaction" concern in the original plan is sidestepped by `onStepSelected`.
* Hero image: the same step-1 zoom screenshot (`p2p4vsc_screenshot_toolbar_05_zoom.png`) doubles as the marketplace listing hero in `docs/MARKETPLACE.md`. This also closes Lane C's "(Optional) capture the real hero screenshot to replace the 1×1 placeholder" pre-publish item.
* MARKETPLACE.md gained a "Toolbar tour" section linking each screenshot via absolute GitHub raw URLs.

EDH smoke test still owed by acoven before marketplace publish (Lane C). The contribution-point schema is validated by `vsce package` not warning, but the auto-open behavior on fresh install needs a one-time human check.

## Goal

After a user clicks Install on the marketplace, the next thing they see in VS Code (or Cursor, or any VSCodium fork that supports the standard `walkthroughs` contribution) should be a Get Started panel that walks them through pressing Alt+P and discovering the toolbar. Without this, the user installs and stares at the empty editor with no idea what to do next.

## Walkthrough structure

* Title: Get started with Print2Paper
* Description: Print or save any code file as a syntax-highlighted PDF in three clicks
* Steps
  1. **Open any file**
     * Description: "Open a code file, markdown doc, or anything else you want to print. Print2Paper works with every language VS Code supports."
     * Media: small screenshot or animated GIF of opening a file
     * Completion event: `onCommand:workbench.action.files.openFile` (auto-checks when the user opens any file)
  2. **Press Alt+P to open the preview**
     * Description: "Hit Alt+P. A preview panel opens beside your editor with a fully styled PDF of the current file."
     * Media: GIF of pressing Alt+P and the preview appearing
     * Completion event: `onCommand:p2p4vsc.print2paper`
     * Action button: "Run Print2Paper now" (executes the command for the user)
  3. **Pick page size, theme, and font from the toolbar**
     * Description: "Use the toolbar in the preview panel to switch theme (100+ Shiki themes), page size (Letter, A4, Legal, etc.), font size, and orientation. The PDF re-renders live."
     * Media: GIF showing toolbar menu interactions
     * Completion event: none reliable — `createWebviewPanel` produces a programmatic panel, not a registered view, so `onView:<id>` does not fire. Either omit a completion event (user marks the step done manually) or register a dedicated `onContext:<key>` event by setting a custom context key when the toolbar receives its first interaction message in `UI.handleWebviewMessage`. Decide during implementation; do not ship a non-firing `onView:` event
  4. **Print directly or save as PDF**
     * Description: "Use the Print menu in the toolbar to save the PDF, send it to your printer, or open the system print dialog for full control."
     * Media: GIF of clicking Save as PDF
     * No completion event (final step is informational)

## Workitems

* Discover the right contribution shape
  * [ ] Read [VS Code walkthrough contribution docs](<https://code.visualstudio.com/api/references/contribution-points#contributes.walkthroughs>) (or equivalent up-to-date reference) to confirm the schema for `contributes.walkthroughs[].steps[].completionEvents` and `media`
  * [ ] Confirm Cursor and other VSCodium forks honor this contribution (they should; it is part of the standard extension API)
* Edit `.config/template.package.json`
  * [ ] Add a `contributes.walkthroughs` array with one entry: id `p2p4vsc.getStarted`, title, description, and four-step `steps` array as above
  * [ ] Use `{{extId}}` substitution where command IDs appear (the prepublish script handles the swap)
  * [ ] Verify `scripts/generate-package-json.mjs` propagates the walkthrough contribution to the runtime `package.json` correctly
* Create `walkthroughs/` directory
  * [ ] One markdown file per step: `walkthroughs/step1-open.md`, `walkthroughs/step2-print.md`, `walkthroughs/step3-customize.md`, `walkthroughs/step4-save.md`
  * [ ] Each file is short (3 to 8 lines), since VS Code shows it inline in the Get Started panel
  * [ ] Each file uses the same hyperlink and bullet conventions as the rest of the project
* Capture media
  * [ ] One small GIF per step (or static PNG if GIF is too heavy)
  * [ ] Target size: each asset under 500 KB; total walkthrough media under 2 MB so the VSIX stays small
  * [ ] Save under `walkthroughs/media/` so they are easy to allow-list in `.vscodeignore`
  * [ ] Suggested capture tool on macOS: `Cmd+Shift+5` for video, then convert to GIF via `ffmpeg -i input.mov -vf "fps=10,scale=720:-1" output.gif`
* Update `.vscodeignore`
  * [ ] Add an allow-rule so `walkthroughs/**` ships in the VSIX. Today's `.vscodeignore` does not exclude `walkthroughs/`, so technically no rule is needed, but adding an explicit `!walkthroughs/**` after the broad `*.md` rule is the safe pattern (the walkthrough step files are `.md` and would otherwise be excluded by line 32 of `.vscodeignore`)
* Smoke test in Extension Development Host
  * [ ] Build the VSIX with `bash scripts/prepublish.sh && npx @vscode/vsce package`
  * [ ] Install it into a clean VS Code instance via `code --install-extension print2paper4vscode-1.0.0.vsix`
  * [ ] Confirm the Get Started panel auto-opens after install (or appears under Help → Get Started)
  * [ ] Walk through all four steps; confirm media renders, completion events fire, action button on step 2 actually runs the command
  * [ ] Repeat the smoke test in Cursor if convenient (validates VSCodium fork compatibility)

## Acceptance

* `.config/template.package.json` carries a valid `contributes.walkthroughs` entry; `npx @vscode/vsce package` does not warn about schema issues.
* The four `walkthroughs/*.md` step files exist and pass `markdownlint`.
* The walkthrough media files exist and total under 2 MB.
* Fresh install in an Extension Development Host shows the Get Started panel automatically and all four steps render correctly.
* The VSIX file count grows by exactly the new walkthrough assets (Lane E will diff against the Lane A baseline of 8 files).

## Notes

* Walkthroughs are a polish feature; if media capture stalls, the lane can land with text-only steps (no media) and follow-up commits add the GIFs. A text-only walkthrough is still better than no walkthrough.
* Some forks (older VSCodium builds, Theia-based forks) do not honor walkthroughs. The contribution gracefully degrades, so those users just see no Get Started panel, which is the same as today. There is no negative side effect of adding it.
* If the prepublish script does not currently handle `contributes.walkthroughs` template substitution correctly, that is a small fix in `scripts/generate-package-json.mjs` and belongs in this lane, not as separate work.

## Status note (2026-04-28)

The docs refresh wave shipped without this lane via PR #115 (`63940fe`). Lanes A, B, C are all marked done. The `walkthroughs/` directory does not exist on disk; `.config/template.package.json` has no `contributes.walkthroughs` entry; nothing in this lane has begun.

Resume conditions:

* When acoven or Claude has time for a 2-3 hour focused session (4 step files + media capture + EDH smoke test).
* New branch off `main`, e.g., `feature/walkthrough-getstarted`. The original wave branch is merged and the wave is mostly closed.
* When this lane lands, re-run only the walkthrough-specific portion of [Lane E](<2026-04-26_plan_done_DocsRefresh_LaneE-Verify.md>) (the EDH smoke test that confirms the walkthrough auto-opens after install). The Lane E cross-link audit and VSIX integrity check already ran on 2026-05-01; the `TODO(date)` / `TODO(release-tag)` resolution is owned by the publish-wave Lane C, not by this lane.

This lane does not block marketplace publish — Lane C of the [marketplace publish wave](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>) is unblocked as of PR #115. The walkthrough is polish that can ship as v1.0.1 or later.
