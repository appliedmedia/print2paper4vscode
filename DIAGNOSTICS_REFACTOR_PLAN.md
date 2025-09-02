# Diagnostics Refactor Plan

## Overview
This plan outlines the systematic refactoring of the entire codebase to use the new `Diagnostics` class instead of the current `debugOut` pattern. The goal is to have every class instantiate `this.dx = new Diagnostic("className")` and use `dx.out()` for debug output, with proper cleanup using `dx.done()`.

## Current State Analysis
- **Diagnostics.ts**: ✅ Already implemented with full functionality
- **App.ts**: ✅ Already has `this.dx = new Diagnostics('App')` but still uses `debugOut`
- **Other classes**: ❌ Still using `this.app.ui.debugOut()` pattern
- **debugOut methods**: Present in UI.ts and OS.ts as static methods

## Refactor Tasks

### Phase 1: Core Infrastructure Updates

#### 1.1 Remove debugOut Methods
- [ ] **UI.ts**: Remove `debugOut()` and `static debugOut()` methods (lines 107-142)
- [ ] **OS.ts**: Remove `debugOut()` and `static debugOut()` methods (lines 159-180)
- [ ] **OSWin.ts**: Remove `debugOut()` call (line 24)
- [ ] **OSMac.ts**: Remove `debugOut()` call (line 27)

#### 1.2 Update App.ts
- [ ] **App.ts**: Replace `this.ui.debugOut()` calls with `this.dx.out()` (lines 49, 63)
- [ ] **App.ts**: Add `this.dx.done()` in the `done()` method

### Phase 2: Class-by-Class Refactoring

#### 2.1 VSCodeAPIs Class
- [ ] **VSCodeAPIs.ts**: Add `this.dx = new Diagnostics('VSCodeAPIs')` in constructor
- [ ] **VSCodeAPIs.ts**: Replace `this.app.ui.debugOut()` calls with `this.dx.out()` (lines 33, 38, 99, 216)
- [ ] **VSCodeAPIs.ts**: Add `this.dx.done()` in `done()` method
- [ ] **VSCodeAPIs.ts**: Assess methods for `dx.require()` usage:
  - [ ] `init()`: Add `dx.require()` for context and vscode parameters
  - [ ] `loadThemeFile()`: Add `dx.require()` for themeId parameter

#### 2.2 UI Class
- [ ] **UI.ts**: Add `this.dx = new Diagnostics('UI')` in constructor
- [ ] **UI.ts**: Replace `this.debugOut()` calls with `this.dx.out()` (lines 45, 67-68, 80-81)
- [ ] **UI.ts**: Add `this.dx.done()` in `done()` method
- [ ] **UI.ts**: Assess methods for `dx.require()` usage:
  - [ ] `handleWebviewMessage()`: Add `dx.require()` for msg parameter
  - [ ] `generateToolbarHTML()`: Add `dx.require()` for required parameters

#### 2.3 PaperPrinter Class
- [ ] **PaperPrinter.ts**: Add `this.dx = new Diagnostics('PaperPrinter')` in constructor
- [ ] **PaperPrinter.ts**: Replace all `this.app.ui.debugOut()` calls with `this.dx.out()` (26 instances)
- [ ] **PaperPrinter.ts**: Add `this.dx.done()` in `done()` method
- [ ] **PaperPrinter.ts**: Assess methods for `dx.require()` usage:
  - [ ] `handleDragEnd()`: Add `dx.require()` for msg parameter
  - [ ] `handleMenuItemSelected()`: Add `dx.require()` for msg parameter
  - [ ] `handlePrint()`: Add `dx.require()` for msg parameter
  - [ ] `createMenus()`: Add `dx.require()` for menuConfigs parameter
  - [ ] `handleThemeMenuSelection()`: Add `dx.require()` for msg parameter
  - [ ] `handleTextMenuSelection()`: Add `dx.require()` for msg parameter

#### 2.4 Stylize Class
- [ ] **Stylize.ts**: Add `this.dx = new Diagnostics('Stylize')` in constructor
- [ ] **Stylize.ts**: Replace all `this.app.ui.debugOut()` calls with `this.dx.out()` (22 instances)
- [ ] **Stylize.ts**: Add `this.dx.done()` in `done()` method
- [ ] **Stylize.ts**: Assess methods for `dx.require()` usage:
  - [ ] `validateHighlighter()`: Add `dx.require()` for languageId parameter
  - [ ] `highlightCode()`: Add `dx.require()` for code and languageId parameters
  - [ ] `getThemes()`: Add `dx.require()` for themeType parameter
  - [ ] `getVSCodeThemes()`: Add `dx.require()` for themeType parameter

#### 2.5 ClipboardCapture Class
- [ ] **ClipboardCapture.ts**: Add `this.dx = new Diagnostics('ClipboardCapture')` in constructor
- [ ] **ClipboardCapture.ts**: Replace `this.app.ui.debugOut()` calls with `this.dx.out()` (lines 45, 77)
- [ ] **ClipboardCapture.ts**: Add `this.dx.done()` in `done()` method
- [ ] **ClipboardCapture.ts**: Assess methods for `dx.require()` usage:
  - [ ] `captureFromActiveTab()`: Add `dx.require()` for required parameters
  - [ ] `captureWithEditorCheck()`: Add `dx.require()` for required parameters

#### 2.6 PDF Class
- [ ] **PDF.ts**: Add `this.dx = new Diagnostics('PDF')` in constructor
- [ ] **PDF.ts**: Replace all `this.app.ui.debugOut()` calls with `this.dx.out()` (8 instances)
- [ ] **PDF.ts**: Add `this.dx.done()` in `done()` method
- [ ] **PDF.ts**: Assess methods for `dx.require()` usage:
  - [ ] `printWithPreview()`: Add `dx.require()` for filePath parameter
  - [ ] `printDirectly()`: Add `dx.require()` for filePath parameter
  - [ ] `saveAsPDF()`: Add `dx.require()` for filePath and targetPath parameters

#### 2.7 UIMenuMgr Class
- [ ] **UIMenuMgr.ts**: Add `this.dx = new Diagnostics('UIMenuMgr')` in constructor
- [ ] **UIMenuMgr.ts**: Replace all `this.app.ui.debugOut()` calls with `this.dx.out()` (6 instances)
- [ ] **UIMenuMgr.ts**: Add `this.dx.done()` in `done()` method
- [ ] **UIMenuMgr.ts**: Assess methods for `dx.require()` usage:
  - [ ] `generateHTML()`: Add `dx.require()` for menu parameter

#### 2.8 UIMenu Class
- [ ] **UIMenu.ts**: Add `this.dx = new Diagnostics('UIMenu')` in constructor
- [ ] **UIMenu.ts**: Replace all `this._app.ui.debugOut()` calls with `this.dx.out()` (8 instances)
- [ ] **UIMenu.ts**: Add `this.dx.done()` in `done()` method
- [ ] **UIMenu.ts**: Assess methods for `dx.require()` usage:
  - [ ] `getHTML()`: Add `dx.require()` for required parameters
  - [ ] `getDefaultSelection()`: Add `dx.require()` for required parameters

#### 2.9 TabInspector Class
- [ ] **TabInspector.ts**: Add `this.dx = new Diagnostics('TabInspector')` in constructor
- [ ] **TabInspector.ts**: Add `this.dx.done()` in `done()` method
- [ ] **TabInspector.ts**: Assess methods for `dx.require()` usage (no current debugOut usage found)

#### 2.10 History Class
- [ ] **History.ts**: Add `this.dx = new Diagnostics('History')` in constructor
- [ ] **History.ts**: Add `this.dx.done()` in `done()` method
- [ ] **History.ts**: Assess methods for `dx.require()` usage (no current debugOut usage found)

### Phase 3: Entry Point Updates

#### 3.1 Entry Point
- [ ] **-entrypoint.ts**: Replace `app.ui.debugOut()` with `app.dx.out()` (line 10)

### Phase 4: Method-Level Refactoring

#### 4.1 Method Pattern Updates
For each method that creates a new Diagnostics instance:
- [ ] **All classes**: Add `const dx = this.dx.sub('methodName')` at method start
- [ ] **All classes**: Add `dx.done()` at method end (before return statements)
- [ ] **All classes**: Replace any remaining `this.dx.out()` with `dx.out()` within methods

#### 4.2 Error Handling Updates
- [ ] **All classes**: Update error handling to use `dx.out()` instead of `debugOut()`
- [ ] **All classes**: Ensure error messages are properly formatted for Diagnostics

### Phase 5: Testing and Validation

#### 5.1 Debug Output Verification
- [ ] **All classes**: Verify all debug output now uses Diagnostics format
- [ ] **All classes**: Test debug output with different debug levels
- [ ] **All classes**: Verify timing information is displayed correctly

#### 5.2 Method Validation
- [ ] **All classes**: Test `dx.require()` functionality with missing parameters
- [ ] **All classes**: Verify method completion timing is tracked
- [ ] **All classes**: Test nested method calls and lineage display

#### 5.3 Cleanup Verification
- [ ] **All classes**: Verify `dx.done()` is called in all cleanup methods
- [ ] **All classes**: Test that no memory leaks occur from Diagnostics instances

## Implementation Notes

### Debug Output Assessment
For each `debugOut` usage, assess:
1. **Still needed?** Most debug output appears to be valuable for troubleshooting
2. **Convert to dx.out()** All should be converted to use the new Diagnostics system

### dx.require() Assessment
The `dx.require()` method should be added to methods that:
- Accept parameters that are critical for the method to function
- Have complex parameter validation needs
- Are public methods that could be called with invalid parameters
- Handle user input or external data

### Method Sub-Context Pattern
For methods that need their own Diagnostics context:
```typescript
someMethod(param1: string, param2: number): void {
  const dx = this.dx.sub('someMethod');
  dx.require({ param1, param2 }, ['param1', 'param2']);
  
  // Method implementation
  dx.out('Processing data...');
  
  dx.done('Method completed successfully');
}
```

## Success Criteria
- [ ] All classes have `this.dx = new Diagnostics('ClassName')` in constructor
- [ ] All `debugOut` calls replaced with `dx.out()`
- [ ] All `debugOut` methods removed from UI.ts and OS.ts
- [ ] All classes call `this.dx.done()` in their cleanup methods
- [ ] All methods that need parameter validation use `dx.require()`
- [ ] All methods that need sub-context use `const dx = this.dx.sub('methodName')`
- [ ] No memory leaks from Diagnostics instances
- [ ] Debug output shows proper class/method lineage
- [ ] Timing information is displayed for all methods

## Risk Mitigation
- Test each class individually after refactoring
- Maintain backup of original debugOut functionality until fully migrated
- Verify no functionality is lost during the transition
- Test with different debug levels to ensure proper output