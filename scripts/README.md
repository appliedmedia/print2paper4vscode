# Print2Paper4VSCode Scripts

Extension-specific build and automation scripts.

## 📁 Scripts in This Directory

- **`generate-package-json.mjs`** - Generates package.json from extension manifest
- **`prepublish.sh`** - Pre-publish checks and preparation
- **`lint-yaml-code.js`** - YAML code block linting
- **`setup-vscode-mock.js`** - Sets up VSCode API mocks for testing

## 🔗 Organizational Scripts

Generic automation scripts (GitHub Pages, DNS, badges, etc.) have been moved to:

**[appliedmedia/ops](https://github.com/appliedmedia/ops)**

This includes:
- Badge generation (centralized via `appliedmedia/internal` handler/proxy workflow)
- GitHub Pages automation (`enable-github-pages.sh`, `enable-https.sh`)
- DNS configuration (`configure-dynadot-dns.sh`, `configure-dynadot-dns-ipv6.sh`)
- Cross-organizational planning documents

For operations that span multiple Applied Media projects, see the ops repository.
