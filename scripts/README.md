# Print2Paper4VSCode Scripts

Extension-specific build and automation scripts.

## 📁 Scripts in This Directory

- **`generate-badges.sh`** - Generates SVG badges for CI, coverage, and license
- **`generate-package-json.mjs`** - Generates package.json from extension manifest
- **`prepublish.sh`** - Pre-publish checks and preparation
- **`lint-yaml-code.js`** - YAML code block linting
- **`setup-vscode-mock.js`** - Sets up VSCode API mocks for testing
- **`templateDictReplace.mjs`** - Template variable replacement utility

## 🔗 Organizational Scripts

Generic automation scripts (GitHub Pages, DNS, badges, etc.) have been moved to:

**[appliedmedia/ops](https://github.com/appliedmedia/ops)**

This includes:
- Badge generation workflow (`scripts/generate-badges.sh`, see `docs/badges.md`)
- GitHub Pages automation (`enable-github-pages.sh`, `enable-https.sh`)
- DNS configuration (`configure-dynadot-dns.sh`, `configure-dynadot-dns-ipv6.sh`)
- Cross-organizational planning documents

For operations that span multiple Applied Media projects, see the ops repository.
