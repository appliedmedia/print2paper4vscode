#!/bin/bash

# Configure DNS A records for Applied Media domains using Dynadot API
# Requires: DYNADOT_API_KEY environment variable
# Usage: ./configure-dynadot-dns.sh

set -e

# Check if API key is set
if [ -z "$DYNADOT_API_KEY" ]; then
    echo "Error: DYNADOT_API_KEY environment variable is not set"
    echo "Get your API key from: https://www.dynadot.com/account/domain/setting/api.html"
    echo "Then set it with: export DYNADOT_API_KEY=your_api_key"
    exit 1
fi

# Dynadot API configuration
API_BASE="https://api.dynadot.com/api3.json"
API_KEY="$DYNADOT_API_KEY"

# GitHub Pages IPs
GITHUB_IPS=(
    "185.199.108.153"
    "185.199.109.153"
    "185.199.110.153"
    "185.199.111.153"
)

# Domains to configure
DOMAINS=(
    "p2p4vsc.com"
    "g2t.cc"
    "cov.llc"
)

echo "=================================="
echo "Configuring DNS for Applied Media"
echo "=================================="
echo ""

for DOMAIN in "${DOMAINS[@]}"; do
    echo "Processing: $DOMAIN"
    
    # Dynadot API command to set DNS records
    # API Reference: https://www.dynadot.com/community/help/question/set-dns2
    
    # Build the DNS records parameter string
    # For A records, format is: main_record_type0=a&main_record0=IP
    DNS_PARAMS=""
    for i in "${!GITHUB_IPS[@]}"; do
        IP="${GITHUB_IPS[$i]}"
        DNS_PARAMS="${DNS_PARAMS}&main_record_type${i}=a&main_record${i}=${IP}"
    done
    
    # Make API request to set DNS
    RESPONSE=$(curl -s "${API_BASE}?key=${API_KEY}&command=set_dns2&domain=${DOMAIN}${DNS_PARAMS}")
    
    # Check response
    if echo "$RESPONSE" | grep -q '"SetDns2Response"'; then
        STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$STATUS" = "success" ]; then
            echo "  ✅ DNS configured successfully"
            echo "     Added 4 A records pointing to GitHub Pages"
        else
            echo "  ❌ Failed to configure DNS"
            echo "     Response: $RESPONSE"
        fi
    else
        echo "  ❌ API request failed"
        echo "     Response: $RESPONSE"
    fi
    
    echo ""
done

echo "=================================="
echo "Summary"
echo "=================================="
echo ""
echo "✅ DNS configuration complete"
echo ""
echo "Note: DNS changes may take up to 48 hours to propagate globally,"
echo "but usually complete within 1-2 hours."
echo ""
echo "Test propagation with:"
echo "  dig p2p4vsc.com"
echo "  dig g2t.cc"
echo "  dig cov.llc"
echo ""
echo "Once propagated, verify sites are live:"
echo "  - https://p2p4vsc.com"
echo "  - https://g2t.cc"
echo "  - https://cov.llc"
echo ""
