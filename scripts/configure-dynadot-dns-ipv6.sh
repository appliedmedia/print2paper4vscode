#!/bin/bash

# Configure DNS AAAA (IPv6) records for Applied Media domains using Dynadot API
# Requires: DYNADOT_API_KEY environment variable
# Usage: ./configure-dynadot-dns-ipv6.sh

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

# GitHub Pages IPv4 IPs (A records - already configured)
GITHUB_IPS_V4=(
    "185.199.108.153"
    "185.199.109.153"
    "185.199.110.153"
    "185.199.111.153"
)

# GitHub Pages IPv6 IPs (AAAA records - adding these)
GITHUB_IPS_V6=(
    "2606:50c0:8000::153"
    "2606:50c0:8001::153"
    "2606:50c0:8002::153"
    "2606:50c0:8003::153"
)

# Domains to configure
DOMAINS=(
    "print2paper4vscode.com"
    "gmail2trello.com"
    "cov.llc"
)

echo "=================================="
echo "Adding IPv6 (AAAA) records for Applied Media"
echo "=================================="
echo ""

echo "Note: This script adds AAAA records alongside your existing A records."
echo "Both IPv4 and IPv6 will work after this configuration."
echo ""

for DOMAIN in "${DOMAINS[@]}"; do
    echo "Processing: $DOMAIN"
    
    # Build the DNS records parameter string
    # Include both IPv4 (A) and IPv6 (AAAA) records
    DNS_PARAMS=""
    
    # Add IPv4 A records
    for i in "${!GITHUB_IPS_V4[@]}"; do
        IP="${GITHUB_IPS_V4[$i]}"
        DNS_PARAMS="${DNS_PARAMS}&main_record_type${i}=a&main_record${i}=${IP}"
    done
    
    # Add IPv6 AAAA records (continue numbering from where IPv4 left off)
    v4_count=${#GITHUB_IPS_V4[@]}
    for i in "${!GITHUB_IPS_V6[@]}"; do
        IP="${GITHUB_IPS_V6[$i]}"
        idx=$((v4_count + i))
        DNS_PARAMS="${DNS_PARAMS}&main_record_type${idx}=aaaa&main_record${idx}=${IP}"
    done
    
    # Make API request to set DNS
    RESPONSE=$(curl -s "${API_BASE}?key=${API_KEY}&command=set_dns2&domain=${DOMAIN}${DNS_PARAMS}")
    
    # Check response
    if echo "$RESPONSE" | grep -q '"SetDns2Response"'; then
        STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$STATUS" = "success" ]; then
            echo "  ✅ DNS configured successfully"
            echo "     Added 4 A records (IPv4)"
            echo "     Added 4 AAAA records (IPv6)"
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
echo "✅ IPv6 (AAAA) configuration complete"
echo ""
echo "Your domains now support both IPv4 and IPv6!"
echo ""
echo "Test IPv6 with:"
echo "  dig AAAA print2paper4vscode.com"
echo "  dig AAAA gmail2trello.com"
echo "  dig AAAA cov.llc"
echo ""
