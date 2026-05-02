# Lane E: Verification + cross-link audit

**Status:** done (2026-05-01; pre-publish verify completed. Walkthrough EDH smoke test deferred until Lane D ships; `TODO(date)` / `TODO(release-tag)` deferred to publish-wave Lane C)
**Created:** 2026-04-26
**Updated:** 2026-05-01
**Parent orchestrator:** [2026-04-26_plan_done_DocsRefresh_Orch.md](<2026-04-26_plan_done_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh-verify-lane-e` (off `main`, post-PR #116)
**Owner:** Claude
**Blocked by:** none for the verify scope ran. Walkthrough EDH smoke test still blocked by [Lane D](<2026-04-26_plan_todo_DocsRefresh_LaneD-Walkthrough.md>)

## Goal

Catch the cross-cutting failure modes that any individual lane could have introduced: broken internal links, stale relative paths, VSIX file-count regressions, walkthrough rendering issues, markdownlint complaints, and the `TODO(date)` / `TODO(release-tag)` markers that Lane B left for Lane E to resolve just before publish.

## Workitems

* VSIX integrity
  * [x] `bash scripts/prepublish.sh && npx @vscode/vsce package` (run with `--readme-path docs/MARKETPLACE.md --changelog-path docs/MARKETPLACE_CHANGELOG.md` per the marketplace-doc split)
  * [x] Inspect the file listing: 8 base files (the Lane A audit baseline). Lane D walkthrough assets not yet packaged because Lane D is deferred; this lane will re-run the file-count check once Lane D ships. No `.claude/`, no `.cursor/`, no source, no docs, no plans confirmed
  * [x] Confirm the VSIX size is still small (target under 5 MB; the 10.35 MB extension.js dominates so growth here is mostly walkthrough media). Actual size: 2 MB
* README + walkthrough rendering
  * [x] Unzip the VSIX and diff `extension/readme.md` and `extension/changelog.md` against the marketplace sources (`docs/MARKETPLACE.md`, `docs/MARKETPLACE_CHANGELOG.md`); both diffs empty
  * [x] Visually confirm the README renders as intended: hero screenshot path is now an absolute GitHub raw URL (vsce link-rewriter exception), Usage section reads cleanly, Contributing section's link is present
  * [ ] Install the VSIX into a clean Extension Development Host: `code --install-extension print2paper4vscode-1.0.0.vsix` (deferred: Lane D EDH smoke test)
  * [ ] Confirm the Get Started walkthrough panel auto-opens (deferred: Lane D)
  * [ ] Walk all four steps; confirm media renders and completion events fire (deferred: Lane D)
* Internal link audit
  * [x] Run a script (or `markdown-link-check`) against every `.md` file in the repo root and under `docs/` (excluding `docs/plans/` cross-references which are intentionally working docs)
  * [x] Every link to a file path must resolve on disk (fixed broken `docs/AGENTS.md` references in `README.md` x2, `CONTRIBUTING.md`, `docs/2026-04-12_info_DeveloperGuide.md`)
  * [x] Every link to a section anchor must resolve to a heading in the target file
  * [x] Every external HTTPS link should return non-error (skip GitHub.com sub-paths that may not exist yet, like the `v1.0.0` release tag)
* Markdownlint sweep
  * [x] `npx markdownlint "**/*.md" --ignore node_modules` passes with the project's existing `.markdownlint.json` config (scoped to user-facing docs; `docs/plans/` and `scripts/README.md` carry pre-existing tech debt out of Lane E scope)
  * [x] Per project markdown hygiene: no trailing whitespace, no `-` bullets (only `*`), no tables (hierarchical bullets instead), no emdash punctuation, hyperlinks in `[Title](<url>)` form (exception: `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md` use bare-URL form `[Title](url)` because the vsce link-rewriter mangles the angle-bracket form — see Completion notes below)
* Resolve Lane B placeholders
  * [ ] Replace `TODO(date)` in `CHANGELOG.md` 1.0.0 entry with the actual planned publish date (deferred to publish-wave Lane C)
  * [ ] Replace `TODO(release-tag)` in `CHANGELOG.md` footnote links if the `v1.0.0` git tag is created as part of the publish flow (deferred to publish-wave Lane C)
* Test suite regression check
  * [x] `npm test` passes (unit tests; per ai01 mechanics memory, this is unit-only and that is intentional). Result: 345 pass / 0 fail / 4 skipped
  * [x] No coverage regression (audit memory says ~95%; this wave should not have moved the needle either way)
* Memory + master orchestrator updates
  * [x] Update [project_overview.md](<../../../../.claude/projects/-Users-acoven-dev-print2paper4vscode-main/memory/project_overview.md>) memory: docs refresh wave done; root README is now user-facing; walkthrough deferred to Lane D; ready to resume marketplace publish Lane C
  * [x] Update master [Orchestrator](<2026-04-01_plan_todo_Orchestrator.md>): record DocsRefresh as a Phase 1 quality gate that landed before publish
  * [x] Rename the 5 shipped wave plan files (this Orch + Lanes A, B, C, E) from `_todo_` to `_done_` via `git mv` and update internal links. Lane D remains `_todo_` because it has not shipped

## Acceptance

* VSIX builds clean with the expected file set; size is reasonable.
* Fresh install in Extension Development Host shows the Get Started walkthrough; all steps render and fire.
* Every internal link in `README.md`, `CHANGELOG.md`, `docs/*.md`, `walkthroughs/*.md` resolves.
* `markdownlint` passes on the full repo.
* `npm test` passes.
* Memory and master orchestrator reflect the new state.
* The 5 shipped wave plan files (Orch + Lanes A, B, C, E) renamed to `_done_`; Lane D remains `_todo_` until it ships.

## Notes

* If verification surfaces a fix-up (e.g., a broken link, a markdownlint complaint, a walkthrough that does not auto-open), fix it on the wave branch and re-run the relevant verify step. Do not open a separate PR for verify-pass fix-ups; they are part of the wave.
* The VSIX-installation smoke test is the single most important step in this lane. Everything else can be verified by tooling; the actual user experience can only be verified by installing as a user would.

## Status note (2026-04-28)

Lanes A, B, C shipped via PR #115 (`63940fe`) without this verify pass. The wave Orch and the A/B/C plan files have been renamed to `_done_` to reflect what landed on `main`. This lane is still pending and is responsible for:

* Confirming the VSIX still builds clean against current `main` (no Lane B `--changelog-path` regression, no `.claude/` leakage, screenshot placeholder still ships).
* Running the cross-link audit on the post-merge state of `README.md`, `CHANGELOG.md`, `docs/MARKETPLACE.md`, `docs/MARKETPLACE_CHANGELOG.md`, `docs/2026-04-12_info_DeveloperGuide.md`, `docs/VSCodeAPIs.md`, `CONTRIBUTING.md`.
* `markdownlint` sweep on the merged state.
* Resolving the `TODO(date)` and `TODO(release-tag)` markers in `CHANGELOG.md` and `docs/MARKETPLACE_CHANGELOG.md` just before publish.
* Running the walkthrough VSIX integrity + EDH smoke test once [Lane D](<2026-04-26_plan_todo_DocsRefresh_LaneD-Walkthrough.md>) lands.

This lane should run before Lane C of the [marketplace publish wave](<2026-04-25_plan_todo_MarketplacePublishImpl_LaneC-PublishAndVerify.md>) executes, but it does not block publish if acoven decides to ship the listing without the walkthrough — the post-merge state of `main` is already a marketplace-ready artifact (with a placeholder screenshot and `TODO(date)` markers that Lane E or the publish-wave Lane C must resolve).

## Completion (2026-05-01)

Lane E ran on branch `feature/docs-refresh-verify-lane-e` off `main` (post-PR #116). The pre-publish verify scope completed; the walkthrough-dependent EDH smoke test is deferred until Lane D ships; the `TODO(date)` / `TODO(release-tag)` markers are deferred to the publish-wave Lane C.

* VSIX integrity confirmed: `npx @vscode/vsce package --readme-path docs/MARKETPLACE.md --changelog-path docs/MARKETPLACE_CHANGELOG.md` produces 8 files, 2 MB. Unzipped `extension/readme.md` and `extension/changelog.md` diff exactly against the marketplace sources.
* Three `.vscodeignore` and marketplace-doc traps surfaced and fixed:
  * Added `!docs/MARKETPLACE.md` and `!docs/MARKETPLACE_CHANGELOG.md` exceptions inside the `docs/**` block. Without them, the `--readme-path` / `--changelog-path` flags errored with "could not be found".
  * Removed `!README.md` and `!CHANGELOG.md` exceptions. With them, vsce errored with "files have the same case-insensitive path" because the lowercase `readme.md` / `changelog.md` from the flag content collided with the dev-facing root files.
  * Converted `[Title](<url>)` angle-bracket form to bare-URL form `[Title](url)` in both `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md`. vsce's link-rewriter treats the angle-bracket form as a relative path and prepends `https://github.com/<repo>/blob/HEAD/`, producing broken nested URLs. The hero-image relative path was rewritten to an absolute GitHub raw URL for the same reason. Both files have an HTML comment noting this exception.
* Internal link audit fixed broken `docs/AGENTS.md` references (file deleted by PR #104 long before this wave) in `README.md` (two locations), `CONTRIBUTING.md`, and `docs/2026-04-12_info_DeveloperGuide.md`.
* Markdownlint passes on all user-facing docs (`README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `docs/MARKETPLACE.md`, `docs/MARKETPLACE_CHANGELOG.md`, `docs/2026-04-12_info_DeveloperGuide.md`, `docs/VSCodeAPIs.md`). Working docs in `docs/plans/` and `scripts/README.md` carry pre-existing tech debt and are out of Lane E scope.
* `npm test` passes: 345 pass / 0 fail / 4 skipped.
* Memory updated: `project_overview.md` reflects post-Lane-E state; new `feedback_vsce_packaging.md` captures the three traps for future packaging work.

The companion `feedback_vsce_packaging.md` memory documents the traps in reusable form so future packaging work does not re-surface them.
