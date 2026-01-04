#!/bin/bash
################################################################################
# badges4readmes.sh - Dynamic SVG badge generator for README files
################################################################################
#
# OVERVIEW:
#   Generates three types of SVG badges for repository README files:
#   1. CI Status - Static "CI: passing" badge with fixed kerning
#   2. Test Coverage - Dynamic badge showing coverage % with color coding
#   3. License - Automatically extracts license name from LICENSE file
#
# USAGE:
#   ./badges4readmes.sh <COVERAGE_PERCENTAGE>
#
#   Example: ./badges4readmes.sh 84.83
#
# ARGUMENTS:
#   COVERAGE_PERCENTAGE - Test coverage as decimal number (0-100)
#                        Used to generate coverage badge with appropriate color
#
# OUTPUT:
#   Creates/updates three SVG files in project images/ directory:
#   - images/ci.svg       (CI: passing)
#   - images/coverage.svg (Coverage: XX.X%)
#   - images/license.svg  (License: <extracted from LICENSE file>)
#
# REQUIREMENTS:
#   - Node.js (for template replacement)
#   - LICENSE file in repository root
#   - svgs.yaml with badge templates (in same directory as this script)
#   - templateDictReplace.mjs (in sibling directory or same dir)
#
# LICENSE PARSER:
#   Extracts license name from LICENSE file using flexible parsing:
#   1. Finds first line containing "License" (case insensitive)
#   2. Strips leading comment markers: # // /*
#   3. If line contains "License:", strips everything before it
#   4. If started with /*, strips trailing */
#   5. Removes quotes and trims whitespace
#
#   Supported formats:
#   - # License: MIT                      → MIT
#   - # "Code Transparency" License v1    → Code Transparency License v1
#   - /* License: BSD 3-Clause */         → BSD 3-Clause
#   - // Apache License 2.0               → Apache License 2.0
#
# COVERAGE COLORS:
#   Coverage percentage determines badge color:
#   - Green  (#97ca00): >= 80%
#   - Yellow (#dfb317): >= 60%
#   - Orange (#fe7d37): >= 40%
#   - Red    (#e05d44): <  40%
#
# BADGE DIMENSIONS:
#   License badge width auto-calculated based on text length:
#   - Base label width: 51px
#   - Character width: ~6.5px per character
#   - Formula: total_width = 51 + (char_count * 6.5 + 6)
#   - SVG coordinates scaled by factors for proper rendering
#
# ENVIRONMENT VARIABLES:
#   Override default paths if needed:
#   - PROJECT_ROOT    - Repository root (auto-detected)
#   - LICENSE_FILE    - Path to LICENSE file (default: $PROJECT_ROOT/LICENSE)
#   - IMAGES_DIR      - Output directory (default: $PROJECT_ROOT/images)
#   - TEMPLATE_SCRIPT - Path to templateDictReplace.mjs (auto-detected)
#
# INTEGRATION:
#   Typically called from CI workflow after test coverage generation:
#
#   - name: Generate badges
#     run: |
#       COVERAGE=$(extract_from_test_output)
#       ./scripts/badges4readmes/badges4readmes.sh $COVERAGE
#
#   - name: Commit badges
#     run: |
#       git add images/*.svg
#       git commit -m "Update badges [skip ci]"
#       git push
#
# ERROR HANDLING:
#   Script exits with error code 1 if:
#   - LICENSE file not found (outputs: Unknown)
#   - Template script not found
#   - Template replacement fails
#
# DEPENDENCIES:
#   - templateDictReplace.mjs: Performs variable substitution in SVG templates
#   - svgs.yaml: Contains SVG badge templates with {{placeholder}} variables
#   - templateDictReplace.yaml: Configuration for template processing
#
# SEE ALSO:
#   - README.md (this directory): Complete usage guide and examples
#   - ../templateDictReplace/templateDictReplace.mjs: Template engine docs
#
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-detect project root
# Script is in scripts/badges4readmes/, so go up 2 levels to get project root
if [ -f "$SCRIPT_DIR/../../LICENSE" ]; then
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
elif [ -f "$SCRIPT_DIR/../LICENSE" ]; then
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  PROJECT_ROOT="$SCRIPT_DIR"
fi

LICENSE_FILE="${LICENSE_FILE:-$PROJECT_ROOT/LICENSE}"
IMAGES_DIR="${IMAGES_DIR:-$PROJECT_ROOT/images}"

# Template script can be in same directory, sibling directory, or in scripts/
if [ -f "$SCRIPT_DIR/templateDictReplace.mjs" ]; then
  TEMPLATE_SCRIPT="${TEMPLATE_SCRIPT:-$SCRIPT_DIR/templateDictReplace.mjs}"
elif [ -f "$SCRIPT_DIR/../templateDictReplace/templateDictReplace.mjs" ]; then
  TEMPLATE_SCRIPT="${TEMPLATE_SCRIPT:-$SCRIPT_DIR/../templateDictReplace/templateDictReplace.mjs}"
else
  TEMPLATE_SCRIPT="${TEMPLATE_SCRIPT:-$PROJECT_ROOT/scripts/templateDictReplace.mjs}"
fi

# Parse arguments
COVERAGE_PERCENTAGE="${1:-0}"

echo "=========================================="
echo "Badge Generation Script"
echo "=========================================="
echo "Project Root: $PROJECT_ROOT"
echo "Coverage: ${COVERAGE_PERCENTAGE}%"
echo ""

# ==========================================
# Extract License Information
# ==========================================
extract_license() {
  local license_file="$1"
  
  if [ ! -f "$license_file" ]; then
    echo "Unknown"
    return
  fi
  
  # Parse LICENSE file:
  # 1. Find first line containing "License" (case insensitive)
  # 2. Strip leading comment markers (# // /*) + spaces
  # 3. If contains "License:" → strip everything up to and including "License:" + spaces
  # 4. If started with /* → strip trailing */
  # 5. Remove quotes and trim
  
  local license_line
  license_line=$(grep -i "license" "$license_file" | head -1)
  
  if [ -z "$license_line" ]; then
    echo "Unknown"
    return
  fi
  
  # Check if line starts with /* (multi-line comment)
  local has_block_comment=false
  if echo "$license_line" | grep -qE '^[[:space:]]*\/\*'; then
    has_block_comment=true
  fi
  
  # Strip leading comment markers and spaces
  local license_text
  license_text=$(echo "$license_line" | sed -E 's/^[[:space:]]*(#|\/\/|\/\*)[[:space:]]*//')
  
  # If contains "License:", strip everything up to and including it
  if echo "$license_text" | grep -qi "license:"; then
    license_text=$(echo "$license_text" | sed -E 's/^.*[Ll]icense:[[:space:]]*//')
  fi
  
  # Remove trailing */ if we had /* at start
  if [ "$has_block_comment" = true ]; then
    license_text=$(echo "$license_text" | sed -E 's/[[:space:]]*\*\/[[:space:]]*$//')
  fi
  
  # Remove quotes and trim trailing spaces
  license_text=$(echo "$license_text" | sed 's/"//g' | sed -E 's/[[:space:]]*$//')
  
  echo "$license_text"
}

# ==========================================
# Calculate Badge Dimensions
# ==========================================
calculate_badge_dimensions() {
  local text="$1"
  local char_count=${#text}
  
  # SVG badge dimensions calculation
  # Character width: ~6.5 pixels per character at font-size 110
  local value_text_length=$((char_count * 65))
  local value_width=$((value_text_length / 10 + 6))
  local total_width=$((51 + value_width))
  local value_x=$((510 + value_width * 5))
  
  echo "$total_width,$value_width,$value_x,$value_text_length"
}

# ==========================================
# Main Execution
# ==========================================

echo "Step 1: Extracting license information..."
LICENSE_NAME=$(extract_license "$LICENSE_FILE")
echo "  License: '$LICENSE_NAME'"
echo ""

echo "Step 2: Calculating coverage badge color..."
# Color thresholds: green>=80%, yellow>=60%, orange>=40%, red<40%
COLOR_HEX="e05d44"  # red
if awk "BEGIN {exit !($COVERAGE_PERCENTAGE >= 80)}"; then
  COLOR_HEX="97ca00"  # green
elif awk "BEGIN {exit !($COVERAGE_PERCENTAGE >= 60)}"; then
  COLOR_HEX="dfb317"  # yellow
elif awk "BEGIN {exit !($COVERAGE_PERCENTAGE >= 40)}"; then
  COLOR_HEX="fe7d37"  # orange
fi
echo "  Coverage color: #$COLOR_HEX"
echo ""

echo "Step 3: Calculating license badge dimensions..."
IFS=',' read -r TOTAL_WIDTH VALUE_WIDTH VALUE_X VALUE_TEXT_LENGTH <<< "$(calculate_badge_dimensions "$LICENSE_NAME")"
echo "  Width: $TOTAL_WIDTH, Value Width: $VALUE_WIDTH, Value X: $VALUE_X, Text Length: $VALUE_TEXT_LENGTH"
echo ""

echo "Step 4: Generating badges..."
if [ ! -f "$TEMPLATE_SCRIPT" ]; then
  echo "ERROR: Template replacement script not found: $TEMPLATE_SCRIPT"
  exit 1
fi

# Generate all badges using template replacement
node "$TEMPLATE_SCRIPT" --config "$SCRIPT_DIR/templateDictReplace.yaml" --dict "{\"coverage\":\"$COVERAGE_PERCENTAGE\",\"colorHex\":\"$COLOR_HEX\",\"licenseName\":\"$LICENSE_NAME\",\"width\":\"$TOTAL_WIDTH\",\"valueWidth\":\"$VALUE_WIDTH\",\"valueX\":\"$VALUE_X\",\"valueTextLength\":\"$VALUE_TEXT_LENGTH\"}"

echo ""
echo "=========================================="
echo "Badge Generation Complete!"
echo "=========================================="
echo "Generated badges:"
echo "  - $IMAGES_DIR/ci.svg"
echo "  - $IMAGES_DIR/coverage.svg (${COVERAGE_PERCENTAGE}%)"
echo "  - $IMAGES_DIR/license.svg ($LICENSE_NAME)"
echo ""
