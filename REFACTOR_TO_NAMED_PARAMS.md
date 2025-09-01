# Refactor to Named Parameters - Complete Plan

## Overview

Refactor all methods with two or more parameters to use named parameter objects for better clarity, maintainability, and to eliminate parameter ordering issues.

## Execution Strategy

- **Phase 1**: Core infrastructure (App, VSCodeAPIs)
- **Phase 2**: Core services (PDF, PaperPrinter, History)
- **Phase 3**: UI & Utilities (UI, UIMenuMgr, UIMenu, Stylize)
- **Phase 4**: OS & Platform (OS, OSMac, OSWin)
- **Phase 5**: Entry Point & Tests (entrypoint, all test files)

---

## Phase 1: Core Infrastructure

### 1.1 Create Shared Parameter Interfaces ✅

- [x] Create `types/Common_t.ts` file
- [x] Add `DebugParams` interface for debugOut methods
- [x] Add `FileOperationParams` interface for file operations
- [x] Add `PrintParams` interface for PDF operations
- [x] Add `DocumentParams` interface for document operations

### 1.2 Create Diagnostics.require() Method ✅

- [x] Pull Diagnostics class from mainline
- [x] Add `require(args, requiredKeys)` method to Diagnostics class
- [x] Implement boolean return for validation success/failure
- [x] Add proper error output with method name and missing key
- [x] Create comprehensive test suite for Diagnostics class
- [x] Verify all Diagnostics tests pass

### 1.3 Refactor App.ts

- [ ] Create `AppConstructorArgs` interface
- [ ] Refactor constructor to use named parameters
- [ ] Create `TemplateReplaceArgs` interface
- [ ] Refactor `templateDictReplace` method
- [ ] Update all constructor call sites

### 1.4 Refactor VSCodeAPIs.ts

- [ ] Create `VSCodeAPIsConstructorArgs` interface
- [ ] Refactor constructor to use named parameters
- [ ] Create `CreateDocumentArgs` interface
- [ ] Refactor `createDocument` method
- [ ] Create `ShowDocumentArgs` interface
- [ ] Refactor `showDocument` method
- [ ] Create `CreateWebviewPanelArgs` interface
- [ ] Refactor `createWebviewPanel` method
- [ ] Create `GetVSCodeThemeJsonArgs` interface
- [ ] Refactor `getVSCodeThemeJson` method
- [ ] Create `SetStatusBarMessageArgs` interface
- [ ] Refactor `setStatusBarMessage` method
- [ ] Update all method call sites

---

## Phase 2: Core Services

### 2.1 Refactor PDF.ts

- [ ] Create `PrintWithPreviewArgs` interface
- [ ] Refactor `printWithPreview` method
- [ ] Create `PrintDirectlyArgs` interface
- [ ] Refactor `printDirectly` method
- [ ] Create `SaveAsPDFArgs` interface
- [ ] Refactor `saveAsPDF` method
- [ ] Create `PreparePathsArgs` interface
- [ ] Refactor `preparePaths` method
- [ ] Create `HtmlToPdfArgs` interface
- [ ] Refactor `htmlToPdf` method
- [ ] Update all method call sites

### 2.2 Refactor PaperPrinter.ts

- [ ] Create `OpenPrintPrepAndPromptArgs` interface
- [ ] Refactor `openPrintPrepAndPrompt` method
- [ ] Update all method call sites

### 2.3 Refactor History.ts

- [ ] Create `HistoryConstructorArgs` interface
- [ ] Refactor constructor to use named parameters
- [ ] Update all constructor call sites

---

## Phase 3: UI & Utilities

### 3.1 Refactor UI.ts

- [ ] Create `DebugOutArgs` interface
- [ ] Refactor `debugOut` method
- [ ] Create `CreateWebviewPanelArgs` interface
- [ ] Refactor `createWebviewPanel` method
- [ ] Create `SetStatusBarMessageArgs` interface
- [ ] Refactor `setStatusBarMessage` method
- [ ] Update all method call sites

### 3.2 Refactor UIMenuMgr.ts

- [ ] Create `CreateMenuArgs` interface
- [ ] Refactor `createMenu` method
- [ ] Update all method call sites

### 3.3 Refactor UIMenu.ts

- [ ] Create `UIMenuConstructorArgs` interface
- [ ] Refactor constructor to use named parameters
- [ ] Update all constructor call sites

### 3.4 Refactor Stylize.ts

- [ ] Create `StyleToHtmlArgs` interface
- [ ] Refactor `styleToHtml` method
- [ ] Update all method call sites

---

## Phase 4: OS & Platform

### 4.1 Refactor OS.ts

- [ ] Create `DebugOutArgs` interface
- [ ] Refactor `debugOut` method
- [ ] Create `ReadJsonFileArgs` interface
- [ ] Refactor `readJsonFile` method
- [ ] Create `ReadExtensionYamlArgs` interface
- [ ] Refactor `readExtensionYaml` method
- [ ] Update all method call sites

### 4.2 Refactor OSMac.ts

- [ ] Review for multi-parameter methods
- [ ] Create interfaces for any found methods
- [ ] Refactor methods to use named parameters
- [ ] Update all method call sites

### 4.3 Refactor OSWin.ts

- [ ] Review for multi-parameter methods
- [ ] Create interfaces for any found methods
- [ ] Refactor methods to use named parameters
- [ ] Update all method call sites

---

## Phase 5: Entry Point & Tests

### 5.1 Refactor -entrypoint.ts

- [ ] Update App constructor call to use named parameters

### 5.2 Update Test Files

- [ ] Update `tests/App-Template.test.js`
- [ ] Update `tests/Integration.test.js`
- [ ] Update `tests/Stylize.test.js`
- [ ] Update `tests/Stylize-ErrorHandling.test.js`
- [ ] Update `tests/UI-Naming.test.js`
- [ ] Update `tests/UIMenu.test.js`
- [ ] Update `tests/UIMenuMgr.test.js`
- [ ] Update `tests/PaperPrinter-Naming.test.js`
- [ ] Update `tests/App-Template.test.ts`
- [ ] Update `tests/Integration.test.ts`
- [ ] Update `tests/Stylize.test.ts`
- [ ] Update `tests/Stylize-ErrorHandling.test.ts`
- [ ] Update `tests/UI-Naming.test.ts`
- [ ] Update `tests/UIMenu.test.ts`
- [ ] Update `tests/UIMenuMgr.test.ts`

---

## Phase 6: Validation & Cleanup

### 6.1 Compilation & Testing

- [ ] Run `npm run compile` to ensure TypeScript compilation
- [ ] Run `npm test` to ensure all tests pass
- [ ] Fix any compilation errors
- [ ] Fix any test failures

### 6.2 Code Review

- [ ] Review all refactored methods for consistency
- [ ] Ensure all interfaces follow naming conventions
- [ ] Verify no circular dependencies were introduced
- [ ] Check that all call sites were updated

### 6.3 Documentation

- [ ] Update any relevant documentation
- [ ] Add JSDoc comments for new interfaces
- [ ] Update README if necessary

---

## Interface Naming Conventions

### Constructor Parameters

- `ClassNameConstructorArgs` (e.g., `AppConstructorArgs`)

### Method Parameters

- `MethodNameArgs` (e.g., `CreateDocumentArgs`)
- `VerbNounArgs` (e.g., `PrintWithPreviewArgs`)

### Shared Interfaces

- `DebugArgs` - for all debugOut methods
- `FileOperationArgs` - for file operations
- `PrintArgs` - for PDF operations
- `DocumentArgs` - for document operations

---

## File Structure After Refactoring

```
src/
├── types/
│   ├── Common_t.ts          # Shared parameter interfaces
│   ├── UI_t.ts             # UI-specific types (existing)
│   └── rtf-parser.d.ts     # RTF parser types (existing)
├── App.ts                   # Uses AppConstructorArgs
├── VSCodeAPIs.ts           # Uses various *Args interfaces
├── PDF.ts                  # Uses Print*Args interfaces
├── PaperPrinter.ts         # Uses OpenPrintPrepAndPromptArgs
├── History.ts              # Uses HistoryConstructorArgs
├── UI.ts                   # Uses DebugArgs, etc.
├── UIMenuMgr.ts            # Uses CreateMenuArgs
├── UIMenu.ts               # Uses UIMenuConstructorArgs
├── Stylize.ts              # Uses StyleToHtmlArgs
├── OS.ts                   # Uses DebugArgs, etc.
├── OSMac.ts                # Uses any specific args
├── OSWin.ts                # Uses any specific args
└── -entrypoint.ts          # Updated constructor calls
```

---

## Progress Tracking

- **Total Tasks**: 89
- **Completed**: 9
- **Remaining**: 80
- **Current Phase**: Phase 1
- **Status**: In Progress - Diagnostics infrastructure complete, ready for App.ts refactoring

**Last Updated**: 2025-08-30
**Notes**: ✅ Diagnostics class successfully pulled from mainline and enhanced with require() method. ✅ All Diagnostics tests passing (72/72). ✅ Diagnostics instance integrated into App class. ✅ Comprehensive usage examples created. Ready to proceed with Phase 1.3: App.ts refactoring to use named parameters.

**Current Commit**: `caeefd9` - Diagnostics infrastructure complete
