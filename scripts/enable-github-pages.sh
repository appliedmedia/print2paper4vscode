#!/bin/bash

# Enable GitHub Pages for Applied Media web presence repositories
# Requires: GH_TOKEN environment variable with repo access, jq
# Usage: ./enable-github-pages.sh

set -e

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    echo "Install with: sudo apt-get install jq (Debian/Ubuntu) or brew install jq (macOS)"
    exit 1
fi

# Check if GH_TOKEN is set
if [ -z "$GH_TOKEN" ]; then
    echo "Error: GH_TOKEN environment variable is not set"
    echo "Please set it with: export GH_TOKEN=your_github_token"
    exit 1
fi

# GitHub API configuration
API_BASE="https://api.github.com"
ORG="appliedmedia"

# Repo -> Domain mapping (associative array for safety)
declare -A REPO_DOMAINS=(
    ["print2paper4vscode.com"]="print2paper4vscode.com"
    ["gmail2trello.com"]="gmail2trello.com"
    ["cov.llc"]="cov.llc"
)

# Track failed repos
FAILED_REPOS=()

echo "=================================="
echo "Enabling GitHub Pages"
echo "Organization: $ORG"
echo "=================================="
echo ""

for REPO in "${!REPO_DOMAINS[@]}"; do
    DOMAIN="${REPO_DOMAINS[$REPO]}"
    
    echo "Processing: $ORG/$REPO"
    echo "  Domain: $DOMAIN"
    
    # Enable GitHub Pages using the GitHub API
    # Reference: https://docs.github.com/en/rest/pages/pages?apiVersion=2022-11-28#create-a-github-pages-site
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$API_BASE/repos/$ORG/$REPO/pages" \
        -d "{\"source\":{\"branch\":\"main\",\"path\":\"/\"}}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "201" ]; then
        echo "  ✅ GitHub Pages enabled successfully"
    elif [ "$HTTP_CODE" = "409" ]; then
        echo "  ℹ️  GitHub Pages already enabled"
    else
        echo "  ❌ Failed with HTTP $HTTP_CODE"
        echo "  Response: $BODY"
        FAILED_REPOS+=("$REPO")
    fi
    
    echo ""
done

echo "=================================="
echo "Creating CNAME files in repos"
echo "=================================="
echo ""

for REPO in "${!REPO_DOMAINS[@]}"; do
    DOMAIN="${REPO_DOMAINS[$REPO]}"
    
    # Skip if this repo failed Pages enablement
    if [[ " ${FAILED_REPOS[@]} " =~ " ${REPO} " ]]; then
        echo "Processing: $ORG/$REPO"
        echo "  ⏭️  Skipping CNAME creation (Pages enablement failed)"
        echo ""
        continue
    fi
    
    echo "Processing: $ORG/$REPO"
    
    # Check if CNAME file already exists
    CHECK_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$API_BASE/repos/$ORG/$REPO/contents/CNAME")
    
    CHECK_CODE=$(echo "$CHECK_RESPONSE" | tail -n1)
    
    if [ "$CHECK_CODE" = "200" ]; then
        # CNAME exists, verify content matches expected domain
        EXISTING_CONTENT=$(echo "$CHECK_RESPONSE" | sed '$d' | jq -r '.content' | base64 -d 2>/dev/null || echo "")
        if [ "$EXISTING_CONTENT" = "$DOMAIN" ]; then
            echo "  ℹ️  CNAME file already exists with correct domain"
            echo ""
            continue
        else
            echo "  ⚠️  CNAME exists but contains: '$EXISTING_CONTENT' (expected: '$DOMAIN')"
            echo "     Updating CNAME file..."
            # Get SHA for update
            EXISTING_SHA=$(echo "$CHECK_RESPONSE" | sed '$d' | jq -r '.sha')
        fi
    else
        EXISTING_SHA=""
    fi
    
    # Create or update CNAME file
    # Base64 encode the domain name
    CONTENT_BASE64=$(printf '%s' "$DOMAIN" | base64)
    
    # Build request body
    if [ -n "$EXISTING_SHA" ]; then
        REQUEST_BODY="{\"message\":\"Update CNAME to $DOMAIN\",\"content\":\"$CONTENT_BASE64\",\"sha\":\"$EXISTING_SHA\"}"
    else
        REQUEST_BODY="{\"message\":\"Add CNAME for GitHub Pages\",\"content\":\"$CONTENT_BASE64\"}"
    fi
    
    CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$API_BASE/repos/$ORG/$REPO/contents/CNAME" \
        -d "$REQUEST_BODY")
    
    CREATE_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
    CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
    
    if [ "$CREATE_CODE" = "201" ]; then
        echo "  ✅ CNAME file created: $DOMAIN"
    elif [ "$CREATE_CODE" = "200" ]; then
        echo "  ✅ CNAME file updated: $DOMAIN"
    else
        echo "  ❌ Failed to create/update CNAME with HTTP $CREATE_CODE"
        echo "  Response: $CREATE_BODY"
    fi
    
    echo ""
done

echo "=================================="
echo "Summary"
echo "=================================="
echo ""

if [ ${#FAILED_REPOS[@]} -eq 0 ]; then
    echo "✅ All repositories configured successfully"
else
    echo "⚠️  Some repositories failed:"
    for REPO in "${FAILED_REPOS[@]}"; do
        echo "  - $REPO"
    done
fi

echo ""
echo "Next steps:"
echo "1. Configure DNS A records for each domain:"
echo "   - Add 4 A records pointing to GitHub Pages IPs:"
echo "     * 185.199.108.153"
echo "     * 185.199.109.153"
echo "     * 185.199.110.153"
echo "     * 185.199.111.153"
echo ""
echo "2. Create index.html in each repository"
echo ""
echo "3. Wait for DNS propagation (up to 24 hours, usually 1-2 hours)"
echo ""
echo "4. Verify sites are live:"
echo "   - https://print2paper4vscode.com"
echo "   - https://gmail2trello.com"
echo "   - https://cov.llc"
echo ""
