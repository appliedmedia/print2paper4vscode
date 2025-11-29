# Named Parameters Refactoring Plan

This document outlines the comprehensive plan for refactoring method signatures from positional parameters to named parameters (hash/object style) throughout the codebase. Each method will accept an `args` object and use `dx.require()` for mandatory parameters.

## Scope & Exclusion Rules

**INCLUDE (refactor to named parameters):**
- Methods with 2+ primitive/simple parameters (no object params)
- **Exception:** Methods with object params where the calling pattern is already config-based (unpacking config objects to pass individual params) - these will be **simplified** by named parameters

**EXCLUDE (do NOT refactor):**
- Single parameter methods
- Zero parameter methods
- Variadic/rest parameters (`...args`)
- Type guard functions (`param is Type`)
- **Methods that already have an object/dict/config parameter (any param count)**
  - Examples: `(source, dictionary)`, `(value, options)`, `(id, contextDict)`
  - Reason: Avoids confusing double-nesting of objects
  - **Exception:** If callers already unpack config objects to call the method (like UIMenu.constructor), named parameters will simplify the code

## Pattern

```typescript
// Before
function foo(param1: string, param2: number, param3?: boolean) {
  // ...
}

// After - CRITICAL: Keys must match variable names exactly
function foo(args: { param1: string; param2: number; param3?: boolean }) {
  const dx = this.dx.sub('foo');
  dx.require(args, ['param1', 'param2']); // Required params only
  const { param1, param2, param3 } = args; // Keys = variable names
  // ...
}
```

---

## EXCLUDED Methods (Will NOT Be Refactored)

The following methods meet one or more exclusion criteria and should remain with positional parameters:

### Single Parameter Methods
- `forceNumber(value)` - App.ts
- `Diagnostics.out(message)` - single param
- `Diagnostics.print(message)` - single param
- `Diagnostics.error(message)` - single param
- `Diagnostics.done(message?)` - optional single param
- `Diagnostics.debugOn(enabled?)` - optional single param
- `Diagnostics.static debugOn(enabled?)` - optional single param
- All single-param constructors: `PDF(app)`, `PaperPrinter(app)`, `Stylize(app)`, `UI(app)`, `UIWebView(app)`, `UIMenuMgr(app)`, `TabInspector(app)`, `Coords(app)`, `Persist(app)`, `DocInfo_PDF(app)`, `DocInfo_PaperPrinter(app)`, `OS(app)`, `OS.create(app)`
- `handlePrintRequest(printType)` - PaperPrinter.ts
- `getThemes(filter?)` - Stylize.ts
- `getShikiThemes(filter?)` - Stylize.ts
- `getVSCodeThemes(filter?)` - Stylize.ts
- `convertVSCodeThemeToShiki(vscodeTheme)` - Stylize.ts
- `getFontFamilyFromTheme(themeData)` - Stylize.ts
- `handleWebviewMessage(msg)` - UI.ts
- `showInfoMessage(message)` - UI.ts
- `showErrorMessage(message)` - UI.ts
- `showWarningMessage(message)` - UI.ts
- `addToolbar(html)` - UI.ts
- `chooseSaveLocation(defaultFilename)` - UI.ts
- `UI.static out(message)` - UI.ts
- `getMenuById(id)` - UIMenuMgr.ts
- `getPersistForMenuId(menuId)` - UIMenuMgr.ts
- `getMenuItemIdSelected(menuId)` - UIMenuMgr.ts
- `getValueForMenuItemIdSelected(menuId)` - UIMenuMgr.ts
- `addMenu(menu)` - UIMenuMgr.ts
- `getUIMenu_HTML(menuId)` - UIMenuMgr.ts
- `setContextDict(contextDict?)` - UIMenuMgr.ts
- `getHTML(visited?)` - UIMenu.ts
- `getGlobalState(key)` - VSCodeAPIs.ts
- `showInformationMessage(message)` - VSCodeAPIs.ts
- `showErrorMessage(message)` - VSCodeAPIs.ts
- `showWarningMessage(message)` - VSCodeAPIs.ts
- `openInVSCode(filePath)` - VSCodeAPIs.ts
- `setupMessageHandling(panel)` - VSCodeAPIs.ts
- `getSelectionOrDocumentText(editor)` - VSCodeAPIs.ts
- `getDescriptiveName(document)` - VSCodeAPIs.ts
- `uriFromPath(filePath)` - VSCodeAPIs.ts
- `uriToPath(uri)` - VSCodeAPIs.ts
- `showSaveDialog(options)` - VSCodeAPIs.ts (already takes options object)
- `dictReplace(source)` - OS.ts
- `ensureDir(dirPath)` - OS.ts
- `fileDelete(targetPath)` - OS.ts
- `pathDirname(filePath)` - OS.ts
- `exists(targetPath)` - OS.ts
- `sanitizeFileName(name)` - OS.ts
- `pathBasename(p)` - OS.ts
- `fileOpenPrintDialog(path)` - OS.ts
- `filePrint(path)` - OS.ts
- `fileReveal(path)` - OS.ts
- `fileOpenInDefaultApp(path)` - OS.ts
- `cssPxToPdfPts(cssPx)` - Coords.ts
- `pdfPtsToCssPx(pdfPts)` - Coords.ts
- `register(name)` - Persist.ts
- `setPage(pageNumber)` - DocInfo_PDF.ts

### Zero Parameter Methods
- `Diagnostics.static reset()` - no params
- `setupPdf()` - PDF.ts
- `finishPdf()` - PDF.ts
- `generatePdf()` - PDF.ts
- `getPageTotal()` - PDF.ts
- `getPageSizePx()` - PDF.ts
- `resetCaches()` - PDF.ts
- `handlePrintCommandFromVSCode()` - PaperPrinter.ts
- `resolveActiveTheme()` - Stylize.ts
- `displayPdfPanel()` - UIWebView.ts

### Type Guard Functions
- `isMenuId(id)` - UIMenuMgr.ts (type narrowing requires positional params)
- `isMenuItemId(id)` - UIMenuMgr.ts (type narrowing requires positional params)

### Variadic Functions
- `pathJoin(...parts)` - OS.ts (rest parameters - wrapping in object defeats ergonomics)

### Methods with Object/Dict Parameter (any param count)
- `templateDictReplace(source, dictionary)` - App.ts (has dictionary object)
- `forceNumbers(dict, useForZero?, requiredKeys?)` - App.ts (has dict object)
- `Diagnostics.require(args, requiredKeys)` - Diagnostics.ts (has args object)
- `dispatchSelection(menuItemId, contextDict?)` - UIMenu.ts (has contextDict object)
- `handleMenuItemSelected(menuId, menuItemId, contextDict)` - UIMenuMgr.ts (has contextDict)
- `handleSelection_ZoomLevel(menuId, menuItemId, contextDict)` - PaperPrinter.ts (has contextDict)
- `createDocument(content, uri?)` - VSCodeAPIs.ts (has uri object)
- `showDocument(document, preview?)` - VSCodeAPIs.ts (has document object)

---

## INCLUDED Methods (Will Be Refactored)

The following methods have 2-4 simple parameters OR 5+ parameters and will benefit from named parameter refactoring:

---

## App.ts

### `constructor(context, vscode)`
**Current signature:** `constructor(context: ExtensionContext, vscode: typeof import('vscode'))`

**New signature:** 
```typescript
constructor(args: { 
  context: ExtensionContext; 
  vscode: typeof import('vscode') 
})
```

**dx.require:** `['context', 'vscode']`

**Callers to update:**
- `src/-entrypoint.ts` - activation function

**Typedefs to update:**
- None (uses imported types)

---

## Diagnostics.ts

### `constructor(name, debugOn?, parent?, app?)`
**Current signature:** `constructor(name: string, debugOn?: boolean, parent?: Diagnostics | null, app?: any)`

**New signature:**
```typescript
constructor(args: {
  name: string;
  debugOn?: boolean;
  parent?: Diagnostics | null;
  app?: any;
})
```

**dx.require:** `['name']`

**Callers to update:**
- `src/App.ts` line 77
- `src/Diagnostics.ts` line 113 - sub() method
- Every component constructor creates Diagnostics

**Typedefs to update:**
- None

---

### `sub(name, debugOn?)`
**Current signature:** `sub(name: string, debugOn?: boolean): Diagnostics`

**New signature:**
```typescript
sub(args: { name: string; debugOn?: boolean }): Diagnostics
```

**dx.require:** `['name']`

**Callers to update:**
- Hundreds of calls throughout codebase (every method creates a sub-diagnostics)
- Search for `.sub(` pattern

**Typedefs to update:**
- None

---

## PDF.ts

### `printWithPreview(pdfDoc, descriptiveName?)`
**Current signature:** `async printWithPreview(pdfDoc: DocInfo_PDF, descriptiveName?: string): Promise<void>`

**New signature:**
```typescript
async printWithPreview(args: {
  pdfDoc: DocInfo_PDF;
  descriptiveName?: string;
}): Promise<void>
```

**dx.require:** `['pdfDoc']`

**Callers to update:**
- `src/PaperPrinter.ts` line 139-142, 624-627

**Typedefs to update:**
- None

---

### `printDirectly(pdfDoc, descriptiveName?)`
**Current signature:** `async printDirectly(pdfDoc: DocInfo_PDF, descriptiveName?: string): Promise<void>`

**New signature:**
```typescript
async printDirectly(args: {
  pdfDoc: DocInfo_PDF;
  descriptiveName?: string;
}): Promise<void>
```

**dx.require:** `['pdfDoc']`

**Callers to update:**
- `src/PaperPrinter.ts` line 143-146, 628-631

**Typedefs to update:**
- None

---

### `saveAsPDF(pdfDoc, descriptiveName?)`
**Current signature:** `async saveAsPDF(pdfDoc: DocInfo_PDF, descriptiveName?: string): Promise<void>`

**New signature:**
```typescript
async saveAsPDF(args: {
  pdfDoc: DocInfo_PDF;
  descriptiveName?: string;
}): Promise<void>
```

**dx.require:** `['pdfDoc']`

**Callers to update:**
- `src/PaperPrinter.ts` line 148-151, 635-638

**Typedefs to update:**
- None

---

### `renderTokenizedLine(lineNumber, tokens)`
**Current signature:** `public renderTokenizedLine(lineNumber: number, tokens: ThemedToken[]): void`

**New signature:**
```typescript
public renderTokenizedLine(args: {
  lineNumber: number;
  tokens: ThemedToken[];
}): void
```

**dx.require:** `['lineNumber', 'tokens']`

**Callers to update:**
- `src/Stylize.ts` line 274

**Typedefs to update:**
- None (uses Shiki types)

---

## PaperPrinter.ts

### `handleSelection_Print(menuId, menuItemId)`
**Current signature:** `private async handleSelection_Print(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_Print(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 331 - bound reference in createMenus

**Typedefs to update:**
- None

---

### `handleSelection_Theme(menuId, menuItemId)`
**Current signature:** `private async handleSelection_Theme(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_Theme(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 331 - bound reference in createMenus

**Typedefs to update:**
- None

---

### `handleSelection_Text(menuId, menuItemId)`
**Current signature:** `private async handleSelection_Text(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_Text(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 331 - bound reference in createMenus

**Typedefs to update:**
- None

---

### `handleSelection_PageSizeId(menuId, menuItemId)`
**Current signature:** `private async handleSelection_PageSizeId(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_PageSizeId(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 331 - bound reference in createMenus

**Typedefs to update:**
- None

---

### `handleSelection_Orient(menuId, menuItemId)`
**Current signature:** `private async handleSelection_Orient(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_Orient(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 331 - bound reference in createMenus

**Typedefs to update:**
- None

---

### `handleSelection_MarginId(menuId, menuItemId)`
**Current signature:** `private async handleSelection_MarginId(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_MarginId(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 331 - bound reference in createMenus

**Typedefs to update:**
- None

---

### `handleSelection_HeaderFooter(menuId, menuItemId)`
**Current signature:** `private async handleSelection_HeaderFooter(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_HeaderFooter(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 345 - bound reference in createMenus

**Typedefs to update:**
- None

---

### `handleSelection_ZoomInOut(menuId, menuItemId)`
**Current signature:** `private async handleSelection_ZoomInOut(menuId: MenuId_t, menuItemId: MenuItemId_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_ZoomInOut(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- Menu system dispatch (UIMenuMgr)

**Typedefs to update:**
- None

---

## Stylize.ts

### `tokenize(code, languageId, theme?, pageBegin?, pageEnd?)`
**Current signature:** 
```typescript
async tokenize(
  code: string,
  languageId: LanguageId_t,
  theme?: string,
  pageBegin?: number,
  pageEnd?: number
): Promise<ThemedToken[][]>
```

**New signature:**
```typescript
async tokenize(args: {
  code: string;
  languageId: LanguageId_t;
  theme?: string;
  pageBegin?: number;
  pageEnd?: number;
}): Promise<ThemedToken[][]>
```

**dx.require:** `['code', 'languageId']`

**Callers to update:**
- `src/PDF.ts` line 372-378

**Typedefs to update:**
- None

---

## UI.ts

### `registerMessageHandler(messageType, handler)`
**Current signature:** `registerMessageHandler(messageType: string, handler: MessageHandler_t): void`

**New signature:**
```typescript
registerMessageHandler(args: {
  messageType: string;
  handler: MessageHandler_t;
}): void
```

**dx.require:** `['messageType', 'handler']`

**Callers to update:**
- `src/UIWebView.ts` line 292

**Typedefs to update:**
- None

---

### `unregisterMessageHandler(messageType, handler)`
**Current signature:** `unregisterMessageHandler(messageType: string, handler: MessageHandler_t): void`

**New signature:**
```typescript
unregisterMessageHandler(args: {
  messageType: string;
  handler: MessageHandler_t;
}): void
```

**dx.require:** `['messageType', 'handler']`

**Callers to update:**
- `src/UIWebView.ts` line 261

**Typedefs to update:**
- None

---

## UIWebView.ts

*(No methods in this file meet the refactoring criteria)*

---

## UIMenu.ts

### `constructor(app, id, displayName, iconSlotTriad, isFlyout, menuItems, flyoutMenuItemIds, selectionHandler)`
**Current signature:**
```typescript
constructor(
  app: App,
  id: MenuId_t,
  displayName: string,
  iconSlotTriad: iconSlotTriad_t,
  isFlyout: boolean = false,
  menuItems: () => UIMenuItem_t[],
  flyoutMenuItemIds: string[] = [],
  selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t, contextDict: contextDict_t) => Promise<HandleSelection_t>
)
```

**New signature:**
```typescript
constructor(args: {
  app: App;
  id: MenuId_t;
  displayName: string;
  iconSlotTriad: iconSlotTriad_t;
  isFlyout?: boolean;
  menuItems: () => UIMenuItem_t[];
  flyoutMenuItemIds?: string[];
  selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t, contextDict: contextDict_t) => Promise<HandleSelection_t>;
})
```

**dx.require:** `['app', 'id', 'displayName', 'iconSlotTriad', 'menuItems', 'selectionHandler']`

**Callers to update:**
- `src/UIMenuMgr.ts` line 129-139 (createMenu method)

**Typedefs to update:**
- None

**Refactoring Note:** This was previously excluded due to `iconSlotTriad` object parameter, but actual usage in PaperPrinter.ts shows the calling pattern already uses config objects that are unpacked. Named parameters will **simplify** this by allowing direct spread: `new UIMenu({ app: this.app, ...config })` instead of unpacking each property individually.

---

### `getItemHTML(item, flyout, defaultItemId, selectedItemId)`
**Current signature:** 
```typescript
async getItemHTML(
  item: UIMenuItem_t,
  flyout: string,
  defaultItemId: string,
  selectedItemId: string
): Promise<string>
```

**New signature:**
```typescript
async getItemHTML(args: {
  item: UIMenuItem_t;
  flyout: string;
  defaultItemId: string;
  selectedItemId: string;
}): Promise<string>
```

**dx.require:** `['item', 'flyout', 'defaultItemId', 'selectedItemId']`

**Callers to update:**
- `src/UIMenu.ts` line 601

**Typedefs to update:**
- None

---

## UIMenuMgr.ts

### `createMenu(id, displayName, iconSlotTriad, isFlyout, menuItems, flyoutMenuItemIds, selectionHandler)`
**Current signature:**
```typescript
createMenu(
  id: MenuId_t,
  displayName: string,
  iconSlotTriad: iconSlotTriad_t,
  isFlyout: boolean = false,
  menuItems: () => UIMenuItem_t[],
  flyoutMenuItemIds: string[] = [],
  selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>
): UIMenu
```

**New signature:**
```typescript
createMenu(args: {
  id: MenuId_t;
  displayName: string;
  iconSlotTriad: iconSlotTriad_t;
  isFlyout?: boolean;
  menuItems: () => UIMenuItem_t[];
  flyoutMenuItemIds?: string[];
  selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>;
}): UIMenu
```

**dx.require:** `['id', 'displayName', 'iconSlotTriad', 'menuItems', 'selectionHandler']`

**Callers to update:**
- `src/PaperPrinter.ts` line 354-362 (loop through menuConfigs)

**Typedefs to update:**
- None

**Refactoring Note:** This was previously excluded due to `iconSlotTriad` object parameter, but actual usage shows config-based calling pattern. After refactoring, PaperPrinter.ts can be simplified:
- Rename `menuConfigs` → `menus` (remove redundant "Configs")
- Rename loop variable `config` → `menu`
- Simplify call: `const menu = this.app.uimenumgr.createMenu({ app: this.app, ...menu })`
- The returned menu from `createMenu()` is currently captured then immediately passed to `addMenu()` - consider if `createMenu()` should internally call `addMenu()` and return void, or if the intermediate variable serves a purpose.

---

### `getValueForPersistIdOnMenuId(menuId, persistId)`
**Current signature:** `getValueForPersistIdOnMenuId(menuId: MenuId_t, persistId: UI_t): PersistValue_t | undefined`

**New signature:**
```typescript
getValueForPersistIdOnMenuId(args: {
  menuId: MenuId_t;
  persistId: UI_t;
}): PersistValue_t | undefined
```

**dx.require:** `['menuId', 'persistId']`

**Callers to update:**
- `src/UIMenuMgr.ts` line 301

**Typedefs to update:**
- None

---

### `setValueForPersistIdOnMenuId(menuId, persistId, value)`
**Current signature:** `setValueForPersistIdOnMenuId(menuId: MenuId_t, persistId: UI_t, value: PersistValue_t): void`

**New signature:**
```typescript
setValueForPersistIdOnMenuId(args: {
  menuId: MenuId_t;
  persistId: UI_t;
  value: PersistValue_t;
}): void
```

**dx.require:** `['menuId', 'persistId', 'value']`

**Callers to update:**
- `src/PaperPrinter.ts` line 704, 738, 765, 810, 836, 864, 889, 1003, 1006

**Typedefs to update:**
- None

---

### `getValueForMenuItemId(menuId, menuItemId)`
**Current signature:** `getValueForMenuItemId(menuId: MenuId_t, menuItemId: string): number | string`

**New signature:**
```typescript
getValueForMenuItemId(args: {
  menuId: MenuId_t;
  menuItemId: string;
}): number | string
```

**dx.require:** `['menuId', 'menuItemId']`

**Callers to update:**
- `src/UIMenuMgr.ts` line 277
- `src/UIWebView.ts` line 183
- `src/PaperPrinter.ts` line 918

**Typedefs to update:**
- None

---

## VSCodeAPIs.ts

### `constructor(app, vscode, context)`
**Current signature:** `constructor(app: App, vscode: typeof import('vscode'), context: ExtensionContext)`

**New signature:**
```typescript
constructor(args: {
  app: App;
  vscode: typeof import('vscode');
  context: ExtensionContext;
})
```

**dx.require:** `['app', 'vscode', 'context']`

**Callers to update:**
- `src/App.ts` line 80

**Typedefs to update:**
- None

---

### `updateGlobalState(key, value)`
**Current signature:** `updateGlobalState(key: GlobalStateKey_t, value: GlobalStateValue_t): void`

**New signature:**
```typescript
updateGlobalState(args: {
  key: GlobalStateKey_t;
  value: GlobalStateValue_t;
}): void
```

**dx.require:** `['key', 'value']`

**Callers to update:**
- `src/Persist.ts` line 63, 78, 113

**Typedefs to update:**
- None

---

### `setPanelTitle(id, title)`
**Current signature:** `setPanelTitle(id: WebviewPanelId_t, title: string): void`

**New signature:**
```typescript
setPanelTitle(args: {
  id: WebviewPanelId_t;
  title: string;
}): void
```

**dx.require:** `['id', 'title']`

**Callers to update:**
- Search for calls

**Typedefs to update:**
- None

---

### `updatePanelHtml(id, html)`
**Current signature:** `updatePanelHtml(id: WebviewPanelId_t, html: string): void`

**New signature:**
```typescript
updatePanelHtml(args: {
  id: WebviewPanelId_t;
  html: string;
}): void
```

**dx.require:** `['id', 'html']`

**Callers to update:**
- `src/VSCodeAPIs.ts` line 219, 266

**Typedefs to update:**
- None

---

### `getOrCreateWebviewPanel(title, html, existingPanelId?)`
**Current signature:** 
```typescript
async getOrCreateWebviewPanel(
  title: string,
  html: string,
  existingPanelId?: WebviewPanelId_t
): Promise<WebviewPanelId_t>
```

**New signature:**
```typescript
async getOrCreateWebviewPanel(args: {
  title: string;
  html: string;
  existingPanelId?: WebviewPanelId_t;
}): Promise<WebviewPanelId_t>
```

**dx.require:** `['title', 'html']`

**Callers to update:**
- `src/UIWebView.ts` line 146-150

**Typedefs to update:**
- None

---

### `getVSCodeThemeJson(themeId, keys?)`
**Current signature:** `getVSCodeThemeJson(themeId: string, keys?: string[]): Record<string, unknown> | undefined`

**New signature:**
```typescript
getVSCodeThemeJson(args: {
  themeId: string;
  keys?: string[];
}): Record<string, unknown> | undefined
```

**dx.require:** `['themeId']`

**Callers to update:**
- `src/Stylize.ts` line 155, 217

**Typedefs to update:**
- None

---

## OS.ts

### `fileWrite(filePath, content)`
**Current signature:** `fileWrite(filePath: string, content: string | Buffer): void`

**New signature:**
```typescript
fileWrite(args: {
  filePath: string;
  content: string | Buffer;
}): void
```

**dx.require:** `['filePath', 'content']`

**Callers to update:**
- `src/PDF.ts` line 137, 169, 208

**Typedefs to update:**
- None

---

### `fileCopy(srcPath, destPath)`
**Current signature:** `fileCopy(srcPath: string, destPath: string): void`

**New signature:**
```typescript
fileCopy(args: {
  srcPath: string;
  destPath: string;
}): void
```

**dx.require:** `['srcPath', 'destPath']`

**Callers to update:**
- Search for calls

**Typedefs to update:**
- None

---

### `fileRead<T>(path, key?)`
**Current signature:** `fileRead: FileRead_t = <T = string>(path: string, key?: string): T | undefined`

**New signature:**
```typescript
fileRead<T = string>(args: {
  path: string;
  key?: string;
}): T | undefined
```

**dx.require:** `['path']`

**Callers to update:**
- `src/Stylize.ts` line 166, 317
- `src/Yaml.ts` line 45
- `src/UIWebView.ts` line 171
- `src/VSCodeAPIs.ts` line 335

**Typedefs to update:**
- `FileRead_t`

---

### `htmlSrcPathToURI(html, webviewPanelId)`
**Current signature:** `htmlSrcPathToURI(html: string, webviewPanelId: WebviewPanelId_t): string`

**New signature:**
```typescript
htmlSrcPathToURI(args: {
  html: string;
  webviewPanelId: WebviewPanelId_t;
}): string
```

**dx.require:** `['html', 'webviewPanelId']`

**Callers to update:**
- `src/VSCodeAPIs.ts` line 219, 265

**Typedefs to update:**
- None

---

## TabInspector.ts

*(No methods in this file meet the refactoring criteria)*

---

## Coords.ts

### `pageDimensionsInchesOrMmToPdfPts(widthInchesOrMm, heightInchesOrMm, unit)`
**Current signature:** 
```typescript
pageDimensionsInchesOrMmToPdfPts(
  widthInchesOrMm: number,
  heightInchesOrMm: number,
  unit: 'in' | 'mm'
): { widthPts: number; heightPts: number }
```

**New signature:**
```typescript
pageDimensionsInchesOrMmToPdfPts(args: {
  widthInchesOrMm: number;
  heightInchesOrMm: number;
  unit: 'in' | 'mm';
}): { widthPts: number; heightPts: number }
```

**dx.require:** `['widthInchesOrMm', 'heightInchesOrMm', 'unit']`

**Callers to update:**
- Search for calls

**Typedefs to update:**
- None

---

## Persist.ts

### `validateDefault(name, computeFn)`
**Current signature:** `async validateDefault(name: string, computeFn: () => Promise<PersistValue_t>): Promise<PersistValue_t>`

**New signature:**
```typescript
async validateDefault(args: {
  name: string;
  computeFn: () => Promise<PersistValue_t>;
}): Promise<PersistValue_t>
```

**dx.require:** `['name', 'computeFn']`

**Callers to update:**
- `src/UIMenu.ts` line 269

**Typedefs to update:**
- None

---

## Yaml.ts

### `constructor(app, filePath, dataStruct)`
**Current signature:** `constructor(app: App, filePath: string, dataStruct: T)`

**New signature:**
```typescript
constructor(args: {
  app: App;
  filePath: string;
  dataStruct: T;
})
```

**dx.require:** `['app', 'filePath', 'dataStruct']`

**Callers to update:**
- Every component that uses Yaml: `src/UI.ts`, `src/PDF.ts`, `src/PaperPrinter.ts`, `src/UIWebView.ts`, `src/UIMenu.ts`

**Typedefs to update:**
- None

---

## DocInfo_PDF.ts

*(No methods in this file meet the refactoring criteria)*

---

## DocInfo_PaperPrinter.ts

*(No methods in this file meet the refactoring criteria)*

---

## Summary

This refactoring focuses on methods where named parameters provide clear benefits: multi-parameter methods with simple arguments, and large constructors/methods with many parameters. By excluding single-parameter methods, variadic functions, type guards, and methods that already use object parameters, we avoid unnecessary complexity while still achieving the goal of explicit, self-documenting API calls.

### Key Steps

1. Update each method signature to accept a single `args` object with keys matching variable names
2. Add `dx.require()` calls at the beginning of each method for required parameters
3. Destructure the `args` object using the **same key names as variable names**
4. Update all call sites to pass arguments as an object with explicit keys
5. Update type definitions where necessary (primarily function signatures)

### Implementation Strategy

1. **Start with leaf methods** - Methods that don't call other methods in the codebase
2. **Work bottom-up** - Refactor callers after callees
3. **Test incrementally** - Run tests after each file or set of related methods
4. **Use compiler** - TypeScript will catch all call sites that need updating
5. **Verify key names** - Ensure destructured variable names match object keys exactly

### Estimated Impact

**INCLUDED (will be refactored):**
- **~27-32 methods** need refactoring (includes UIMenu.constructor and UIMenuMgr.createMenu)
- **~125-155 call sites** need updating
- Methods with clear benefit: 2+ simple/primitive parameters, OR methods with object params where the calling pattern is already config-based (e.g., UIMenu initialization)

**EXCLUDED (remain positional):**
- **~73+ methods** remain unchanged
- Single-parameter, zero-parameter, variadic functions, type guards, and methods with object/dict/config params (except where already config-driven)
- No effort required, no risk introduced, no double-nesting confusion

**Total effort:** Focused on high-value changes that improve API clarity without unnecessary churn. Special attention to UIMenu/UIMenuMgr which will enable significant simplification in PaperPrinter.ts (menuConfigs → menus, direct object spread).
