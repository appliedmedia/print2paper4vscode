# Menu Hidden System Implementation Plan

**Status**: inProgress

**Created**: 2025-12-16

**Goal**: Add conditional visibility to menu system allowing menus to show/hide based on context (e.g., markdown menu only visible for markdown files).

## TODO Checklist

- [x] Refactor `ForceNumber_*_t` to `Force_*_t` in `Utils.ts` and update usages
- [x] Implement `forceContent` and `forceContents` in `Utils.ts`
- [x] Update `UIMenuItemDict_t` type to include string values
- [x] Refactor `UIMenuItemValueFxn_t` and `UIMenuIsVisibleFxn_t` to generic `UIMenuFxn_t<T>` (Note: Changed to non-generic union type per request)
- [x] Add `isHidden` property to `kMd` menu constant (refactored from `isVisible`)
- [x] Update `UIMenuMgr.buildUIMenuItemDict()` to handle numeric and textual inputs
- [x] Add `resolveUIMenuIsHidden()` to `UIMenuMgr` (refactored from `resolveUIMenuIsVisible`)
- [x] Update `UIMenu` constructor to accept and store `isHidden`
- [x] Update `UIMenu.getHTML()` to add CSS class based on visibility
- [x] Update `UIMenuMgr.createMenu()` to resolve visibility
- [x] Update `PaperPrinter` menu creation
- [x] Add CSS to `UIMenu.yaml`
- [x] Test with markdown and non-markdown files
- [x] Refactor to use `isHidden` property and CSS class (inverted logic)
- [x] Explicitly set `isHidden: false` for all menu constants

## Overview

Add `isHidden` property to menu constants that can be a boolean or function receiving context dict. Menus evaluate visibility at creation time and add CSS class to hide when needed.

## Architecture

### Pattern Consistency

Follow existing `value` resolver pattern:

- **Menu items** use `value: number | string | UIMenuFxn_t`
- **Menus** will use `isHidden: boolean | UIMenuFxn_t`
- Both receive `UIMenuItemDict_t` context with validated data
- Functions execute at appropriate time (value at selection, isHidden at creation)

### Context Dictionary Enhancement

Currently `UIMenuItemDict_t` only contains numbers. We need to support both numeric and textual context:

**Current (numeric only):**

```typescript
export type UIMenuItemDict_t = Record<string, number>;

// Built from:
const dict = {
  windowWidth: 1200,
  windowHeight: 800,
  pageWidth: 595,
  pageHeight: 842,
};
```

**New (mixed types):**

```typescript
export type UIMenuItemDict_t = Record<string, number | string>;

// Built from:
const dict = {
  windowWidth: 1200,      // number
  windowHeight: 800,      // number
  pageWidth: 595,         // number
  pageHeight: 842,        // number
  languageId: 'markdown', // string
};
```

## Implementation Steps

### Step 1: Refactor Force Types and Add forceContent/forceContents to Utils.ts

**Refactor Types in `src/Utils.ts`**:

Rename specific types to be more generic since they cover string/number/undefined:

- `ForceNumber_scalar_t` -> `Force_scalar_t`
- `ForceNumber_dict_t` -> `Force_dict_t`

**Add `forceContent` and `forceContents`**:

Create string validation utilities mirroring existing `forceNumber`/`forceNumbers` pattern.

**Location**: `src/Utils.ts`

**Add after existing forceNumbers method:**

```typescript
/**
 * Force a value to be a string, returning useForEmpty if invalid
 *
 * Mirrors forceNumber() but for string content validation.
 * Ensures values are strings and provides fallback for empty/null/undefined.
 *
 * @param val - Value to force to string
 * @param useForEmpty - Value to use for empty/null/undefined (default: '')
 * @returns String value or useForEmpty
 */
forceContent(val: Force_scalar_t, useForEmpty: string = ''): string {
  if (val === null || val === undefined || val === '') {
    return useForEmpty;
  }
  return String(val);
}

/**
 * Force all values in dict to strings with required keys validation
 *
 * Mirrors forceNumbers() but for string content validation.
 * Ensures all values are strings and adds missing required keys with useForEmpty.
 *
 * @param dict - Dictionary to process
 * @param useForEmpty - Value to use for empty/null/undefined (default: '')
 * @param requiredKeys - Keys that must exist (will be added with useForEmpty if missing)
 * @returns Dictionary with all values as strings
 */
forceContents(
  dict: Force_dict_t,
  useForEmpty: string = '',
  requiredKeys?: readonly string[]
): Record<string, string> {
  const dx = this.dx.sub({ name: 'forceContents' });
  const result: Record<string, string> = {};

  // Add all required keys first with useForEmpty
  if (requiredKeys) {
    for (const key of requiredKeys) {
      result[key] = useForEmpty;
    }
  }

  // Process all dict values, converting to strings
  for (const [key, val] of Object.entries(dict)) {
    result[key] = this.forceContent(val, useForEmpty);
  }

  dx.done();
  return result;
}
```

### Step 2: Update UIMenuItemDict_t Type

**Location**: `src/types/PaperPrinter_t.ts` (around line 48)

**Change from:**

```typescript
export type UIMenuItemDict_t = Record<string, number>;
```

**Change to:**

```typescript
export type UIMenuItemDict_t = Record<string, number | string>;
```

**Update documentation comment above (lines 22-47):**

Add to "Required keys" section:

```typescript
* - Required keys (numeric): windowWidth, windowHeight, pageWidth, pageHeight
* - Required keys (textual): languageId
```

### Step 3: Add UIMenuFxn_t Type

**Location**: `src/types/PaperPrinter_t.ts` (after line 49)

**Add:**

```typescript
export type UIMenuFxn_t = (dict: UIMenuItemDict_t) => number | string | boolean | unknown;
```

### Step 4: Add isHidden to kMd Menu Constant

**Location**: `src/types/PaperPrinter_t.ts` (kMd definition around line 339)

**Change from:**

```typescript
export const kMd = {
  id: 'md',
  displayName: 'Markdown',
  iconSlotTriad: { begin: '', main: '.md', end: '' },
  altId: kMd_Raw.id,
  methodName: 'Md',
  isFlyout: false,
  flyoutMenuItemIds: [] as const,
  menuItems: [
    { id: kMd_Raw.id, displayName: kMd_Raw.displayName, value: kMd_Raw.value },
    { id: kMd_Render.id, displayName: kMd_Render.displayName, value: kMd_Render.value },
  ],
} as const;
```

**Change to:**

```typescript
export const kMd = {
  id: 'md',
  displayName: 'Markdown',
  iconSlotTriad: { begin: '', main: '.md', end: '' },
  altId: kMd_Raw.id,
  methodName: 'Md',
  isFlyout: false,
  isHidden: (dict: UIMenuItemDict_t) => dict.languageId !== 'markdown',
  flyoutMenuItemIds: [] as const,
  menuItems: [
    { id: kMd_Raw.id, displayName: kMd_Raw.displayName, value: kMd_Raw.value },
    { id: kMd_Render.id, displayName: kMd_Render.displayName, value: kMd_Render.value },
  ],
} as const;
```

### Step 5: Update UIMenuMgr.buildUIMenuItemDict()

**Location**: `src/UIMenuMgr.ts` (around line 389)

**Change from:**

```typescript
private buildUIMenuItemDict(): UIMenuItemDict_t {
  const dx = this.dx.sub({ name: 'buildUIMenuItemDict' });
  const pageSizePx = this.fn.pdf?.docInfo()?.pageSizePx;
  const context = this.contextDict ?? {};
  const inputs: Force_dict_t = {
    windowWidth: context.windowWidth,
    windowHeight: context.windowHeight,
    pageWidth: pageSizePx?.widthPx,
    pageHeight: pageSizePx?.heightPx,
  };
  const dict_nums = this.fn.utils.forceNumbers(inputs, 1, kUIMenuItemDictRequiredKeys);
  dx.done();
  return dict_nums;
}
```

**Change to:**

```typescript
private buildUIMenuItemDict(): UIMenuItemDict_t {
  const dx = this.dx.sub({ name: 'buildUIMenuItemDict' });
  const docInfo = this.fn.pdf.docInfo();
  const pageSizePx = docInfo?.pageSizePx;
  const context = this.contextDict ?? {};

  // Numeric keys - validate with forceNumbers
  const numericInputs: Force_dict_t = {
    windowWidth: context.windowWidth,
    windowHeight: context.windowHeight,
    pageWidth: pageSizePx?.widthPx,
    pageHeight: pageSizePx?.heightPx,
  };
  const dict_nums = this.fn.utils.forceNumbers(numericInputs, 1, kUIMenuItemDictRequiredKeys);

  // Textual keys - validate with forceContents
  const textualInputs: Force_dict_t = {
    languageId: docInfo?.languageId,
  };
  const dict_text = this.fn.utils.forceContents(textualInputs, '');

  // Combine both dicts
  const combined = { ...dict_nums, ...dict_text };

  dx.done();
  return combined as UIMenuItemDict_t;
}
```

**Update fn imports in constructor:**

Add to `this.reg.use()` call:

```typescript
'utils.forceContent',
'utils.forceContents',
```

### Step 6: Add resolveUIMenuIsHidden() to UIMenuMgr

**Location**: `src/UIMenuMgr.ts` (after resolveUIMenuItemValue around line 437)

**Add new method:**

```typescript
/**
 * Resolve menu visibility using isHidden function or boolean
 *
 * Executes isHidden function with validated dict (numeric + textual context).
 * Returns boolean indicating whether menu should be hidden.
 *
 * @param isHidden - Boolean or function that determines visibility from context
 * @param menuId - Menu ID for error logging context
 * @returns true if menu should be hidden, false otherwise (default: false)
 */
private resolveUIMenuIsHidden(
  isHidden: boolean | UIMenuFxn_t | undefined,
  menuId: string
): boolean {
  const dx = this.dx.sub({ name: 'resolveUIMenuIsHidden' });

  // Handle undefined - default to visible (isHidden = false)
  if (isHidden === undefined) {
    dx.done();
    return false;
  }

  // Handle boolean literal
  if (typeof isHidden === 'boolean') {
    dx.done();
    return isHidden;
  }

  // Handle function - build dict and execute
  const dict = this.buildUIMenuItemDict();
  try {
    const result = isHidden(dict);
    dx.done();
    return Boolean(result);
  } catch (error) {
    this.dx.error(`Menu isHidden resolver failed for ${menuId}: ${String(error)}`);
    dx.done();
    return false; // Default to visible on error
  }
}
```

**Import UIMenuFxn_t at top of file:**

```typescript
import {
  kFontSizeId,
  type UIMenuItemDict_t,
  type UIMenuFxn_t,
} from './types/PaperPrinter_t';
```

### Step 7: Update UIMenu Constructor

**Location**: `src/UIMenu.ts`

**Add isHidden property (around line 61):**

```typescript
private _isHidden: boolean;
```

**Update constructor signature (around line 70):**

```typescript
constructor(args: {
  reg: Registry;
  id: MenuId_t;
  displayName: string;
  iconSlotTriad: iconSlotTriad_t;
  isFlyout?: boolean;
  isHidden?: boolean;  // NEW
  menuItems: () => UIMenuItem_t[];
  flyoutMenuItemIds?: string[];
  selectionHandler: (
    menuId: MenuId_t,
    menuItemId: MenuItemId_t,
    contextDict: contextDict_t
  ) => Promise<HandleSelection_t>;
}) {
```

**Update constructor body (around line 111):**

```typescript
const {
  id,
  displayName,
  iconSlotTriad,
  isFlyout = false,
  isHidden = false,  // NEW - default to visible (isHidden = false)
  menuItems,
  flyoutMenuItemIds = [],
  selectionHandler,
} = args;

this._id = id;
this._displayName = displayName;
this._iconSlotTriad = iconSlotTriad;
this._isFlyout = isFlyout;
this._isHidden = isHidden;  // NEW
this._menuItems = menuItems;
this._flyoutMenuItemIds = flyoutMenuItemIds;
this._selectionHandler = selectionHandler;
```

**Add getter (around line 145):**

```typescript
get isHidden(): boolean {
  return this._isHidden;
}
```

### Step 8: Update UIMenu.getHTML() to Add CSS Class

**Location**: `src/UIMenu.ts` (getHTML method around line 524)

**Change from:**

```typescript
const menuClasses = [
  isFlyout ? 'isFlyout' : '',
  hasGutterBefore ? 'has-gutter-before' : '',
  hasGutterAfter ? 'has-gutter-after' : '',
]
  .filter(Boolean)
  .join(' ');
```

**Change to:**

```typescript
const menuClasses = [
  isFlyout ? 'isFlyout' : '',
  hasGutterBefore ? 'has-gutter-before' : '',
  hasGutterAfter ? 'has-gutter-after' : '',
  this._isHidden ? 'isHidden' : '',  // NEW
]
  .filter(Boolean)
  .join(' ');
```

### Step 9: Update UIMenuMgr.createMenu()

**Location**: `src/UIMenuMgr.ts` (createMenu method around line 129)

**Update to call resolveUIMenuIsHidden:**

Find where UIMenu is instantiated and add isHidden parameter:

```typescript
createMenu(args: {
  id: MenuId_t;
  displayName: string;
  iconSlotTriad: iconSlotTriad_t;
  isFlyout?: boolean;
  isHidden?: boolean | UIMenuFxn_t;  // NEW
  menuItems: () => UIMenuItem_t[];
  flyoutMenuItemIds?: string[];
  selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>;
}): UIMenu {
  const dx = this.dx.sub({ name: 'createMenu' });
  dx.require(args, ['id', 'displayName', 'iconSlotTriad', 'menuItems', 'selectionHandler']);
  const {
    id,
    displayName,
    iconSlotTriad,
    isFlyout = false,
    isHidden,  // NEW
    menuItems,
    flyoutMenuItemIds = [],
    selectionHandler,
  } = args;

  // Resolve isHidden to boolean
  const isHiddenResolved = this.resolveUIMenuIsHidden(isHidden, id);  // NEW

  return new UIMenu({
    reg: this.reg,
    id,
    displayName,
    iconSlotTriad,
    isFlyout,
    isHidden: isHiddenResolved,  // NEW
    menuItems,
    flyoutMenuItemIds,
    selectionHandler: async (menuId: MenuId_t, menuItemId: MenuItemId_t, contextDict: contextDict_t) => {
      this.setContextDict(contextDict);
      return await selectionHandler(menuId, menuItemId);
    },
  });
}
```

### Step 10: Update PaperPrinter Menu Creation

**Location**: `src/PaperPrinter.ts` (where menus are created)

**Find menu creation calls and add isHidden:**

Search for where `kMd` menu is created and ensure `isHidden` is passed:

```typescript
this.fn.uimenumgr.createMenu({
  id: kMd.id,
  displayName: kMd.displayName,
  iconSlotTriad: kMd.iconSlotTriad,
  isFlyout: kMd.isFlyout,
  isHidden: kMd.isHidden,  // NEW - pass from constant
  menuItems: () => kMd.menuItems,
  flyoutMenuItemIds: kMd.flyoutMenuItemIds as unknown as string[],
  selectionHandler: async (menuId, menuItemId) => this.handleMenuItemSelected(menuId, menuItemId),
});
```

### Step 11: Add CSS to UIMenu.yaml

**Location**: `src/UIMenu.yaml` (uimenu_css section around line 4)

**Add after existing menu CSS (before uimenu_html):**

```css
.{{ns_}}menu.isHidden {
  display: none;
}
```

## Testing Strategy

### Manual Testing

1. **Test with markdown file:**
   - Open a `.md` file
   - Trigger print command
   - Verify markdown menu is visible in toolbar

2. **Test with non-markdown file:**
   - Open a `.ts` or `.js` file
   - Trigger print command
   - Verify markdown menu is NOT visible in toolbar

3. **Test menu functionality:**
   - When visible, markdown menu should work normally
   - Selections should persist
   - Raw/Render modes should function

4. **Test other menus unaffected:**
   - All other menus should remain visible
   - Print, Page, Theme, Text, Zoom menus work normally

### Edge Cases

1. **No active editor:**
   - Default `languageId: 'typescript'` should make markdown menu hidden

2. **Unknown language:**
   - Non-markdown languages should hide markdown menu

3. **Multiple visibility conditions:**
   - If we add more conditional menus, test combinations

## Future Enhancements

### Additional Context Keys

Could add more context to dict for visibility functions:

```typescript
// Textual keys
languageId: docInfo?.languageId,
fileName: docInfo?.fileName,
fileExtension: docInfo?.fileExtension,

// Boolean keys (as strings: 'true'/'false')
hasSelection: context.hasSelection ? 'true' : 'false',
isReadOnly: context.isReadOnly ? 'true' : 'false',
```

### Dynamic Visibility Updates

Currently visibility is evaluated once at menu creation. Could add:

- Re-evaluate on file switch
- Update CSS classes dynamically
- Rebuild menus on language change

### Multiple Condition Menus

Pattern supports any conditional menu:

```typescript
// Only show for specific languages (inverted logic for isHidden)
isHidden: (dict) => !['javascript', 'typescript', 'jsx', 'tsx'].includes(dict.languageId)

// Show based on multiple conditions
isHidden: (dict) => !(dict.languageId === 'html' && dict.hasSelection === 'true')

// Always show (explicit)
isHidden: false

// Always hide (for testing/development)
isHidden: true
```

## Rollback Plan

If issues arise, revert changes in reverse order:

1. Remove CSS from UIMenu.yaml
2. Remove isHidden from PaperPrinter menu creation
3. Remove isHidden handling from UIMenuMgr.createMenu
4. Remove isHidden from UIMenu class
5. Remove resolveUIMenuIsHidden from UIMenuMgr
6. Remove languageId from buildUIMenuItemDict
7. Remove isHidden from kMd constant
8. Remove UIMenuFxn_t type and restore UIMenuItemValueFxn_t/UIMenuIsVisibleFxn_t
9. Revert UIMenuItemDict_t to numeric only
10. Remove forceContent/forceContents from Utils

## Notes

- Keep `isFlyout` and `isHidden` as separate concerns
- `isFlyout` controls flyout behavior (existing)
- `isHidden` controls conditional visibility (new)
- Both can be true simultaneously (hidden flyout is still a flyout)
- CSS class `isHidden` chosen to be explicit about state

## Status Updates

- **2025-12-16**: Plan created, ready to implement
- **2025-12-20**: Implemented all code changes including Force type refactoring and menu visibility logic.
- **2025-12-20**: Refactoring UIMenuItemValueFxn_t/UIMenuIsVisibleFxn_t to generic UIMenuFxn_t\<T\>.
- **2025-12-21**: Completed refactoring to non-generic UIMenuFxn_t and verified implementation with tests.
- **2025-12-21**: Renamed `isVisible` to `isHidden` for better CSS class alignment and simplicity. Inverted logic accordingly.
- **2025-12-21**: Defined `kMd_languageId` constant for use in place of magical "markdown" strings.
- **2025-12-21**: Renamed test file to `MenuHidden.test.ts` and plan file to `MenuHidden.md` for clarity.
- **2025-12-21**: Refined type system to support boolean values in `UIMenuItem_t` and `UIMenuMgr`, removing `as any` casts in tests for strict type compliance.
