# Registry Pattern Migration Plan

## Overview

This document outlines a comprehensive migration plan to replace the current dependency injection pattern where every class receives a copy of `app` and accesses other classes via `this.app.componentName`, along with eliminating the requirement for `init()` routines.

## Goals

1. **Eliminate tight coupling**: Remove the need for classes to hold references to the entire `app` object
2. **Lazy initialization**: Construct components only when first used, not at startup
3. **Explicit dependencies**: Each class constructor explicitly declares what it needs via a Registry
4. **Remove init() methods**: Eliminate the need for separate initialization routines
5. **Type safety**: Maintain strong typing throughout the migration
6. **Minimal startup overhead**: Only construct App, Registry, and Diagnostics at startup (Diagnostics needed for debugging)

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

1. **Registry Class**: Central registry that manages lazy instantiation and dependency resolution
2. **Dependency Declaration**: Components declare needed dependencies in their constructors
3. **Lazy Construction**: Components are created on-demand when first requested (except Diagnostics, which is immediate)
4. **Scoped Access**: Registry returns objects containing only requested methods/instances
5. **No Init Required**: Construction handles all initialization
6. **Diagnostics Always Available**: Diagnostics is created immediately at App startup for debugging purposes

### Target Usage Pattern

```typescript
// Target pattern
class PDF {
  private dependencies: PDFDependencies;
  
  constructor(registry: Registry) {
    this.dependencies = registry.require({
      stylize: ['getTokens', 'getThemes'],
      ui: ['showErrorMessage', 'showInfoMessage'],
      coords: ['Coords'],
      dx: ['create']
    });
    
    this.dx = this.dependencies.dx.create('PDF');
    this.coords = new this.dependencies.coords(registry);
  }
  
  someMethod() {
    const tokens = this.dependencies.stylize.getTokens(...);
    this.dependencies.ui.showErrorMessage(...);
  }
}
```

## Migration Stages

### Stage 0: Preparation and Infrastructure

**Goal**: Set up Registry infrastructure without changing existing code

#### 0.1: Create Registry Class Skeleton
- [ ] Create `src/Registry.ts` with basic structure
- [ ] Define `DependencyRequest` type for dependency declarations
- [ ] Implement singleton pattern for Registry instance
- [ ] Add basic `require()` method that returns `any` initially

#### 0.2: Create Registry Integration Points
- [ ] Add `Registry` instance to App class (constructed in App constructor)
- [ ] Create Diagnostics instance immediately in App constructor (before Registry)
- [ ] Pass Diagnostics to Registry constructor so it's always available
- [ ] Create minimal Registry that wraps existing App pattern
- [ ] Ensure Registry can access existing App components during transition

#### 0.3: Add Type Definitions
- [ ] Create `src/types/Registry_t.ts` for Registry type definitions
- [ ] Define `DependencyRequest` interface
- [ ] Define `DependencyResponse` interfaces per component
- [ ] Export types for use in components

**Testing**: Registry can be instantiated and returns existing app components

---

### Stage 1: Create Registry Infrastructure

**Goal**: Build complete Registry implementation with lazy loading

#### 1.1: Implement Registry Core
- [ ] Store Diagnostics instance in Registry (created immediately, not lazy)
- [ ] Implement lazy instantiation cache in Registry
- [ ] Add component factory functions mapping (e.g., `VSCodeAPIs`, `UI`, `PDF`, etc.)
- [ ] Implement `require()` method that:
  - Returns Diagnostics immediately (no lazy loading)
  - Checks cache for existing instances
  - Creates instances lazily if not cached
  - Returns scoped object with only requested methods/instances
- [ ] Add circular dependency detection

#### 1.2: Implement Method Scoping
- [ ] Create proxy objects that expose only requested methods
- [ ] Ensure method binding preserves `this` context
- [ ] Add type-safe wrappers for each component's public API

#### 1.3: Update App Constructor
- [ ] Remove eager component construction from App constructor
- [ ] Create Diagnostics instance immediately (needed for debugging)
- [ ] Create Registry instance with Diagnostics passed in
- [ ] Register component factories with Registry
- [ ] Update App to use Registry for accessing components
- [ ] Keep Diagnostics accessible via `app.dx` for backward compatibility during migration

**Testing**: 
- Registry can lazy-load components
- Requested methods are accessible
- Unrequested methods are not accessible
- Components work correctly when accessed via Registry

---

### Stage 2: Migrate Leaf Components First

**Goal**: Migrate components with no dependencies or minimal dependencies

**Note**: Diagnostics is NOT migrated here - it's created immediately at App startup and always available via Registry

#### 2.1: Migrate OS Classes
- [ ] Update OS base class constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies via Registry:
  - `Diagnostics` (for logging)
  - `VSCodeAPIs` (for extension path - may need to access via old app pattern during transition)
- [ ] Move `init()` logic into constructor
- [ ] Update OS factory method to use Registry
- [ ] Update OSMac, OSWin, OSLinux constructors

#### 2.3: Migrate Yaml
- [ ] Update Yaml constructor to accept Registry
- [ ] Request `OS` dependency for file reading
- [ ] Request `Diagnostics` dependency (via Registry) for logging
- [ ] Remove `app` parameter
- [ ] Move initialization into constructor

**Testing**: All migrated components work correctly, no regressions

---

### Stage 3: Migrate Core Infrastructure Components

**Goal**: Migrate foundational components that others depend on

#### 3.1: Migrate VSCodeAPIs
- [ ] Update VSCodeAPIs constructor to accept Registry + vscode + context
- [ ] Remove `app` parameter
- [ ] Request Diagnostics via Registry
- [ ] Move `init()` logic (command registration) into constructor
- [ ] Update Registry factory for VSCodeAPIs
- [ ] Update App to construct VSCodeAPIs via Registry

#### 3.2: Migrate UI
- [ ] Update UI constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies: `Diagnostics`, `OS` (for file reading), `Persist`
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory for UI
- [ ] Update all references to `app.ui` to use Registry

#### 3.3: Migrate Persist
- [ ] Update Persist constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request `VSCodeAPIs` for global state access
- [ ] Move initialization into constructor

**Testing**: Core infrastructure components work correctly

---

### Stage 4: Migrate Middle-Tier Components

**Goal**: Migrate components with moderate dependencies

#### 4.1: Migrate TabInspector
- [ ] Update TabInspector constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies: `VSCodeAPIs`, `Diagnostics`
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory
- [ ] Update all `app.tabinspector` references

#### 4.2: Migrate Stylize
- [ ] Update Stylize constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies: `Diagnostics` (for logging)
- [ ] Move async `init()` logic into constructor (may need lazy initialization pattern)
- [ ] Update Registry factory
- [ ] Update all `app.stylize` references

#### 4.3: Migrate UIMenuMgr
- [ ] Update UIMenuMgr constructor to accept Registry
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
- [ ] Update Coords constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies: `PDF` (for docInfo), `Diagnostics`
- [ ] Move `init()` logic into constructor
- [ ] Update all Coords instantiations

#### 5.2: Migrate PDF
- [ ] Update PDF constructor to accept Registry
- [ ] Remove `app` parameter
- [ ] Request dependencies:
  - `Stylize` (for getTokens)
  - `UI` (for error messages)
  - `OS` (for file operations)
  - `Diagnostics`
  - `Coords` (class reference)
- [ ] Update DocInfo_PDF constructor to accept Registry
- [ ] Move `init()` logic into constructor
- [ ] Update Registry factory
- [ ] Update all `app.pdf` references

#### 5.3: Migrate DocInfo Classes
- [ ] Update DocInfo_PDF constructor to accept Registry
- [ ] Update DocInfo_PaperPrinter constructor to accept Registry
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
- [ ] Update UIScrollView constructor to accept Registry
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
- [ ] Keep only `Registry` and `Diagnostics` in App (Diagnostics created immediately)
- [ ] Update App to use Registry for component access
- [ ] Keep `app.dx` property for backward compatibility if needed, or remove if all access via Registry

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
- [ ] Ensure Registry `require()` returns properly typed objects
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

## Registry Implementation Details

### Registry Class Structure

```typescript
type DependencyRequest = {
  [componentName: string]: string[] | string; // Methods or 'ClassName' for class references
};

class Registry {
  private instances: Map<string, any> = new Map();
  private factories: Map<string, (registry: Registry) => any> = new Map();
  private diagnostics: Diagnostics; // Created immediately, not lazy
  
  constructor(
    private diagnostics: Diagnostics, // Created at App startup
    private vscode: any, 
    private context: any
  ) {
    // Store Diagnostics immediately (not lazy)
    this.instances.set('dx', diagnostics);
    this.registerFactories();
  }
  
  require<T>(request: DependencyRequest): T {
    // Implementation:
    // 1. Handle Diagnostics specially (always available immediately)
    // 2. For each other requested component:
    //    - Check cache, create if needed
    //    - Return scoped object with only requested methods
  }
  
  private registerFactories(): void {
    // Register factory functions for each component (except Diagnostics)
  }
}
```

### Component Factory Pattern

```typescript
// In Registry.registerFactories()
this.factories.set('vscodeapis', (registry) => {
  return new VSCodeAPIs(registry, this.vscode, this.context);
});

this.factories.set('ui', (registry) => {
  return new UI(registry);
});
```

### Method Scoping Pattern

```typescript
private createScopedAccess(instance: any, requestedMethods: string[]): any {
  const scoped: any = {};
  for (const method of requestedMethods) {
    scoped[method] = instance[method].bind(instance);
  }
  return scoped;
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
- **Mitigation**: Keep old pattern working during transition

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

### Diagnostics Immediate Availability

Diagnostics is the only component that is **not** lazy-loaded. It must be created immediately at App startup because:

1. **Debugging needs**: Components need Diagnostics for logging during their own construction
2. **Early error reporting**: If Registry or other components fail during construction, Diagnostics should be available to report the error
3. **Dependency chain**: Nearly all components depend on Diagnostics for logging, so it's a foundational dependency

**Implementation approach**:
- Diagnostics is created in App constructor before Registry
- Diagnostics is passed to Registry constructor
- Registry stores Diagnostics instance immediately (not in lazy cache)
- Registry's `require()` method returns Diagnostics immediately when requested
- All components request Diagnostics via Registry: `registry.require({ dx: ['create', 'sub', 'out'] })`

## Notes

- Migration can be done incrementally without breaking existing functionality
- Each stage should be tested thoroughly before proceeding
- Consider pair programming for complex stages
- Regular code reviews during migration
- Keep migration branch synced with main branch
