# VS Code Marketplace Publishing - Swimlane + Recipe

**Status:** TODO
**Created:** 2026-04-01
**Master Orchestrator:** `2026-04-01_plan_todo_Orchestrator.md` (Phase 1, Stream B)
**Branch:** `feature/marketplace-prep` (for any code changes)
**PR Target:** `main` (CodeRabbit review required)
**Blocked by:** Stream A (Windows Fixes)
**Priority:** High - required for deployment
**Publisher:** Applied Media (ID: `appliedmedia`)
**Estimated Time:** 30-45 minutes (one-time setup)

---

## Prerequisites

Before starting:
- [ ] Git connected and building (361 tests pass) ✅
- [ ] `bash scripts/prepublish.sh` runs successfully (produces `dist/extension.js`)
- [ ] `npx @vscode/vsce package` creates a valid VSIX
- [ ] VSIX tested locally in VS Code

---

## Step-by-Step Recipe

### Step 1: Create Azure DevOps Organization (5 min)

The marketplace uses Azure DevOps for authentication.

1. Go to **<https://dev.azure.com>**
2. Sign in with a Microsoft account (personal, GitHub, or work/school)
3. Click **New organization**
4. Name it (e.g., `appliedmedia`) — this is just for the PAT, not public-facing
5. Select hosting region, click **Continue**
6. You don't need to create any projects — just need the org to exist

**Cost:** Free. No subscription required for existing organizations.

### Step 2: Create Personal Access Token (5 min)

1. While logged in at **<https://dev.azure.com>**, click your profile icon (top right)
2. Click **Personal access tokens**
3. Click **+ New Token**
4. Fill in:
   - **Name:** `vsce-publish` (or anything descriptive)
   - **Organization:** **All accessible organizations** ⚠️ CRITICAL — selecting a specific org causes 403 errors
   - **Expiration:** 365 days (maximum)
   - **Renewal reminder:** Create a calendar reminder for ~11 months after creation (e.g., March 2027) to renew this token before expiry. The PAT name `vsce-publish` is stored as GitHub secret `VSCE_PAT` (see Step 9) and locally via `vsce login`.
   - **Scopes:** Click **Custom defined** → click **Show all scopes** → scroll to **Marketplace** → check **Manage**
5. Click **Create**
6. **COPY THE TOKEN IMMEDIATELY** — it is shown only once

**Save the token securely** (password manager, etc.). You'll need it for `vsce login` and as a GitHub Actions secret.

### Step 3: Create Marketplace Publisher (5 min)

1. Go to **<https://marketplace.visualstudio.com/manage>**
2. Log in with the **same Microsoft account** used for Azure DevOps
3. Click **Create publisher** in the left pane
4. Fill in:
   - **ID:** `appliedmedia` — this is permanent, cannot be changed
   - **Name:** `Applied Media` — display name shown on marketplace
5. Click **Create**

**Note:** Both ID and Name must be unique across the entire marketplace.

### Step 4: Verify package.json Publisher Field

The `publisher` field in `.config/template.package.json` must match the publisher ID exactly:

```json
{
  "publisher": "appliedmedia"
}
```

Verify this is already set correctly. If not, update the template and regenerate:

```bash
node scripts/generate-package-json.mjs
```

### Step 5: Build and Package (5 min)

```bash
# Full build pipeline
bash scripts/prepublish.sh

# Package the extension
npx @vscode/vsce package
```

**vsce validation checks it will run:**
- `publisher` field exists and matches regex
- `name`, `version`, `engines.vscode` exist
- No SVG images (icons must be PNG)
- All README images use HTTPS
- No template README text detected
- No secrets detected in source files
- Maximum 30 keywords

If any check fails, fix the issue and re-run.

### Step 6: Test Locally (5 min)

```bash
# Install the VSIX in VS Code
code --install-extension print2paper4vscode-1.0.0.vsix
```

Then in VS Code:
1. Open any code file
2. Press **Alt+P** (Option+P on Mac)
3. Verify preview opens with syntax highlighting
4. Test theme switching, page sizes, fonts
5. Test Save PDF
6. Test Print (macOS only currently)

### Step 7: Login and Publish (2 min)

```bash
# Login with your publisher ID
npx @vscode/vsce login appliedmedia
# Paste the PAT when prompted

# Publish!
npx @vscode/vsce publish
```

**Alternative (CI/non-interactive):**

```bash
npx @vscode/vsce publish -p <your-pat-token>
```

**Or with env var:**

```bash
export VSCE_PAT=<your-pat-token>
npx @vscode/vsce publish
```

### Step 8: Verify Publication (5 min)

Microsoft runs an automated virus scan before the extension goes live. This typically takes a few minutes.

1. Visit: `https://marketplace.visualstudio.com/items?itemName=appliedmedia.print2paper4vscode`
2. Search for "Print2Paper" in VS Code Extensions view
3. Install from marketplace (not VSIX) and verify it works

```bash
# CLI verification
npx @vscode/vsce show appliedmedia.print2paper4vscode
```

### Step 9: Add PAT to GitHub Actions (2 min)

For automated publishing via the existing `publish.yml` workflow:

1. Go to `https://github.com/appliedmedia/print2paper4vscode/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `VSCE_PAT`
4. Value: paste the PAT from Step 2
5. Click **Add secret**

Now `publish.yml` can publish automatically on release or manual trigger.

---

## Post-Publish Checklist

- [ ] Extension visible in marketplace search
- [ ] Extension installs from marketplace correctly
- [ ] All features work (Alt+P, themes, PDF, print)
- [ ] Marketplace listing looks professional (description, README renders correctly)
- [ ] `VSCE_PAT` secret added to GitHub repo
- [ ] Verify `2025-12-11_plan_inProgress_PrepareForDeploy.md` is marked as superseded by the orchestrator

---

## Updating the Extension Later

```bash
# Increment version and publish
npx @vscode/vsce publish patch   # 1.0.0 → 1.0.1
npx @vscode/vsce publish minor   # 1.0.0 → 1.1.0
npx @vscode/vsce publish major   # 1.0.0 → 2.0.0

# Or set explicit version
npx @vscode/vsce publish 1.2.0
```

The existing `publish.yml` CI workflow handles this automatically when you create a GitHub release.

---

## Pre-release Publishing (Optional)

For beta/preview releases:

```bash
npx @vscode/vsce publish --pre-release
```

Convention: even minor = release (`1.2.x`), odd minor = pre-release (`1.3.x`).

Requires `engines.vscode >= 1.63.0` (already satisfied).

---

## Common Pitfalls

| Problem | Cause | Fix |
| --- | --- | --- |
| 403 Forbidden on publish | PAT scoped to specific org | Recreate PAT with "All accessible organizations" |
| 401 Unauthorized | Wrong PAT scope | Ensure Marketplace → Manage is selected |
| "publisher not found" | Publisher ID mismatch | `package.json` publisher must match ID exactly |
| SVG icon rejected | vsce doesn't allow SVG | Use 128x128+ PNG |
| Template README detected | Default Yeoman text | Customize README content |
| Stale PAT | Not signed into Azure DevOps in 30 days | Sign in to dev.azure.com periodically |

---

## Costs

**$0.** Publishing to the VS Code Marketplace is completely free. No fees for publisher creation, hosting, or downloads.

---

## Reference URLs

| Resource | URL |
| --- | --- |
| Azure DevOps | <https://dev.azure.com> |
| Publisher Management | <https://marketplace.visualstudio.com/manage> |
| Publishing Docs | <https://code.visualstudio.com/api/working-with-extensions/publishing-extension> |
| Extension Manifest | <https://code.visualstudio.com/api/references/extension-manifest> |
| vsce npm package | <https://www.npmjs.com/package/@vscode/vsce> |
