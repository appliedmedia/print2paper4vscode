# Lane A: Marketplace-facing README (separate file)

**Status:** in-progress
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh`
**Owner:** Claude (drafts), acoven (screenshot capture + final review)
**Blocked by:** none

## Goal

Ship a marketplace-only README at `docs/MARKETPLACE.md` so the marketplace listing answers a user's three first questions in the first screen of scroll: *what does this do, what do I press, what does it look like*.
The repo-root `README.md` stays put as the developer / contributor entry point on GitHub. The two files have separate audiences and should not be collapsed.
`vsce publish` ships the marketplace file via `--readme-path docs/MARKETPLACE.md`; the GitHub landing page keeps rendering `README.md` as today.

## Why a separate file (not a rewrite of the root README)

* The repo README on GitHub serves people who want to understand the codebase, build it, and contribute. That audience needs prerequisites, build commands, architecture diagrams, three-library pipeline detail.
* The marketplace listing serves people who just installed the extension or are deciding whether to. That audience needs a screenshot, the keybinding, and a list of what they can do — no `apt-get install nodejs`.
* `vsce` exposes `--readme-path <path>` and `--changelog-path <path>` exactly so a project can ship a different file to the marketplace than what GitHub renders. That is the supported path; we are using it.
* See memory `feedback_marketplace_readme_split.md` for the full background on this convention.

## Target structure for `docs/MARKETPLACE.md`

* H1 title and one-sentence pitch
* Hero screenshot (PNG) showing the Print2Paper preview panel side-by-side with a code editor
* `## Features` (4 to 7 short bullets with concrete user-visible value, not architecture)
* `## Usage`
  * Press **Alt+P** in any editor to open the Print2Paper preview
  * Walk through the toolbar menus (Print, Page, Theme, Text, Markdown mode)
  * Note the two real commands (`Print2Paper`, `Clear State`) and where they appear in the Command Palette
* `## Configuration`
  * Page sizes (Letter, A4, Legal, Tabloid, Ledger, A3, Executive)
  * Orientations (Portrait, Landscape)
  * Font sizes (8 to 24)
  * Themes (100+ Shiki themes, follows active VS Code theme by default)
  * Markdown raw vs render mode
* `## Platform support`
  * macOS: native AppleScript print
  * Windows: PowerShell + System.Windows.Forms.PrintDialog
  * Linux: CUPS + viewer selection (Okular, Evince, etc.)
* `## Known limitations`
  * jsPDF font set (Courier, Helvetica, Times)
  * Performance ceiling on very large files
* `## Source code and contributing`
  * One sentence pointing to the GitHub repo
* `## License`
  * One line referencing the LICENSE on GitHub

Total target length: under 100 lines including blank lines and headings. Current draft is 80 lines.

## Workitems

* Create `docs/MARKETPLACE.md`
  * [x] Write the file end-to-end against the structure above (DONE 2026-04-26; current file is 80 lines)
  * [x] Cite real command titles from `.config/template.package.json` (`Print2Paper`, `Clear State`) and the real Alt+P keybinding
  * [x] No SVG images (marketplace rejects them)
  * [x] All non-image links use the extended hyperlink format `[Title](<url>)` per project markdown hygiene
  * [x] Hero image reference uses `<../images/screenshot-preview.png>` (relative from `docs/` to repo `images/`)
* Wire `vsce` to ship the marketplace file
  * [x] `.github/workflows/publish.yml` line that runs `vsce publish` now includes `--readme-path docs/MARKETPLACE.md` (DONE 2026-04-26)
  * [ ] Document the same flag on any local manual `vsce package` invocation (e.g., a one-liner in `docs/CONTRIBUTING.md` if Lane C creates it, or in a new `scripts/` helper). Without the flag the local package would ship the dev README, which is a footgun
* Hero screenshot
  * [ ] Capture a 1600x1000 (or 16:10) screenshot of the Print2Paper preview panel beside a code editor with syntax highlighting visible
  * [ ] Compress the PNG (target under 200 KB) via `pngquant` or equivalent so it does not bloat the VSIX
  * [ ] Save as `images/screenshot-preview.png`
  * [ ] `images/` is currently in `.vscodeignore` only via the default `**/*.png` allowance via `images/` being included; verify with a test `vsce package --readme-path docs/MARKETPLACE.md` that the screenshot ships and the relative `../images/` reference resolves on the marketplace
* Verify
  * [ ] `npx markdownlint docs/MARKETPLACE.md` passes
  * [ ] `npx @vscode/vsce package --readme-path docs/MARKETPLACE.md` produces a VSIX whose `extension/readme.md` contains the marketplace content (vsce stages the `--readme-path` file as `extension/readme.md` inside the VSIX)
  * [ ] Unzip the produced VSIX and confirm `extension/images/screenshot-preview.png` is present and renders
  * [ ] Manually scan the rendered marketplace README for any "Cmd+Shift+P" / "Quick Links" / dev-shell references (none expected; this lane started clean)

## Acceptance

* `docs/MARKETPLACE.md` exists, is under 100 lines, and reads top-to-bottom as a user guide.
* Every command and keybinding mentioned exists in `.config/template.package.json`.
* `.github/workflows/publish.yml` passes `--readme-path docs/MARKETPLACE.md` to `vsce publish`.
* The marketplace VSIX includes one screenshot and ships the marketplace README (not the repo README).
* `markdownlint` is clean.
* Repo `README.md` is untouched by this lane (Lane C handles repo README factual accuracy).

## Notes

* The hero screenshot is the highest-leverage item in this lane. A clear screenshot with the toolbar menus visible answers most "what does this do" questions before the user reads a word.
* If acoven cannot capture a screenshot today, the lane can land with a `images/screenshot-preview.png` placeholder (a 1x1 transparent PNG) and the real capture follows as a fix-up commit. The current `docs/MARKETPLACE.md` already has the reference in place with a `TODO(screenshot)` HTML comment.
* `docs/MARKETPLACE.md` should NOT link to `docs/AGENTS.md`, `docs/VSCodeAPIs.md`, or any `docs/plans/*`. Those paths do not exist in the marketplace VSIX (since `docs/**` is excluded except for the explicit `--readme-path` file) and would render as broken links.
* When adding any new vsce invocation anywhere in the repo (workflow, helper script, doc), include the `--readme-path` and (eventually) `--changelog-path` flags. See `feedback_marketplace_readme_split.md` for the why.
