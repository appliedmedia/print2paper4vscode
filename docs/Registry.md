# Registry Pattern Migration Plan

## ⚡ EXECUTION TODOS

### Immediate Actions (Start Here)

#### Stage 0.1: Create Registry Infrastructure ✅ NEXT
- [ ] Create `src/types/Id_t.ts` with `kId` constant and `Id_t` type
- [ ] Create `src/types/Registry_t.ts` for Registry type definitions
- [ ] Create `src/Registry.ts` with basic skeleton
- [ ] Add `DependencyRequest` type (method-name-based requests)
- [ ] Add basic `use()` method stub

#### Stage 0.2: Integrate Registry into App ⏸️
- [ ] Update `App.ts` to create Registry instance in constructor
- [ ] Registry constructor creates Diagnostics internally
- [ ] Add `app.use()` method that delegates to Registry
- [ ] Verify Registry can be instantiated without breaking existing code

#### Stage 0.3: Test Infrastructure ⏸️
- [ ] Run existing tests to ensure no regressions
- [ ] Add basic Registry construction test
- [ ] Verify Diagnostics is available via Registry

---

### Stage 1: Implement Registry Core ⏸️
- [ ] Implement `buildMethodMap()` - scan all components for methods
- [ ] Implement lazy instantiation cache
- [ ] Implement component factories (vscodeapis, ui, os, pdf, etc.)
- [ ] Implement full `use()` method with method resolution
- [ ] Add circular dependency detection
- [ ] Add error handling with circuit breaker pattern
- [ ] Test Registry lazy loading works correctly

---

### Stage 2: Migrate Leaf Components ⏸️

#### 2.1 Migrate OS Classes
- [ ] Add `public readonly id: Id_t = kId.os` to OS base class
- [ ] Update OS constructor to use `app.use()`
- [ ] Request dependencies: `{ create: [], sub: [], out: [] }` (Diagnostics)
- [ ] Update OSMac, OSWin, OSLinux (add `id` property to each)
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test OS classes work correctly

#### 2.2 Migrate Yaml
- [ ] Add `public readonly id: Id_t = kId.yaml`
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: OS methods, Diagnostics methods
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test Yaml works correctly

---

### Stage 3: Migrate Core Infrastructure ⏸️

#### 3.1 Migrate VSCodeAPIs
- [ ] Add `public readonly id: Id_t = kId.vscodeapis`
- [ ] Update constructor to use `app.use()`
- [ ] Request Diagnostics via Registry
- [ ] Move command registration from `init()` to constructor
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test command registration works

#### 3.2 Migrate Persist
- [ ] Add `public readonly id: Id_t = kId.persist`
- [ ] Update constructor to use `app.use()`
- [ ] Request VSCodeAPIs methods via Registry
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test persistence works

#### 3.3 Migrate UI
- [ ] Add `public readonly id: Id_t = kId.ui`
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: Diagnostics, OS, Persist methods
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test UI operations work

---

### Stage 4: Migrate Middle-Tier Components ⏸️

#### 4.1 Migrate TabInspector
- [ ] Add `public readonly id: Id_t = kId.tabinspector`
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: VSCodeAPIs, Diagnostics
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test tab inspection works

#### 4.2 Migrate Stylize
- [ ] Add `public readonly id: Id_t = kId.stylize`
- [ ] Update constructor to use `app.use()`
- [ ] Request Diagnostics via Registry
- [ ] Handle async initialization (lazy pattern in `init()`)
- [ ] Keep `init()` method (required by class library)
- [ ] Test syntax highlighting works

#### 4.3 Migrate UIMenuMgr
- [ ] Add `public readonly id: Id_t = kId.uimenumgr`
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: UI, VSCodeAPIs, Diagnostics
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test menu management works

---

### Stage 5: Migrate Complex Components ⏸️

#### 5.1 Migrate Coords
- [ ] Add `public readonly id: Id_t = kId.coords`
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: PDF (docInfo), Diagnostics
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test coordinate calculations work

#### 5.2 Migrate PDF
- [ ] Add `public readonly id: Id_t = kId.pdf`
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: Stylize, UI, OS, Diagnostics methods
- [ ] Update Coords instantiation
- [ ] Keep `init()` method (required by class library)
- [ ] Test PDF generation works

#### 5.3 Migrate DocInfo Classes
- [ ] Add `id` property to DocInfo_PDF
- [ ] Add `id` property to DocInfo_PaperPrinter
- [ ] Update constructors to use `app.use()`
- [ ] Remove `app` parameter
- [ ] Test DocInfo classes work

---

### Stage 6: Migrate Orchestration Components ⏸️

#### 6.1 Migrate UIWebView
- [ ] Add `public readonly id: Id_t = kId.uiwebview`
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: VSCodeAPIs, UI, OS, UIMenuMgr, Diagnostics
- [ ] Keep `init()` method (add comment if empty - required by class library)
- [ ] Test webview display works

#### 6.2 Migrate PaperPrinter
- [ ] Add `public readonly id: Id_t = kId.paperprinter`
- [ ] Update constructor to use `app.use()`
- [ ] Request all dependencies via Registry
- [ ] Update DocInfo_PaperPrinter instantiation
- [ ] Keep `init()` method (required by class library)
- [ ] Test complete print workflow

---

### Stage 7: Cleanup and Finalization ⏸️

#### 7.1 Remove App Component Properties
- [ ] Remove `vscodeapis`, `ui`, `pdf`, etc. from App class
- [ ] Remove `componentOrder` array
- [ ] Keep only Registry property
- [ ] Update App to access components via Registry

#### 7.2 Verify Init/Done Infrastructure
- [ ] Verify all `init()` methods preserved (required by class library)
- [ ] Keep `init()` calls from App (required by class library)
- [ ] Keep `app.init()` in `-entrypoint.ts` (required by class library)
- [ ] Verify `done()` methods still work correctly

#### 7.3 Update Type Definitions
- [ ] Remove `App` type from component imports where possible
- [ ] Update all type imports
- [ ] Ensure Registry types properly exported

#### 7.4 Final Testing
- [ ] Run full test suite
- [ ] Manual testing of all features
- [ ] Performance benchmarks
- [ ] Documentation updates

---

### Stage 8: Optimization ⏸️
- [ ] Add strong typing for dependency requests
- [ ] Add dependency validation
- [ ] Add lifecycle management
- [ ] Performance profiling and optimization
- [ ] Update all documentation

---

## Current Status Summary

**Components in Codebase:**
- ✅ App.ts - Main orchestrator (creates all components, has init/done)
- ✅ Diagnostics.ts - Logging system (stores app reference)
- ✅ VSCodeAPIs.ts - VS Code API wrapper (stores app, has init/done)
- ✅ UI.ts - UI manager (stores app, has init/done)
- ✅ OS.ts, OSMac.ts, OSWin.ts, OSLinux.ts - OS abstractions (store app, have init/done)
- ✅ PDF.ts - PDF generation (stores app, has init/done)
- ✅ Stylize.ts - Syntax highlighting (stores app, has init/done)
- ✅ TabInspector.ts - Tab inspection (stores app, has init/done)
- ✅ UIMenuMgr.ts - Menu management (stores app, has init/done)
- ✅ UIMenu.ts - Menu component
- ✅ UIWebView.ts - Webview management
- ✅ PaperPrinter.ts - Main orchestrator (stores app, has init/done)
- ✅ Coords.ts - Coordinate calculations (stores app, has init/done)
- ✅ Persist.ts - State persistence
- ✅ Yaml.ts - YAML loading
- ✅ DocInfo_PDF.ts - PDF document info
- ✅ DocInfo_PaperPrinter.ts - PaperPrinter document info

**Current Architecture Pattern:**
```typescript
// Every component follows this pattern:
class Component {
  private app: App;
  private dx: Diagnostics;
  
  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.sub('Component');
  }
  
  init(): void { /* ... */ }
  done(): void { /* ... */ }
  
  someMethod() {
    // Access other components via this.app
    this.app.ui.showErrorMessage('Error');
    this.app.pdf.generatePdf();
  }
}
```

**Target Architecture Pattern:**
```typescript
// Target pattern with Registry:
class Component {
  public readonly id: Id_t = kId.component;
  private deps: ComponentDependencies;
  private dx: Diagnostics;
  
  constructor(app: App) {
    // Request only what you need by method names
    this.deps = app.use({
      showErrorMessage: [],  // Registry finds in UI
      generatePdf: [],        // Registry finds in PDF
      create: [],             // Registry finds in Diagnostics
      sub: [],                // Registry finds in Diagnostics
      out: [],                // Registry finds in Diagnostics
    });
    
    // Create local diagnostics
    this.dx = this.deps.dx.create('Component');
  }
  
  someMethod() {
    // Access via deps organized by component
    this.deps.ui.showErrorMessage('Error');
    this.deps.pdf.generatePdf();
  }
}
```

---

## Overview

This document outlines a comprehensive migration plan to replace the current dependency injection pattern where every class receives a copy of `app` and accesses other classes via `this.app.componentName`, along with eliminating the requirement for `init()` routines.

## Goals

1. **Eliminate tight coupling**: Remove the need for classes to hold references to the entire `app` object
2. **Lazy initialization**: Construct components only when first used, not at startup
3. **Explicit dependencies**: Each class constructor explicitly declares what it needs via a Registry
4. **Preserve init() methods**: Keep `init()` methods (required by class library system) but move logic to constructors where possible
5. **Type safety**: Maintain strong typing throughout the migration
6. **Minimal startup overhead**: Only construct App and Registry at startup (Registry creates Diagnostics internally)

## Current Architecture Problems

### Issues Identified

1. **Tight Coupling**: Every class holds a reference to `app` and can access any component, creating implicit dependencies
2. **Eager Initialization**: All components are constructed at startup, even if never used
3. **Two-Phase Construction**: Constructor + `init()` creates complexity (note: `init()` must be preserved per class library requirements)
4. **Dependency Graph**: Hard to see what a class actually depends on without reading its entire implementation
5. **Testing Complexity**: Difficult to mock dependencies when everything is accessed via `this.app.*`

### Current Usage Pattern

```typescript
// Current pattern
class PDF {
  private app: App;
  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('PDF');
    this.coords = new Coords(app);
  }

  init(): void {
    this.tempPdfs = [];
    this.coords.init();
  }

  someMethod() {
    const tokens = this.app.stylize.getTokens(...);
    const ui = this.app.ui.showErrorMessage(...);
  }
}
```

## Target Architecture: Registry Pattern

### Core Concepts

1. **Registry Class**: Central registry that manages lazy instantiation and dependency resolution, owns Diagnostics
2. **Dependency Declaration**: Components declare needed dependencies in their constructors
3. **Lazy Construction**: Components are created on-demand when first requested (except Diagnostics, which Registry creates immediately)
4. **Scoped Access**: Registry returns objects containing only requested methods/instances
5. **No Init Required**: Construction handles all initialization
6. **Registry Owns Diagnostics**: Registry creates and manages Diagnostics internally for debugging and error reporting

### Target Usage Pattern

```typescript
// Target pattern - PDF class example
class PDF {
  private deps: PDFDependencies;

  constructor(app: App) {
    // Request by method names - Registry figures out which component has each method
    this.deps = app.use({
      getTokens: [], // Registry finds this in Stylize
      getThemes: [], // Registry finds this in Stylize
      showErrorMessage: [], // Registry finds this in UI
      showInfoMessage: [], // Registry finds this in UI
      fileRead: [], // Registry finds this in OS
      fileWrite: [], // Registry finds this in OS
      create: [], // Registry finds this in Diagnostics (dx)
      sub: [], // Registry finds this in Diagnostics (dx)
      out: [], // Registry finds this in Diagnostics (dx)
    });

    // Create Diagnostics instance for this class
    this.dx = this.deps.dx.create('PDF');

    // Create Coords instance (request class reference)
    this.coords = new Coords(app);
  }

  async renderPage(pageNum: number): Promise<void> {
    const subDx = this.deps.dx.sub('renderPage');

    try {
      // Use requested methods - access via component name (organized by Registry)
      const tokens = await this.deps.stylize.getTokens('code', 'javascript', 'theme');
      this.deps.ui.showInfoMessage(`Rendering page ${pageNum}`);

      const content = this.deps.os.fileRead('template.html');
    } catch (err) {
      // Error handling: log via Diagnostics and show user-friendly error
      subDx.out(
        `Failed to render page ${pageNum}: ${err instanceof Error ? err.message : String(err)}`
      );
      this.deps.ui.showErrorMessage(`Failed to render page ${pageNum}. Please try again.`);
      throw err; // Re-throw to allow caller to handle
    }
  }
}

// UI class example
class UI {
  private deps: UIDependencies;
  public readonly id = 'ui'; // Every class must have id property or id() getter

  constructor(app: App) {
    this.deps = app.use({
      create: [], // Registry finds this in Diagnostics
      sub: [], // Registry finds this in Diagnostics
      out: [], // Registry finds this in Diagnostics
      fileRead: [], // Registry finds this in OS
      showErrorMessage: [], // Registry finds this in VSCodeAPIs
      showInfoMessage: [], // Registry finds this in VSCodeAPIs
      showWarningMessage: [], // Registry finds this in VSCodeAPIs
    });

    this.dx = this.deps.dx.create('UI');
  }

  showError(msg: string): void {
    try {
      // Access methods via component organization
      // Check dependencies are available before using
      if (!this.deps.vscodeapis || !this.deps.dx) {
        throw new Error('Required dependencies not available');
      }
      this.deps.vscodeapis.showErrorMessage(msg);
      this.deps.dx.out(`Error: ${msg}`);
    } catch (err) {
      // Fallback: log to console if diagnostics unavailable
      console.error(`UI.showError failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

// Example with ambiguous method names (use component prefix)
class PaperPrinter {
  private deps: PaperPrinterDependencies;
  public readonly id = 'paperprinter'; // Every class must have id property or id() getter

  constructor(app: App) {
    this.deps = app.use({
      // If method names are unique across all components, just use method name
      renderPage: [],
      getCurrentPdfDoc: [],
      setTokensForPageRender: [],
      getTokens: [],
      getThemes: [],
      getActiveTabContent: [],
      getLanguageId: [],
      showErrorMessage: [],
      showInfoMessage: [],
      getValueForSelectedByMenuId: [],
      createMenu: [],
      getActiveTextEditor: [],
      postMessage: [],
      create: [],
      sub: [],
      out: [],

      // If there's ambiguity (same method name in multiple components), use prefix
      // 'diagnostics.out': [],  // Only needed if 'out' exists in multiple components
    });

    this.dx = this.deps.dx.create('PaperPrinter');
  }

  async handlePrint(): Promise<void> {
    const subDx = this.deps.dx.sub('handlePrint');

    try {
      // Check dependencies are available
      if (!this.deps.tabinspector || !this.deps.stylize || !this.deps.pdf) {
        throw new Error('Required dependencies not available for printing');
      }

      const content = this.deps.tabinspector.getActiveTabContent();
      const lang = this.deps.tabinspector.getLanguageId();
      const tokens = await this.deps.stylize.getTokens(content, lang, 'github-light');

      this.deps.pdf.setTokensForPageRender(tokens, 'github-light');
      await this.deps.pdf.renderPage(0);
    } catch (err) {
      // Error handling: log and show user-friendly message
      subDx.out(`Print failed: ${err instanceof Error ? err.message : String(err)}`);
      this.deps.ui.showErrorMessage(
        'Failed to print document. Please check your selection and try again.'
      );
      // Don't re-throw - gracefully degrade
    }
  }
}
```

### How Dependency Access Works

1. **Request Phase**: Request by method names in constructor: `app.use({ getTokens: [], showErrorMessage: [] })`
2. **Registry Resolution**: Registry automatically finds which component has each method
3. **Ambiguity Handling**: If same method name exists in multiple components, use `'componentName.methodName'` format
4. **Return Format**: Registry returns object organized by component: `{ dx: { create, sub, out }, ui: { showErrorMessage }, stylize: { getTokens } }`
5. **Access Phase**: Use `this.deps.componentName.methodName()` - same access pattern as current `app.componentName.methodName()`
6. **Request Entire Class**: Request entire class instance by class name or short name: `app.use({ Diagnostics: [] })` or `app.use({ dx: [] })`
7. **Class References**: For class constructors, use special syntax like `Coords: []` or similar

**Key Benefits**:

- Don't need to know component names - just request methods you need
- Registry handles the mapping automatically
- Only disambiguate when truly needed (rare)
- Return format matches current access pattern (`app.dx.out()`, `app.ui.showErrorMessage()`, etc.)
- Can request entire classes when needed

**Method Name Ambiguity Resolution**:

- **Build-time detection**: During `buildMethodMap()`, Registry scans all components and detects method name collisions
- **Fail-fast**: If ambiguous methods exist without explicit prefixes, Registry construction fails with clear error message listing all conflicts
- **Explicit prefixes required**: For any method name that exists in multiple components, callers must use `'componentName.methodName'` format
- **Example**: If both `UI` and `VSCodeAPIs` have `showErrorMessage`, request as `'ui.showErrorMessage'` or `'vscodeapis.showErrorMessage'`
- This prevents silent failures and undefined behavior in production

**Class ID Requirement**:

- Every class must have `public readonly id: string` returning the short name (e.g., `'dx'`, `'ui'`, `'pdf'`)
- **Standard**: `public readonly id = "dx"` - can be typed as `Id_t` (see below)
- **Alternative**: `get id(): string { return "dx" }` - no instance property, but cannot be typed as `Id_t`
- **Decision**: Use `readonly id` because it enables type-safe ID constants and typedefs

**ID Type Definition**:
Create a `kId` constant object with all component IDs, then derive `Id_t` type from it:

```typescript
// src/types/Id_t.ts
export const kId = {
  dx: 'dx',
  vscodeapis: 'vscodeapis',
  ui: 'ui',
  os: 'os',
  pdf: 'pdf',
  stylize: 'stylize',
  tabinspector: 'tabinspector',
  uimenumgr: 'uimenumgr',
  paperprinter: 'paperprinter',
  coords: 'coords',
  persist: 'persist',
  yaml: 'yaml',
  // ... all component IDs
} as const;

// Derive type from kId values
export type Id_t = (typeof kId)[keyof typeof kId];

// Usage in classes:
class Diagnostics {
  public readonly id: Id_t = kId.dx;
}

class UI {
  public readonly id: Id_t = kId.ui;
}
```

This provides:

- Single source of truth for all IDs (`kId`)
- Type safety (`Id_t` ensures only valid IDs are used)
- Autocomplete support
- Refactoring safety (renaming `kId.dx` updates all references)

## Migration Stages

### Stage 0: Preparation and Infrastructure

**Goal**: Set up Registry infrastructure without changing existing code

#### 0.1: Create Registry Class Skeleton

- [ ] Create `src/Registry.ts` with basic structure
- [ ] Define `DependencyRequest` type for dependency declarations
- [ ] Add basic `use()` method that returns `any` initially

#### 0.2: Create Registry Integration Points

- [ ] Add `Registry` instance to App class (constructed in App constructor)
- [ ] Registry constructor creates Diagnostics instance immediately internally
- [ ] Create minimal Registry that wraps existing App pattern
- [ ] Registry can access existing App components during transition

#### 0.3: Add Type Definitions

- [ ] Create `src/types/Registry_t.ts` for Registry type definitions
- [ ] Create `src/types/Id_t.ts` with:
  - `kId` constant object containing all component IDs
  - `Id_t` type derived from `kId` values
- [ ] Define `DependencyRequest` interface
- [ ] Define `DependencyResponse` interfaces per component
- [ ] Export types for use in components

**Testing**: Registry can be instantiated and returns existing app components

---

### Stage 1: Create Registry Infrastructure

**Goal**: Build complete Registry implementation with lazy loading

#### 1.1: Implement Registry Core

- [ ] Registry constructor creates Diagnostics instance immediately (not lazy, needed for debugging)
- [ ] Store Diagnostics instance in Registry's internal cache immediately
- [ ] Implement lazy instantiation cache in Registry for other components
- [ ] Add component factory functions mapping (e.g., `VSCodeAPIs`, `UI`, `PDF`, etc.)
- [ ] Implement `buildMethodMap()` that:
  - Creates instances of all registered components (or uses prototypes)
  - Reads each component's `id` property or calls `id()` getter to get short name
  - Scans all methods on each component
  - Builds mapping: methodName -> componentId (e.g., 'out' -> 'dx')
  - **Detects method name collisions** at build-time and fails hard if ambiguous methods exist without explicit prefix
- [ ] Implement `use()` method that:
  - Handles class name requests (e.g., `Diagnostics: []`, `dx: []`) - returns entire instance
  - Handles method name requests - uses methodMap to resolve to component
  - Returns Diagnostics immediately (always available, created at Registry construction)
  - Checks cache for existing instances
  - Creates instances lazily if not cached with error handling (see Error Handling section)
  - Returns scoped object with only requested methods/instances, or entire instance if requested
- [ ] Add circular dependency detection (see algorithm below)

#### 1.2: Implement Method Scoping

- [ ] Create proxy objects that expose only requested methods
- [ ] Ensure method binding preserves `this` context
- [ ] Add type-safe wrappers for each component's public API
- [ ] Implement class name to short name mapping (Diagnostics -> dx, VSCodeAPIs -> vscodeapis, etc.)

#### 1.3: Update App Constructor

- [ ] Remove eager component construction from App constructor
- [ ] Create Registry instance (Registry creates Diagnostics internally)
- [ ] Register component factories with Registry
- [ ] Update App to use Registry for accessing components

**Testing**:

- Registry can lazy-load components
- Requested methods are accessible
- Unrequested methods are not accessible
- Components work correctly when accessed via Registry

---

### Stage 2: Migrate Leaf Components First

**Goal**: Migrate components with no dependencies or minimal dependencies

**Note**:

- Diagnostics is owned by Registry and created immediately at Registry construction. All components request Diagnostics via Registry.
- **Critical**: Every migrated class must add `public readonly id: Id_t = kId.xxx` (using the appropriate ID from `kId`)

#### 2.1: Migrate OS Classes

- [ ] Update OS base class constructor to accept App
- [ ] Remove `app` parameter
- [ ] Add `public readonly id: Id_t = kId.os` (or appropriate ID)
- [ ] Request dependencies via Registry:
  - `Diagnostics` (for logging)
  - `VSCodeAPIs` (for extension path)
- [ ] Move `init()` logic into constructor
- [ ] Update OS factory method to use Registry
- [ ] Update OSMac, OSWin, OSLinux constructors (each adds `id` property)

#### 2.3: Migrate Yaml

- [ ] Update Yaml constructor to accept App
- [ ] Request `OS` dependency for file reading
- [ ] Request `Diagnostics` dependency (via Registry) for logging
- [ ] Remove `app` parameter
- [ ] Move initialization into constructor

**Testing**: All migrated components work correctly, no regressions

---

### Stage 3: Migrate Core Infrastructure Components

**Goal**: Migrate foundational components that others depend on

#### 3.1: Migrate VSCodeAPIs

- [ ] Update VSCodeAPIs constructor to accept App + vscode + context
- [ ] Remove `app` parameter
- [ ] Request Diagnostics via Registry
- [ ] Move `init()` logic (command registration) into constructor
- [ ] Update Registry factory for VSCodeAPIs
- [ ] Update App to construct VSCodeAPIs via Registry

#### 3.2: Migrate UI

- [ ] Update UI constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request dependencies: `Diagnostics`, `OS` (for file reading), `Persist`
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory for UI
- [ ] Update all references to `app.ui` to use Registry

#### 3.3: Migrate Persist

- [ ] Update Persist constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request `VSCodeAPIs` for global state access
- [ ] Move initialization into constructor

**Testing**: Core infrastructure components work correctly

---

### Stage 4: Migrate Middle-Tier Components

**Goal**: Migrate components with moderate dependencies

#### 4.1: Migrate TabInspector

- [ ] Update TabInspector constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request dependencies: `VSCodeAPIs`, `Diagnostics`
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory
- [ ] Update all `app.tabinspector` references

#### 4.2: Migrate Stylize

- [ ] Update Stylize constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request dependencies: `Diagnostics` (for logging)
- [ ] Move async `init()` logic into constructor (may need lazy initialization pattern)
- [ ] Update Registry factory
- [ ] Update all `app.stylize` references

#### 4.3: Migrate UIMenuMgr

- [ ] Update UIMenuMgr constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request dependencies: `UI`, `VSCodeAPIs`, `Diagnostics`
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory
- [ ] Update all `app.uimenumgr` references

**Testing**: Middle-tier components work correctly

---

### Stage 5: Migrate Complex Components

**Goal**: Migrate components with many dependencies

#### 5.1: Migrate Coords

- [ ] Update Coords constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request dependencies: `PDF` (for docInfo), `Diagnostics`
- [ ] Move `init()` logic into constructor
- [ ] Update all Coords instantiations

#### 5.2: Migrate PDF

- [ ] Update PDF constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request dependencies:
  - `Stylize` (for getTokens)
  - `UI` (for error messages)
  - `OS` (for file operations)
  - `Diagnostics`
  - `Coords` (class reference)
- [ ] Update DocInfo_PDF constructor to accept App
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory
- [ ] Update all `app.pdf` references

#### 5.3: Migrate DocInfo Classes

- [ ] Update DocInfo_PDF constructor to accept App
- [ ] Update DocInfo_PaperPrinter constructor to accept App
- [ ] Request necessary dependencies in each
- [ ] Remove `app` parameters

**Testing**: Complex components work correctly

---

### Stage 6: Migrate Orchestration Components

**Goal**: Migrate top-level components that orchestrate others

#### 6.1: Migrate UIWebView

- [ ] Update UIWebView constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies:
  - `VSCodeAPIs` (for webview panels)
  - `UI` (for toolbar, message handling)
  - `OS` (for file reading)
  - `UIMenuMgr`
  - `Diagnostics`
- [ ] Move `init()` logic into constructor
- [ ] Update all instantiations

#### 6.2: Migrate UIScrollView

- [ ] Update UIScrollView constructor to accept App
- [ ] Remove `app` parameter
- [ ] Request dependencies via Registry
- [ ] Move `init()` logic into constructor

#### 6.3: Migrate PaperPrinter

- [ ] Update PaperPrinter constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies:
  - `PDF`
  - `Stylize`
  - `TabInspector`
  - `UI`
  - `UIMenuMgr`
  - `VSCodeAPIs`
  - `Diagnostics`
  - `UIWebView` (class reference)
  - `DocInfo_PaperPrinter` (class reference)
- [ ] Update DocInfo_PaperPrinter constructor
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory
- [ ] Update all `app.paperprinter` references

**Testing**: All orchestration components work correctly

---

### Stage 7: Cleanup and Finalization

**Goal**: Remove all traces of old pattern

#### 7.1: Remove App Component Properties

- [ ] Remove `vscodeapis`, `ui`, `pdf`, etc. properties from App class
- [ ] Remove `componentOrder` array
- [ ] Keep only `Registry` property in App (Registry owns Diagnostics internally)
- [ ] Update App to use Registry for component access

#### 7.2: Remove Init Methods

- [ ] Remove all `init()` method implementations
- [ ] Remove `init()` calls from App
- [ ] Remove `init()` type definitions if present

#### 7.3: Remove Done Methods (if not needed)

- [ ] Evaluate if `done()` methods are still needed
- [ ] If not needed, remove them
- [ ] If needed, ensure they work with Registry pattern

#### 7.4: Update Entry Point

- [ ] Update `-entrypoint.ts` to remove `app.init()` call
- [ ] Verify extension activation works correctly

#### 7.5: Update Type Definitions

- [ ] Remove `App` type from component constructor signatures
- [ ] Update all type imports
- [ ] Ensure Registry types are properly exported

#### 7.6: Code Cleanup

- [ ] Remove all `this.app.*` references (should be none remaining)
- [ ] Remove unused imports
- [ ] Run linter and fix issues
- [ ] Update documentation comments

**Testing**: Full integration test, all features work

---

## Error Handling Strategy

### Error Handling During Lazy Initialization

Registry factories may throw errors during component construction. The Registry must handle these gracefully:

**Error Boundary in Registry.use()**:

```typescript
use<T>(request: DependencyRequest): T {
  // ... resolve method names to components ...

  for (const [componentName, methods] of componentMethods) {
    if (componentName === 'dx') {
      result.dx = this.createScopedAccess(this.diagnostics, Array.from(methods));
    } else {
      // Get or create component instance lazily with error handling
      if (!this.instances.has(componentName)) {
        try {
          const factory = this.factories.get(componentName);
          if (!factory) throw new Error(`No factory for component: ${componentName}`);
          this.instances.set(componentName, factory(this.app));
        } catch (err) {
          // Log error via Diagnostics
          this.diagnostics.out(`Failed to create component '${componentName}': ${err instanceof Error ? err.message : String(err)}`);

          // Circuit breaker: mark component as failed, don't retry
          this.failedComponents.add(componentName);

          // Throw meaningful error to caller
          throw new Error(
            `Failed to initialize component '${componentName}': ${err instanceof Error ? err.message : String(err)}. ` +
            `Extension may need to be restarted.`
          );
        }
      }

      // Check if component previously failed
      if (this.failedComponents.has(componentName)) {
        throw new Error(`Component '${componentName}' failed to initialize and is unavailable`);
      }

      const instance = this.instances.get(componentName);
      result[componentName] = this.createScopedAccess(instance, Array.from(methods));
    }
  }

  return result as T;
}
```

**Fallback Strategy**:

- Components should check for missing dependencies before use (null/undefined guards)
- Use try/catch blocks around Registry.use() calls in constructors
- Log errors via Diagnostics when available
- Degrade gracefully - return early or use fallback values where possible

**Circuit Breaker**:

- Track failed component initializations
- Don't retry failed factories on subsequent requests
- Provide clear error messages indicating component is unavailable

---

### Stage 8: Optimization and Enhancement

**Goal**: Optimize Registry and add advanced features

#### 8.1: Add Type Safety

- [ ] Create strong types for each component's dependency requests
- [ ] Ensure Registry `use()` returns properly typed objects
- [ ] Add TypeScript generics for better type inference

#### 8.2: Add Dependency Validation

- [ ] Validate requested dependencies exist
- [ ] Validate requested methods exist on components
- [ ] Add helpful error messages for missing dependencies

#### 8.3: Add Lifecycle Management

- [ ] Implement cleanup/destruction order if needed
- [ ] Add Registry cleanup method
- [ ] Ensure proper disposal of resources

#### 8.4: Performance Optimization

- [ ] Profile lazy loading overhead
- [ ] Optimize method proxy creation
- [ ] Add caching for frequently accessed components

**Testing**: Performance tests, type safety verification

---

## Architecture Decision: Registry Integrated into App

Registry functionality is exposed directly on App: `app.use()`. Registry is still a separate internal class that handles the dependency management, but App delegates to it. This keeps the API simple - components just call `app.use()` without needing to know about Registry.

## Registry Implementation Details

### Component Naming Convention

Registry uses **short names/aliases** (not class names) for consistency with the current App pattern:

- `dx` ? Diagnostics class
- `vscodeapis` ? VSCodeAPIs class
- `ui` ? UI class
- `os` ? OS class
- `pdf` ? PDF class
- `stylize` ? Stylize class
- `tabinspector` ? TabInspector class
- `uimenumgr` ? UIMenuMgr class
- etc.

When requesting dependencies, use these short names:

```typescript
registry.use({
  dx: ['create', 'sub', 'out'], // Not 'diagnostics' or 'Diagnostics'
  ui: ['showErrorMessage'],
  vscodeapis: ['getActiveTextEditor'],
});
```

This matches the current `app.dx`, `app.ui`, `app.vscodeapis` pattern for easy migration.

```typescript
type DependencyRequest = {
  [componentName: string]: string[] | string; // Methods array or 'ClassName' string
};

class Registry {
  private instances: Map<string, any> = new Map();
  private factories: Map<string, (registry: Registry) => any> = new Map();
  private diagnostics: Diagnostics;

  constructor(
    private vscode: any,
    private context: any
  ) {
    // Create Diagnostics immediately (needed for debugging during construction)
    this.diagnostics = new Diagnostics('Registry', undefined, null, null);
    this.instances.set('dx', this.diagnostics);
    this.registerFactories();
  }

  use<T>(request: DependencyRequest): T {
    const result: any = {};

    for (const [componentName, methods] of Object.entries(request)) {
      if (componentName === 'dx') {
        // Diagnostics is always available
        result.dx = this.createScopedAccess(this.diagnostics, methods as string[]);
      } else {
        // Get or create component instance lazily
        if (!this.instances.has(componentName)) {
          const factory = this.factories.get(componentName);
          if (!factory) throw new Error(`No factory for component: ${componentName}`);
          this.instances.set(componentName, factory(this));
        }

        const instance = this.instances.get(componentName);

        // Handle class reference requests
        if (methods === 'ClassName' || methods === componentName) {
          result[componentName] = instance.constructor;
        } else {
          // Return scoped access to requested methods
          result[componentName] = this.createScopedAccess(instance, methods as string[]);
        }
      }
    }

    return result as T;
  }

  private createScopedAccess(instance: any, methods: string[]): any {
    const scoped: any = {};
    for (const method of methods) {
      // Validate method exists on component
      if (!(method in instance)) {
        throw new Error(
          `Method '${method}' not found on component. Available methods: ${Object.getOwnPropertyNames(
            instance
          )
            .filter(m => typeof instance[m] === 'function')
            .join(', ')}`
        );
      }

      if (typeof instance[method] === 'function') {
        scoped[method] = instance[method].bind(instance);
      } else {
        scoped[method] = instance[method];
      }
    }
    return scoped;
  }

  private registerFactories(): void {
    // Register factories using short names (aliases), not class names
    // This matches the current app.dx, app.ui pattern for consistency

    this.factories.set('vscodeapis', registry => {
      return new VSCodeAPIs(registry, this.vscode, this.context);
    });

    this.factories.set('ui', registry => {
      return new UI(registry);
    });

    this.factories.set('os', registry => {
      return OS.create(registry);
    });

    this.factories.set('pdf', registry => {
      return new PDF(registry);
    });

    this.factories.set('stylize', registry => {
      return new Stylize(registry);
    });

    // ... register all other components with their short names
  }
}
```

## Testing Strategy

### Unit Tests

- Test Registry lazy loading
- Test method scoping
- Test circular dependency detection
- Test each migrated component in isolation

### Integration Tests

- Test component interactions
- Test end-to-end workflows
- Test extension activation/deactivation

### Regression Tests

- Run existing test suite after each stage
- Verify no functionality regressions
- Performance benchmarks

## Rollback Plan

### Feature Flag Strategy (Recommended)

Use feature flags instead of commented-out code or multiple branches:

**Implementation**:

```typescript
// Feature flag configuration
const USE_REGISTRY = process.env.USE_REGISTRY === 'true' || false;

class App {
  constructor(context: ExtensionContext, vscode: typeof import('vscode')) {
    if (USE_REGISTRY) {
      this.registry = new Registry(vscode, context, this);
      // Use Registry pattern
    } else {
      // Legacy pattern: eager initialization
      this.vscodeapis = new VSCodeAPIs(this, vscode, context);
      this.ui = new UI(this);
      // ... etc
    }
  }
}
```

**Rollout Strategy**:

- **Stage 0-1**: Infrastructure only (no flag needed, no user-facing changes)
- **Stage 2+**: Feature flag enables Registry for that component tier
  - Start with `USE_REGISTRY=false` (default)
  - Enable flag for specific components: `USE_REGISTRY=pdf,ui`
  - Gradually expand: `USE_REGISTRY=pdf,ui,os`
  - Full rollout: `USE_REGISTRY=true`
- **Rollback**: Flip flag to `false`, revert single commit if needed
- **Parallel deployment**: Gradual rollout (50% to 100%) with monitoring

**Benefits**:

- Clean codebase (no commented-out code)
- Single branch to maintain
- Instant rollback via flag flip
- Gradual rollout reduces risk
- Easy A/B testing

### Emergency Rollback

- Feature flag flip (instant)
- Git revert to last stable commit if needed
- Tag stable points for reference

## Migration Checklist

### Pre-Migration

- [ ] Create feature branch
- [ ] Document current test coverage
- [ ] Run full test suite and document results
- [ ] Create backup/tag current state

### During Migration

- [ ] Complete stages sequentially
- [ ] Run tests after each stage
- [ ] Fix issues before proceeding
- [ ] Update documentation as you go

### Post-Migration

- [ ] Full test suite passes
- [ ] No performance regressions
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Old code removed

## Risks and Mitigations

### Risk: Circular Dependencies

- **Mitigation**: Registry detects and reports circular dependencies (see algorithm below)
- **Mitigation**: Careful stage ordering (leaf components first)

### Circular Dependency Detection Algorithm

Registry uses **lazy detection** (on-demand during `use()` calls) to detect circular dependencies:

```typescript
class Registry {
  private constructionStack: string[] = []; // Track components being constructed

  use<T>(request: DependencyRequest): T {
    const result: any = {};
    const componentMethods: Map<string, Set<string>> = new Map();

    // Resolve method names to components...

    for (const [componentName, methods] of componentMethods) {
      // Check for circular dependency
      if (this.constructionStack.includes(componentName)) {
        const cycle = [...this.constructionStack, componentName].join(' -> ');
        throw new Error(
          `Circular dependency detected: ${cycle}. ` +
            `Components cannot depend on each other directly or indirectly.`
        );
      }

      if (componentName === 'dx') {
        result.dx = this.createScopedAccess(this.diagnostics, Array.from(methods));
      } else {
        if (!this.instances.has(componentName)) {
          // Push component onto construction stack
          this.constructionStack.push(componentName);

          try {
            const factory = this.factories.get(componentName);
            if (!factory) throw new Error(`No factory for component: ${componentName}`);
            const instance = factory(this.app);

            // If factory calls app.use() internally, it will detect cycles
            this.instances.set(componentName, instance);
          } finally {
            // Pop component from stack when done (even if error occurred)
            this.constructionStack.pop();
          }
        }

        const instance = this.instances.get(componentName);
        result[componentName] = this.createScopedAccess(instance, Array.from(methods));
      }
    }

    return result as T;
  }
}
```

**How it works**:

1. Track construction stack: List of components currently being constructed
2. Before creating a component, check if it's already in the stack
3. If found, throw error with full cycle path
4. Push component onto stack before factory call
5. Pop component from stack after factory call (use try/finally to ensure cleanup)

**Performance**: Minimal overhead - only tracks stack during lazy initialization, no upfront graph building needed.

### Risk: Breaking Changes

- **Mitigation**: Incremental migration with tests at each stage

### Risk: Performance Degradation

- **Mitigation**: Profile lazy loading overhead
- **Mitigation**: Cache instances aggressively

### Risk: Type Safety Loss

- **Mitigation**: Strong typing in Registry interfaces
- **Mitigation**: TypeScript strict mode enabled

## Success Criteria

1. ✓ No `app` parameter in component constructors
2. ✓ `init()` methods preserved (required by class library) but logic moved to constructors where possible
3. ✓ Components constructed lazily on first use
4. ✓ Explicit dependency declarations in constructors
5. ✓ All tests passing
6. ✓ No performance regressions
7. ✓ Code is cleaner and more maintainable

## Timeline Estimate

- **Stage 0**: 1-2 days (Infrastructure setup)
- **Stage 1**: 2-3 days (Registry implementation)
- **Stage 2**: 2-3 days (Leaf components)
- **Stage 3**: 2-3 days (Core infrastructure)
- **Stage 4**: 2-3 days (Middle-tier)
- **Stage 5**: 3-4 days (Complex components)
- **Stage 6**: 3-4 days (Orchestration)
- **Stage 7**: 2-3 days (Cleanup)
- **Stage 8**: 2-3 days (Optimization)

**Total**: ~19-28 days of focused development work

## Special Considerations

### Registry Owns Diagnostics

Registry creates and manages Diagnostics internally. This simplifies the architecture:

1. **Single Responsibility**: Registry is the dependency manager, so it manages all dependencies including Diagnostics
2. **Simplified App**: App only needs to create Registry, Registry handles Diagnostics
3. **Early Availability**: Registry creates Diagnostics immediately in its constructor, before any components are created
4. **Centralized Ownership**: One place manages Diagnostics lifecycle

**Implementation approach**:

- Registry constructor creates Diagnostics instance immediately (first thing)
- Registry stores Diagnostics in its instance cache immediately
- Registry's `deps()` method returns Diagnostics immediately when requested
- All components request Diagnostics via Registry: `registry.deps({ dx: ['create', 'sub', 'out'] })`

## Notes

- Migration can be done incrementally without breaking existing functionality
- Each stage should be tested thoroughly before proceeding
- Consider pair programming for complex stages
- Regular code reviews during migration
- Keep migration branch synced with main branch
