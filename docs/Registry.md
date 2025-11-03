# Registry Pattern Migration Plan

## Overview

This document outlines a comprehensive migration plan to replace the current dependency injection pattern where every class receives a copy of `app` and accesses other classes via `this.app.componentName`, along with eliminating the requirement for `init()` routines.

## Goals

1. **Eliminate tight coupling**: Remove the need for classes to hold references to the entire `app` object
2. **Lazy initialization**: Construct components only when first used, not at startup
3. **Explicit dependencies**: Each class constructor explicitly declares what it needs via a Registry
4. **Remove init() methods**: Eliminate the need for separate initialization routines
5. **Type safety**: Maintain strong typing throughout the migration
6. **Minimal startup overhead**: Only construct App and Registry at startup (Registry creates Diagnostics internally)

## Current Architecture Problems

### Issues Identified

1. **Tight Coupling**: Every class holds a reference to `app` and can access any component, creating implicit dependencies
2. **Eager Initialization**: All components are constructed at startup, even if never used
3. **Two-Phase Construction**: Constructor + `init()` creates complexity and potential for misuse
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
      getTokens: [],           // Registry finds this in Stylize
      getThemes: [],           // Registry finds this in Stylize
      showErrorMessage: [],    // Registry finds this in UI
      showInfoMessage: [],     // Registry finds this in UI
      fileRead: [],            // Registry finds this in OS
      fileWrite: [],           // Registry finds this in OS
      create: [],              // Registry finds this in Diagnostics (dx)
      sub: [],                 // Registry finds this in Diagnostics (dx)
      out: []                  // Registry finds this in Diagnostics (dx)
    });
    
    // Create Diagnostics instance for this class
    this.dx = this.deps.dx.create('PDF');
    
    // Create Coords instance (request class reference)
    this.coords = new Coords(app);
  }
  
  async renderPage(pageNum: number): Promise<void> {
    const subDx = this.deps.dx.sub('renderPage');
    
    // Use requested methods - access via component name (organized by Registry)
    const tokens = await this.deps.stylize.getTokens('code', 'javascript', 'theme');
    this.deps.ui.showInfoMessage(`Rendering page ${pageNum}`);
    
    const content = this.deps.os.fileRead('template.html');
  }
}

// UI class example
class UI {
  private deps: UIDependencies;
  public readonly id = 'ui'; // Every class must have id property or id() getter
  
  constructor(app: App) {
    this.deps = app.use({
      create: [],              // Registry finds this in Diagnostics
      sub: [],                 // Registry finds this in Diagnostics
      out: [],                 // Registry finds this in Diagnostics
      fileRead: [],            // Registry finds this in OS
      showErrorMessage: [],    // Registry finds this in VSCodeAPIs
      showInfoMessage: [],     // Registry finds this in VSCodeAPIs
      showWarningMessage: []  // Registry finds this in VSCodeAPIs
    });
    
    this.dx = this.deps.dx.create('UI');
  }
  
  showError(msg: string): void {
    // Access methods via component organization
    this.deps.vscodeapis.showErrorMessage(msg);
    this.deps.dx.out(`Error: ${msg}`);
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
    const content = this.deps.tabinspector.getActiveTabContent();
    const lang = this.deps.tabinspector.getLanguageId();
    const tokens = await this.deps.stylize.getTokens(content, lang, 'github-light');
    
    this.deps.pdf.setTokensForPageRender(tokens, 'github-light');
    await this.deps.pdf.renderPage(0);
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
export type Id_t = typeof kId[keyof typeof kId];

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
- [ ] Implement `use()` method that:
  - Handles class name requests (e.g., `Diagnostics: []`, `dx: []`) - returns entire instance
  - Handles method name requests - uses methodMap to resolve to component
  - Returns Diagnostics immediately (always available, created at Registry construction)
  - Checks cache for existing instances
  - Creates instances lazily if not cached
  - Returns scoped object with only requested methods/instances, or entire instance if requested
- [ ] Add circular dependency detection

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
  dx: ['create', 'sub', 'out'],  // Not 'diagnostics' or 'Diagnostics'
  ui: ['showErrorMessage'],
  vscodeapis: ['getActiveTextEditor']
})
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
  
  constructor(private vscode: any, private context: any) {
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
          `Method '${method}' not found on component. Available methods: ${Object.getOwnPropertyNames(instance).filter(m => typeof instance[m] === 'function').join(', ')}`
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
    
    this.factories.set('vscodeapis', (registry) => {
      return new VSCodeAPIs(registry, this.vscode, this.context);
    });
    
    this.factories.set('ui', (registry) => {
      return new UI(registry);
    });
    
    this.factories.set('os', (registry) => {
      return OS.create(registry);
    });
    
    this.factories.set('pdf', (registry) => {
      return new PDF(registry);
    });
    
    this.factories.set('stylize', (registry) => {
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

### Per-Stage Rollback
- Each stage should be atomic and reversible
- Keep old code commented out during migration
- Use feature flags if needed

### Emergency Rollback
- Git branch for each stage
- Tag stable points
- Quick revert to previous stage if critical issues found

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
- **Mitigation**: Registry detects and reports circular dependencies
- **Mitigation**: Careful stage ordering (leaf components first)

### Risk: Breaking Changes
- **Mitigation**: Incremental migration with tests at each stage

### Risk: Performance Degradation
- **Mitigation**: Profile lazy loading overhead
- **Mitigation**: Cache instances aggressively

### Risk: Type Safety Loss
- **Mitigation**: Strong typing in Registry interfaces
- **Mitigation**: TypeScript strict mode enabled

## Success Criteria

1. ? No `app` parameter in component constructors
2. ? No `init()` methods required
3. ? Components constructed lazily on first use
4. ? Explicit dependency declarations in constructors
5. ? All tests passing
6. ? No performance regressions
7. ? Code is cleaner and more maintainable

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
