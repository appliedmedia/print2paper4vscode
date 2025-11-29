# Named Parameters Refactoring Plan

This document outlines the comprehensive plan for refactoring method signatures from positional parameters to named parameters (hash/object style) throughout the codebase. Each method will accept an `args` object and use `dx.require()` for mandatory parameters.

## Pattern

```typescript
// Before
function foo(param1: string, param2: number, param3?: boolean) {
  // ...
}

// After
function foo(args: { param1: string; param2: number; param3?: boolean }) {
  const dx = this.dx.sub('foo');
  dx.require(args, ['param1', 'param2']); // Required params only
  const { param1, param2, param3 } = args;
  // ...
}
```

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

### `forceNumber(value)`
**Current signature:** `forceNumber(value: ForceNumber_scalar_t): number`

**New signature:**
```typescript
forceNumber(args: { value: ForceNumber_scalar_t }): number
```

**dx.require:** `['value']`

**Callers to update:**
- `src/App.ts` line 113 - self-call
- `src/UIMenuMgr.ts` line 185 - contextDict display
- `src/UIWebView.ts` line 185 - zoom level
- `src/PaperPrinter.ts` line 888, 937, 974 - zoom value processing

**Typedefs to update:**
- `ForceNumber_scalar_t` remains same

---

### `forceNumbers(dict, useForZero?, requiredKeys?)`
**Current signature:** 
```typescript
forceNumbers(
  dict: ForceNumber_dict_t,
  useForZero = 0,
  requiredKeys?: readonly string[]
): ForceNumbers_t
```

**New signature:**
```typescript
forceNumbers(args: {
  dict: ForceNumber_dict_t;
  useForZero?: number;
  requiredKeys?: readonly string[];
}): ForceNumbers_t
```

**dx.require:** `['dict']`

**Callers to update:**
- `src/App.ts` line 113 - internal call
- `src/UIMenuMgr.ts` line 374 - buildUIMenuItemDict

**Typedefs to update:**
- `ForceNumber_dict_t` remains same

---

### `hasContent(content?)`
**Current signature:** `hasContent(content: string | number | boolean | undefined = ''): boolean`

**New signature:**
```typescript
hasContent(args: { content?: string | number | boolean | undefined }): boolean
```

**dx.require:** None (optional parameter)

**Callers to update:**
- `src/PaperPrinter.ts` line 883 - zoom level validation
- `src/UIMenuMgr.ts` line 303 - persist value check

**Typedefs to update:**
- None

---

### `templateDictReplace(source, dictionary)`
**Current signature:** `templateDictReplace(source: string, dictionary: Record<string, string>): string`

**New signature:**
```typescript
templateDictReplace(args: {
  source: string;
  dictionary: Record<string, string>;
}): string
```

**dx.require:** `['source', 'dictionary']`

**Callers to update:**
- Multiple callers across:
  - `src/OS.ts` line 121
  - `src/UI.ts` line 184, 206
  - `src/UIMenu.ts` line 348, 488, 636
  - `src/UIWebView.ts` line 216-217, 220
  - `src/UIMenuMgr.ts` line 462
  - `src/PaperPrinter.ts` line 471, 480
  - `src/Stylize.ts` line 346, 353, 361
  - `src/PDF.ts` line 807

**Typedefs to update:**
- None (uses built-in types)

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

### `require(args, requiredKeys)`
**Current signature:** `require(args: Record<string, unknown>, requiredKeys: string[]): boolean`

**New signature:**
```typescript
require(args: {
  argsToValidate: Record<string, unknown>;
  requiredKeys: string[];
}): boolean
```

**dx.require:** `['argsToValidate', 'requiredKeys']`

**Callers to update:**
- `src/Stylize.ts` line 69
- `src/UIWebView.ts` line 120, 331
- `src/PDF.ts` line 117, 359
- `src/VSCodeAPIs.ts` line 62
- `src/UI.ts` line 107, 146

**Typedefs to update:**
- None

---

### `out(message)`
**Current signature:** `out(message: MessageRef): this`

**New signature:**
```typescript
out(args: { message: MessageRef }): this
```

**dx.require:** `['message']`

**Callers to update:**
- Hundreds of calls throughout codebase
- Search for `dx.out(` and `.out(` patterns

**Typedefs to update:**
- `MessageRef` remains same

---

### `done(message?)`
**Current signature:** `done(message?: MessageRef): this`

**New signature:**
```typescript
done(args?: { message?: MessageRef }): this
```

**dx.require:** None (all optional)

**Callers to update:**
- Hundreds of calls throughout codebase
- Search for `dx.done()` pattern

**Typedefs to update:**
- None

---

### `print(message)`
**Current signature:** `print(message: MessageRef): this`

**New signature:**
```typescript
print(args: { message: MessageRef }): this
```

**dx.require:** `['message']`

**Callers to update:**
- `src/UIWebView.ts` line 335, 337

**Typedefs to update:**
- None

---

### `error(message)`
**Current signature:** `error(message: MessageRef): this`

**New signature:**
```typescript
error(args: { message: MessageRef }): this
```

**dx.require:** `['message']`

**Callers to update:**
- Multiple error handlers throughout codebase
- Search for `dx.error(` pattern

**Typedefs to update:**
- None

---

### `debugOn(enabled?)`
**Current signature:** `debugOn(enabled?: boolean): boolean`

**New signature:**
```typescript
debugOn(args?: { enabled?: boolean }): boolean
```

**dx.require:** None (all optional)

**Callers to update:**
- Internal calls in Diagnostics.ts
- Various debug checks

**Typedefs to update:**
- None

---

### `static debugOn(enabled?)`
**Current signature:** `static debugOn(enabled?: boolean): boolean`

**New signature:**
```typescript
static debugOn(args?: { enabled?: boolean }): boolean
```

**dx.require:** None (all optional)

**Callers to update:**
- Static calls to Diagnostics.debugOn

**Typedefs to update:**
- None

---

### `static reset()`
**Current signature:** `static reset(): void`

**New signature:**
```typescript
static reset(args?: {}): void
```

**dx.require:** None

**Callers to update:**
- Test files

**Typedefs to update:**
- None

---

## PDF.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/App.ts` line 84

**Typedefs to update:**
- None

---

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

### `setupPdf()`
**Current signature:** `public setupPdf(): void`

**New signature:**
```typescript
public setupPdf(args?: {}): void
```

**dx.require:** None (uses docInfo properties)

**Callers to update:**
- `src/PDF.ts` line 366

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

### `finishPdf()`
**Current signature:** `public finishPdf(): void`

**New signature:**
```typescript
public finishPdf(args?: {}): void
```

**dx.require:** None

**Callers to update:**
- `src/PDF.ts` line 381

**Typedefs to update:**
- None

---

### `generatePdf()`
**Current signature:** `async generatePdf(): Promise<void>`

**New signature:**
```typescript
async generatePdf(args?: {}): Promise<void>
```

**dx.require:** None (uses docInfo properties, validates with dx.require internally)

**Callers to update:**
- `src/PaperPrinter.ts` line 132, 197, 274, 618

**Typedefs to update:**
- None

---

### `getPageTotal()`
**Current signature:** `async getPageTotal(): Promise<number>`

**New signature:**
```typescript
async getPageTotal(args?: {}): Promise<number>
```

**dx.require:** None

**Callers to update:**
- `src/PDF.ts` line 79

**Typedefs to update:**
- None

---

### `getPageSizePx()`
**Current signature:** `async getPageSizePx(): Promise<{ widthPx: number; heightPx: number }>`

**New signature:**
```typescript
async getPageSizePx(args?: {}): Promise<{ widthPx: number; heightPx: number }>
```

**dx.require:** None

**Callers to update:**
- `src/PDF.ts` line 417

**Typedefs to update:**
- None

---

### `resetCaches()`
**Current signature:** `resetCaches(): void`

**New signature:**
```typescript
resetCaches(args?: {}): void
```

**dx.require:** None

**Callers to update:**
- `src/PaperPrinter.ts` line 580

**Typedefs to update:**
- None

---

## PaperPrinter.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/App.ts` line 85

**Typedefs to update:**
- None

---

### `handlePrintRequest(printType)`
**Current signature:** `async handlePrintRequest(printType: string): Promise<void>`

**New signature:**
```typescript
async handlePrintRequest(args: { printType: string }): Promise<void>
```

**dx.require:** `['printType']`

**Callers to update:**
- Message handlers (check for webview message routing)

**Typedefs to update:**
- None

---

### `handlePrintCommandFromVSCode()`
**Current signature:** `async handlePrintCommandFromVSCode(): Promise<void>`

**New signature:**
```typescript
async handlePrintCommandFromVSCode(args?: {}): Promise<void>
```

**dx.require:** None

**Callers to update:**
- `src/VSCodeAPIs.ts` line 66

**Typedefs to update:**
- None

---

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

### `handleSelection_ZoomLevel(menuId, menuItemId, contextDict)`
**Current signature:** `private async handleSelection_ZoomLevel(menuId: MenuId_t, menuItemId: MenuItemId_t, contextDict: contextDict_t): Promise<HandleSelection_t>`

**New signature:**
```typescript
private async handleSelection_ZoomLevel(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
  contextDict: contextDict_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuId', 'menuItemId', 'contextDict']`

**Callers to update:**
- Menu system dispatch (UIMenuMgr)

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

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/App.ts` line 86

**Typedefs to update:**
- None

---

### `getThemes(filter?)`
**Current signature:** `getThemes(filter?: string): Theme[]`

**New signature:**
```typescript
getThemes(args?: { filter?: string }): Theme[]
```

**dx.require:** None

**Callers to update:**
- `src/PaperPrinter.ts` line 377, 729-730
- `src/Stylize.ts` line 293
- `src/UIMenuMgr.ts` line 98

**Typedefs to update:**
- None

---

### `getShikiThemes(filter?)`
**Current signature:** `getShikiThemes(filter?: string): Theme[]`

**New signature:**
```typescript
getShikiThemes(args?: { filter?: string }): Theme[]
```

**dx.require:** None

**Callers to update:**
- `src/Stylize.ts` line 104

**Typedefs to update:**
- None

---

### `getVSCodeThemes(filter?)`
**Current signature:** `getVSCodeThemes(filter?: string): Theme[]`

**New signature:**
```typescript
getVSCodeThemes(args?: { filter?: string }): Theme[]
```

**dx.require:** None

**Callers to update:**
- `src/Stylize.ts` line 105

**Typedefs to update:**
- None

---

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

### `resolveActiveTheme()`
**Current signature:** `public resolveActiveTheme(): string`

**New signature:**
```typescript
public resolveActiveTheme(args?: {}): string
```

**dx.require:** None

**Callers to update:**
- `src/Stylize.ts` line 259

**Typedefs to update:**
- None

---

### `convertVSCodeThemeToShiki(vscodeTheme)`
**Current signature:** `public convertVSCodeThemeToShiki(vscodeTheme: VSCodeTheme): ThemeData`

**New signature:**
```typescript
public convertVSCodeThemeToShiki(args: {
  vscodeTheme: VSCodeTheme;
}): ThemeData
```

**dx.require:** `['vscodeTheme']`

**Callers to update:**
- `src/Stylize.ts` line 185, 221

**Typedefs to update:**
- None

---

### `getFontFamilyFromTheme(themeData)`
**Current signature:** `public getFontFamilyFromTheme(themeData: Theme): string`

**New signature:**
```typescript
public getFontFamilyFromTheme(args: { themeData: Theme }): string
```

**dx.require:** `['themeData']`

**Callers to update:**
- Search for calls (appears to be unused in current code)

**Typedefs to update:**
- None

---

## UI.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/App.ts` line 81

**Typedefs to update:**
- None

---

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

### `handleWebviewMessage(msg)`
**Current signature:** `async handleWebviewMessage(msg: SendToExt_t): Promise<void>`

**New signature:**
```typescript
async handleWebviewMessage(args: { msg: SendToExt_t }): Promise<void>
```

**dx.require:** `['msg']`

**Callers to update:**
- `src/VSCodeAPIs.ts` line 276

**Typedefs to update:**
- None

---

### `showInfoMessage(message)`
**Current signature:** `showInfoMessage(message: string): void`

**New signature:**
```typescript
showInfoMessage(args: { message: string }): void
```

**dx.require:** `['message']`

**Callers to update:**
- `src/Persist.ts` line 124

**Typedefs to update:**
- None

---

### `showErrorMessage(message)`
**Current signature:** `showErrorMessage(message: string): void`

**New signature:**
```typescript
showErrorMessage(args: { message: string }): void
```

**dx.require:** `['message']`

**Callers to update:**
- `src/PDF.ts` line 176, 218
- `src/Diagnostics.ts` line 206

**Typedefs to update:**
- None

---

### `showWarningMessage(message)`
**Current signature:** `showWarningMessage(message: string): void`

**New signature:**
```typescript
showWarningMessage(args: { message: string }): void
```

**dx.require:** `['message']`

**Callers to update:**
- Search for calls (may be unused)

**Typedefs to update:**
- None

---

### `addToolbar(html)`
**Current signature:** `async addToolbar(html: string): Promise<string>`

**New signature:**
```typescript
async addToolbar(args: { html: string }): Promise<string>
```

**dx.require:** `['html']`

**Callers to update:**
- `src/UIWebView.ts` line 143

**Typedefs to update:**
- None

---

### `chooseSaveLocation(defaultFilename)`
**Current signature:** `async chooseSaveLocation(defaultFilename: string): Promise<string | null>`

**New signature:**
```typescript
async chooseSaveLocation(args: {
  defaultFilename: string;
}): Promise<string | null>
```

**dx.require:** `['defaultFilename']`

**Callers to update:**
- `src/PDF.ts` line 196

**Typedefs to update:**
- None

---

### `static out(message)`
**Current signature:** `static out(message: string): void`

**New signature:**
```typescript
static out(args: { message: string }): void
```

**dx.require:** `['message']`

**Callers to update:**
- `src/Diagnostics.ts` line 147

**Typedefs to update:**
- None

---

## UIWebView.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/PaperPrinter.ts` line 205

**Typedefs to update:**
- None

---

### `displayPdfPanel()`
**Current signature:** `async displayPdfPanel(): Promise<WebviewPanelId_t>`

**New signature:**
```typescript
async displayPdfPanel(args?: {}): Promise<WebviewPanelId_t>
```

**dx.require:** None (uses app.pdf.docInfo)

**Callers to update:**
- `src/PaperPrinter.ts` line 209, 595

**Typedefs to update:**
- None

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
- `src/UIMenuMgr.ts` line 129-139

**Typedefs to update:**
- None

---

### `dispatchSelection(menuItemId, contextDict?)`
**Current signature:** `async dispatchSelection(menuItemId: MenuItemId_t, contextDict: contextDict_t = {}): Promise<HandleSelection_t>`

**New signature:**
```typescript
async dispatchSelection(args: {
  menuItemId: MenuItemId_t;
  contextDict?: contextDict_t;
}): Promise<HandleSelection_t>
```

**dx.require:** `['menuItemId']`

**Callers to update:**
- `src/UIMenu.ts` line 270
- `src/UIMenuMgr.ts` line 212

**Typedefs to update:**
- None

---

### `getHTML(visited?)`
**Current signature:** `async getHTML(visited: Set<string> = new Set()): Promise<string>`

**New signature:**
```typescript
async getHTML(args?: { visited?: Set<string> }): Promise<string>
```

**dx.require:** None

**Callers to update:**
- `src/UIMenu.ts` line 557, 573
- `src/UIMenuMgr.ts` line 117, 527

**Typedefs to update:**
- None

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

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/App.ts` line 82

**Typedefs to update:**
- None

---

### `setContextDict(contextDict?)`
**Current signature:** `setContextDict(contextDict: contextDict_t = kContextDict_None): void`

**New signature:**
```typescript
setContextDict(args?: { contextDict?: contextDict_t }): void
```

**dx.require:** None

**Callers to update:**
- `src/UIMenuMgr.ts` line 167

**Typedefs to update:**
- None

---

### `isMenuId(id)`
**Current signature:** `isMenuId(id: string): id is MenuId_t`

**New signature:**
```typescript
isMenuId(args: { id: string }): id is MenuId_t
```

**dx.require:** `['id']`

**Callers to update:**
- Type guards (check usage)

**Typedefs to update:**
- None

---

### `isMenuItemId(id)`
**Current signature:** `isMenuItemId(id: string): id is MenuItemId_t`

**New signature:**
```typescript
isMenuItemId(args: { id: string }): id is MenuItemId_t
```

**dx.require:** `['id']`

**Callers to update:**
- `src/UIMenuMgr.ts` line 203

**Typedefs to update:**
- None

---

### `getUIMenu_HTML(menuId)`
**Current signature:** `async getUIMenu_HTML(menuId: MenuId_t): Promise<string>`

**New signature:**
```typescript
async getUIMenu_HTML(args: { menuId: MenuId_t }): Promise<string>
```

**dx.require:** `['menuId']`

**Callers to update:**
- Search for calls

**Typedefs to update:**
- None

---

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
- `src/PaperPrinter.ts` line 354-363

**Typedefs to update:**
- None

---

### `handleMenuItemSelected(menuId, menuItemId, contextDict)`
**Current signature:** 
```typescript
async handleMenuItemSelected(
  menuId: MenuId_t,
  menuItemId: MenuItemId_t,
  contextDict: contextDict_t
): Promise<void>
```

**New signature:**
```typescript
async handleMenuItemSelected(args: {
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
  contextDict: contextDict_t;
}): Promise<void>
```

**dx.require:** `['menuId', 'menuItemId', 'contextDict']`

**Callers to update:**
- `src/UIWebView.ts` line 323

**Typedefs to update:**
- None

---

### `getMenuById(id)`
**Current signature:** `getMenuById(id: string): UIMenu`

**New signature:**
```typescript
getMenuById(args: { id: string }): UIMenu
```

**dx.require:** `['id']`

**Callers to update:**
- Many calls throughout UIMenuMgr and UIMenu

**Typedefs to update:**
- None

---

### `getPersistForMenuId(menuId)`
**Current signature:** `getPersistForMenuId(menuId: MenuId_t): PersistValue_t | undefined`

**New signature:**
```typescript
getPersistForMenuId(args: { menuId: MenuId_t }): PersistValue_t | undefined
```

**dx.require:** `['menuId']`

**Callers to update:**
- Search for calls

**Typedefs to update:**
- None

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

### `getMenuItemIdSelected(menuId)`
**Current signature:** `getMenuItemIdSelected(menuId: MenuId_t): string | undefined`

**New signature:**
```typescript
getMenuItemIdSelected(args: { menuId: MenuId_t }): string | undefined
```

**dx.require:** `['menuId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 121, 230, 233, 236, 243, 250, 692
- `src/PDF.ts` line 436
- `src/UIWebView.ts` line 181

**Typedefs to update:**
- None

---

### `getValueForMenuItemIdSelected(menuId)`
**Current signature:** `getValueForMenuItemIdSelected(menuId: MenuId_t): number | string | undefined`

**New signature:**
```typescript
getValueForMenuItemIdSelected(args: { menuId: MenuId_t }): number | string | undefined
```

**dx.require:** `['menuId']`

**Callers to update:**
- `src/PaperPrinter.ts` line 973
- `src/UIMenu.ts` line 425

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

### `addMenu(menu)`
**Current signature:** `addMenu(menu: UIMenu): void`

**New signature:**
```typescript
addMenu(args: { menu: UIMenu }): void
```

**dx.require:** `['menu']`

**Callers to update:**
- `src/PaperPrinter.ts` line 363

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

### `getGlobalState(key)`
**Current signature:** `getGlobalState(key: GlobalStateKey_t): GlobalStateValue_t | undefined`

**New signature:**
```typescript
getGlobalState(args: { key: GlobalStateKey_t }): GlobalStateValue_t | undefined
```

**dx.require:** `['key']`

**Callers to update:**
- `src/Persist.ts` line 54

**Typedefs to update:**
- None

---

### `showInformationMessage(message)`
**Current signature:** `showInformationMessage(message: string): void`

**New signature:**
```typescript
showInformationMessage(args: { message: string }): void
```

**dx.require:** `['message']`

**Callers to update:**
- `src/UI.ts` line 130

**Typedefs to update:**
- None

---

### `showErrorMessage(message)`
**Current signature:** `showErrorMessage(message: string): void`

**New signature:**
```typescript
showErrorMessage(args: { message: string }): void
```

**dx.require:** `['message']`

**Callers to update:**
- `src/UI.ts` line 135

**Typedefs to update:**
- None

---

### `showWarningMessage(message)`
**Current signature:** `showWarningMessage(message: string): void`

**New signature:**
```typescript
showWarningMessage(args: { message: string }): void
```

**dx.require:** `['message']`

**Callers to update:**
- `src/UI.ts` line 140

**Typedefs to update:**
- None

---

### `createDocument(content, uri?)`
**Current signature:** `async createDocument(content: string, uri?: Uri): Promise<TextDocument>`

**New signature:**
```typescript
async createDocument(args: {
  content: string;
  uri?: Uri;
}): Promise<TextDocument>
```

**dx.require:** `['content']`

**Callers to update:**
- Search for calls (may be unused)

**Typedefs to update:**
- None

---

### `showDocument(document, preview?)`
**Current signature:** `async showDocument(document: TextDocument, preview: boolean = false): Promise<void>`

**New signature:**
```typescript
async showDocument(args: {
  document: TextDocument;
  preview?: boolean;
}): Promise<void>
```

**dx.require:** `['document']`

**Callers to update:**
- Search for calls

**Typedefs to update:**
- None

---

### `openInVSCode(filePath)`
**Current signature:** `async openInVSCode(filePath: string): Promise<void>`

**New signature:**
```typescript
async openInVSCode(args: { filePath: string }): Promise<void>
```

**dx.require:** `['filePath']`

**Callers to update:**
- Search for calls

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

### `removePanel(id)`
**Current signature:** `removePanel(id: WebviewPanelId_t): void`

**New signature:**
```typescript
removePanel(args: { id: WebviewPanelId_t }): void
```

**dx.require:** `['id']`

**Callers to update:**
- `src/UIWebView.ts` line 269

**Typedefs to update:**
- None

---

### `getPanelForUriConversion(id)`
**Current signature:** `getPanelForUriConversion(id: WebviewPanelId_t): WebviewPanel | undefined`

**New signature:**
```typescript
getPanelForUriConversion(args: {
  id: WebviewPanelId_t;
}): WebviewPanel | undefined
```

**dx.require:** `['id']`

**Callers to update:**
- `src/OS.ts` line 208

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

### `setupMessageHandling(panel)`
**Current signature:** `setupMessageHandling(panel: WebviewPanel): void`

**New signature:**
```typescript
setupMessageHandling(args: { panel: WebviewPanel }): void
```

**dx.require:** `['panel']`

**Callers to update:**
- `src/VSCodeAPIs.ts` line 263

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

### `getSelectionOrDocumentText(editor)`
**Current signature:** `getSelectionOrDocumentText(editor: TextEditor): string`

**New signature:**
```typescript
getSelectionOrDocumentText(args: { editor: TextEditor }): string
```

**dx.require:** `['editor']`

**Callers to update:**
- `src/TabInspector.ts` line 50, 68, 88

**Typedefs to update:**
- None

---

### `getDescriptiveName(document)`
**Current signature:** `getDescriptiveName(document: TextDocument): string`

**New signature:**
```typescript
getDescriptiveName(args: { document: TextDocument }): string
```

**dx.require:** `['document']`

**Callers to update:**
- `src/VSCodeAPIs.ts` line 428
- `src/TabInspector.ts` line 52, 70, 90

**Typedefs to update:**
- None

---

### `showSaveDialog(options)`
**Current signature:** 
```typescript
async showSaveDialog(options: {
  defaultUri?: Uri;
  filters?: { [name: string]: string[] };
  title?: string;
}): Promise<Uri | undefined>
```

**New signature:**
```typescript
async showSaveDialog(args: {
  options: {
    defaultUri?: Uri;
    filters?: { [name: string]: string[] };
    title?: string;
  };
}): Promise<Uri | undefined>
```

**dx.require:** `['options']`

**Callers to update:**
- `src/UI.ts` line 219

**Typedefs to update:**
- None

---

### `uriFromPath(filePath)`
**Current signature:** `uriFromPath(filePath: string): Uri`

**New signature:**
```typescript
uriFromPath(args: { filePath: string }): Uri
```

**dx.require:** `['filePath']`

**Callers to update:**
- `src/UI.ts` line 220
- `src/OS.ts` line 226

**Typedefs to update:**
- None

---

### `uriToPath(uri)`
**Current signature:** `uriToPath(uri: Uri): string`

**New signature:**
```typescript
uriToPath(args: { uri: Uri }): string
```

**dx.require:** `['uri']`

**Callers to update:**
- `src/UI.ts` line 228

**Typedefs to update:**
- None

---

## OS.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/OSMac.ts`, `src/OSWin.ts`, `src/OSLinux.ts` - super() calls

**Typedefs to update:**
- None

---

### `static create(app)`
**Current signature:** `static create(app: App): OS`

**New signature:**
```typescript
static create(args: { app: App }): OS
```

**dx.require:** `['app']`

**Callers to update:**
- `src/App.ts` line 83

**Typedefs to update:**
- None

---

### `dictReplace(source)`
**Current signature:** `dictReplace(source: string): string`

**New signature:**
```typescript
dictReplace(args: { source: string }): string
```

**dx.require:** `['source']`

**Callers to update:**
- `src/PaperPrinter.ts` line 526

**Typedefs to update:**
- None

---

### `ensureDir(dirPath)`
**Current signature:** `ensureDir(dirPath: string): void`

**New signature:**
```typescript
ensureDir(args: { dirPath: string }): void
```

**dx.require:** `['dirPath']`

**Callers to update:**
- `src/PDF.ts` line 133, 165, 205

**Typedefs to update:**
- None

---

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

### `fileDelete(targetPath)`
**Current signature:** `fileDelete(targetPath: string): void`

**New signature:**
```typescript
fileDelete(args: { targetPath: string }): void
```

**dx.require:** `['targetPath']`

**Callers to update:**
- `src/PDF.ts` line 105

**Typedefs to update:**
- None

---

### `pathDirname(filePath)`
**Current signature:** `pathDirname(filePath: string): string`

**New signature:**
```typescript
pathDirname(args: { filePath: string }): string
```

**dx.require:** `['filePath']`

**Callers to update:**
- `src/PDF.ts` line 204

**Typedefs to update:**
- None

---

### `exists(targetPath)`
**Current signature:** `exists(targetPath: string): boolean`

**New signature:**
```typescript
exists(args: { targetPath: string }): boolean
```

**dx.require:** `['targetPath']`

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

### `sanitizeFileName(name)`
**Current signature:** `sanitizeFileName(name: string): string`

**New signature:**
```typescript
sanitizeFileName(args: { name: string }): string
```

**dx.require:** `['name']`

**Callers to update:**
- `src/PDF.ts` line 128, 160, 192

**Typedefs to update:**
- None

---

### `pathJoin(...parts)`
**Current signature:** `pathJoin(...parts: Array<string | undefined>): string`

**New signature:**
```typescript
pathJoin(args: { parts: Array<string | undefined> }): string
```

**dx.require:** `['parts']`

**Callers to update:**
- Many calls across codebase - `src/PDF.ts`, `src/Stylize.ts`, `src/OS.ts`, `src/VSCodeAPIs.ts`, etc.

**Typedefs to update:**
- None

---

### `pathBasename(p)`
**Current signature:** `pathBasename(p: string): string`

**New signature:**
```typescript
pathBasename(args: { p: string }): string
```

**dx.require:** `['p']`

**Callers to update:**
- `src/VSCodeAPIs.ts` line 448

**Typedefs to update:**
- None

---

### `fileOpenPrintDialog(path)`
**Current signature:** `abstract fileOpenPrintDialog(path: string): Promise<void>`

**New signature:**
```typescript
abstract fileOpenPrintDialog(args: { path: string }): Promise<void>
```

**dx.require:** `['path']`

**Callers to update:**
- `src/PDF.ts` line 140
- OS platform implementations

**Typedefs to update:**
- None

---

### `filePrint(path)`
**Current signature:** `abstract filePrint(path: string): Promise<void>`

**New signature:**
```typescript
abstract filePrint(args: { path: string }): Promise<void>
```

**dx.require:** `['path']`

**Callers to update:**
- `src/PDF.ts` line 173
- OS platform implementations

**Typedefs to update:**
- None

---

### `fileReveal(path)`
**Current signature:** `abstract fileReveal(path: string): Promise<void>`

**New signature:**
```typescript
abstract fileReveal(args: { path: string }): Promise<void>
```

**dx.require:** `['path']`

**Callers to update:**
- `src/PDF.ts` line 214
- OS platform implementations

**Typedefs to update:**
- None

---

### `fileOpenInDefaultApp(path)`
**Current signature:** `abstract fileOpenInDefaultApp(path: string): Promise<void>`

**New signature:**
```typescript
abstract fileOpenInDefaultApp(args: { path: string }): Promise<void>
```

**dx.require:** `['path']`

**Callers to update:**
- OS platform implementations

**Typedefs to update:**
- None

---

## TabInspector.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/App.ts` line 87

**Typedefs to update:**
- None

---

## Coords.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/PDF.ts` line 61
- `src/DocInfo_PDF.ts` line 200

**Typedefs to update:**
- None

---

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

### `cssPxToPdfPts(cssPx)`
**Current signature:** `cssPxToPdfPts(cssPx: number): number`

**New signature:**
```typescript
cssPxToPdfPts(args: { cssPx: number }): number
```

**dx.require:** `['cssPx']`

**Callers to update:**
- `src/PDF.ts` line 507, 513, 867

**Typedefs to update:**
- None

---

### `pdfPtsToCssPx(pdfPts)`
**Current signature:** `pdfPtsToCssPx(pdfPts: number): number`

**New signature:**
```typescript
pdfPtsToCssPx(args: { pdfPts: number }): number
```

**dx.require:** `['pdfPts']`

**Callers to update:**
- `src/PDF.ts` line 425, 448
- `src/DocInfo_PDF.ts` line 202

**Typedefs to update:**
- None

---

## Persist.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/UI.ts` line 69
- `src/UIMenu.ts` line 209

**Typedefs to update:**
- None

---

### `register(name)`
**Current signature:** `register(name: string): this`

**New signature:**
```typescript
register(args: { name: string }): this
```

**dx.require:** `['name']`

**Callers to update:**
- `src/UI.ts` line 70
- `src/UIMenu.ts` line 214, 220

**Typedefs to update:**
- None

---

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

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/PDF.ts` line 62

**Typedefs to update:**
- None

---

### `setPage(pageNumber)`
**Current signature:** `setPage(pageNumber: number): void`

**New signature:**
```typescript
setPage(args: { pageNumber: number }): void
```

**dx.require:** `['pageNumber']`

**Callers to update:**
- `src/PDF.ts` line 924

**Typedefs to update:**
- None

---

## DocInfo_PaperPrinter.ts

### `constructor(app)`
**Current signature:** `constructor(app: App)`

**New signature:**
```typescript
constructor(args: { app: App })
```

**dx.require:** `['app']`

**Callers to update:**
- `src/PaperPrinter.ts` line 102

**Typedefs to update:**
- None

---

## Summary

This refactoring will touch nearly every method in the codebase. The key steps are:

1. Update each method signature to accept a single `args` object
2. Add `dx.require()` calls at the beginning of each method for required parameters
3. Destructure the `args` object to extract parameters
4. Update all call sites to pass arguments as an object with explicit keys
5. Update type definitions where necessary (primarily function signatures)

## Implementation Strategy

1. **Start with leaf methods** - Methods that don't call other methods in the codebase
2. **Work bottom-up** - Refactor callers after callees
3. **Test incrementally** - Run tests after each file or set of related methods
4. **Use compiler** - TypeScript will catch all call sites that need updating

## Estimated Impact

- **~100+ methods** need refactoring
- **~500+ call sites** need updating
- **Minimal typedef changes** - most types remain the same
