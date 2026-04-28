# Lane B: Marketplace CHANGELOG (separate file) + repo CHANGELOG accuracy

**Status:** done (shipped via PR #115, 2026-04-28)
**Created:** 2026-04-26
**Updated:** 2026-04-28
**Parent orchestrator:** [2026-04-26_plan_done_DocsRefresh_Orch.md](<2026-04-26_plan_done_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh` (merged)
**Owner:** Claude
**Blocked by:** none

## Goal

Two independent deliverables, packaged together because they are both about the v1.0.0 changelog story:

1. Ship a marketplace-only changelog at `docs/MARKETPLACE_CHANGELOG.md` so the marketplace listing's "Changelog" tab speaks to users in user-facing language. Wire it via `vsce publish ... --changelog-path docs/MARKETPLACE_CHANGELOG.md`.
2. Fix the factual inaccuracies in the repo-root `CHANGELOG.md` so the developer-facing changelog is also correct: drop "platform support is future" claims (Linux shipped on PR #105 + #110, Windows on PR #112), correct the publish date, replace the stale test count.

The repo `CHANGELOG.md` stays as the developer-facing changelog rendered on GitHub. The marketplace changelog at `docs/MARKETPLACE_CHANGELOG.md` is what the marketplace listing renders. Same convention as Lane A's README split. See memory `feedback_marketplace_readme_split.md`.

## Workitems

* `docs/MARKETPLACE_CHANGELOG.md` (new file, marketplace audience)
  * [x] H1 + Keep a Changelog header
  * [x] `## [1.0.0] - YYYY-MM-DD` (placeholder date with `TODO(date)` HTML comment; Lane E fills in just before publish)
  * [x] Sections: Added, Platform support, Notes
  * [x] Tone is end-user, not implementation
  * [x] Lead with what users get
  * [x] Brief Platform support note (macOS / Windows / Linux all shipped in 1.0.0)
  * [x] No "Future Roadmap" section in the marketplace changelog
  * [x] Footnote link at bottom to the GitHub release page
* Wire `vsce` to ship the marketplace changelog
  * [x] `.github/workflows/publish.yml` line that runs `vsce publish` adds `--changelog-path docs/MARKETPLACE_CHANGELOG.md` alongside the existing `--readme-path docs/MARKETPLACE.md`
  * [x] Document the same flag on local manual `vsce package` invocation (added to `CONTRIBUTING.md` "Packaging the extension locally" section)
* Repo-root `CHANGELOG.md` factual fixes (developer audience)
  * [x] Update date from `2025-12-12` to `YYYY-MM-DD` placeholder with `TODO(date)` HTML comment for Lane E to finalize
  * [x] Drop the `### Known Limitations` claim "macOS-specific print commands (Windows/Linux support planned)"
  * [x] Rewrite `#### Platform Support` to reflect shipped reality (macOS / Windows PR #112 / Linux PRs #105 + #110)
  * [x] Replace the test-count line with generic "~95% statement coverage"
  * [x] Drop "Cross-platform printing support (Windows, Linux)" and "GitHub Actions CI/CD pipeline" from Future Roadmap (both shipped)
  * [x] Add `TODO(release-tag)` HTML comment near the `[1.0.0]` link footnote so Lane E catches it before publish
* Tone consistency
  * [x] Repo `CHANGELOG.md` keeps developer detail (PR numbers, file paths)
  * [x] `docs/MARKETPLACE_CHANGELOG.md` describes user-visible behavior only

## Acceptance

* `docs/MARKETPLACE_CHANGELOG.md` exists, reads as a user-facing changelog, and is wired through `vsce publish --changelog-path`.
* Repo `CHANGELOG.md` 1.0.0 entry has a correct date (or a `TODO(date)` marker for Lane E to fill in just before publish).
* No "future" / "planned" / "Known Limitations" claim in either file is contradicted by current code.
* Test-count line in repo `CHANGELOG.md` is either current or generic.
* `markdownlint` passes on both files.
* Footnote links resolve (or carry a `TODO(release-tag)` marker).

## Notes

* This lane is short. If acoven only has 30 minutes for docs work in a sitting, the repo `CHANGELOG.md` accuracy fixes alone are the highest-value-per-minute slice — they prevent a v1.0.0 changelog that contradicts what shipped.
* The marketplace changelog can ship minimal at first ("v1.0.0: initial release with cross-platform print support") and grow with future versions. Versioning starts at 1.0.0 because that is what the marketplace listing will show.

## Closeout (2026-04-28, PR #115)

Shipped as part of the docs refresh wave merged via `63940fe`:

* `docs/MARKETPLACE_CHANGELOG.md` exists at 39 lines, with `TODO(date)` placeholder for Lane E to fill in just before publish.
* `.github/workflows/publish.yml` now runs `vsce publish` with `--changelog-path docs/MARKETPLACE_CHANGELOG.md` alongside the `--readme-path` flag from Lane A.
* `CONTRIBUTING.md` "Packaging the extension locally" section documents the same `--changelog-path` flag for manual `vsce package` invocations.
* Repo `CHANGELOG.md` factual fixes landed: date set to `TODO(date)` placeholder, the "macOS-specific print commands (Windows/Linux support planned)" claim removed, the `#### Platform Support` section rewritten to reflect macOS / Windows (PR #112) / Linux (PRs #105 + #110), the test-count line replaced with "~95% statement coverage", "Cross-platform printing support" and "GitHub Actions CI/CD pipeline" removed from Future Roadmap, `TODO(release-tag)` placeholder added near the `[1.0.0]` link footnote.

Deferred to Lane E (verification, just before publish):

* Replace `TODO(date)` with the actual planned publish date.
* Replace `TODO(release-tag)` once the `v1.0.0` git tag is created as part of the publish flow.
