# Lane B: CHANGELOG accuracy + format pass

**Status:** todo
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh` (or sub-branch `feature/docs-refresh-laneB`)
**Owner:** Claude
**Blocked by:** none

## Goal

`CHANGELOG.md` is the second thing every marketplace user looks at after the README, especially for a fresh extension at v1.0.0.
Today's changelog claims Windows and Linux print support is "future" or "planned" or under "Known Limitations", but both shipped weeks ago (PRs #105, #110, #112).
It cites `357 tests across 90 suites` (we now have 386+).
It dates 1.0.0 to `2025-12-12` even though the actual marketplace release date is 2026-04-26 or later.
It carries a "Future Roadmap" section that lists already-done items as TODOs.
None of these are functionally broken, but together they tell a story of "the maintainer does not know what they shipped".

## Workitems

* Top-of-file structure
  * [ ] Confirm Keep a Changelog format compliance (Unreleased section first, then versioned entries newest first, ISO date in `[VERSION] - YYYY-MM-DD` heading)
  * [ ] Keep the existing semver pointer line at top
* 1.0.0 entry rewrite
  * [ ] Update date from `2025-12-12` to the actual marketplace publish date (placeholder `YYYY-MM-DD` until Lane C of the publish wave settles the date; Lane E of this wave finalizes)
  * [ ] Drop the `### Known Limitations` claim "macOS-specific print commands (Windows/Linux support planned)": Linux shipped on PR #105 + #110, Windows on PR #112
  * [ ] Move accurate platform-support facts out of `### Known Limitations` into `#### Platform Support` and rewrite both:
    * macOS: AppleScript-driven Preview / direct print
    * Windows: PowerShell-driven `System.Windows.Forms.PrintDialog`, with structured failure-mode handling for missing printers, missing PDF reader, etc. (PR #112)
    * Linux: CUPS detection + viewer selection (Okular, Evince, etc.) with smoke-tested error paths (PR #110)
  * [ ] Replace the test-count line `Comprehensive test suite: 357 tests across 90 suites` with either a current count or a generic "Comprehensive Gherkin + unit test suite covering ~95% of statements" (the audit memory says coverage is at ~95% via PR #107, so the latter is safer than chasing exact counts that go stale every PR)
  * [ ] Drop or rewrite any other "future" / "planned" claim that has shipped
* Future Roadmap section
  * [ ] Decide: keep in `CHANGELOG.md` (acceptable per Keep a Changelog) or move to a new `docs/ROADMAP.md`
  * [ ] If kept: delete entries that already shipped (cross-platform printing support; possibly GitHub Actions CI/CD pipeline if it exists)
  * [ ] If moved: ensure the README does not link to it (Lane A constraint)
* Cross-references
  * [ ] Verify `[Unreleased]` and `[1.0.0]` link footnotes at file bottom point to real GitHub URLs (the current ones point to `appliedmedia/print2paper4vscode/compare/...` and `releases/tag/v1.0.0`; the tag must exist or the link 404s)
  * [ ] If the `v1.0.0` tag does not yet exist (it will not until Lane C of the publish wave runs), leave a `TODO(release-tag)` HTML comment so verify-pass catches it
* Tone
  * [ ] User-facing entries describe behavior, not implementation. "Added Windows print support" beats "Added Windows.Forms.PrintDialog wrapper class" for a marketplace audience. The technical details belong in the GitHub release notes or in `docs/ARCHITECTURE.md`.

## Acceptance

* `CHANGELOG.md` 1.0.0 entry has a correct date (or a `TODO(date)` marker for Lane E to fill in just before publish).
* No "future" / "planned" / "Known Limitations" claim is contradicted by current code.
* Test-count line is either current or generic.
* `markdownlint` passes on `CHANGELOG.md`.
* Footnote links resolve (or carry a `TODO(release-tag)` marker).

## Notes

* This lane is short. If acoven only has 30 minutes for docs work in a sitting, this is the highest-value-per-minute lane to assign.
* "Future Roadmap" content is genuinely useful for community signal; recommend keeping it in `CHANGELOG.md` rather than spinning up a new `docs/ROADMAP.md` that nobody will maintain. But trim it ruthlessly so what remains is actually planned, not aspirational.
