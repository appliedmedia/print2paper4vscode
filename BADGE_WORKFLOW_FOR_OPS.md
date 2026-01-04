# Badge Generation Workflow for Ops Repository

## Summary

This workflow provides reusable badge generation for Applied Media repositories. It creates three dynamic SVG badges: CI status, test coverage, and license information.

## Files to Copy to Ops Repo

### 1. Core Script: `scripts/generate-badges.sh`

**Location in ops repo:** `scripts/generate-badges.sh`

**Purpose:** Standalone script that generates all badges. Can be called from CI workflows or run manually.

**Usage:**
```bash
./scripts/generate-badges.sh <COVERAGE_PERCENTAGE>
```

**Dependencies:**
- Node.js
- `scripts/templateDictReplace.mjs` (or similar template replacement tool)
- `images/svgs.yaml` (badge templates)
- `LICENSE` file in repo root

**Source:** `print2paper4vscode/scripts/generate-badges.sh`

### 2. Template Replacement Engine: `scripts/templateDictReplace.mjs`

**Location in ops repo:** `scripts/templateDictReplace.mjs`

**Purpose:** Generic template variable replacement tool that works with YAML templates and JSON dictionaries.

**Usage:**
```bash
node scripts/templateDictReplace.mjs --dict '{"key":"value",...}'
```

**Source:** `print2paper4vscode/scripts/templateDictReplace.mjs`

### 3. Badge Templates: `images/svgs.yaml`

**Location in ops repo:** `templates/badges/svgs.yaml` (or similar)

**Purpose:** SVG badge templates with placeholder variables.

**Templates:**
- `ci` - CI status badge
- `coverage` - Coverage percentage badge with color coding
- `license` - Dynamic license badge with auto-sizing

**Source:** `print2paper4vscode/images/svgs.yaml`

### 4. Configuration: `.config/templateDictReplace.yaml`

**Location in ops repo:** `templates/badges/templateDictReplace.yaml` (or similar)

**Purpose:** Configuration for template replacement specifying which templates to process.

**Source:** `print2paper4vscode/.config/templateDictReplace.yaml`

### 5. Documentation: `docs/BADGE_GENERATION.md`

**Location in ops repo:** `docs/badge-generation.md`

**Purpose:** Complete documentation for setting up and using badge generation in any repo.

**Source:** `print2paper4vscode/docs/BADGE_GENERATION.md`

## CI Workflow Integration

See `print2paper4vscode/.github/workflows/ci.yml` for a complete working example that includes:

1. **License extraction** (lines ~167-210)
2. **Badge generation** (lines ~212-230)
3. **Commit and push** (lines ~232-250)

Key features:
- Parses LICENSE file with flexible comment format support
- Calculates dynamic badge dimensions
- Determines coverage color thresholds
- Commits badges with `[skip ci]` to avoid loops

## Quick Setup for New Repos

1. Copy files from ops repo to new repo
2. Ensure LICENSE file uses supported format: `# License: Name v1`
3. Add badge generation step to CI workflow
4. Add badge references to README

## Reference Implementation

**Repository:** `appliedmedia/print2paper4vscode`
**Branch:** `cursor/readme-badge-improvements-ea6b`
**Files:**
- `.github/workflows/ci.yml` - Complete CI workflow
- `scripts/generate-badges.sh` - Badge generator script
- `scripts/templateDictReplace.mjs` - Template engine
- `images/svgs.yaml` - Badge templates
- `docs/BADGE_GENERATION.md` - Full documentation

## Key Improvements in This Implementation

1. **CI badge kerning fix** - Changed textLength from 170 to 130 for better spacing
2. **Dynamic license badge** - Auto-extracts from LICENSE file, adjusts width automatically
3. **Smart license parser** - Handles multiple comment formats (# // /* */)
4. **Complementary closing markers** - Properly strips */ when /* is detected at start
5. **Reusable script** - Self-contained bash script for easy integration

## Next Steps

1. Review files and documentation
2. Decide on directory structure in ops repo
3. Copy files to ops repo
4. Create example README or guide for using across repos
5. Update other Applied Media repos to use this workflow

## Testing

The workflow has been tested with:
- Current LICENSE format: `# License: Code Transparency v1`
- Block comment format: `/* License: BSD-Foo */`
- Line comment format: `// Apache License 2.0`
- Hash comment format: `# MIT License`

All formats extract correctly and generate properly sized badges.
