#!/bin/bash

# Enable GitHub Pages for Applied Media web presence repositories
# Requires: GH_TOKEN environment variable with repo access
# Usage: ./enable-github-pages.sh

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
    "p2p4vsc.com"
    "g2t.cc"
    "cov.llc"
)

# Domains for each repo
DOMAINS=(
    "print2paper4vscode.com"
    "gmail2trello.com"
    "cov.llc"
)

echo "=================================="
echo "Enabling GitHub Pages"
echo "Organization: $ORG"
echo "=================================="
echo ""

for i in "${!REPOS[@]}"; do
    REPO="${REPOS[$i]}"
    DOMAIN="${DOMAINS[$i]}"
    
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
    fi
    
    echo ""
done

echo "=================================="
echo "Creating CNAME files in repos"
echo "=================================="
echo ""

for i in "${!REPOS[@]}"; do
    REPO="${REPOS[$i]}"
    DOMAIN="${DOMAINS[$i]}"
    
    echo "Processing: $ORG/$REPO"
    
    # Check if CNAME file already exists
    CHECK_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$API_BASE/repos/$ORG/$REPO/contents/CNAME")
    
    CHECK_CODE=$(echo "$CHECK_RESPONSE" | tail -n1)
    
    if [ "$CHECK_CODE" = "200" ]; then
        echo "  ℹ️  CNAME file already exists"
        echo ""
        continue
    fi
    
    # Create CNAME file
    # Base64 encode the domain name
    CONTENT_BASE64=$(echo -n "$DOMAIN" | base64)
    
    CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GH_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$API_BASE/repos/$ORG/$REPO/contents/CNAME" \
        -d "{\"message\":\"Add CNAME for GitHub Pages\",\"content\":\"$CONTENT_BASE64\"}")
    
    CREATE_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
    CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
    
    if [ "$CREATE_CODE" = "201" ]; then
        echo "  ✅ CNAME file created: $DOMAIN"
    else
        echo "  ❌ Failed to create CNAME with HTTP $CREATE_CODE"
        echo "  Response: $CREATE_BODY"
    fi
    
    echo ""
done

echo "=================================="
echo "Summary"
echo "=================================="
echo ""
echo "✅ GitHub Pages configuration complete"
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
echo "   - https://p2p4vsc.com"
echo "   - https://g2t.cc"
echo "   - https://cov.llc"
echo ""
