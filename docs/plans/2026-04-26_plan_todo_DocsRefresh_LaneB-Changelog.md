# Lane B: Marketplace CHANGELOG (separate file) + repo CHANGELOG accuracy

**Status:** todo
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh`
**Owner:** Claude
**Blocked by:** none

## Goal

Two independent deliverables, packaged together because they are both about the v1.0.0 changelog story:

1. Ship a marketplace-only changelog at `docs/MARKETPLACE_CHANGELOG.md` so the marketplace listing's "Changelog" tab speaks to users in user-facing language. Wire it via `vsce publish ... --changelog-path docs/MARKETPLACE_CHANGELOG.md`.
2. Fix the factual inaccuracies in the repo-root `CHANGELOG.md` so the developer-facing changelog is also correct: drop "platform support is future" claims (Linux shipped on PR #105 + #110, Windows on PR #112), correct the publish date, replace the stale test count.

The repo `CHANGELOG.md` stays as the developer-facing changelog rendered on GitHub. The marketplace changelog at `docs/MARKETPLACE_CHANGELOG.md` is what the marketplace listing renders. Same convention as Lane A's README split. See memory `feedback_marketplace_readme_split.md`.

## Workitems

* `docs/MARKETPLACE_CHANGELOG.md` (new file, marketplace audience)
  * [ ] H1 + Keep a Changelog header
  * [ ] `## [1.0.0] - YYYY-MM-DD` (placeholder date; Lane E of this wave fills in just before publish)
  * [ ] Sections: Added, Improved, Platform support
  * [ ] Tone is end-user, not implementation: "Added Windows print support" not "Added Windows.Forms.PrintDialog wrapper"
  * [ ] Lead with what users get (one-keystroke print, 100+ themes, all common page sizes, live preview, cross-platform support)
  * [ ] Brief Platform support note (macOS / Windows / Linux all shipped in 1.0.0)
  * [ ] No "Future Roadmap" section in the marketplace changelog (roadmap is a community signal that belongs on GitHub, not on a marketplace listing)
  * [ ] Footnote link at bottom to the GitHub release page for full developer-facing detail
* Wire `vsce` to ship the marketplace changelog
  * [ ] `.github/workflows/publish.yml` line that runs `vsce publish` adds `--changelog-path docs/MARKETPLACE_CHANGELOG.md` alongside the existing `--readme-path docs/MARKETPLACE.md`
  * [ ] Document the same flag on any local manual `vsce package` invocation
* Repo-root `CHANGELOG.md` factual fixes (developer audience)
  * [ ] Update date from `2025-12-12` to the actual marketplace publish date (placeholder `TODO(date)` until Lane C of the publish wave settles the date; Lane E of this wave finalizes)
  * [ ] Drop the `### Known Limitations` claim "macOS-specific print commands (Windows/Linux support planned)": Linux shipped on PR #105 + #110, Windows on PR #112
  * [ ] Move accurate platform-support facts out of `### Known Limitations` into `#### Platform Support` and rewrite both:
    * macOS: AppleScript-driven Preview / direct print
    * Windows: PowerShell-driven `System.Windows.Forms.PrintDialog`, with structured failure-mode handling for missing printers, missing PDF reader, etc. (PR #112)
    * Linux: CUPS detection + viewer selection (Okular, Evince, etc.) with smoke-tested error paths (PR #110)
  * [ ] Replace the test-count line `Comprehensive test suite: 357 tests across 90 suites` with either a current count or a generic "Comprehensive Gherkin + unit test suite covering ~95% of statements" (the audit memory says coverage is at ~95% via PR #107, so the latter is safer than chasing exact counts that go stale every PR)
  * [ ] Drop or rewrite any other "future" / "planned" claim that has shipped
  * [ ] Future Roadmap section: keep in the repo `CHANGELOG.md` (developer-facing roadmap is fine on GitHub) but trim entries that have already shipped
  * [ ] Cross-references at file bottom: verify `[Unreleased]` and `[1.0.0]` link footnotes point to real GitHub URLs; if the `v1.0.0` tag does not yet exist, leave a `TODO(release-tag)` HTML comment so verify-pass catches it
* Tone consistency
  * [ ] Repo `CHANGELOG.md` may keep developer detail (PR numbers, file paths) since it lives on GitHub
  * [ ] `docs/MARKETPLACE_CHANGELOG.md` describes user-visible behavior only

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
