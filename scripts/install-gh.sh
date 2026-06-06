#!/bin/bash
# GitHub CLI Installation Script for Cursor Background Agents

# Check if gh is already installed
if command -v gh &> /dev/null; then
    echo "GitHub CLI already installed: $(gh --version)"
    exit 0
fi

echo "Installing GitHub CLI..."

# Add GitHub CLI repository
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null

# Update package list and install
sudo apt update
sudo apt install gh -y

# Verify installation
if command -v gh &> /dev/null; then
    echo "GitHub CLI installed successfully: $(gh --version)"
else
    echo "Failed to install GitHub CLI"
    exit 1
fi