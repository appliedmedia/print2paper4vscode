# GitHub Action Reviewer Bot Comment Plan

**Status:** COMPLETED
**Created:** 2025-12-31
**Updated:** 2026-01-01
**Priority:** Implementation complete and tested

---

## Overview

We have successfully implemented and tested a GitHub Action workflow `reviewer-bot-comment-action.yml` that allows authorized users (like Cursor Agents) to post comments on Pull Requests using the `github-actions[bot]` identity.

This capability separates automated/bot commentary from personal accounts, ensuring clearer attribution in code reviews and discussions.

## Workflow Details

- **File Path:** `.github/workflows/reviewer-bot-comment-action.yml`
- **Workflow Name:** `Reviewer Bot Comment`
- **Trigger:** `workflow_dispatch` (Manual trigger via `gh` CLI or GitHub UI)
- **Identity:** `github-actions[bot]`
- **Permissions:** `pull-requests: write`, `issues: write`

### Inputs

| Input | Required | Description |
| :--- | :--- | :--- |
| `pr_number` | Yes | The Pull Request number to comment on. |
| `message` | Yes | The body of the comment (supports Markdown). |
| `reply_to_comment_id` | No | Optional ID of a comment to thread a reply to. Works for review comments; falls back to quoted reply for issue comments. |

## Implementation Status

### ✅ Completed Items

1. **PR #92 Merged** (2025-12-31) - Workflow committed to `main` branch
2. **Workflow Verified Active** - Confirmed via `gh workflow list` (ID: 219955331)
3. **Workflow Renamed** - Changed from "CursorBot Comment" to "Reviewer Bot Comment" for generic naming
4. **Top-Level Comments Tested** - Successfully posted test comments as `github-actions[bot]`
5. **Reply Threading Tested** - Verified both threaded replies and fallback quoting behavior
6. **CRLF Formatting Fixed** - Resolved newline formatting issues in quoted replies
7. **Multi-Line Quoting Fixed** - Each line of quoted comments now properly prefixed with `> `

### Improvements Made

- **CRLF Line Endings:** Uses `$'\r\n\r\n'` for proper spacing between quoted text and replies
- **Multi-Line Markdown Quoting:** Uses `sed 's/^/> /'` to properly quote every line of multi-line comments
- **Clean Fallback Behavior:** Gracefully handles issue comments that don't support threading by posting quoted top-level comments

## Usage Instructions

### Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Access to trigger workflows on the repository
- The workflow must exist on the `main` branch

### 1. Posting a Top-Level Comment

Post a general comment to a PR timeline:

```bash
gh workflow run reviewer-bot-comment-action.yml \
  -f pr_number=94 \
  -f message="This is a top-level comment from github-actions[bot]."
```

**Example with Markdown:**

```bash
gh workflow run reviewer-bot-comment-action.yml \
  -f pr_number=94 \
  -f message="## Test Results

All tests passed successfully! ✅

- Unit tests: 245/245
- Integration tests: 42/42"
```

### 2. Replying to a Review Comment (Threaded Reply)

To reply directly to a code review comment in a thread:

**Step 1: Find the Review Comment ID**

```bash
gh api repos/appliedmedia/print2paper4vscode/pulls/94/comments \
  --jq '.[] | {id: .id, path: .path, body: .body}'
```

**Step 2: Post the Threaded Reply**

```bash
gh workflow run reviewer-bot-comment-action.yml \
  -f pr_number=94 \
  -f message="Fixed in commit abc123." \
  -f reply_to_comment_id=3703142093
```

**Result:** If the comment ID is a valid review comment, the reply appears threaded directly under it.

### 3. Replying to an Issue Comment (Quoted Reply)

To reply to a general PR timeline comment:

**Step 1: Find the Issue Comment ID**

```bash
gh api repos/appliedmedia/print2paper4vscode/issues/94/comments \
  --jq '.[] | {id: .id, author: .user.login, body: .body}'
```

**Step 2: Post the Reply**

```bash
gh workflow run reviewer-bot-comment-action.yml \
  -f pr_number=94 \
  -f message="Thanks for the feedback!" \
  -f reply_to_comment_id=3703142093
```

**Result:** Since issue comments don't support threading, the workflow automatically:
1. Fetches the original comment text
2. Quotes it using Markdown `>` syntax (multi-line support)
3. Posts a new top-level comment with your message below the quote

**Example Output:**

```
> This is the original comment
> that might span multiple lines

Thanks for the feedback!
```

### 4. Checking Workflow Run Status

Monitor the workflow execution:

```bash
# List recent runs
gh run list --workflow=reviewer-bot-comment-action.yml --limit 5

# View specific run details
gh run view <run-id> --log
```

### Notes

- **Markdown Support:** The `message` parameter fully supports GitHub Flavored Markdown
- **Multi-line Messages:** Use CRLF (`\r\n`) for line breaks if needed
- **Timeout:** Workflow times out after 5 minutes
- **Permissions:** Requires repository write access to pull requests and issues

## Strategic Value

- **Decoupled Identity:** Bot comments appear as `github-actions[bot]` instead of personal user accounts
- **No Extra Cost:** Uses built-in GitHub Actions quotas (free for public repos)
- **No Key Management:** Relies on the ephemeral `GITHUB_TOKEN` rather than long-lived Personal Access Tokens (PATs)
- **Flexible Threading:** Supports both true threaded replies (for review comments) and quoted replies (for issue comments)
- **Proper Formatting:** Multi-line comment quoting and CRLF line endings work correctly

## Testing History

**Tested on PR #94 (2026-01-01):**
- ✅ Top-level comment posted successfully
- ✅ Reply to issue comment with quoted fallback
- ✅ CRLF line ending formatting verified
- ✅ Multi-line Markdown quoting tested

---

**Status:** Implementation complete and production-ready. Workflow available for immediate use on all PRs.
