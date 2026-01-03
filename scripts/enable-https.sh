#!/bin/bash

# Enable HTTPS enforcement for Applied Media GitHub Pages sites
# Requires: GH_TOKEN environment variable with repo access
# Usage: ./enable-https.sh

set -e

# Check if GH_TOKEN is set
if [ -z "$GH_TOKEN" ]; then
    echo "Error: GH_TOKEN environment variable is not set"
    echo "Please set it with: export GH_TOKEN=your_github_token"
    exit 1
fi

# GitHub API configuration
API_BASE="https://api.github.com"
ORG="appliedmedia"

# Repositories to configure
REPOS=(
    "print2paper4vscode.com"
    "gmail2trello.com"
    "cov.llc"
)

echo "=================================="
echo "Enabling HTTPS for GitHub Pages"
echo "Organization: $ORG"
echo "=================================="
echo ""

for REPO in "${REPOS[@]}"; do
    echo "Processing: $ORG/$REPO"
    
    # Update GitHub Pages to enforce HTTPS
    # Reference: https://docs.github.com/en/rest/pages/pages?apiVersion=2022-11-28#update-information-about-a-apiname-pages-site
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$API_BASE/repos/$ORG/$REPO/pages" \
        -d '{"https_enforced":true}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "  ✅ HTTPS enforcement enabled"
    elif [ "$HTTP_CODE" = "409" ]; then
        echo "  ⚠️  HTTPS not available yet (DNS may still be propagating)"
        echo "     GitHub will enable HTTPS automatically once DNS is verified"
    else
        echo "  ❌ Failed with HTTP $HTTP_CODE"
        echo "  Response: $BODY"
    fi
    
    echo ""
done

echo "=================================="
echo "Summary"
echo "=================================="
echo ""
echo "✅ HTTPS enforcement configuration complete"
echo ""
echo "Note: GitHub Pages may take a few minutes to provision SSL certificates"
echo "after DNS propagation completes."
echo ""
echo "Verify HTTPS is working:"
echo "  - https://print2paper4vscode.com"
echo "  - https://gmail2trello.com"
echo "  - https://cov.llc"
echo ""
