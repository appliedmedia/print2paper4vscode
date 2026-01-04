#!/bin/bash

# Configure DNS AAAA (IPv6) records for Applied Media domains using Dynadot API
# Requires: DYNADOT_API_KEY environment variable, jq
# Usage: ./configure-dynadot-dns-ipv6.sh

set -e

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    echo "Install with: sudo apt-get install jq (Debian/Ubuntu) or brew install jq (macOS)"
    exit 1
fi

# Check if API key is set
if [ -z "$DYNADOT_API_KEY" ]; then
    echo "Error: DYNADOT_API_KEY environment variable is not set"
    echo "Get your API key from: https://www.dynadot.com/account/domain/setting/api.html"
    echo "Then set it with: export DYNADOT_API_KEY=your_api_key"
    exit 1
fi

echo ""
echo "⚠️  SECURITY WARNING:"
echo "Dynadot's API requires the API key in the URL query string."
echo "This means the key may be visible in:"
echo "  - Process lists (ps aux)"
echo "  - Shell history"
echo "  - System logs"
echo "Recommendation: Rotate your API key after use."
echo ""
read -p "Press Enter to continue..."
echo ""

# Dynadot API configuration
API_BASE="https://api.dynadot.com/api3.json"
API_KEY="$DYNADOT_API_KEY"

# GitHub Pages IPv4 IPs (A records - will be set alongside AAAA)
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
    
    # Check response using jq for robust parsing
    if echo "$RESPONSE" | jq -e '.SetDns2Response' > /dev/null 2>&1; then
        STATUS=$(echo "$RESPONSE" | jq -r '.SetDns2Response.status // "unknown"')
        if [ "$STATUS" = "success" ]; then
            echo "  ✅ DNS configured successfully"
            echo "     Added 4 A records (IPv4)"
            echo "     Added 4 AAAA records (IPv6)"
            
            # Verify DNS records were actually set
            echo "  🔍 Verifying DNS records..."
            sleep 2  # Brief delay for API propagation
            
            # Check A records
            A_RECORDS=$(dig +short A "$DOMAIN" 2>/dev/null | sort)
            EXPECTED_A=$(printf '%s\n' "${GITHUB_IPS_V4[@]}" | sort)
            
            # Check AAAA records
            AAAA_RECORDS=$(dig +short AAAA "$DOMAIN" 2>/dev/null | sort)
            EXPECTED_AAAA=$(printf '%s\n' "${GITHUB_IPS_V6[@]}" | sort)
            
            if [ "$A_RECORDS" = "$EXPECTED_A" ] && [ "$AAAA_RECORDS" = "$EXPECTED_AAAA" ]; then
                echo "  ✅ Verified: All DNS records match expected values"
            else
                echo "  ⚠️  Warning: DNS records may not match expected values yet"
                echo "     This is normal - DNS propagation can take time"
                echo "     Run 'dig A $DOMAIN' and 'dig AAAA $DOMAIN' to check manually"
            fi
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
