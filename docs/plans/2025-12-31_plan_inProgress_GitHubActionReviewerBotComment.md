# GitHub Action Reviewer Bot Comment Plan

**Status:** TODO
**Created:** 2025-12-31
**Priority:** Implement after PR #92 is merged

---

## Overview

We have implemented a GitHub Action workflow `reviewer-bot-comment-action.yml` that allows authorized users (like Cursor Agents) to post comments on Pull Requests using the `github-actions[bot]` identity.

This capability separates automated/bot commentary from the user's personal account, ensuring clearer attribution in code reviews and discussions.

## Workflow Details

- **File Path:** `.github/workflows/reviewer-bot-comment-action.yml`
- **Trigger:** `workflow_dispatch` (Manual trigger via API or UI)
- **Identity:** `github-actions[bot]`

### Inputs

| Input | Required | Description |
| :--- | :--- | :--- |
| `pr_number` | Yes | The Pull Request number to comment on. |
| `message` | Yes | The body of the comment (supports Markdown). |
| `reply_to_comment_id` | No | Optional ID of a **review comment** to thread a reply to. If omitted, posts a top-level comment. |

## Why It Is Currently Inactive

GitHub Actions security model prevents triggering `workflow_dispatch` events for workflows that do not yet exist on the repository's default branch (`main`).

Since this workflow was added in PR #92 (branch `cursor/web-presence-documentation-updates-1bea`), it cannot be triggered via the `gh` CLI or API until PR #92 is merged into `main`.

## Next Steps

1. **Merge PR #92**: This will commit the workflow file to `main`.
2. **Verify Availability**: Run `gh workflow list` to confirm `reviewer-bot-comment-action.yml` is active.
3. **Future Usage**: Use the instructions below to post comments as a bot.

## Usage Instructions

### Posting a Top-Level Comment

To post a general comment on a PR timeline:

```bash
gh workflow run reviewer-bot-comment-action.yml \
  -f pr_number=92 \
  -f message="This is a top-level comment from the bot."
```

### Replying to a Specific Code Review Thread

To reply to a specific line-of-code comment (threaded):

1. **Find the Comment ID**:

    ```bash
    gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
    ```

    Look for the `id` of the comment you want to reply to.

2. **Trigger the Reply**:

    ```bash
    gh workflow run reviewer-bot-comment-action.yml \
      -f pr_number=92 \
      -f message="Fixed in the latest commit." \
      -f reply_to_comment_id="123456789"
    ```

### Fallback Behavior

If you provide a `reply_to_comment_id` that refers to a standard issue comment (which doesn't support API threading) instead of a code review comment, the workflow includes a fallback mechanism:

1. **It catches the API failure.**
2. **It fetches the original comment body.**
3. **It posts a new **top-level comment** that quotes the original text, ensuring context is preserved.**

## Strategic Value

- **Decoupled Identity:** Prevents "acoven" (user) from appearing as the author of automated status updates.
- **No Extra Cost:** Uses built-in GitHub Actions quotas (free for public repos).
- **No Key Management:** Relies on the ephemeral `GITHUB_TOKEN` rather than long-lived Personal Access Tokens (PATs).

---

**Action Item:** Once merged, verify functionality by sending a "Hello World" test comment to an open PR.
