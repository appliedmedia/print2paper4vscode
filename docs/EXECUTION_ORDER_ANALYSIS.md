# Execution Order Analysis: Extension Load and Custom Number Display

## Extension Initialization Flow

### 1. Extension Activation (`-entrypoint.ts`)

```text
activate() 
  → new App(context, vscode)
  → app.init()
```

### 2. App Initialization (`App.ts`)

Components are initialized in dependency order:

```text
App.init():
  1. vscodeapis.init()
  2. ui.init()
  3. os.init()
  4. pdf.init()
  5. paperprinter.init()
  6. stylize.init()
  7. tabinspector.init()
  8. uimenumgr.init()
```

### 3. Print Command Flow (Option-P)

```text
Command: "print2paper4vscode.printDoc"
  ↓
PaperPrinter.handlePrintCommandFromVSCode()
  ↓
1. TabInspector detects active tab category
2. Extracts code/selection
3. Creates menus (if not already created)
   → createMenus() → Creates all menu instances
   → Each menu constructor calls persist.register(menuId)
   → **BUG WAS HERE**: text_edit persistId was NOT registered
4. generatePdf() - renders content to PDF
5. new UIWebView(app) + uiwebview.init()
6. uiwebview.displayPdfPanel()
   ↓
   a. generatePDFHTML() - reads zoom from persist
   b. UI.addToolbar() - generates menu HTML
      → UIMenuMgr.getUIMenus_HTML()
      → UIMenu.getHTML() for each menu
      → UIMenu.handleIconSlotTypes() for text_edit widgets
         → **READS FROM**: menu.persist['zoomLevel_value']
         → **BUG**: This property was never registered, so getter returns undefined
   c. Creates webview panel with HTML
```

## Custom Number Entry Flow (User enters "101")

### Webview → Extension

```text
1. User types "101" in text_edit field
2. User blurs (tabs away or hits enter)
3. handleTextEditBlur() fires
4. postMessage to extension:
   {
     type: 'menuItemSelected',
     menuId: 'zoomLevel',
     menuItemId: 'zoomLevel',  // Same as menuId = custom value
     contextDict: { display: '101' }
   }
```

### Extension Processing

```text
5. UI.handleWebviewMessage() receives message
6. Routes to UIMenuMgr.handleMenuItemSelected()
7. Detects menuItemId === menuId (custom value indicator)
8. Applies transform.persist: "{{display}}/100" → eval("101/100") = 1.01
9. Calls PaperPrinter.handleSelection_ZoomLevel(menuId, '1.01', contextDict)
   ↓
   a. setValueOfPersistIdForMenuId('zoomLevel', 'zoomLevel', 1.01)
      → Stores persist value in menu.persist['zoomLevel']
   b. zoomLevel_setTextEdit(1.01)
      → setValueOfPersistIdForMenuId('zoomLevel', 'zoomLevel_value', 1.01)
      → **WRITES TO**: menu.persist['zoomLevel_value'] = 1.01
      → **BUG**: Property not registered, no setter to sync to global state
   c. regenerateAndUpdateWebview()
```

### Regeneration and Display

```text
10. regenerateAndUpdateWebview()
    ↓
    a. generatePdf() - creates new PDF with zoom 1.01
    b. displayPdfPanel() - regenerates HTML
       → handleIconSlotTypes() for text_edit
       → getValueOfMenuItemIdSelected('zoomLevel')
          → getMenuItemIdSelected('zoomLevel') returns 'zoomLevel' (custom value)
          → getValueOfMenuItemIdForMenuId('zoomLevel', 'zoomLevel')
             → Detects menuItemId === menuId
             → Reads from persistId: menu.persist['zoomLevel_value']
             → **READS**: undefined (getter not defined)
       → textEditValue = '' (blank!)
    c. Displays webview with blank text_edit field
```

## The Fix

**File**: `src/UIMenu.ts`  
**Lines**: 209-215 (added)

```typescript
// Register persistId if present (e.g., 'zoomLevel_value' for display values)
const main = this._iconSlotTriad?.main;
const menuPersistId = typeof main === 'object' ? main.persistId : undefined;
if (menuPersistId) {
  this.persist.register(menuPersistId);
}
```

Generic, type-safe solution: registers any `persistId` found in the config, regardless of widget type. This gives it proper getter/setter that syncs to VS Code global state.

## Verification

After the fix:

1. ✅ Custom value "101" entered by user
2. ✅ Transform.persist converts to 1.01 (persist value)
3. ✅ Saved to menu.persist['zoomLevel_value'] with proper setter
4. ✅ Synced to VS Code global state
5. ✅ Read from menu.persist['zoomLevel_value'] with proper getter
6. ✅ Transform.display converts to "101" (display value)
7. ✅ Text_edit field shows "101"
8. ✅ Zoom functionality uses 1.01 scale correctly

## Testing Checklist

- [x] Enter custom zoom value (e.g., 101)
- [x] Verify text_edit displays "101" after regeneration
- [x] Verify zoom scales correctly to 1.01x
- [x] Close and reopen preview
- [x] Verify custom zoom value persists and displays correctly
- [x] Test with predefined values (100%, 125%, etc.)
- [x] Verify predefined values still work correctly
