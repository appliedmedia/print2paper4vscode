# Namespace Refactoring Plan

## ✅ STATUS: COMPLETE

**Completion Date**: November 27, 2025  
**Tests**: 321/321 passing (100%)  
**Compilation**: No errors

### Key Achievement: Single Source of Truth

- **`VSCodeAPIs.ExtId`** = `'p2p4vsc'` (must match package.json)
- **`App.kNs`** = `VSCodeAPIs.ExtId` (references ExtId)
- **`App.kNs_`** = `App.kNs + '_'` (underscore prefix)

To change namespace: Update **ONE** constant (`VSCodeAPIs.ExtId`) + package.json commands

### Naming Convention Change

**BREAKING**: Changed from kebab-case to underscore+camelCase
- OLD: `.p2p4vsc-menu-btn`, `#p2p4vsc-toolbar`
- NEW: `.p2p4vsc_menuBtn`, `#p2p4vsc_toolbar`

### Dead Code Removed

- ✅ `handleFlyoutHover()` function from UI.yaml (confirmed unused)
- ✅ `.p2p4vsc-flyout` selectors (flyouts now use `.{{ns_}}menu.isFlyout`)

---

## Overview

This document tracks all areas that need to be updated to use namespace variables `{{ns}}` (for "p2p4vsc") and `{{ns_}}` (for "p2p4vsc\_") to make future renaming trivial - just change one constant.

## Goal

Replace all hardcoded `p2p4vsc` strings with `{{ns}}` in templates and ensure all `templateDictReplace` calls include `ns: 'p2p4vsc'` and `ns_: 'p2p4vsc_'` in their replacement dictionaries.

---

## Phase 1: YAML Template Files

### Phase 1: ✅ Completed

#### 1. ✅ `src/UIMenu.yaml`

- Replaced 28+ CSS class occurrences (`.p2p4vsc-menu-btn` → `.{{ns_}}menuBtn`)
- Replaced 15+ JavaScript selectors
- Created new `uimenu_items_container` template
- Moved hardcoded HTML from UIMenu.ts to template
- Updated UIMenu.kYaml type definition

#### 2. ✅ `src/UI.yaml`

- Replaced 8 CSS class occurrences (`#p2p4vsc-toolbar` → `#{{ns_}}toolbar`)
- Replaced 6+ JavaScript selectors
- Replaced 4 HTML IDs
- **REMOVED** dead code: `handleFlyoutHover()` function and `.p2p4vsc-flyout` selectors

#### 3. ✅ `src/UIWebView.yaml`

- Verified clean - no hardcoded p2p4vsc strings

#### 4-7. ✅ `src/PaperPrinter.yaml`, `src/PDF.yaml`, `src/Stylize.yaml`, `src/OSMac.yaml`

- All verified clean - no hardcoded p2p4vsc strings

### Phase 1: 🔲 To Do

#### ~~1. `src/UIMenu.yaml`~~

**File**: `src/UIMenu.yaml`

**CSS Classes to Replace** (28 occurrences):

- `.p2p4vsc-menu-btn` → `.{{ns_}}menuBtn`
- `.p2p4vsc-menu` → `.{{ns_}}menu`
- `.p2p4vsc-menu-items` → `.{{ns_}}menuItems`
- `.p2p4vsc-menu-item` → `.{{ns_}}menuItem`
- `.p2p4vsc-group` → `.{{ns_}}group`

**JavaScript Selectors to Replace** (15+ occurrences):

- `'.p2p4vsc-menu-btn'` → `'.{{ns_}}menuBtn'`
- `'.p2p4vsc-menu'` → `'.{{ns_}}menu'`
- `'.p2p4vsc-menu-items'` → `'.{{ns_}}menuItems'`
- `'.p2p4vsc-menu-item'` → `'.{{ns_}}menuItem'`
- `'.p2p4vsc-menu.is-flyout'` → `'.{{ns_}}menuFlyout'`

**HTML IDs** (already using `{{menuId}}` - verify no hardcoded p2p4vsc IDs)

**Verify**: `src/UIMenu.ts` `getItemHTML()` and `getHTML()` methods work correctly with automatic namespace inclusion from `templateDictReplace()`

---

#### 2. `src/UI.yaml`

**File**: `src/UI.yaml`

**CSS Classes to Replace** (8 occurrences):

- `#p2p4vsc-toolbar` → `#{{ns_}}toolbar`
- `.p2p4vsc-toolbar-menubar` → `.{{ns_}}toolbarMenubar`
- `.p2p4vsc-toolbar-grip` → `.{{ns_}}toolbarGrip`
- `.p2p4vsc-menu-btn` → `.{{ns_}}menuBtn`
- `.p2p4vsc-zoom-controls` → `.{{ns_}}zoomControls`
- `.p2p4vsc-zoom-btn` → `.{{ns_}}zoomBtn`
- `.p2p4vsc-zoom-level` → `.{{ns_}}zoomLevel`

**JavaScript Selectors to Replace** (6+ occurrences):

- `'p2p4vsc-toolbar'` → `'{{ns_}}toolbar'`
- `'p2p4vsc-toolbar-grip'` → `'{{ns_}}toolbarGrip'`
- `'.p2p4vsc-menu-item'` → `'.{{ns_}}menuItem'`
- `'.p2p4vsc-flyout'` → `'.{{ns_}}flyout'` ⚠️ **NOTE: This class appears to be dead code. The selector `.p2p4vsc-flyout` is referenced in `src/UI.yaml` JavaScript (lines 78, 81, 94) but this class is NOT generated anywhere in the codebase. The actual flyout menus use `.p2p4vsc-menu.is-flyout` instead. CONFIRM this is unused and REMOVE `.p2p4vsc-flyout` references from `src/UI.yaml` before namespace refactoring.**
- `'p2p4vsc-zoom-controls'` → `'{{ns_}}zoomControls'`

**HTML IDs to Replace** (4 occurrences):

- `id="p2p4vsc-toolbar"` → `id="{{ns_}}toolbar"`
- `id="p2p4vsc-toolbar-grip"` → `id="{{ns_}}toolbarGrip"`
- `id="p2p4vsc-zoom-controls"` → `id="{{ns_}}zoomControls"`
- `id="zoom-level"` → Consider if this needs namespace (appears to be generic), but if no namespace at least `id="zoomLevel"`

**Verify**: `src/UI.ts` methods that call `templateDictReplace()` work correctly with automatic namespace inclusion

---

#### 3. `src/UIWebView.yaml`

**File**: `src/UIWebView.yaml`

**JavaScript Selectors to Replace** (2+ occurrences):

- `'p2p4vsc-zoom-controls'` → `'{{ns_}}zoomControls'`
- `'.p2p4vsc-menu-item'` → `'.{{ns_}}menuItem'`

**Verify**: `src/UIWebView.ts` methods that call `templateDictReplace()` work correctly with automatic namespace inclusion

---

#### 4. `src/PaperPrinter.yaml`

**File**: `src/PaperPrinter.yaml`

**Check for**: Any hardcoded `p2p4vsc` strings in CSS, HTML, or JavaScript

**Verify**: `src/PaperPrinter.ts` methods that call `templateDictReplace()` work correctly with automatic namespace inclusion

---

#### 5. `src/PDF.yaml`

**File**: `src/PDF.yaml`

**Check for**: Any hardcoded `p2p4vsc` strings in CSS, HTML, or JavaScript

**Verify**: `src/PDF.ts` methods that call `templateDictReplace()` work correctly with automatic namespace inclusion

---

#### 6. `src/Stylize.yaml`

**File**: `src/Stylize.yaml`

**Check for**: Any hardcoded `p2p4vsc` strings in CSS, HTML, or JavaScript

**Verify**: `src/Stylize.ts` methods that call `templateDictReplace()` work correctly with automatic namespace inclusion

---

#### 7. `src/OSMac.yaml`

**File**: `src/OSMac.yaml`

**Check for**: Any hardcoded `p2p4vsc` strings in CSS, HTML, or JavaScript

**Verify**: `src/OSMac.ts` methods that call `templateDictReplace()` work correctly with automatic namespace inclusion

---

## Phase 2: TypeScript Source Files

### Phase 2: ✅ Completed

#### 1. ✅ `src/VSCodeAPIs.ts`

**Added**:
- `public static readonly ExtId = 'p2p4vsc'` - Single source of truth for namespace
- Must match package.json command registrations
- All namespace references derive from this

#### 2. ✅ `src/App.ts`

**Added**:
- `public static readonly kNs = VSCodeAPIs.ExtId` - References ExtId
- `public static readonly kNs_ = App.kNs + '_'` - Underscore prefix
- Instance properties: `ns` and `ns_` for easy access
- Updated `templateDictReplace()` to auto-inject `{ns: 'p2p4vsc', ns_: 'p2p4vsc_'}`

#### 3. ✅ `src/UIMenu.ts`

- Updated `kYaml` type definition to include `uimenu_items_container`
- Changed hardcoded HTML generation to use template
- Verified `templateDictReplace()` calls work with auto-injection

#### 4-10. ✅ All other TypeScript files

- Verified all `templateDictReplace()` calls work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed anywhere

### Phase 2: 🔲 To Do

#### ~~1. `src/App.ts`~~

**~~Constants to Add~~**:

- `public static readonly kNs = 'p2p4vsc';`
- `public static readonly kNs_ = kNs + '_';`

**Instance Properties to Add** (for class access):

- `public readonly ns = App.kNs;`
- `public readonly ns_ = App.kNs_;`

**Method to Update**:

- `templateDictReplace()` - Automatically include `ns` and `ns_` in every replacement dictionary using `this.ns` and `this.ns_`

**Note**: Classes using `templateDictReplace()` do NOT need to manually add `ns` and `ns_` to their dictionaries - they will be automatically included. Classes can also access namespace values directly via `this.app.ns` and `this.app.ns_` if needed.

---

#### 2. `src/UIMenu.ts`

**Methods to Update**:

- Verify `getItemHTML()` and `getHTML()` methods work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 3. `src/UI.ts`

**Methods to Update**:

- Verify all methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 4. `src/UIWebView.ts`

**Methods to Update**:

- Verify `generatePDFHTML()` and other methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 5. `src/PaperPrinter.ts`

**Methods to Update**:

- Verify all methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 6. `src/PDF.ts`

**Methods to Update**:

- Verify all methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 7. `src/Stylize.ts`

**Methods to Update**:

- Verify all methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 8. `src/OSMac.ts`

**Methods to Update**:

- Verify all methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 9. `src/OSLinux.ts`

**Methods to Update**:

- Verify all methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

#### 10. `src/OSWin.ts`

**Methods to Update**:

- Verify all methods calling `templateDictReplace()` work correctly with automatic namespace inclusion
- No manual `ns`/`ns_` addition needed

---

## Phase 3: Configuration and Command IDs

### Phase 3: ✅ Completed

#### 1. ✅ `src/VSCodeAPIs.ts`

**Decision**: Extension ID stays as `ExtId = 'p2p4vsc'` (single source of truth)
- Must match package.json command registrations
- This is the ONE constant to change for namespace updates

#### 2. ✅ `package.json`

**Decision**: Command IDs stay hardcoded (VS Code API requirement)
- `"command": "p2p4vsc.print2paper"`
- `"command": "p2p4vsc.persistClear"`
- Must be manually updated when changing namespace (VS Code requires registration)

### Phase 3: 🔲 To Do

#### ~~1. `src/VSCodeAPIs.ts`~~

**~~Constants to Update~~**:

- ~~`private static readonly EXTENSION_ID = 'p2p4vsc';` → Consider if this should use namespace constant~~
- ~~`private static readonly WEBVIEW_ID = VSCodeAPIs.EXTENSION_ID + '.printprep';` → Update if EXTENSION_ID changes~~

**✅ DONE**: `ExtId` is single source of truth, `WEBVIEW_ID` references it

---

#### ~~2. `package.json`~~

**~~Commands to Review~~**:

- ~~`"command": "p2p4vsc.print2paper"` - VS Code command IDs may need to stay hardcoded~~
- ~~`"command": "p2p4vsc.persistClear"` - VS Code command IDs may need to stay hardcoded~~

**✅ VERIFIED**: Must stay hardcoded per VS Code API requirements

---

## Phase 4: Data Attributes (Future)

### Phase 4: 🔲 To Do

#### 1. Add Namespaced Data Attributes

**When adding data attributes**, use format:

- `data-{{ns}}-menu-item-id` → becomes `data-p2p4vsc-menu-item-id`
- Accessible in JavaScript as `dataset.{{ns_}}menuItemId` → `dataset.p2p4vscMenuItemId`

**Note**: For data attributes with hyphens, JavaScript converts to camelCase:

- `data-p2p4vsc-menu-item-id` → `dataset.p2p4vscMenuItemId` (hyphens removed, camelCase)
- `data-p2p4vsc_menu_item_id` → `dataset.p2p4vsc_menu_item_id` (underscores preserved)

**Recommendation**: Use hyphens in HTML (`data-{{ns}}-menu-item-id`) and access via camelCase in JavaScript (`dataset.p2p4vscMenuItemId`)

---

## Phase 5: Testing and Verification

### Phase 5: ✅ Completed

#### 1. ✅ Search for Remaining Hardcoded Strings

**Ran**: `grep -r "p2p4vsc" src/ --exclude-dir=node_modules`

**Results**: All accounted for
- `VSCodeAPIs.ExtId = 'p2p4vsc'` - Source constant ✅
- `App.kNs = VSCodeAPIs.ExtId` - References source ✅
- Command registrations in VSCodeAPIs.ts - Must match package.json ✅
- All YAML templates use `{{ns}}` or `{{ns_}}` ✅

#### 2. ✅ Test Template Replacement

**Created**: `tests/Namespace-Template-Replacement.test.ts`
- Verifies `templateDictReplace()` auto-injects `{ns, ns_}`
- Tests CSS, HTML, and JavaScript consistency
- Validates new underscore+camelCase convention
- All tests passing ✅

#### 3. ✅ Test Namespace Change

**Compilation**: No errors ✅  
**Test Suite**: 321/321 tests passing (100%) ✅  
**Ready**: To change namespace by updating ONE constant ✅

---

## Implementation Strategy

### Step 1: Add Constants to App Class

1. Add `public static readonly kNamespace` and `kNamespacePrefix` constants to `App` class
2. Update `templateDictReplace()` method to automatically include `ns` and `ns_` in every replacement dictionary

### Step 2: Update YAML Templates

1. Replace all hardcoded `p2p4vsc` with `{{ns_}}` followed by camelCase in CSS classes (e.g., `p2p4vsc-menu-btn` → `{{ns_}}menuBtn`)
2. Replace all hardcoded `p2p4vsc` with `{{ns_}}` followed by camelCase in HTML IDs
3. Replace all hardcoded `p2p4vsc` with `{{ns_}}` followed by camelCase in JavaScript selectors
4. Use `{{ns_}}` prefix for JavaScript variable names (camelCase after the prefix)

### Step 3: Verify Template Replacement Works

1. `templateDictReplace()` automatically includes `ns` and `ns_` in every replacement dictionary
2. Verify all `templateDictReplace()` calls work correctly (no manual `ns`/`ns_` addition needed)
3. Templates will automatically have access to `{{ns}}` and `{{ns_}}` variables

### Step 4: Test and Verify

1. Run all tests
2. Manually test UI functionality
3. Verify CSS styling works
4. Verify JavaScript selectors work
5. Test namespace change with test value

---

## Notes

- **VS Code Command IDs**: May need to remain hardcoded if VS Code requires them at registration time
- **Extension ID**: May need to remain hardcoded for VS Code API compatibility - verify requirements
- **Data Attributes**: Decide on hyphen vs underscore convention before implementing
- **Shared Constants**: Namespace constants (`kNamespace` and `kNamespacePrefix`) are defined in `App` class and automatically included in every `templateDictReplace()` call
- **Dead Code Cleanup**: `.p2p4vsc-flyout` class selector is referenced in `src/UI.yaml` JavaScript but the class is never generated. Actual flyout menus use `.p2p4vsc-menu.is-flyout` instead. **CONFIRM and REMOVE** `.p2p4vsc-flyout` references before namespace refactoring.

---

## Progress Tracking

- [x] Phase 1: YAML Templates
- [x] Phase 2: TypeScript Source Files
- [x] Phase 3: Configuration and Command IDs
- [ ] Phase 4: Data Attributes (future enhancement, not required)
- [x] Phase 5: Testing and Verification

---

## How to Change Namespace (Post-Implementation)

To rename from `p2p4vsc` to `newname`:

1. **Update `src/VSCodeAPIs.ts`**:
   ```typescript
   public static readonly ExtId = 'newname'; // Changed from 'p2p4vsc'
   ```

2. **Update `package.json`** (required):
   ```json
   "command": "newname.print2paper"  // from p2p4vsc.print2paper
   "command": "newname.persistClear" // from p2p4vsc.persistClear
   ```

3. **Recompile and test**:
   ```bash
   npm run compile
   npm test
   ```

All templates automatically update to use `newname_menuBtn`, `newname_toolbar`, etc.

**Note**: `App.kNs` automatically references `VSCodeAPIs.ExtId`, no changes needed there.
