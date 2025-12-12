# Package.json Metadata Updates

**Status:** TODO  
**Created:** 2025-12-11  

This plan tracks the required metadata updates to `package.json` before publishing.

## Current Status

- Version: `0.0.1` → **CHANGE TO:** `1.0.0` or `0.1.0`
- License: ✅ **COMPLETE** - `"license": "SEE LICENSE IN LICENSE"` added
- Missing: `repository`, `bugs`, `homepage`, `keywords`, `icon` (optional)

## Required Updates

Add these fields to your `package.json`:

```json
{
  "name": "print2paper4vscode",
  "displayName": "Print2Paper4VSCode",
  "description": "Print code with syntax highlighting, generate PDFs, and render markdown - all with an interactive preview",
  "version": "1.0.0",
  "publisher": "acoven",
  "license": "SEE LICENSE IN LICENSE",
  
  "repository": {
    "type": "git",
    "url": "https://github.com/appliedmedia/print2paper4vscode"
  },
  
  "bugs": {
    "url": "https://github.com/appliedmedia/print2paper4vscode/issues"
  },
  
  "homepage": "https://github.com/appliedmedia/print2paper4vscode#readme",
  
  "keywords": [
    "print",
    "pdf",
    "export",
    "syntax-highlighting",
    "markdown",
    "code-printing",
    "shiki",
    "jspdf",
    "vscode-extension"
  ],
  
  "icon": "icon.png",
  
  "categories": [
    "Other"
  ],
  
  "engines": {
    "vscode": "^1.60.0"
  }
}
```

## Detailed Field Explanations

### `version`

Choose one:

- **`1.0.0`** - If you consider this production-ready and stable
- **`0.1.0`** - If you want to release as beta/preview first

### `license`

✅ **ALREADY COMPLETE**

Current value: `"license": "SEE LICENSE IN LICENSE"`

This references the custom source-available LICENSE file in the root directory.
No changes needed to this field.

### `repository`

```json
"repository": {
  "type": "git",
  "url": "https://github.com/appliedmedia/print2paper4vscode"
}
```

This tells VS Code marketplace and npm where the source code lives.

### `bugs`

```json
"bugs": {
  "url": "https://github.com/appliedmedia/print2paper4vscode/issues"
}
```

Where users can report issues.

### `homepage`

```json
"homepage": "https://github.com/appliedmedia/print2paper4vscode#readme"
```

Main documentation page (usually README on GitHub).

### `keywords`

```json
"keywords": [
  "print",
  "pdf",
  "export",
  "syntax-highlighting",
  "markdown",
  "code-printing",
  "shiki",
  "jspdf",
  "vscode-extension"
]
```

These help users discover your extension when searching. Choose 5-10 relevant terms.

### `icon`

```json
"icon": "icon.png"
```

Path to 128x128 PNG icon. If you don't have one yet, remove this field (not required, but recommended).

---

## Complete Updated package.json

Here's the full file with all changes applied:

```json
{
  "name": "print2paper4vscode",
  "displayName": "Print2Paper4VSCode",
  "description": "Print code with syntax highlighting, generate PDFs, and render markdown - all with an interactive preview",
  "version": "1.0.0",
  "publisher": "acoven",
  "license": "SEE LICENSE IN LICENSE",
  
  "repository": {
    "type": "git",
    "url": "https://github.com/appliedmedia/print2paper4vscode"
  },
  
  "bugs": {
    "url": "https://github.com/appliedmedia/print2paper4vscode/issues"
  },
  
  "homepage": "https://github.com/appliedmedia/print2paper4vscode#readme",
  
  "keywords": [
    "print",
    "pdf",
    "export",
    "syntax-highlighting",
    "markdown",
    "code-printing",
    "shiki",
    "jspdf",
    "vscode-extension"
  ],
  
  "icon": "icon.png",
  
  "engines": {
    "vscode": "^1.60.0"
  },
  
  "categories": [
    "Other"
  ],
  
  "activationEvents": [
    "onStartupFinished"
  ],
  
  "main": "./out/src/-entrypoint.js",
  
  "contributes": {
    "commands": [
      {
        "command": "{{extId}}.print2paper",
        "title": "Print2Paper",
        "category": "Print"
      },
      {
        "command": "{{extId}}.persistClear",
        "title": "Clear State",
        "category": "Print"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "{{extId}}.print2paper",
          "group": "navigation"
        }
      ],
      "editor/title": [
        {
          "command": "{{extId}}.print2paper",
          "group": "navigation",
          "when": "editorTextFocus",
          "title": "Print2Paper"
        }
      ]
    },
    "keybindings": [
      {
        "command": "{{extId}}.print2paper",
        "key": "alt+p",
        "mac": "alt+p"
      }
    ]
  },
  
  "scripts": {
    "postinstall": "node scripts/setup-vscode-mock.js",
    "vscode:prepublish": "npm run compile:deploy",
    "compile": "rm -rf out && tsc -p ./.config/ && node scripts/templateDictReplace.mjs",
    "compile:deploy": "rm -rf out-deploy && tsc -p ./.config/tsconfig.deploy.json && node scripts/templateDictReplace.mjs",
    "lint": "eslint --config ./.config/eslint.config.mjs src/**/*.ts",
    "lint:fix": "eslint --config ./.config/eslint.config.mjs src/**/*.ts --fix",
    "lint:md": "markdownlint *.md tests/**/*.md",
    "lint:md:fix": "markdownlint *.md tests/**/*.md --fix",
    "lint:yaml": "node scripts/lint-yaml-code.js",
    "lint:all": "npm run lint && npm run lint:md && npm run lint:yaml",
    "format": "prettier --write src/**/*.ts **/*.md",
    "format:check": "prettier --check src/**/*.ts **/*.md",
    "test": "node --test 'out/tests/*.test.js'",
    "test:watch": "node --test --watch out/tests/**/*.test.js",
    "test:verbose": "node --test --reporter spec out/tests/**/*.test.js",
    "test:coverage": "c8 --reporter=text --reporter=html --reporter=json-summary npm run test",
    "test:coverage:check": "c8 --reporter=text --reporter=html --reporter=json-summary --check-coverage --lines 80 --functions 80 --branches 80 --statements 80 npm run test"
  },
  
  "devDependencies": {
    "@types/node": "^24.3.1",
    "@types/vscode": "^1.60.0",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "c8": "^10.1.3",
    "eslint": "latest",
    "htmlparser2": "^10.0.0",
    "js-yaml": "^4.1.0",
    "markdownlint-cli": "latest",
    "prettier": "latest",
    "stylelint": "^16.25.0",
    "stylelint-config-standard": "^39.0.1",
    "typescript": "^5.9.2"
  },
  
  "dependencies": {
    "@shikijs/vscode-textmate": "^10.0.2",
    "jspdf": "^3.0.3",
    "node-html-parser": "^7.0.1",
    "shiki": "^3.11.0",
    "vscode-oniguruma": "^2.0.1",
    "yaml": "latest"
  }
}
```

---

## Icon Requirements (Optional)

If you want to add an icon:

1. Create a 128x128 PNG file named `icon.png` in the root directory
2. Design should be simple and recognizable
3. Theme: Printer, paper, or document related
4. Use transparency if needed
5. Test that it looks good at small sizes (VS Code marketplace shows it small)

If you don't have an icon yet:

- Remove the `"icon": "icon.png"` line from package.json
- You can add it later without breaking anything

---

## Changes Already Applied

The following have already been completed:

- ✅ Fixed `test` script glob pattern: Changed to `'out/tests/*.test.js'`
- ✅ Added comment to `UI.ts` console.log explaining it's intentional for static method
- ✅ Created custom source-available LICENSE file
- ✅ Added `"license": "SEE LICENSE IN LICENSE"` to package.json

---

## Verification Steps

After making these changes:

1. **Validate package.json:**

   ```bash
   npm install
   npm run compile
   ```

2. **Test the extension:**

   ```bash
   npm test
   # Should run and pass all 357 tests
   ```

3. **Package the extension:**

   ```bash
   npm install -g @vscode/vsce
   vsce package
   # Should create print2paper4vscode-1.0.0.vsix
   ```

4. **Test installation:**
   - Open VS Code
   - Extensions → "..." menu → Install from VSIX
   - Select the .vsix file
   - Test Alt+P on a code file

---

## Next Steps

1. ✅ ~~Add LICENSE file~~ - Complete
2. Update package.json with repository, bugs, homepage, keywords
3. Create icon.png (optional)
4. Test packaging with `vsce package`
5. Publish to marketplace with `vsce publish`

---

## Publishing Commands

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package extension (creates .vsix file)
vsce package

# Publish to VS Code marketplace (requires publisher account)
vsce publish

# Or publish specific version
vsce publish 1.0.0
```

---

## Marketplace Requirements

Before publishing, you need:

1. **Publisher account:** https://marketplace.visualstudio.com/manage
2. **Personal Access Token (PAT):**
   - Go to https://dev.azure.com/
   - Create PAT with "Marketplace → Manage" permission
   - Keep it secure (don't commit to repo)

3. **Login to vsce:**

   ```bash
   vsce login <publisher-name>
   # Enter your PAT when prompted
   ```

4. **Publish:**

   ```bash
   vsce publish
   ```

---

## References

- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest (package.json)](https://code.visualstudio.com/api/references/extension-manifest)
- [vsce CLI Reference](https://github.com/microsoft/vscode-vsce)
