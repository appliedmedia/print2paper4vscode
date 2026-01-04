# Badge Generation Workflow

This document describes the reusable badge generation workflow that can be shared across Applied Media repositories.

## Overview

The badge generation system creates three dynamic SVG badges:
1. **CI Status** - Shows "CI: passing" 
2. **Test Coverage** - Shows coverage percentage with color coding
3. **License** - Dynamically extracts and displays license information

## Components

### 1. License Parser

The license parser extracts license information from the `LICENSE` file:

```bash
# Parser logic:
# 1. Find first line containing "License" (case insensitive)
# 2. Strip leading comment markers (# // /*) + spaces
# 3. If contains "License:" → strip everything up to and including "License:" + spaces
# 4. If started with /* → strip trailing */
# 5. Remove quotes and trim
```

**Supported formats:**
- `# License: MIT` → `MIT`
- `# "Code Transparency" License v1` → `Code Transparency License v1`
- `/* License: BSD 3-Clause */` → `BSD 3-Clause`
- `// Apache License 2.0` → `Apache License 2.0`

### 2. Badge Templates (`images/svgs.yaml`)

```yaml
coverage: |
  <svg xmlns="http://www.w3.org/2000/svg" width="114" height="20" ...>
  # Template with {{coverage}} and {{colorHex}} placeholders

ci: |
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="20" ...>
  # Static "CI: passing" badge with improved kerning

license: |
  <svg xmlns="http://www.w3.org/2000/svg" width="{{width}}" height="20" ...>
  # Dynamic badge with {{licenseName}}, {{width}}, {{valueWidth}}, etc.
```

### 3. Template Replacement (`scripts/templateDictReplace.mjs`)

Node.js script that:
- Reads YAML templates
- Applies variable replacements
- Outputs SVG files

### 4. Badge Generation Script (`scripts/generate-badges.sh`)

Bash script that orchestrates the entire process:
- Extracts license information
- Calculates badge dimensions
- Determines coverage color
- Generates all badges via templateDictReplace.mjs

## Usage

### In CI Workflow

```yaml
- name: Extract license info
  id: license
  run: |
    # License extraction logic here
    
- name: Generate badges
  run: |
    COVERAGE=${{ steps.coverage.outputs.percentage }}
    LICENSE_NAME="${{ steps.license.outputs.name }}"
    
    # Calculate dimensions
    LICENSE_CHAR_COUNT=${#LICENSE_NAME}
    VALUE_TEXT_LENGTH=$((LICENSE_CHAR_COUNT * 65))
    VALUE_WIDTH=$((VALUE_TEXT_LENGTH / 10 + 6))
    TOTAL_WIDTH=$((51 + VALUE_WIDTH))
    VALUE_X=$((510 + VALUE_WIDTH * 5))
    
    # Generate badges
    node scripts/templateDictReplace.mjs --dict "{\"coverage\":\"$COVERAGE\",\"colorHex\":\"$COLOR_HEX\",\"licenseName\":\"$LICENSE_NAME\",\"width\":\"$TOTAL_WIDTH\",\"valueWidth\":\"$VALUE_WIDTH\",\"valueX\":\"$VALUE_X\",\"valueTextLength\":\"$VALUE_TEXT_LENGTH\"}"

- name: Commit and push badges
  run: |
    git add images/coverage.svg images/ci.svg images/license.svg
    git commit -m "Update badges [skip ci]"
    git push
```

### Standalone Usage

```bash
# Generate badges with 84.83% coverage
./scripts/generate-badges.sh 84.83
```

## Setup for New Repositories

1. **Copy required files:**
   - `scripts/generate-badges.sh`
   - `scripts/templateDictReplace.mjs`
   - `images/svgs.yaml`
   - `.config/templateDictReplace.yaml`

2. **Create LICENSE file with supported format:**
   ```
   # License: Your License Name v1
   ```

3. **Add to CI workflow:**
   See `.github/workflows/ci.yml` for complete example

4. **Add badges to README:**
   ```markdown
   [![CI](images/ci.svg)](https://github.com/org/repo/actions)
   [![Coverage](images/coverage.svg)](https://github.com/org/repo/actions)
   [![License](images/license.svg)](https://github.com/org/repo/blob/main/LICENSE)
   ```

## Key Improvements

### CI Badge Kerning Fix
- **Before**: `textLength="170"` made "CI" look like "C I"
- **After**: `textLength="130"` for proper character spacing

### Dynamic License Badge
- Automatically adjusts width based on license name length
- Parses multiple license file formats
- Handles comment markers correctly (including complementary closing markers)

## Files Reference

From `print2paper4vscode` repository:
- `.github/workflows/ci.yml` - Complete CI workflow with badge generation
- `scripts/generate-badges.sh` - Standalone badge generator
- `scripts/templateDictReplace.mjs` - Template replacement engine
- `images/svgs.yaml` - Badge templates
- `.config/templateDictReplace.yaml` - Template replacement config

## Coverage Color Thresholds

- **Green** (#97ca00): >= 80%
- **Yellow** (#dfb317): >= 60%
- **Orange** (#fe7d37): >= 40%
- **Red** (#e05d44): < 40%

## Badge Dimensions Calculation

For license badge:
```bash
CHAR_COUNT=${#LICENSE_NAME}
VALUE_TEXT_LENGTH=$((CHAR_COUNT * 65))
VALUE_WIDTH=$((VALUE_TEXT_LENGTH / 10 + 6))
TOTAL_WIDTH=$((51 + VALUE_WIDTH))
VALUE_X=$((510 + VALUE_WIDTH * 5))
```

This ensures proper text fitting regardless of license name length.
