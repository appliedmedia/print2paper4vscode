# Badge generation for README files

Reusable badge generation system for creating dynamic SVG badges in README files.

## What this generates

Three types of badges:
1. **CI Status** - Shows "CI: passing" with improved kerning
2. **Test Coverage** - Shows percentage with color coding (green/yellow/orange/red)
3. **License** - Dynamically extracted from LICENSE file with auto-sizing

## Quick start

```bash
./generate-badges.sh 84.83
```

This generates three badges in your `images/` directory:
- `images/ci.svg`
- `images/coverage.svg` (with 84.83%)
- `images/license.svg` (extracted from LICENSE file)

## Files in this directory

- **`generate-badges.sh`** - Main badge generator script
- **`templateDictReplace.mjs`** - Template variable replacement engine
- **`svgs.yaml`** - SVG badge templates with placeholders
- **`templateDictReplace.yaml`** - Configuration for template processing
- **`README.md`** - This file

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

License badge automatically adjusts width based on text length using this formula:

```bash
CHAR_COUNT=${#LICENSE_NAME}
VALUE_TEXT_LENGTH=$((CHAR_COUNT * 65))
VALUE_WIDTH=$((VALUE_TEXT_LENGTH / 10 + 6))
TOTAL_WIDTH=$((51 + VALUE_WIDTH))
VALUE_X=$((510 + VALUE_WIDTH * 5))
```

## Setup for your repository

### 1. Copy files

```bash
mkdir -p scripts/badges4readmes
cp scripts/badges4readmes/* your-repo/scripts/badges4readmes/
```

### 2. Create LICENSE file

Use a supported format:
```
# License: Your License Name v1
```

### 3. Create badge templates directory

Ensure you have:
- `images/` directory (or update paths in script)
- `svgs.yaml` with badge templates
- `.config/templateDictReplace.yaml` config file

### 4. Run generator

```bash
./scripts/badges4readmes/generate-badges.sh 84.83
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
    ./scripts/badges4readmes/generate-badges.sh ${{ steps.coverage.outputs.percentage }}

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

./generate-badges.sh 85.0
```

## Troubleshooting

**"Template replacement script not found"**
- Ensure `templateDictReplace.mjs` is in the same directory or set `TEMPLATE_SCRIPT`

**"License: Unknown"**
- Check LICENSE file exists and contains "License" (case insensitive)
- Verify LICENSE file uses a supported comment format

**Badge dimensions look wrong**
- Check `svgs.yaml` has correct template placeholders
- Verify calculation formulas in `generate-badges.sh`

**Coverage color not updating**
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
