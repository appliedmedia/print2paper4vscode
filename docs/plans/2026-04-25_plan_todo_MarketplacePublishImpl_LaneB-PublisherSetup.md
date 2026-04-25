# Lane B: Publisher + PAT setup, acoven manual

**Status:** todo
**Created:** 2026-04-25
**Parent orchestrator:** [2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md](<2026-04-25_plan_todo_MarketplacePublishImpl_Orch.md>)
**Owner:** acoven (manual; Claude has no credentials for these systems)

## Goal

Stand up the three external accounts the marketplace needs and capture the resulting PAT in both the local environment and the GitHub repo secrets. None of this is automatable from inside the repo.

## Why this lane is acoven-only

Each step requires a logged-in browser session against Microsoft / Azure DevOps / VS Code Marketplace, plus storing a secret value (PAT) in a password manager. Claude cannot drive interactive Microsoft logins or store credentials on acoven's behalf, so the entire lane is checklist-driven by acoven.

## Checklist

* Azure DevOps organization
  * [ ] Sign in at <https://dev.azure.com> with the Microsoft account that will own the publisher
  * [ ] Create a new organization (suggested name: `appliedmedia`)
  * [ ] Confirm the org dashboard loads (no project creation required)
* Personal Access Token
  * [ ] Profile icon at <https://dev.azure.com> → Personal access tokens → New Token
  * [ ] Name: `vsce-publish`
  * [ ] Organization: **All accessible organizations** (selecting one specific org causes 403s during publish; spec calls this out)
  * [ ] Expiration: 365 days (max). Add a calendar reminder for ~11 months from creation to renew.
  * [ ] Scopes: Custom defined → Show all scopes → Marketplace → Manage
  * [ ] Click Create, copy the PAT immediately (shown only once)
  * [ ] Paste the PAT into a password manager
* Marketplace publisher
  * [ ] Sign in at <https://marketplace.visualstudio.com/manage> with the same Microsoft account
  * [ ] Create publisher: ID `appliedmedia`, Name `Applied Media`
  * [ ] Confirm publisher card appears in the management dashboard
* Local vsce login (for ad-hoc publishes)
  * [ ] `npx @vscode/vsce login appliedmedia`
  * [ ] Paste the PAT when prompted
  * [ ] Confirm the session is stored (`~/.vsce` or equivalent)
* GitHub Actions secret (for automated publishes via `publish.yml`)
  * [ ] At <https://github.com/appliedmedia/print2paper4vscode/settings/secrets/actions> click New repository secret
  * [ ] Name: `VSCE_PAT`
  * [ ] Value: paste the same PAT
  * [ ] Confirm the secret is listed (value will not be visible after save)

## Acceptance

* All five sections above are fully checked.
* `npx @vscode/vsce verify-pat appliedmedia` succeeds locally.
* Repo Actions secret list shows `VSCE_PAT`.

## Hand-off to Lane C

Comment on the wave Orch (or just check this lane in) once the checklist is fully ticked. Lane C is gated on this signal.

## Notes for renewal

* The PAT name `vsce-publish` and the GitHub secret name `VSCE_PAT` should stay in sync. When the PAT expires, regenerate with the same name, re-`vsce login`, and update the `VSCE_PAT` secret.
* Sign in to <https://dev.azure.com> at least every 30 days to keep the PAT from going stale. This is a Microsoft policy, not a vsce policy.
