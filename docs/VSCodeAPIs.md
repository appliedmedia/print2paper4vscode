# VS Code Extension APIs Research

## Overview

This document summarizes all the VS Code extension APIs we've researched for our syntax highlighting project, including
what they provide and what they don't.

## Webview and Tab Creation APIs

### 1. Webview Panel API

**URL:** [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)

**API Signature:**

```typescript
vscode.window.createWebviewPanel(
    viewType: string,
    title: string,
    showOptions: vscode.ViewColumn | vscode.WebviewPanelShowOptions,
    options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
): vscode.WebviewPanel
```

**What it provides:** ✅ Create custom webview panels with HTML content
**What it doesn't provide:** ❌ Direct access to VS Code's native preview tabs

**Example Usage:**

```typescript
// Create a webview panel with HTML content
const panel = vscode.window.createWebviewPanel(
  'capturedContent', // viewType
  'Captured Content', // title
  vscode.ViewColumn.One, // showOptions
  {
    enableScripts: true,
    retainContextWhenHidden: true,
  }
);

// Set HTML content directly from memory
panel.webview.html = `
<!DOCTYPE html>
<html>
<head>
    <title>Captured Content</title>
</head>
<body>
    <h1>Content from Clipboard</h1>
    <div>${capturedContent}</div>
</body>
</html>
`;
```

### 2. Text Document Creation API

**URL:** [VS Code Workspace API](https://code.visualstudio.com/api/references/vscode-api#workspace)

**API Signature:**

```typescript
vscode.workspace.openTextDocument(
    content: string,
    language?: string,
    options?: vscode.TextDocumentShowOptions
): Promise<vscode.TextDocument>
```

**What it provides:** ✅ Create text documents from in-memory content
**What it doesn't provide:** ❌ HTML rendering (only plain text)

**Example Usage:**

```typescript
// Create a text document from memory
const document = await vscode.workspace.openTextDocument({
  content: capturedContent,
  language: 'html',
});

// Show the document in a new tab
await vscode.window.showTextDocument(document, {
  preview: false,
  viewColumn: vscode.ViewColumn.One,
});
```

### 3. HTML Preview Extension API

**URL:** [VS Code HTML Preview Extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

**What it provides:** ✅ HTML preview functionality
**What it doesn't provide:** ❌ Direct API access from extensions

**Note:** HTML preview is typically handled by built-in extensions, not directly accessible via API.

## Recommended Approach

**For in-memory preview tabs, use `vscode.window.createWebviewPanel`:**

1. **Capture clipboard content** (HTML/RTF/text)
2. **Create webview panel** with `createWebviewPanel`
3. **Set HTML content** directly from memory
4. **No disk I/O required**

This gives us full control over the preview content and styling without touching the filesystem.

## Selection and Highlighting APIs

### 1. Active Editor Selection API

**URL:** [VS Code Window API](https://code.visualstudio.com/api/references/vscode-api#window)

**API Signature:**

```typescript
// Get active text editor
vscode.window.activeTextEditor: vscode.TextEditor | undefined

// Get current selection
const selection = vscode.window.activeTextEditor?.selection;

// Check if there's a selection
const hasSelection = !selection?.isEmpty;

// Get selected text
const selectedText = vscode.window.activeTextEditor?.document.getText(selection);
```

**What it provides:** ✅ Direct access to current selection state and content
**What it doesn't provide:** ❌ HTML/RTF formatting (only plain text)

### 2. Selection Manipulation API

**URL:** [VS Code TextEditor API](https://code.visualstudio.com/api/references/vscode-api#TextEditor)

**API Signature:**

```typescript
// Select all content
await vscode.commands.executeCommand('editor.action.selectAll');

// Clear selection
await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
```

**What it provides:** ✅ Native VS Code commands for selection operations
**What it doesn't provide:** ❌ Direct clipboard access

### 3. Clipboard API (Limited)

**URL:** [VS Code Clipboard API](https://code.visualstudio.com/api/references/vscode-api#clipboard)

**API Signature:**

```typescript
// Read clipboard (plain text only)
const clipboardText = await vscode.env.clipboard.readText();

// Write to clipboard (plain text only)
await vscode.env.clipboard.writeText('content');
```

**What it provides:** ✅ Native clipboard access
**What it doesn't provide:** ❌ HTML/RTF content (only plain text)

## Better Approach: Hybrid VS Code + Minimal AppleScript

**Use VS Code APIs when possible, AppleScript only for what's necessary:**

1. **Get selection state** via `vscode.window.activeTextEditor.selection`
2. **Select all if needed** via `vscode.commands.executeCommand('editor.action.selectAll')`
3. **Copy via AppleScript** (only for HTML/RTF content)
4. **Clear selection if needed** via `vscode.commands.executeCommand('editor.action.clipboardCopyAction')`

This minimizes AppleScript usage while leveraging VS Code's native capabilities.

## Active Tab Detection (Text Editor vs Preview)

**Problem:** `vscode.window.activeTextEditor` only works for text editors, not preview tabs.

**Solutions:**

### 1. Check Active Tab Type

```typescript
// Check if active tab is a text editor
const activeEditor = vscode.window.activeTextEditor;
if (activeEditor) {
  // It's a text editor
  const tabName = this.getDescriptiveName(activeEditor.document);
} else {
  // It might be a preview tab - we need to detect it differently
  // For now, fall back to a generic name
  const tabName = 'Preview Tab';
}
```

### 2. Use Tab Groups API (Limited)

```typescript
// Get active tab group
const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
if (activeTabGroup) {
  const activeTab = activeTabGroup.activeTab;
  if (activeTab) {
    const tabName = activeTab.label;
  }
}
```

**Note:** Tab Groups API has limited access to preview tab content.

### 3. Hybrid Approach

**For text editors:** Use VS Code APIs
**For preview tabs:** Use AppleScript + clipboard capture
**Tab naming:** Use tab label when possible, fallback to generic names

## Theme and Configuration APIs

### 1. Workbench Configuration API

**URL:** [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api)

**API Signature:**

```typescript
vscode.workspace.getConfiguration(section?: string, scope?: vscode.ConfigurationScope): vscode.WorkspaceConfiguration
```

**What it provides:** ✅ Current theme name
**What it doesn't provide:** ❌ Theme file path, theme file location

**Example Usage:**

```typescript
// Get current theme name
const themeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
// Returns: "Default Dark Modern"

// Get other workbench settings
const fontSize = vscode.workspace.getConfiguration('editor').get('fontSize');
const wordWrap = vscode.workspace.getConfiguration('editor').get('wordWrap');
```

## Extension Management APIs

### 2. Extensions API

**URL:** [VS Code Extensions API](https://code.visualstudio.com/api/references/vscode-api#extensions)

**API Signature:**

```typescript
// Get all extensions
vscode.extensions.all: readonly vscode.Extension<any>[]

// Get specific extension
vscode.extensions.getExtension<T>(extensionId: string): vscode.Extension<T> | undefined
```

**What it provides:** ✅ List of ALL extensions (built-in + user), individual extension paths, built-in detection
**What it doesn't provide:** ❌ User extensions directory path (must construct manually)

**Example Usage:**

```typescript
// List all extensions
const allExtensions = vscode.extensions.all;
allExtensions.forEach(ext => {
  console.log(`${ext.id}: ${ext.isActive ? 'Active' : 'Inactive'}`);
});

// Get specific extension
const typescriptExt = vscode.extensions.getExtension('ms-vscode.vscode-typescript-next');
if (typescriptExt) {
  console.log(`TypeScript extension path: ${typescriptExt.extensionPath}`);
}

// Find theme extensions
const themeExtensions = vscode.extensions.all.filter(
  ext => ext.id.includes('theme') || ext.packageJSON.contributes?.themes
);

// Distinguish built-in vs user extensions
const builtInExtensions = vscode.extensions.all.filter(ext => ext.packageJSON.isBuiltin);
const userExtensions = vscode.extensions.all.filter(ext => !ext.packageJSON.isBuiltin);

console.log(`Built-in extensions: ${builtInExtensions.length}`);
console.log(`User extensions: ${userExtensions.length}`);

// Find specific built-in extensions we need
const themeDefaults = vscode.extensions.getExtension('vscode.theme-defaults');
const typescriptBasics = vscode.extensions.getExtension('vscode.typescript-language-features');

if (themeDefaults) {
  console.log(`Theme defaults at: ${themeDefaults.extensionPath}`);
}
if (typescriptBasics) {
  console.log(`TypeScript basics at: ${typescriptBasics.extensionPath}`);
}
```

### 3. Extension Context API

**URL:** [VS Code ExtensionContext API](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext)

**API Signature:**

```typescript
interface ExtensionContext {
  readonly extensionPath: string;
  readonly extensionUri: vscode.Uri;
  readonly globalStorageUri: vscode.Uri;
  readonly globalStoragePath: string; // deprecated
  readonly logUri: vscode.Uri;
  readonly storageUri: vscode.Uri | undefined;
  readonly subscriptions: { dispose(): any }[];
  readonly workspaceState: vscode.Memento;
  readonly globalState: vscode.Memento;
  readonly extensionMode: vscode.ExtensionMode;
  readonly extensionKind: vscode.ExtensionKind;
}
```

**What it provides:** ✅ Our extension's own path, global storage location
**What it doesn't provide:** ❌ Other extensions' paths, VS Code app bundle paths

**Example Usage:**

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Get our extension's directory
  const extensionDir = context.extensionPath;
  console.log(`Our extension is located at: ${extensionDir}`);

  // Get global storage location for our extension
  const globalStoragePath = context.globalStorageUri.fsPath;
  console.log(`Global storage at: ${globalStoragePath}`);

  // Store data in global state
  context.globalState.update('lastRun', new Date().toISOString());

  // Get data from global state
  const lastRun = context.globalState.get('lastRun');

  // Subscribe to extension deactivation
  context.subscriptions.push({
    dispose() {
      console.log('Extension deactivating...');
    },
  });
}
```

## Document and Language APIs

### 4. Semantic Tokens API

**URL:** [VS Code Semantic Tokens](https://code.visualstudio.com/api/references/vscode-api#DocumentSemanticTokensProvider)

**API Signature:**

```typescript
vscode.commands.executeCommand(command: string, ...args: any[]): Promise<any>

// Command: 'vscode.executeDocumentSemanticTokensProvider'
// Returns: vscode.SemanticTokens | undefined
```

**What it provides:** ✅ Token types (0, 1, 2, 3) with ranges for IntelliSense
**What it doesn't provide:** ❌ TextMate scopes, syntax highlighting information

**Example Usage:**

```typescript
// Get semantic tokens for a document
const tokens = await vscode.commands.executeCommand(
  'vscode.executeDocumentSemanticTokensProvider',
  document.uri
);

if (tokens) {
  console.log(`Found ${tokens.data.length} semantic tokens`);

  // Decode tokens
  const decoded = vscode.SemanticTokensLegend.decode(tokens);
  decoded.forEach(token => {
    const range = new vscode.Range(
      new vscode.Position(token.line, token.startCharacter),
      new vscode.Position(token.line, token.startCharacter + token.length)
    );

    // token.type: 0=class, 1=interface, 2=type, 3=function, 4=variable, etc.
    console.log(`Token type ${token.type} at ${range.start.line}:${range.start.character}`);
  });
}
```

### 5. Document Color Provider API

**URL:** [VS Code Color Provider](https://code.visualstudio.com/api/references/vscode-api#DocumentColorProvider)

**API Signature:**

```typescript
vscode.commands.executeCommand(command: string, ...args: any[]): Promise<any>

// Command: 'vscode.executeDocumentColorProvider'
// Returns: vscode.ColorInformation[]
```

**What it provides:** ✅ Color information for specific elements in documents
**What it doesn't provide:** ❌ Tokenization, syntax highlighting scopes

**Example Usage:**

```typescript
// Get colors from a document
const colors = await vscode.commands.executeCommand(
  'vscode.executeDocumentColorProvider',
  document.uri
);

if (colors && colors.length > 0) {
  console.log(`Found ${colors.length} colors in document`);

  colors.forEach(colorInfo => {
    const { color, range } = colorInfo;
    console.log(`Color ${color.toString()} at line ${range.start.line}`);
  });
}
```

### 6. Document Language API

**URL:** [VS Code TextDocument API](https://code.visualstudio.com/api/references/vscode-api#TextDocument)

**API Signature:**

```typescript
interface TextDocument {
  readonly uri: vscode.Uri;
  readonly fileName: string;
  readonly isUntitled: boolean;
  readonly languageId: string;
  readonly version: number;
  readonly isDirty: boolean;
  readonly isClosed: boolean;
  readonly eol: vscode.EndOfLine;
  readonly lineCount: number;

  getText(range?: vscode.Range): string;
  getWordRangeAtPosition(position: vscode.Position, regex?: RegExp): vscode.Range | undefined;
  positionAt(offset: number): vscode.Position;
  offsetAt(position: vscode.Position): number;
  validateRange(range: vscode.Range): vscode.Range;
  validatePosition(position: vscode.Position): vscode.Position;
}
```

**What it provides:** ✅ Document language ID, file path, content
**What it doesn't provide:** ❌ Syntax highlighting rules, grammar information

**Example Usage:**

```typescript
// Get document information
const languageId = document.languageId; // "typescript", "markdown", etc.
const fileName = document.fileName;
const content = document.getText();
const lineCount = document.lineCount;

console.log(`Document: ${fileName} (${languageId})`);
console.log(`Lines: ${lineCount}`);
console.log(`Content length: ${content.length}`);

// Get text from specific range
const firstLine = document.getText(new vscode.Range(0, 0, 0, 100));

// Get word at cursor position
const position = vscode.window.activeTextEditor?.selection.active;
if (position) {
  const wordRange = document.getWordRangeAtPosition(position);
  if (wordRange) {
    const word = document.getText(wordRange);
    console.log(`Word at cursor: ${word}`);
  }
}
```

## File System APIs

### 7. Workspace File System API

**URL:** [VS Code File System API](https://code.visualstudio.com/api/references/vscode-api#FileSystem)

**API Signature:**

```typescript
interface FileSystem {
  readFile(uri: vscode.Uri): Promise<Uint8Array>;
  writeFile(uri: vscode.Uri, data: Uint8Array): Promise<void>;
  delete(uri: vscode.Uri): Promise<void>;
  rename(source: vscode.Uri, target: vscode.Uri): Promise<void>;
  copy(source: vscode.Uri, target: vscode.Uri): Promise<void>;
  createDirectory(uri: vscode.Uri): Promise<void>;
  readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]>;
  stat(uri: vscode.Uri): Promise<vscode.FileStat>;
}
```

**What it provides:** ✅ Read/write files in workspace, create URIs
**What it doesn't provide:** ❌ Access to VS Code app bundle, built-in extension files

**Example Usage:**

```typescript
// Read a file
const uri = vscode.Uri.file('/path/to/file.txt');
try {
  const content = await vscode.workspace.fs.readFile(uri);
  const text = new TextDecoder().decode(content);
  console.log(`File content: ${text}`);
} catch (error) {
  console.error(`Failed to read file: ${error}`);
}

// Write a file
const newContent = new TextEncoder().encode('Hello, World!');
try {
  await vscode.workspace.fs.writeFile(uri, newContent);
  console.log('File written successfully');
} catch (error) {
  console.error(`Failed to write file: ${error}`);
}

// List directory contents
const dirUri = vscode.Uri.file('/path/to/directory');
try {
  const entries = await vscode.workspace.fs.readDirectory(dirUri);
  entries.forEach(([name, type]) => {
    const typeStr = type === vscode.FileType.Directory ? 'DIR' : 'FILE';
    console.log(`${typeStr}: ${name}`);
  });
} catch (error) {
  console.error(`Failed to read directory: ${error}`);
}
```

### 10. Window State API (Limited)

**URL:** [VS Code Window API](https://code.visualstudio.com/api/references/vscode-api#window)

**API Signature:**

```typescript
namespace vscode.window {
  readonly state: WindowState;
}

interface WindowState {
  readonly focused: boolean;  // Whether window is focused
  readonly active: boolean;   // Whether window has been recently interacted with
  // That's it - no dimensions, no size, no position
}

interface ExtensionContext {
  // Available at activation time - also has no dimension info
  readonly subscriptions: Disposable[];
  readonly workspaceState: Memento;
  readonly globalState: Memento;
  readonly secrets: SecretStorage;
  readonly extensionUri: Uri;
  readonly extensionPath: string;
  readonly environmentVariableCollection: GlobalEnvironmentVariableCollection;
  readonly storageUri: Uri | undefined;
  readonly storagePath: string | undefined;
  readonly globalStorageUri: Uri;
  readonly logUri: Uri;
  readonly extensionMode: ExtensionMode;
  // No window dimensions here either
}
```

**What it provides:** ✅ Window focus state, ✅ Extension context (storage, paths, subscriptions)

**What it doesn't provide:** ❌ Window dimensions, ❌ Window size, ❌ Window position, ❌ Screen dimensions

**Checked at activation time:** When `activate(context: ExtensionContext)` is called:
- ❌ `context` has no dimension properties
- ❌ `vscode.window.state` only has `focused` and `active` booleans
- ❌ `vscode.window.*` has no dimension-related properties
- ❌ `vscode.env.*` has no dimension-related properties

**Why no dimensions?**

- VS Code extensions run in Node.js (extension host process), not in the browser
- The extension host has no access to the UI layer or window dimensions
- Window dimensions are only available in webview contexts via `window.innerWidth`/`window.innerHeight`
- Even at activation time, there's no way to query window dimensions from the extension host

**Workaround for dimension-dependent features:**

```typescript
// Server-side (extension host) - No access to window dimensions
// Must use reasonable defaults or pass from client
const windowRight = 5120; // Reasonable max for 5K displays

// Client-side (webview JavaScript) - Has access to actual dimensions
const actualWidth = window.innerWidth;
const actualHeight = window.innerHeight;

// Dynamically clamp values to actual window size
const maxLeft = Math.max(minLeft, window.innerWidth - elementWidth - padding);
element.style.left = Math.min(savedPosition, maxLeft) + 'px';
```

**ViewColumn is NOT window width:**

- `ViewColumn` refers to editor split columns (left, center, right)
- It's for positioning editor panes, not measuring window dimensions
- Values: `ViewColumn.One`, `ViewColumn.Two`, `ViewColumn.Beside`, etc.

## What VS Code APIs DON'T Provide

### ❌ Window Dimensions and Display Information

- No API to get window width/height
- No API to get screen dimensions  
- No API to get window position
- Extensions run in Node.js extension host with no UI access
- Only webview contexts (browser) have `window.innerWidth`/`innerHeight`

### ~~❌ VS Code Installation Directory~~ ✅ AVAILABLE

- ~~No API to get `/Applications/Cursor.app/Contents/Resources/app/`~~
- ~~No API to get the root extensions directory~~
- ~~No API to get built-in theme locations~~
- **CORRECTED:** Use `vscode.env.appRoot` to get installation directory

### ~~❌ Built-in Extension File Paths~~ ✅ AVAILABLE

- ~~Built-in extensions (like `theme-defaults`) are bundled into VS Code's app bundle~~
- ~~They don't expose their file paths via the extension API~~
- ~~This is by design for security and packaging reasons~~
- **CORRECTED:** Use `vscode.extensions.all` to get all extensions with paths

### ❌ TextMate Tokenization

- No API to get TextMate scopes like `entity.name.function`
- No API to get syntax highlighting tokenization
- No API to access VS Code's internal syntax highlighting engine

### ❌ Editor DOM Access

- VS Code editors are native UI components, not HTML/CSS
- No API to access editor DOM or rendered HTML
- No API to capture syntax highlighting as it appears in the editor

### ❌ Reliable Locale with Region Code

- `vscode.env.language` returns language WITHOUT region (e.g., "en" not "en-US")
- `vscode.l10n` provides translation functions but no locale detection
- `navigator.language` (in webviews) is also unreliable
- **SOLUTION:** Use Node.js `Intl.DateTimeFormat().resolvedOptions().locale`

## Initial API Learnings

1. **VS Code APIs are designed for extension functionality, not internal access**
2. ~~**Built-in extensions are intentionally isolated from extension APIs**~~
   **CORRECTED: Built-in extensions ARE accessible via `vscode.extensions.all`**
3. **Syntax highlighting information is not exposed via extension APIs**
4. ~~**Our approach of reading theme and grammar files directly is the only viable solution**~~
   **UPDATED: We can now use VS Code APIs to find extension paths dynamically**

## Conclusion

VS Code's extension API system is comprehensive for building extensions, but it intentionally doesn't provide access to:

- ~~VS Code's internal file structure~~ **CORRECTED: `vscode.env.appRoot` provides app structure**
- ~~Built-in extension files~~ **CORRECTED: `vscode.extensions.all` includes built-in extensions with paths**
- Syntax highlighting engine internals
- Editor rendering details

**UPDATED CONCLUSION:** We can now use VS Code APIs to dynamically find theme and grammar files:

- **`vscode.env.appRoot`** gives us the VS Code installation directory
- **`vscode.extensions.all`** gives us all extensions (built-in + user) with their paths
- **`extension.packageJSON.isBuiltin`** distinguishes built-in vs user extensions
- **`vscode.extensions.getExtension(id)`** gets specific extensions by ID

This makes our solution **portable and dynamic** instead of relying on hardcoded paths.

## Environment APIs

### 8. VS Code Environment API ⭐ **BREAKTHROUGH!**

**URL:** [VS Code Environment API](https://code.visualstudio.com/api/references/vscode-api#env)

**API Signature:**

```typescript
namespace vscode.env {
    readonly appHost: string;
    readonly appName: string;
    readonly appRoot: string;           // ⭐ THIS IS WHAT WE NEED!
    readonly clipboard: Clipboard;
    readonly isNewAppInstall: boolean;
    readonly isTelemetryEnabled: boolean;
    readonly language: string;           // ⚠️ UNRELIABLE - see note below
    readonly logLevel: LogLevel;
    readonly machineId: string;
    readonly remoteName: string | undefined;
    readonly sessionId: string;
    readonly shell: string;
    readonly uiKind: UIKind;
    readonly uriScheme: string;
}
```

**What it provides:** ✅ **VS Code installation root directory!**

**What it doesn't provide:** ❌ Direct paths to specific extensions, ❌ Window dimensions, ❌ Reliable locale with region

**Key Discovery - `vscode.env.appRoot`:**

- **Description:** "The application root folder from which the editor is running"
- **What this means:** This should give us `/Applications/Cursor.app/Contents/Resources/app/`
- **Built-in extensions location:** `${appRoot}/extensions/`
- **Theme files:** `${appRoot}/extensions/theme-defaults/themes/`
- **Grammar files:** `${appRoot}/extensions/typescript-basics/syntaxes/`

**Example Usage:**

```typescript
// Get VS Code installation directory
const vscodeAppRoot = vscode.env.appRoot;
console.log(`VS Code app root: ${vscodeAppRoot}`);

// Construct paths to built-in extensions
const extensionsDir = path.join(vscodeAppRoot, 'extensions');
const themeDir = path.join(extensionsDir, 'theme-defaults', 'themes');
const grammarDir = path.join(extensionsDir, 'typescript-basics', 'syntaxes');

console.log(`Built-in extensions: ${extensionsDir}`);
console.log(`Theme files: ${themeDir}`);
console.log(`Grammar files: ${grammarDir}`);

// Load theme file dynamically
const themePath = path.join(themeDir, 'dark_modern.json');
const themeData = JSON.parse(fs.readFileSync(themePath, 'utf8'));

// Load grammar file dynamically
const grammarPath = path.join(grammarDir, 'TypeScript.tmLanguage.json');
const grammarData = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
```

**Other Environment Properties:**

- **`appHost`:** Hosting environment ("desktop", "github.dev", "codespaces", "web")
- **`appName`:** Application name ("VS Code", "Cursor", etc.)
- **`language`:** User language preference - ⚠️ **UNRELIABLE** (see Language/Locale section below)
- **`machineId`:** Unique machine identifier
- **`sessionId`:** Unique session identifier
- **`shell`:** Default shell path
- **`uriScheme`:** URI scheme for the application

### 9. Language and Locale APIs ⚠️ **IMPORTANT CAVEATS**

**NOTE: Left here intentionally to guide future developers.**

**The Problem:** VS Code's language/locale APIs are unreliable for region detection.

**What's Available:**

```typescript
// 1. vscode.env.language - Returns language WITHOUT region code
vscode.env.language;  // ❌ Returns "en" (not "en-US" as documented)

// 2. vscode.l10n namespace - Translation functions, NOT locale detection
namespace vscode.l10n {
  function t(message: string, ...args: Array<string | number | boolean>): string;
  readonly uri: Uri | undefined;  // Path to bundle.l10n.json file (NOT a locale string)
}

// 3. navigator.language - Browser API (webview only), also unreliable
navigator.language;  // ❌ Also returns "en" without region
```

**Examples of what these APIs actually return:**

- `vscode.env.language` → `"en"` (just language, no region)
- `vscode.l10n.uri?.fsPath` → `"/path/to/vscode/l10n/bundle.l10n.json"` (file path, not a locale string)
- `navigator.language` → `"en"` (browser API in webview, also unreliable)

**✅ CORRECT SOLUTION - Use Node.js Intl API:**

```typescript
// OS.getLocale() - Uses Intl API which actually provides region codes
getLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale || '';
}

// Returns proper locale with region: "en-US", "en-GB", "fr-FR", etc.
const locale = Intl.DateTimeFormat().resolvedOptions().locale;
console.log(locale);  // "en-US" ✅
```

**Why Intl API works:**

- Part of Node.js/JavaScript standard library
- Queries the actual OS locale settings
- Returns proper BCP 47 language tags with region codes
- Reliable across all platforms (Windows, macOS, Linux)

**Implementation in our codebase:**

- See `src/OS.ts` - `getLocale()` method
- See `src/VSCodeAPIs.ts` - Comment block explaining why not to use `vscode.env.language`
- See `src/PaperPrinter.ts` - Using `this.app.os.getLocale()` for region-based defaults

**Complete Solution for Finding All Extensions:**

```typescript
// Method 1: Get built-in extensions directory
const builtInExtensionsDir = path.join(vscode.env.appRoot, 'extensions');

// Method 2: Get user extensions directory (must construct manually)
const userExtensionsDir = path.join(os.homedir(), '.vscode', 'extensions');
// For Cursor: path.join(os.homedir(), '.cursor', 'extensions')

// Method 3: Get individual extension paths (both built-in and user)
vscode.extensions.all.forEach(extension => {
  console.log(`${extension.id}: ${extension.extensionPath}`);
  // This gives the actual path for each extension, regardless of location
});

// Method 4: Get specific extension path
const themeExt = vscode.extensions.getExtension('ms-vscode.theme-defaults');
if (themeExt) {
  console.log(`Built-in themes at: ${themeExt.extensionPath}`);
}
```

**Key Insight:** We now have **three ways** to find extensions:

1. **Built-in extensions:** `${vscode.env.appRoot}/extensions/`
2. **User extensions:** `~/.vscode/extensions/` (manual construction)
3. **Individual extensions:** `extension.extensionPath` (works for both)

**Test Results Confirmation:**

```text
Found 142 total extensions
Built-in extensions: 99
User extensions: 43

✅ Found theme-defaults at: /Applications/Cursor.app/Contents/Resources/app/extensions/theme-defaults
   Theme files: dark_modern.json, dark_plus.json, dark_vs.json, hc_black.json, hc_light.json, light_modern.json, light_plus.json, light_vs.json

✅ Found typescript extension at: /Applications/Cursor.app/Contents/Resources/app/extensions/typescript-basics
   Grammar files: TypeScript.tmLanguage.json, TypeScriptReact.tmLanguage.json
```

**Extension ID Patterns:**

- **Theme extension:** `theme-defaults`
- **Language extensions follow the language name:**
  - JavaScript: `"javascript"`
  - TypeScript: `"typescript"`
  - CSS: `"css"`
  - HTML: `"html"`
  - Java: `"java"`
  - Python: `"python"`
  - Markdown: `"markdown"`

**Dynamic Extension Discovery:**

```typescript
// Get extension for any language
function getLanguageExtension(languageId: string) {
  return vscode.extensions.getExtension(languageId);
}

// Usage
const jsExt = getLanguageExtension('javascript');
const tsExt = getLanguageExtension('typescript');
const cssExt = getLanguageExtension('css');
```

## TextMate Grammar System

TextMate grammars are the foundation of VS Code's syntax highlighting. They define patterns that match code elements and assign them semantic scopes like `string.quoted.double.ts` or `keyword.control.ts`.

### Grammar File Structure

**Location:** `/Applications/Cursor.app/Contents/Resources/app/extensions/typescript-basics/syntaxes/TypeScript.tmLanguage.json`

**Basic Structure:**

```json
{
  "name": "TypeScript",
  "scopeName": "source.ts",
  "patterns": [
    { "include": "#directives" },
    { "include": "#statements" },
    { "include": "#shebang" }
  ],
  "repository": {
    "statements": { "patterns": [...] },
    "string": { "patterns": [...] },
    "qstring-double": { "name": "string.quoted.double.ts", "begin": "\"", "end": "..." }
  }
}
```

### Pattern Types

#### 1. Include Patterns

**Purpose:** Reference other patterns by name

**Example:**

```json
{
  "include": "#string"
}
```

**What it does:** Includes all patterns defined in `repository.string`

#### 2. Match Patterns

**Purpose:** Simple regex matching

**Example from VS Code's grammar:**

```json
{
  "name": "keyword.control.conditional.ts",
  "match": "(?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))(else|if)(?![_$[:alnum:]])(?:(?=\\.\\.\\.)|(?!\\.))"
}
```

**What it matches:** `if` and `else` keywords with word boundaries

#### 3. Begin/End Patterns

**Purpose:** Multi-line or complex constructs

**Example from VS Code's grammar:**

```json
{
  "name": "string.quoted.double.ts",
  "begin": "\"",
  "beginCaptures": {
    "0": { "name": "punctuation.definition.string.begin.ts" }
  },
  "end": "(\")|((?:[^\\\\\\n])$)",
  "endCaptures": {
    "1": { "name": "punctuation.definition.string.end.ts" },
    "2": { "name": "invalid.illegal.newline.ts" }
  },
  "patterns": [{ "include": "#string-character-escape" }]
}
```

**What it does:**

- Starts matching at `"`
- Continues until closing `"` or end of line
- Can include nested patterns (like escape sequences)
- Assigns different scopes to different parts

### Real TextMate Regex Features

#### 1. Unicode Character Classes

```regex
[_$[:alnum:]]     # Letters, digits, underscore, dollar
[_$[:alpha:]]     # Letters, underscore, dollar
[[:digit:]]       # Digits 0-9
```

#### 2. Word Boundaries with Context

```regex
(?<![_$[:alnum:]])    # Negative lookbehind: not preceded by word char
(?![_$[:alnum:]])     # Negative lookahead: not followed by word char
```

#### 3. Complex Lookarounds

```regex
(?:(?<=\\.\\.\\.)|(?<!\\.))    # Either after ... or not after .
```

### Actual VS Code Patterns We Found

#### String Patterns

```json
// Double-quoted strings
{
  "name": "string.quoted.double.ts",
  "begin": "\"",
  "end": "(\")|((?:[^\\\\\\n])$)",
  "patterns": [{ "include": "#string-character-escape" }]
}

// Single-quoted strings
{
  "name": "string.quoted.single.ts",
  "begin": "'",
  "end": "(\\')|((?:[^\\\\\\n])$)",
  "patterns": [{ "include": "#string-character-escape" }]
}

// Template literals
{
  "name": "string.template.ts",
  "begin": "([_$[:alpha:]][_$[:alnum:]]*)?(`))",
  "end": "`",
  "patterns": [
    { "include": "#template-substitution-element" },
    { "include": "#string-character-escape" }
  ]
}
```

#### Keyword Patterns

```json
// Control flow keywords
{
  "name": "keyword.control.conditional.ts",
  "match": "(?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))(else|if)(?![_$[:alnum:]])(?:(?=\\.\\.\\.)|(?!\\.))"
}

// Loop keywords
{
  "name": "keyword.control.loop.ts",
  "match": "(?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))(break|continue|do|goto|while)(?![_$[:alnum:]])(?:(?=\\.\\.\\.)|(?!\\.))"
}

// Variable declaration keywords
{
  "name": "storage.type.ts",
  "match": "(?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))\\b(const(?!\\s+enum\\b))(?![_$[:alnum:]])(?:(?=\\.\\.\\.)|(?!\\.))"
}
```

### TextMate Tokenization Process

#### 1. Pattern Resolution

- Start with top-level `patterns` array
- Resolve `#include` references to `repository` entries
- Handle nested includes recursively
- Detect and prevent circular references

#### 2. Pattern Matching

- Apply patterns in order of definition
- Use `begin`/`end` for multi-line constructs
- Use `match` for single-line patterns
- Handle captures for sub-groups

#### 3. Scope Assignment

- Each pattern assigns a `name` (scope)
- Scopes are hierarchical: `string.quoted.double.ts`
- Captures can assign different scopes to different parts

### Why TextMate Patterns Are Complex

#### 1. Context Sensitivity

```regex
# "const" keyword - but only in variable declarations, not in other contexts
(?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))\\b(const(?!\\s+enum\\b))(?![_$[:alnum:]])(?:(?=\\.\\.\\.)|(?!\\.))
```

#### 2. Nested Constructs

```json
// Template literals can contain expressions
{
  "begin": "`",
  "end": "`",
  "patterns": [
    {
      "begin": "\\$\\{",
      "end": "\\}",
      "patterns": [{ "include": "#expression" }] // Recursive!
    }
  ]
}
```

#### 3. Language Evolution

- Patterns handle ES6+, TypeScript, JSX
- Support for new syntax like `using`, `await using`
- Backwards compatibility with older syntax

### Deep Grammar Analysis

#### The TypeScript Grammar File Structure

After examining the actual TypeScript grammar file (`/Applications/Cursor.app/Contents/Resources/app/extensions/typescript-basics/syntaxes/TypeScript.tmLanguage.json`), here's what we found:

**File Statistics:**

- **Size:** 48,495 tokens (massive file)
- **Repository entries:** 146 named pattern definitions
- **Main patterns:** 3 top-level entry points
- **Scope name:** `source.ts`

**Top-level structure:**

```json
{
  "name": "TypeScript",
  "scopeName": "source.ts",
  "patterns": [
    { "include": "#directives" },
    { "include": "#statements" },
    { "include": "#shebang" }
  ],
  "repository": {
    "statements": { ... },
    "expression": { ... },
    "function-declaration": { ... },
    // ... 143 more entries
  }
}
```

**Key Repository Entries:**

1. `shebang` - Script headers
2. `statements` - Top-level statements
3. `declaration` - Variable/function declarations
4. `control-statement` - if/for/while statements
5. `expression` - All expressions
6. `function-call` - Function invocations
7. `arrow-function` - Arrow function syntax
8. `class-declaration` - Class definitions
9. `interface-declaration` - TypeScript interfaces
10. `type-annotation` - Type annotations

#### Why Our Pattern Extraction Failed

**The Problem:** We tried to extract individual regex patterns and apply them independently, but TextMate grammars are **hierarchical state machines**, not collections of independent patterns.

**Evidence from the grammar file:**

1. **Massive interdependent patterns** - Some regex patterns are 2000+ characters long and reference multiple other patterns
2. **Context-dependent matching** - Patterns change behavior based on what was matched before
3. **Nested pattern includes** - `#expression` includes `#function-call` which includes `#type-arguments` which includes `#type` etc.
4. **State tracking** - The grammar maintains a stack of active patterns for nested constructs

**Example of pattern complexity:**

```regex
# This is ONE pattern for arrow functions - 2000+ characters
(?x) (?:
  (?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))(\\basync)
)? ((?<![})!\\]])\\s*
  (?=
    # sure shot arrow functions even if => is on new line
(\n  (<\\s*(((const\\s+)?[_$[:alpha:]])|(\\{([^\\{\\}]|(\\{([^\\{\\}]|\\{[^\\{\\}]*\\})*\\}))*\\})|(\\(([^\\(\\)]|(\\(([^\\(\\)]|\\([^\\(\\)]*\\))*\\)))*\\))|(\\[([^\\[\\]]|(\\[([^\\[\\]]|\\[[^\\[\\]]*\\])*\\]))*\\]))([^=<>]|=[^<]|\\<\\s*(((const\\s+)?[_$[:alpha:]])|(\\{([^\\{\\}]|(\\{([^\\{\\}]|\\{[^\\{\\}]*\\})*\\}))*\\})|(\\(([^\\(\\)]|(\\(([^\\(\\)]|\\([^\\(\\)]*\\))*\\)))*\\))|(\\[([^\\[\\]]|(\\[([^\\[\\]]|\\[[^\\[\\]]*\\])*\\]))*\\]))([^=<>]|=[^<]|\\<\\s*(((const\\s+)?[_$[:alpha:]])|(\\{([^\\{\\}]|(\\{([^\\{\\}]|\\{[^\\{\\}]*\\})*\\}))*\\})|(\\(([^\\(\\)]|(\\(([^\\(\\)]|\\([^\\(\\)]*\\))*\\)))*\\))|(\\[([^\\[\\]]|(\\[([^\\[\\]]|\\[[^\\[\\]]*\\])*\\]))*\\]))([^=<>]|=[^<])*\\>)*\\>)*>\\s*)?
  [(]\\s*(\\/\\*([^\\*]|(\\*[^\\/]))*\\*\\/\\s*)*
  (
    ([)]\\s*:) |                                                                                       # ():
    ((\\.\\.\\.\\s*)?[_$[:alpha:]][_$[:alnum:]]*\\s*:)                                                                  # [(]param: | [(]...param:
  )
) |

# arrow function possible to detect only with => on same line
(
  (<\\s*(((const\\s+)?[_$[:alpha:]])|(\\{([^\\{\\}]|(\\{([^\\{\\}]|\\{[^\\{\\}]*\\})*\\}))*\\})|(\\(([^\\(\\)]|(\\(([^\\(\\)]|\\([^\\(\\)]*\\))*\\)))*\\))|(\\[([^\\[\\]]|(\\[([^\\[\\]]|\\[[^\\[\\]]*\\])*\\]))*\\]))([^=<>]|=[^<]|\\<\\s*(((const\\s+)?[_$[:alpha:]])|(\\{([^\\{\\}]|(\\{([^\\{\\}]|\\{[^\\{\\}]*\\})*\\}))*\\})|(\\(([^\\(\\)]|(\\(([^\\(\\)]|\\([^\\(\\)]*\\))*\\)))*\\))|(\\[([^\\[\\]]|(\\[([^\\[\\]]|\\[[^\\[\\]]*\\])*\\]))*\\]))([^=<>]|=[^<]|\\<\\s*(((const\\s+)?[_$[:alpha:]])|(\\{([^\\{\\}]|(\\{([^\\{\\}]|\\{[^\\{\\}]*\\})*\\}))*\\})|(\\(([^\\(\\)]|(\\(([^\\(\\)]|\\([^\\(\\)]*\\))*\\)))*\\))|(\\[([^\\[\\]]|(\\[([^\\[\\]]|\\[[^\\[\\]]*\\])*\\]))*\\]))([^=<>]|=[^<])*\\>)*\\>)*>\\s*)?                                                                                 # typeparameters
  \\(\\s*(\\/\\*([^\\*]|(\\*[^\\/]))*\\*\\/\\s*)*(([_$[:alpha:]]|(\\{([^\\{\\}]|(\\{([^\\{\\}]|\\{[^\\{\\}]*\\})*\\}))*\\})|(\\[([^\\[\\]]|(\\[([^\\[\\]]|\\[[^\\[\\]]*\\])*\\]))*\\])|(\\.\\.\\.\\s*[_$[:alpha:]]))([^()\'\"\\`]|(\\(([^\\(\\)]|(\\(([^\\(\\)]|\\([^\\(\\)]*\\))*\\)))*\\))|(\\'([^\\'\\\\]|\\\\.)*\\')|(\\\"([^\\\"\\\\]|\\\\.)*\\\")|(\\`([^\\`\\\\]|\\\\.)*\\`))*)?\\)   # parameters
  (\\s*:\\s*([^<>\\(\\)\\{\\}]|\\<([^<>]|\\<([^<>]|\\<[^<>]+\\>)+\\>)+\\>|\\([^\\(\\)]+\\)|\\{[^\\{\\}]+\\})+)?                                                                        # return type
  \\s*=>                                                                                               # arrow operator
)
  ))
)))
```

This single pattern handles:

- Async arrow functions
- Generic type parameters
- Complex parameter destructuring
- Return type annotations
- Multiple arrow function syntaxes
- Edge cases with comments and whitespace

#### Why Independent Pattern Application Fails

**The Core Issue:** TextMate grammars are **pushdown automata** - they maintain a stack of active patterns and contexts. When we extract patterns individually:

1. **Lost Context:** Patterns lose their hierarchical context
2. **Infinite Loops:** Patterns match repeatedly without advancing position
3. **Wrong Scopes:** Patterns fire in incorrect contexts, producing "unknown" scopes
4. **Missing Matches:** Patterns fail to match because they expect specific context

**Example of Context Dependency:**

```json
// This pattern only works INSIDE a function parameter context
{
  "match": "([_$[:alpha:]][_$[:alnum:]]*)",
  "name": "variable.parameter.ts"
}

// But the SAME pattern in a different context would be:
{
  "match": "([_$[:alpha:]][_$[:alnum:]]*)",
  "name": "variable.other.readwrite.ts"
}
```

The grammar engine tracks WHERE you are (function parameters vs. general expression) to assign the correct scope.

#### The TextMate State Machine

**How it actually works:**

1. **Start** with top-level patterns (`#directives`, `#statements`, `#shebang`)
2. **Push context** when entering a `begin`/`end` pattern
3. **Apply nested patterns** within that context
4. **Pop context** when exiting the construct
5. **Maintain pattern stack** for deeply nested structures

**Example flow for `const message = "hello";`:**

1. Start with `#statements`
2. Match `const` → enter variable declaration context
3. Match `message` → variable name (in declaration context)
4. Match `=` → assignment operator
5. Match `"` → enter string context
6. Match `hello` → string content
7. Match `"` → exit string context
8. Match `;` → statement terminator

Each step depends on the context from previous steps.

### Initial Findings

1. **TextMate grammars are state machines** - they track context as they parse
2. **Patterns are hierarchical** - complex constructs are built from simpler ones
3. **Scopes are semantic** - they describe what something IS, not how it looks
4. **VS Code's patterns are battle-tested** - they handle edge cases we'd never think of
5. **Pattern extraction approach is fundamentally flawed** - can't work without state machine
6. **We need VS Code's actual tokenization engine** - or build a complete TextMate parser

### Implementation Strategy

**Previous approach (FAILED):** Extract patterns and apply independently

**Correct approach:** Use VS Code's tokenization or build proper TextMate parser that:

1. **Implements the full state machine** with pattern stacks
2. **Handles `begin`/`end` patterns** with proper nesting
3. **Maintains context** throughout tokenization
4. **Applies patterns in correct order** with proper priorities
5. **Uses VS Code's exact regex** with complete conversion support

**OR** find a way to leverage VS Code's built-in tokenization engine directly.

### The Memoization Solution

**The Problem:** TextMate grammars have circular references (`#statements` → `#expression` → `#statements`)

**Wrong Approach:** Try to flatten all patterns into one giant list (causes infinite recursion)

**Correct Approach (Microsoft's Method):** Use memoization to resolve each include exactly once

```javascript
class TextMateTokenizer {
  constructor(grammarData) {
    this.repository = grammarData.repository || {};
    this.resolvedIncludes = new Map(); // Memoization cache!
  }

  resolveInclude(includeName) {
    // if ![includeName] then [includeName] = [includeContent] else skip
    if (!this.resolvedIncludes.has(includeName)) {
      const pattern = this.repository[includeName];
      this.resolvedIncludes.set(includeName, pattern);
      return pattern;
    } else {
      return this.resolvedIncludes.get(includeName); // Use cached version
    }
  }
}
```

**Why this works:**

- Each include is resolved exactly once
- Circular references become harmless (return cached version)
- No infinite recursion
- Preserves grammar structure
- **This is exactly how professional compilers work!**

This ensures we get **exactly** the same tokenization VS Code uses, automatically handling language updates and edge cases.

### Microsoft's TextMate Library Results

**Library:** `vscode-textmate` (Microsoft's actual implementation)

**What it produces for common patterns:**

```javascript
// const message = "hello";
"const" → "storage.type.ts"
"message" → "variable.other.constant.ts"
"=" → "keyword.operator.assignment.ts"
""hello"" → "string.quoted.double.ts"
";" → "punctuation.terminator.statement.ts"

// class Test { private x: number; }
"class" → "storage.type.class.ts"
"Test" → "entity.name.type.class.ts"
"private" → "storage.modifier.ts"
"x" → "variable.object.property.ts"
"number" → "support.type.primitive.ts"

// new Calculator()
"new" → "keyword.operator.new.ts"
"Calculator" → "entity.name.function.ts"

// if (true) { }
"if" → "keyword.control.conditional.ts"
"true" → "constant.language.boolean.true.ts"

// function test() { return; }
"function" → "storage.type.function.ts"
"test" → "entity.name.function.ts"
"return" → "keyword.control.flow.ts"
```

**Key Insight:** Microsoft's library produces very specific, hierarchical scopes that my basic patterns need to match exactly.

### Available Libraries (For Reference Only)

#### 1. vscode-textmate (Microsoft's Official Library)

**What it is:** Microsoft's actual TextMate grammar parser used in VS Code

**Installation:**

```bash
npm install vscode-textmate vscode-oniguruma
```

**What it provides:**

- Complete TextMate grammar parsing with Oniguruma regex engine
- Exact same tokenization as VS Code
- Handles all complex regex features (POSIX classes, lookbehind, etc.)
- State machine with proper rule stacks

**Why we're not using it:**

- Requires WASM Oniguruma engine (adds complexity)
- We want to understand the underlying patterns ourselves
- Our goal is to learn how TextMate works, not just use a black box

#### 2. posix-character-classes

**What it is:** Library that converts POSIX character classes to JavaScript equivalents

**Installation:**

```bash
npm install posix-character-classes
```

**Example:**

```javascript
const posix = require('posix-character-classes');
posix.alnum; // Returns: 'a-zA-Z0-9'
posix.alpha; // Returns: 'a-zA-Z'
```

**Why we're not using it:**

- We're already doing this conversion manually
- Want to understand the conversion process ourselves
- Need to handle more than just character classes

#### 3. oniguruma-to-es

**What it is:** Converts Oniguruma regex patterns to JavaScript RegExp

**What it provides:**

- Handles complex TextMate regex features
- Converts lookbehind/lookahead patterns
- Processes named capture groups

**Why we're not using it:**

- We want to build our own conversion logic
- Need to understand what each pattern does
- Want control over the conversion process

### Our Approach vs. Libraries

**Libraries:** Use existing solutions that work perfectly but are black boxes

**Our Approach:** Build our own converter to:

1. Understand exactly what each pattern does
2. Control the conversion process
3. Learn how TextMate grammars actually work
4. Fix conversion failures systematically instead of giving up

This gives us the knowledge to handle edge cases and debug issues when they arise.

## RESEARCH_SUMMARY

### What We Tried That Didn't Work

1. **Custom Syntax Highlighting** - We tried to create our own highlighting rules, but this was rejected because it wouldn't match VS Code's exact rendering and wouldn't be generic for future changes.

2. **Semantic Tokens API** - We attempted to use `vscode.executeDocumentSemanticTokensProvider`, but this only provides IntelliSense token types (0, 1, 2, 3) and doesn't give us TextMate scopes or syntax highlighting information.

3. **Monaco Editor in Webview** - We tried embedding Monaco Editor in our webview, but it lacks VS Code's native language services and wouldn't match the exact highlighting.

4. **Capturing Rendered HTML from VS Code Tabs** - We attempted to capture the DOM from VS Code editor tabs, but discovered that VS Code editors are native UI components, not HTML/CSS based, so their DOM cannot be accessed.

5. **VS Code Extension APIs for Theme Files** - We researched all available VS Code APIs and found that none provide access to built-in theme file paths or TextMate grammar locations.

### What Actually Worked

1. **Direct File System Access** - We successfully located VS Code/Cursor theme and grammar files on disk by searching in the app bundle directories:
   - `/Applications/Cursor.app/Contents/Resources/app/extensions/theme-defaults/themes/`
   - `/Applications/Cursor.app/Contents/Resources/app/extensions/typescript-basics/syntaxes/`
   - `/Applications/Cursor.app/Contents/Resources/app/extensions/markdown-basics/syntaxes/`

2. **Theme File Parsing** - We successfully parsed VS Code theme JSON files, including handling nested `include` statements (e.g., `dark_modern.json` including `dark_plus.json`) to merge `tokenColors`.

3. **TextMate Grammar Parsing** - We successfully loaded and parsed TextMate grammar files (`.tmLanguage.json`) to extract syntax highlighting patterns.

4. **Regex Pattern Conversion** - We implemented a converter to transform TextMate-specific regex features (like `(?x)`, `(?<!...)`, named capture groups) into valid JavaScript regex patterns.

5. **Cycle Detection** - We implemented cycle detection in grammar parsing to prevent infinite recursion when processing TextMate grammar files.

6. **Tokenization and Styling** - We successfully combined theme colors with grammar patterns to generate HTML with proper syntax highlighting that matches VS Code's rendering.

### Next Implementation Strategy

1. **Create a SyntaxHighlighter Class** - This class will handle:
   - Loading theme and grammar files
   - Parsing TextMate patterns
   - Converting regex patterns
   - Tokenizing code
   - Generating styled HTML

2. **Integrate with PDFManager** - Modify the PDF generation process to use the SyntaxHighlighter instead of basic templates.

3. **Cache Grammar and Theme Data** - Implement caching to avoid re-parsing files on each use.

4. **Handle Multiple File Types** - Extend the system to support various programming languages by loading their respective TextMate grammars.

5. **Fallback Patterns** - Add fallback patterns for complex TextMate regex that can't be converted to JavaScript regex.

6. **Error Handling** - Implement robust error handling for cases where theme or grammar files can't be loaded.

This approach gives us the exact VS Code syntax highlighting without trying to recreate it, making our solution generic and future-proof.
