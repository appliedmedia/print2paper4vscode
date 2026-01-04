# Badge generation for README files

Reusable badge generation system for creating dynamic SVG badges in README files.

## Primary documentation

**See [`badges4readmes.sh`](./badges4readmes.sh)** for complete documentation including:

- Overview of badge types (CI, Coverage, License)
- Usage and arguments
- License parser logic and supported formats
- Coverage color thresholds
- Badge dimension calculations
- Environment variables
- CI integration examples
- Error handling

The script header contains comprehensive inline documentation.

## Quick start

```bash
./badges4readmes.sh 84.83
```

This generates three badges in your `images/` directory:

- `images/ci.svg`
- `images/coverage.svg` (with 84.83%)
- `images/license.svg` (extracted from LICENSE file)

## Files in this directory

- **`badges4readmes.sh`** - Main badge generator script
- **`svgs.yaml`** - SVG badge templates with placeholders
- **`templateDictReplace.yaml`** - Configuration for template processing (used with `--config` flag)
- **`README.md`** - This file

**Architecture note:** This directory uses the shared `templateDictReplace.mjs` from `../templateDictReplace/` but has its own config file (`templateDictReplace.yaml`) that specifies badge-specific input/output paths. The script passes `--config` to tell templateDictReplace which config to use.

## How it works

### 1. License extraction

Parses your `LICENSE` file to extract the license name:

**Supported formats:**

```bash
# License: MIT                     → MIT
# "Code Transparency" License v1   → Code Transparency License v1
/* License: BSD 3-Clause */        → BSD 3-Clause
// Apache License 2.0              → Apache License 2.0
```

**Parser logic:**

1. Find first line containing "License" (case insensitive)
2. Strip leading comment markers (`#`, `//`, `/*`) + spaces
3. If contains "License:" → strip everything up to and including "License:" + spaces
4. If started with `/*` → strip trailing `*/`
5. Remove quotes and trim

### 2. Coverage color thresholds

- **Green** (#97ca00): >= 80%
- **Yellow** (#dfb317): >= 60%
- **Orange** (#fe7d37): >= 40%
- **Red** (#e05d44): < 40%

### 3. Dynamic badge sizing

License badge automatically adjusts width based on text length.

**Implementation**: See `calculate_badge_dimensions()` function in [`badges4readmes.sh`](./badges4readmes.sh) (lines ~97-109) for the canonical dimension calculation formulas.

## Setup for your repository

### 1. Copy files

```bash
mkdir -p scripts/badges4readmes
cp scripts/badges4readmes/* your-repo/scripts/badges4readmes/
```

### 2. Create LICENSE file

Use a supported format:

```text
# License: Your License Name v1
```

### 3. Create badge templates directory

Ensure you have:

- `images/` directory (or update paths in script)
- `svgs.yaml` with badge templates
- `.config/templateDictReplace.yaml` config file

### 4. Run generator

```bash
./scripts/badges4readmes/badges4readmes.sh 84.83
```

### 5. Add to README

```markdown
[![CI](images/ci.svg)](https://github.com/org/repo/actions)
[![Coverage](images/coverage.svg)](https://github.com/org/repo/actions)
[![License](images/license.svg)](https://github.com/org/repo/blob/main/LICENSE)
```

## CI workflow integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Extract coverage percentage
  id: coverage
  run: |
    COVERAGE=$(grep "All files" coverage.txt | awk '{print $4}' | sed 's/%//')
    echo "percentage=${COVERAGE}" >> $GITHUB_OUTPUT

- name: Generate badges
  run: |
    ./scripts/badges4readmes/badges4readmes.sh ${{ steps.coverage.outputs.percentage }}

- name: Commit badges
  run: |
    git add images/*.svg
    git commit -m "Update badges [skip ci]"
    git push
```

For complete CI workflow example, see the reference implementation in `appliedmedia/print2paper4vscode`.

## Environment variables

You can override default paths:

```bash
export PROJECT_ROOT=/custom/path
export LICENSE_FILE=/custom/LICENSE
export IMAGES_DIR=/custom/images
export TEMPLATE_SCRIPT=/custom/templateDictReplace.mjs

./badges4readmes.sh 85.0
```

## Troubleshooting

### Template replacement script not found

- Ensure `templateDictReplace.mjs` is in the same directory or set `TEMPLATE_SCRIPT`

### License: Unknown

- Check LICENSE file exists and contains "License" (case insensitive)
- Verify LICENSE file uses a supported comment format

### Badge dimensions look wrong

- Check `svgs.yaml` has correct template placeholders
- Verify calculation formulas in `badges4readmes.sh`

### Coverage color not updating

- Check coverage percentage is passed as first argument
- Verify `awk` is available for threshold calculations

## Key improvements

### CI badge kerning fix

- **Before**: `textLength="170"` made "CI" look like "C I"
- **After**: `textLength="130"` for proper character spacing

### Complementary comment marker handling

- Correctly strips `*/` when `/*` is detected at start
- Prevents output like "BSD-Foo */"

## Source

This workflow was developed in `appliedmedia/print2paper4vscode` and shared via `appliedmedia/ops`.

For complete documentation, see `docs/badges.md` in the ops repository.
