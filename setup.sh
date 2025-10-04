#!/bin/bash
echo "Setting up Print2Paper4VSCode development environment..."

echo "Installing Node.js/npm..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Installing TypeScript globally..."
npm install -g typescript

echo "Installing GitHub CLI..."
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

echo "Installing project dependencies..."
npm install

echo "Environment setup complete!"
echo "Ready to compile and test!"
echo "Run 'npm run compile' to build the extension"
echo "Run 'npm test' to run tests"