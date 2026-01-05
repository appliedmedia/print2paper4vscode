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
#   ./badges4readmes.sh <coverage_percentage>
#
#   Example: ./badges4readmes.sh 84.83
#
# ARGUMENTS:
#   coverage_percentage - Test coverage as decimal number (0-100)
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
#   - jq (for safe JSON construction)
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
#   - project_root    - Repository root (auto-detected)
#   - license_file    - Path to LICENSE file (default: $project_root/LICENSE)
#   - images_dir      - Output directory (default: $project_root/images)
#   - template_script - Path to templateDictReplace.mjs (auto-detected)
#
# INTEGRATION:
#   Typically called from CI workflow after test coverage generation:
#
#   - name: Generate badges
#     run: |
#       coverage=$(extract_from_test_output)
#       ./scripts/badges4readmes/badges4readmes.sh $coverage
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
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-detect project root
# Script is in scripts/badges4readmes/, so go up 2 levels to get project root
if [ -f "$script_dir/../../LICENSE" ]; then
  project_root="$(cd "$script_dir/../.." && pwd)"
elif [ -f "$script_dir/../LICENSE" ]; then
  project_root="$(cd "$script_dir/.." && pwd)"
else
  project_root="$script_dir"
fi

license_file="${license_file:-$project_root/LICENSE}"
images_dir="${images_dir:-$project_root/images}"

# Template script can be in same directory, sibling directory, or in scripts/
if [ -f "$script_dir/templateDictReplace.mjs" ]; then
  template_script="${template_script:-$script_dir/templateDictReplace.mjs}"
elif [ -f "$script_dir/../templateDictReplace/templateDictReplace.mjs" ]; then
  template_script="${template_script:-$script_dir/../templateDictReplace/templateDictReplace.mjs}"
else
  template_script="${template_script:-$project_root/scripts/templateDictReplace.mjs}"
fi

# Parse arguments
coverage_percentage="${1:-0}"

# Validate coverage percentage
if ! [[ "$coverage_percentage" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
  echo "ERROR: Coverage percentage must be a numeric value (integer or decimal)."
  echo "  Received: '$coverage_percentage'"
  echo "  Expected: A number between 0 and 100 (e.g., 84.83)"
  exit 1
fi

# Check coverage is within valid range (0-100)
if ! awk "BEGIN {exit !($coverage_percentage >= 0 && $coverage_percentage <= 100)}"; then
  echo "ERROR: Coverage percentage must be between 0 and 100."
  echo "  Received: $coverage_percentage"
  exit 1
fi

# Check for required dependencies
if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed."
  echo "Install it with: sudo apt-get install jq (Debian/Ubuntu)"
  echo "                 brew install jq (macOS)"
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is required but not installed."
  echo "Install it with: sudo apt-get install nodejs npm (Debian/Ubuntu)"
  echo "                 brew install node (macOS)"
  exit 1
fi

echo "=========================================="
echo "Badge Generation Script"
echo "=========================================="
echo "Project Root: $project_root"
echo "Coverage: ${coverage_percentage}%"
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
license_name=$(extract_license "$license_file")
echo "  License: '$license_name'"
echo ""

echo "Step 2: Calculating coverage badge color..."
# Color thresholds: green>=80%, yellow>=60%, orange>=40%, red<40%
color_hex="e05d44"  # red
if awk "BEGIN {exit !($coverage_percentage >= 80)}"; then
  color_hex="97ca00"  # green
elif awk "BEGIN {exit !($coverage_percentage >= 60)}"; then
  color_hex="dfb317"  # yellow
elif awk "BEGIN {exit !($coverage_percentage >= 40)}"; then
  color_hex="fe7d37"  # orange
fi
echo "  Coverage color: #$color_hex"
echo ""

echo "Step 3: Calculating license badge dimensions..."
IFS=',' read -r total_width value_width value_x value_text_length <<< "$(calculate_badge_dimensions "$license_name")"
echo "  Width: $total_width, Value Width: $value_width, Value X: $value_x, Text Length: $value_text_length"
echo ""

echo "Step 4: Generating badges..."
if [ ! -f "$template_script" ]; then
  echo "ERROR: Template replacement script not found: $template_script"
  exit 1
fi

# Generate all badges using template replacement
json_dict=$(jq -n \
  --arg coverage "$coverage_percentage" \
  --arg colorHex "$color_hex" \
  --arg licenseName "$license_name" \
  --arg width "$total_width" \
  --arg valueWidth "$value_width" \
  --arg valueX "$value_x" \
  --arg valueTextLength "$value_text_length" \
  '{coverage: $coverage, colorHex: $colorHex, licenseName: $licenseName, width: $width, valueWidth: $valueWidth, valueX: $valueX, valueTextLength: $valueTextLength}')

node "$template_script" --dict "$json_dict"

echo ""
echo "=========================================="
echo "Badge Generation Complete!"
echo "=========================================="
echo "Generated badges:"
echo "  - $images_dir/ci.svg"
echo "  - $images_dir/coverage.svg (${coverage_percentage}%)"
echo "  - $images_dir/license.svg ($license_name)"
echo ""
