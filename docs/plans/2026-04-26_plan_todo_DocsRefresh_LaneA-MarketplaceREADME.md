# Lane A: Marketplace-facing README rewrite

**Status:** todo
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh` (or sub-branch `feature/docs-refresh-laneA` if parallelized)
**Owner:** Claude (drafts), acoven (screenshot capture + final review)
**Blocked by:** none

## Goal

Rewrite `README.md` so the marketplace listing answers the user's three first questions in the first screen of scroll: *what does this do, what do I press, what does it look like*. Strip every developer-only artifact (Quick Links to `docs/AGENTS.md`, `apt-get install nodejs`, F5 in Extension Development Host, 300+ lines of execution flow diagrams) and route them to `docs/CONTRIBUTING.md` / `docs/ARCHITECTURE.md` (Lane C handles the destination files).

## Target structure

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
* `## Contributing`
  * One paragraph: "Bug reports and PRs welcome at [GitHub](<https://github.com/appliedmedia/print2paper4vscode>). For development setup, build, and test instructions, see [docs/CONTRIBUTING.md](<docs/CONTRIBUTING.md>). For architecture, see [docs/ARCHITECTURE.md](<docs/ARCHITECTURE.md>)."
* `## License`
  * One line referencing `LICENSE`

Total target length: under 200 lines including screenshots, blank lines, and headings.

## Workitems

* Audit current `README.md`
  * [ ] Read every `##` section and decide one of: keep, move to `docs/CONTRIBUTING.md`, move to `docs/ARCHITECTURE.md`, delete (Lane C consumes the snapshot for the destination files; this lane only marks intent)
  * [ ] Identify every claim in current README that is wrong against current code (e.g., `Cmd+Shift+P` opens Print Selection; right-click "Print Selection" / "Print Current Tab" commands that do not exist)
* Draft new README
  * [ ] Write the new structure end-to-end, replacing the file in one commit
  * [ ] Cite real command IDs from `.config/template.package.json` after `{{extId}}` substitution: `p2p4vsc.print2paper` (title `Print2Paper`) and `p2p4vsc.persistClear` (title `Clear State`)
  * [ ] Cite real keybinding from `keybindings` section of the template (Alt+P)
  * [ ] No SVG images (marketplace rejects them)
  * [ ] All image refs use the `images/` relative path; vsce auto-rewrites them to absolute GitHub URLs in the published listing because `repository.url` is canonical github.com (Lane A audit verified this)
  * [ ] All non-image links use the extended hyperlink format `[Title](<url>)` per project markdown hygiene
* Hero screenshot
  * [ ] Capture a 1600x1000 (or 16:10) screenshot of the Print2Paper preview panel beside a code editor with syntax highlighting visible
  * [ ] Compress the PNG (target under 200 KB) via `pngquant` or equivalent so it does not bloat the VSIX
  * [ ] Save as `images/screenshot-preview.png`
  * [ ] Reference it from the README near the top
* Verify
  * [ ] `npx markdownlint README.md` passes
  * [ ] `npx @vscode/vsce package --no-git-tag-version` produces a VSIX whose `extension/readme.md` contains the new content
  * [ ] Unzip the produced VSIX and confirm `extension/images/screenshot-preview.png` is present and renders
  * [ ] Manually scan the rendered README for any remaining "Cmd+Shift+P" / "Quick Links" / dev-shell references

## Acceptance

* Root `README.md` is under 200 lines and reads top-to-bottom as a user guide.
* Every command and keybinding mentioned exists in `.config/template.package.json`.
* The marketplace VSIX includes one screenshot and ships the new README.
* `markdownlint` is clean.
* Lane C has a snapshot of the old README content available (Lane C is responsible for migrating salvageable architecture / contributor sections; this lane just deletes them from the root file).

## Notes

* The hero screenshot is the highest-leverage item in this lane. A clear screenshot with the toolbar menus visible answers most "what does this do" questions before the user reads a word.
* If acoven cannot capture a screenshot today, the lane can land with a `images/screenshot-preview.png` placeholder (a 1x1 transparent PNG plus a `TODO(screenshot)` HTML comment in the README) and the real capture follows as a fix-up commit.
* Do not link to `docs/AGENTS.md`, `docs/VSCodeAPIs.md`, or any `docs/plans/*` from the new README. Those paths do not exist in the marketplace VSIX and would render as broken links.
