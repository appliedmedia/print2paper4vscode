# Lane C: Repo README accuracy fixes + dev docs audit

**Status:** todo
**Created:** 2026-04-26
**Parent orchestrator:** [2026-04-26_plan_todo_DocsRefresh_Orch.md](<2026-04-26_plan_todo_DocsRefresh_Orch.md>)
**Branch:** `feature/docs-refresh`
**Owner:** Claude
**Blocked by:** none

## Goal

The repo `README.md` stays as the developer / contributor entry point on GitHub. Two responsibilities for this lane:

1. Fix the factual inaccuracies in the repo `README.md` (wrong keybinding claims, wrong command names, dead "Quick Links" pointing at relocated docs, claims about platform support that are now stale).
2. Audit the existing `docs/*.md` files for accuracy against current code as of 2026-04-26 and either update, merge, or delete each.

After this lane, `README.md` plus the `docs/` set should be a coherent, accurate developer-facing surface. Lane A handles the separate marketplace README at `docs/MARKETPLACE.md`; Lane C does NOT extract content out of `README.md` because the repo README is staying.

## Workitems

* Repo `README.md` factual fixes (developer audience)
  * [ ] Audit every claim in current `README.md` against current code:
    * Keybindings: confirm Alt+P is the real keybinding; remove or correct any "Cmd+Shift+P opens Print Selection" style claims
    * Command names: confirm only `Print2Paper` and `Clear State` exist; remove any references to commands that do not exist (e.g., "Print Selection", "Print Current Tab")
    * Quick Links: every link target must resolve on disk (drop links to deleted files)
    * Platform support: replace "macOS only / Windows + Linux planned" language with current reality (all three shipped in 1.0.0)
    * Test count / coverage claims: align with current numbers or generalize ("~95% coverage" per PR #107)
  * [ ] Add a brief "For end users / marketplace listing" pointer at the top so a contributor who lands on the repo README knows where the marketplace user docs live: a one-liner like "End-user docs that ship to the VS Code marketplace live in [docs/MARKETPLACE.md](<docs/MARKETPLACE.md>)."
  * [ ] Do NOT split content out into separate dev docs unless a section is genuinely too long to belong inline. The repo README staying as a single comprehensive dev guide is acceptable (and the user explicitly wants it that way).
* `docs/` audit
  * [ ] `docs/AGENTS.md`: read end-to-end; flag any reference to deleted files, renamed classes, or pre-Phase-2 architecture; update or leave; do not delete (it is the canonical AI / agent context)
  * [ ] `docs/VSCodeAPIs.md`: cross-reference against current `src/VSCodeAPIs.ts` (or wherever the wrapper lives) for accuracy; update API surface descriptions if they have drifted
  * [ ] `docs/INSTALL.md`: read; decide one of: (a) it is end-user install instructions, in which case delete because the marketplace listing covers that; (b) it is dev install instructions, in which case verify accuracy and leave; (c) it is something else worth keeping
  * [ ] `docs/EXECUTION_ORDER_ANALYSIS.md`: read; verify file paths and component class names against current code; either update or merge into `README.md`'s existing architecture section if there is overlap
  * [ ] `docs/2026-04-12_info_DeveloperGuide.md`: read; this is a dated info doc. Decide: (a) update for current state and rename / drop date; (b) keep as a snapshot with a header noting "as of 2026-04-12" if archival; (c) delete if fully superseded
  * [ ] `docs/MARKETPLACE.md` and `docs/MARKETPLACE_CHANGELOG.md` are owned by Lanes A and B; this lane does not touch them
* Cross-link sweep
  * [ ] Every file under `docs/` (except the marketplace pair) should link to its peers via `[Title](<relative-path>)` so a reader can navigate without going back to the README
  * [ ] No dev doc should link to `docs/plans/*` (those are working docs, not reference docs); planning links live only inside `docs/plans/`
  * [ ] Every link from `README.md` to a `docs/*.md` file must resolve on disk

## Acceptance

* Repo `README.md` is factually accurate as of 2026-04-26: real keybinding, real command names, no broken "Quick Links", honest platform support status, current or generic test/coverage numbers.
* Repo `README.md` includes a short pointer telling readers where the marketplace user docs live (`docs/MARKETPLACE.md`).
* `docs/AGENTS.md` and `docs/VSCodeAPIs.md` are accurate as of 2026-04-26 (or any inaccuracy is fixed).
* `docs/INSTALL.md`, `docs/EXECUTION_ORDER_ANALYSIS.md`, `docs/2026-04-12_info_DeveloperGuide.md` are either updated, merged, or deleted via `git rm`, with no orphaned stale files left.
* `markdownlint` passes on every changed `.md` file.

## Notes

* The audit subtasks (AGENTS, VSCodeAPIs, INSTALL, EXECUTION_ORDER_ANALYSIS, info_DeveloperGuide) can each take 5 to 30 minutes depending on how stale they are. If acoven wants to time-box, do the README accuracy fixes first (those are user-visible on GitHub) and treat the audits as a follow-up commit.
* Use `git mv` not bare `mv` for any rename. Use `git rm` not bare `rm` for any deletion.
* Repo `README.md` may end up larger than `docs/MARKETPLACE.md` because the developer audience genuinely needs more detail. That is fine. The two files have different audiences and different sizes are correct.
