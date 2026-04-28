# Lane E: Verification + cross-link audit

**Status:** todo
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh`
**Owner:** Claude
**Blocked by:** Lanes A, B, C, D all complete

## Goal

Catch the cross-cutting failure modes that any individual lane could have introduced: broken internal links, stale relative paths, VSIX file-count regressions, walkthrough rendering issues, markdownlint complaints, and the `TODO(date)` / `TODO(release-tag)` markers that Lane B left for Lane E to resolve just before publish.

## Workitems

* VSIX integrity
  * [ ] `bash scripts/prepublish.sh && npx @vscode/vsce package`
  * [ ] Inspect the file listing: should be 8 base files (the Lane A audit baseline) plus the Lane D walkthrough assets, plus any new Lane A image. No `.claude/`, no `.cursor/`, no source, no docs, no plans
  * [ ] Confirm the VSIX size is still small (target under 5 MB; the 10.35 MB extension.js dominates so growth here is mostly walkthrough media)
* README + walkthrough rendering
  * [ ] Unzip the VSIX and open `extension/readme.md` in a markdown previewer (or use `npx @vscode/vsce show appliedmedia.print2paper4vscode --json` after a dry-run upload, but that requires Lane C of the publish wave which is not yet done)
  * [ ] Visually confirm the README renders as intended: hero screenshot loads, Usage section reads cleanly, Contributing section's link to `docs/CONTRIBUTING.md` is present (it will not resolve in the VSIX itself but vsce will rewrite it to a GitHub URL on publish)
  * [ ] Install the VSIX into a clean Extension Development Host: `code --install-extension print2paper4vscode-1.0.0.vsix`
  * [ ] Confirm the Get Started walkthrough panel auto-opens
  * [ ] Walk all four steps; confirm media renders and completion events fire
* Internal link audit
  * [ ] Run a script (or `markdown-link-check`) against every `.md` file in the repo root and under `docs/` (excluding `docs/plans/` cross-references which are intentionally working docs)
  * [ ] Every link to a file path must resolve on disk
  * [ ] Every link to a section anchor must resolve to a heading in the target file
  * [ ] Every external HTTPS link should return non-error (skip github.com sub-paths that may not exist yet, like the `v1.0.0` release tag)
* Markdownlint sweep
  * [ ] `npx markdownlint "**/*.md" --ignore node_modules` passes with the project's existing `.markdownlint.json` config
  * [ ] Per project markdown hygiene: no trailing whitespace, no `-` bullets (only `*`), no tables (hierarchical bullets instead), no emdash punctuation, hyperlinks in `[Title](<url>)` form
* Resolve Lane B placeholders
  * [ ] Replace `TODO(date)` in `CHANGELOG.md` 1.0.0 entry with the actual planned publish date (coordinate with Lane C of the publish wave)
  * [ ] Replace `TODO(release-tag)` in `CHANGELOG.md` footnote links if the `v1.0.0` git tag is created as part of the publish flow (or leave the link pointing to the eventual tag with a note that it will resolve once tagged)
* Test suite regression check
  * [ ] `npm test` passes (unit tests; per ai01 mechanics memory, this is unit-only and that is intentional)
  * [ ] No coverage regression (audit memory says ~95%; this wave should not have moved the needle either way)
* Memory + master orchestrator updates
  * [ ] Update [project_overview.md](<../../../../.claude/projects/-Users-acoven-dev-print2paper4vscode-main/memory/project_overview.md>) memory: docs refresh wave done; root README is now user-facing; walkthrough exists; ready to resume marketplace publish Lane C
  * [ ] Update master [Orchestrator](<2026-04-01_plan_todo_Orchestrator.md>): record DocsRefresh as a Phase 1 quality gate that landed before publish
  * [ ] Rename all 6 wave plan files (this Orch + 5 lanes) from `_todo_` to `_done_` via `git mv` and update internal links

## Acceptance

* VSIX builds clean with the expected file set; size is reasonable.
* Fresh install in Extension Development Host shows the Get Started walkthrough; all steps render and fire.
* Every internal link in `README.md`, `CHANGELOG.md`, `docs/*.md`, `walkthroughs/*.md` resolves.
* `markdownlint` passes on the full repo.
* `npm test` passes.
* Memory and master orchestrator reflect the new state.
* All 6 wave plan files renamed to `_done_`.

## Notes

* If verification surfaces a fix-up (e.g., a broken link, a markdownlint complaint, a walkthrough that does not auto-open), fix it on the wave branch and re-run the relevant verify step. Do not open a separate PR for verify-pass fix-ups; they are part of the wave.
* The VSIX-installation smoke test is the single most important step in this lane. Everything else can be verified by tooling; the actual user experience can only be verified by installing as a user would.
