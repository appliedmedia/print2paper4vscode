# Lane B: Publisher + PAT setup, acoven manual

**Status:** done
**Created:** 2026-04-25
**Parent orchestrator:** [2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md](<2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md>)
**Owner:** acoven (manual; Claude has no credentials for these systems)

## Goal

Stand up the three external accounts the marketplace needs and capture the resulting PAT in both the local environment and the GitHub repo secrets. None of this is automatable from inside the repo.

## Why this lane is acoven-only

Each step requires a logged-in browser session against Microsoft / Azure DevOps / VS Code Marketplace, plus storing a secret value (PAT) in a password manager. Claude cannot drive interactive Microsoft logins or store credentials on acoven's behalf, so the entire lane is checklist-driven by acoven.

## Checklist

* Azure DevOps organization
  * [x] Sign in at <https://aex.dev.azure.com> with the Microsoft account that will own the publisher (note: bare `dev.azure.com` returns HTTP 404 from Microsoft and bounces to the marketing page; `aex.dev.azure.com` is the correct entry URL for new users)
  * [x] Create a new organization (suggested name: `appliedmedia`)
  * [x] Confirm the org dashboard loads at `https://dev.azure.com/appliedmedia` (no project creation required)
* Personal Access Token
  * [x] Profile icon at `https://dev.azure.com/appliedmedia` → Personal access tokens → New Token
  * [x] Name: `vsce-publish`
  * [x] Organization: **All accessible organizations** (selecting one specific org causes 403s during publish; spec calls this out)
  * [x] Expiration: 365 days (max). Add a calendar reminder for ~11 months from creation to renew.
  * [x] Scopes: Custom defined → Show all scopes → Marketplace → Manage
  * [x] Click Create, copy the PAT immediately (shown only once)
  * [x] Paste the PAT into a password manager
* Marketplace publisher
  * [x] Sign in at <https://marketplace.visualstudio.com/manage> with the same Microsoft account
  * [x] Create publisher: ID `appliedmedia`, Name `Applied Media`
  * [x] Confirm publisher card appears in the management dashboard
* Local vsce login (for ad-hoc publishes)
  * [x] `npx @vscode/vsce login appliedmedia`
  * [x] Paste the PAT when prompted
  * [x] Confirm the session is stored (`~/.vsce` or equivalent)
* GitHub Actions secret (for automated publishes via `publish.yml`)
  * [x] At <https://github.com/appliedmedia/print2paper4vscode/settings/secrets/actions> click New repository secret
  * [x] Name: `VSCE_PAT`
  * [x] Value: paste the same PAT
  * [x] Confirm the secret is listed (value will not be visible after save)

## Acceptance

* All five sections above are fully checked.
* `npx @vscode/vsce verify-pat appliedmedia` succeeds locally.
* Repo Actions secret list shows `VSCE_PAT`.

## Hand-off to Lane C

Comment on the wave Orch (or just check this lane in) once the checklist is fully ticked. Lane C is gated on this signal.

## Notes for renewal

* The PAT name `vsce-publish` and the GitHub secret name `VSCE_PAT` should stay in sync. When the PAT expires, regenerate with the same name, re-`vsce login`, and update the `VSCE_PAT` secret.
* Sign in to <https://aex.dev.azure.com> at least every 30 days to keep the PAT from going stale. This is a Microsoft policy, not a vsce policy.
