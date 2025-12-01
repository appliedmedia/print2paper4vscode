# Registry Pattern Migration Plan

**Status**: Stage 0.1-0.3 Complete | Stage 1 Complete | Stage 2 Complete | Stage 3+ Pending

**Quick Status**: Registry infrastructure and core functionality complete and tested. Stage 2 (OS Classes and Yaml Factory) migration complete. All tests pass. Next: Migrate Core Infrastructure (Stage 3).

---

## ⚠️ /!\ CRITICAL: READ THIS FIRST /!\ ⚠️

**This document has been meticulously detailed over many hours of careful design and architectural decisions.**

**DO NOT deviate from this plan. DO NOT "improve" or "simplify" things. DO NOT add types, patterns, or abstractions not explicitly specified here.**

**If you think you must do something different from what's written:**

1. **STOP**
2. **Ask the user first**
3. **Explain why you think a deviation is necessary**

**Following existing patterns means following THIS document's patterns, not inventing new ones.**

---

## 📊 CURRENT STATUS

### ✅ Completed

- **Stage 0.1: Registry Infrastructure** - Complete
  - Created `src/types/Registry_t.ts` with `FnImport_t` type
  - Created `src/Registry.ts` with Registry class
  - Added `static readonly id` to all main components (Diagnostics, VSCodeAPIs, UI, PDF, Stylize, TabInspector, UIMenuMgr, OS)
  - Registry has `use()` method that resolves methods via prototype lookup

- **Stage 0.2: Registry Integration** - Complete
  - Updated `App.ts` to create Registry instance
  - Registry owns `use()` method (components call `app.reg.use()` directly)
  - Verified compilation succeeds
  - All 319 existing tests pass (319 existing + 11 new Registry tests = 330 total)

- **Stage 0.3: Test Infrastructure** - Complete
  - ✅ All existing tests pass (no regressions)
  - ✅ Basic Registry construction test added
  - ✅ Diagnostics availability via Registry verified
  - ✅ 11 Registry tests covering: construction, Diagnostics access, method resolution, instance registration, always-injected methods

### 🎯 What's Next

#### Next: Stage 2 - Begin Component Migration

- Start with leaf components (OS classes, Yaml)
- Migrate core infrastructure (VSCodeAPIs, UI, Persist)
- Continue through middle-tier and complex components

---

## ⚡ EXECUTION TODOS

**THE SIMPLE APPROACH:**

1. Components only need: `static readonly id = 'componentname'`
2. Registry builds `this.pdf = {}`, `this.ui = {}` etc. (empty placeholders for intellisense)
3. When `use()` is called with method names, Registry uses `Component.prototype.hasOwnProperty(method)` to find which component owns it
4. Registry creates/caches instance and returns bound method
5. **The prototype IS the source of truth** - no arrays to maintain!

### Immediate Actions (Start Here)

#### Stage 0.1: Create Registry Infrastructure ✅ DONE

- ✅ Create `src/types/Registry_t.ts` with ONLY this type:
  - `FnImport_t = { [componentId: string]: { [methodName: string]: Function } }` - what a class imports
  - **That's it!** No other types needed
  - **DO NOT** create: Use_t, FnExport_t, ComponentInstance_t, ComponentFactory_t, etc.
  - **Pattern rule**: Only create types that are actually used
  - See Stage 7.4 for complete pattern rules and cleanup TODOs
- ✅ Create `src/Registry.ts`:
  - `static readonly id = 'reg'` - Registry's component id
  - `[key: string]: unknown` - index signature for dynamic component lookups (this.pdf, this.ui, etc)
  - `private _instances: Map<string, unknown>` - cache for lazy-loaded singleton instances
  - `private components: Array<{ new(...args: any[]): any; id: string }>` - component class references (made flexible for different constructors)
  - `private always: string[]` - methods always injected (format: 'componentId.methodName', e.g., 'dx.sub')
  - `private dx: Diagnostics` - Registry's diagnostics instance
  - `private app: App` - app reference
- ✅ Registry constructor signature: `constructor(args: { app: App; components?: Array<...>; always?: string[] })`
  - Assign fields: `this.app = args.app`, `this.components = args.components || []`, `this.always = args.always || []`
  - Create diagnostics: `this.dx = new Diagnostics({ name: 'Registry', ... })` (Registry creates its own Diagnostics)
  - Initialize instances cache: `this._instances = new Map()`, `this._instances.set('dx', this.dx)`
  - Build placeholder structure on `this`:
    - For each component: `this[Component.id] = {}` - just empty placeholders!
  - Result: `app.reg.pdf`, `app.reg.ui` etc. exist (values don't matter, just used for intellisense)
- ✅ Add `use(...methodIds: string[]): FnImport_t` method - THE SIMPLE VERSION:
  - Merge: `const allMethods = [...methodIds, ...this.always]`
  - For each method name (e.g., 'showError', 'generatePdf'):
    - Find which component class has that method: `Component.prototype.hasOwnProperty(methodName)`
    - Get or create instance: `this._instances.get(componentId) || new Component(this.app)` (placeholder for now - components still created by App)
    - Return bound method: `instance[methodName].bind(instance)`
  - That's it! No complex parsing, prototype IS the source of truth
- ✅ Add `static readonly id` properties to components: Diagnostics ('dx'), VSCodeAPIs ('vscodeapis'), UI ('ui'), PDF ('pdf'), PaperPrinter ('paperprinter'), Stylize ('stylize'), TabInspector ('tabinspector'), UIMenuMgr ('uimenumgr'), OS ('os')

#### Stage 0.2: Integrate Registry into App ✅ DONE

- ✅ Update `App.ts` to create Registry instance:
  - Import Registry: `import { Registry } from './Registry'`
  - Create Registry: `this.reg = new Registry({ app: this, components: [Diagnostics, VSCodeAPIs, UI, PDF, Stylize, TabInspector, UIMenuMgr], always: ['dx.sub'] })`
  - App owns the list of what components exist (all component classes registered)
  - Note: `always: ['dx.sub']` means all components can call `this.fn.dx.sub('ComponentName')` without requesting it
  - Registry owns the `use()` method - components call `app.reg.use(...methodIds)` directly
  - Register existing component instances via `this.reg.registerInstance()`
- ✅ Verify Registry can be instantiated without breaking existing code (compiles successfully, components still created the old way)

#### Stage 0.3: Test Infrastructure ✅ DONE

- ✅ Run existing tests to ensure no regressions (all 330 tests pass, including Registry tests)
- ✅ Add basic Registry construction test
- ✅ Verify Diagnostics is available via Registry

**Status**: All tests passing. Registry tests verify construction, Diagnostics availability, method resolution, and instance registration.

---

### Stage 1: Implement Registry Core ✅ DONE

- [x] Import all component classes at Registry startup
- [x] Read `Class.id` from each component (components have `static readonly id`)
- [x] ~~Build `kId` hierarchically~~ - NOT NEEDED (using prototype lookup approach per "THE SIMPLE APPROACH")
- [x] Implement lazy instantiation cache for singleton services
- [x] ~~Implement component factories~~ - NOT NEEDED YET (components created by App and registered via `registerInstance()`)
- [x] **Registry calls constructor only - NO init() calls** (components self-initialize) - VERIFIED
- [x] Implement `use(...methodIds: string[]): FnImport_t` with:
  - Variadic parameter syntax (no array brackets needed)
  - Always-available methods: `dx.sub` for all components (via `always` array)
  - Method resolution via prototype lookup (`Component.prototype.hasOwnProperty()`)
- [x] Add circular dependency detection (construction stack tracking)
- [x] Add error handling with circuit breaker pattern (failed components tracked in Set)
- [x] Test Registry lazy loading works correctly (all 11 Registry tests pass)

---

### Stage 2: Migrate Leaf Components ✅

#### 2.1 Migrate OS Classes ✅

- [x] Add to OS base class:
  - `static readonly id = 'os'` - that's it! No fn array needed!
- [x] Add instance property: `protected fn: FnImport_t` (protected so subclasses can access)
- [x] Update OS constructor: `this.fn = app.reg.use('vscodeapis.getExtensionPath', 'vscodeapis.getPanelForUriConversion', 'vscodeapis.uriFromPath')` (dx.sub always available from `always` array)
- [x] Move any `init()` logic into constructor (getExtensionPath moved to constructor)
- [x] Remove `init()` method entirely
- [x] Update OSMac, OSWin, OSLinux (removed static id from subclasses - only base OS class needs it, subclasses use `this.fn.dx.sub()`)
- [x] Keep `done()` method for explicit cleanup
- [x] Test OS classes work correctly (compilation successful, all 330 tests pass)
- [x] **Note**: Fixed registration order in App.ts - VSCodeAPIs must be registered before OS creation since OS constructor calls `app.reg.use('vscodeapis.getExtensionPath')`

#### 2.2 Convert Yaml to Factory Pattern ✅

- [x] Update `src/Yaml.ts`:
  - Add `static readonly id = 'yaml'` - that's all!
  - Add `static create<T>(app: App, filePath: string, dataStruct: T): Yaml<T>` - public static method
  - Make constructor private
  - Move any `init()` logic into constructor (currently empty)
  - Remove `init()` method entirely
  - Keep `done()` method for cache cleanup
  - Registry will find `create` via `Yaml.hasOwnProperty('create')`
- [x] Update `src/PaperPrinter.ts` line 107:
  - Changed: `this._yaml = new Yaml({ app, filePath: 'src/PaperPrinter.yaml', dataStruct: PaperPrinter.kYaml })`
  - To: `this._yaml = Yaml.create(app, 'src/PaperPrinter.yaml', PaperPrinter.kYaml)`
- [x] Update `src/UIWebView.ts` line 52:
  - Changed: `this._yaml = new Yaml({ app, filePath: 'src/UIWebView.yaml', dataStruct: UIWebView.kYaml })`
  - To: `this._yaml = Yaml.create(app, 'src/UIWebView.yaml', UIWebView.kYaml)`
- [x] Update `src/UIMenu.ts` line 238:
  - Changed: `this._yaml = new Yaml({ app, filePath: 'src/UIMenu.yaml', dataStruct: UIMenu.kYaml })`
  - To: `this._yaml = Yaml.create(app, 'src/UIMenu.yaml', UIMenu.kYaml)`
- [x] Update `src/UI.ts` line 67:
  - Changed: `this._yaml = new Yaml({ app, filePath: 'src/UI.yaml', dataStruct: UI.kYaml })`
  - To: `this._yaml = Yaml.create(app, 'src/UI.yaml', UI.kYaml)`
- [x] Update `src/PDF.ts` line 64:
  - Changed: `this._yaml = new Yaml({ app, filePath: 'src/PDF.yaml', dataStruct: PDF.kYaml })`
  - To: `this._yaml = Yaml.create(app, 'src/PDF.yaml', PDF.kYaml)`
- [x] Test Yaml factory works correctly (5 files updated, tests updated, compilation successful, all 330 tests pass)

---

### Stage 3: Migrate Core Infrastructure ⏸️

#### 3.1 Migrate VSCodeAPIs

- [ ] Add `static readonly id = 'vscodeapis'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] Request Diagnostics via Registry
- [ ] Move command registration from `init()` to constructor
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for explicit cleanup
- [ ] Test command registration works

#### 3.2 Migrate Persist (Factory Pattern)

- [ ] Update `src/Persist.ts`:
  - Add `static readonly id = 'persist'` - that's it!
  - Add `static create(app: App): Persist` - public static method
  - Make constructor private
  - Update constructor to use `app.use()` for VSCodeAPIs methods
  - Move any `init()` logic into constructor (currently empty)
  - Remove `init()` method entirely
  - Keep `done()` method for explicit cleanup
- [ ] Update `src/UIMenu.ts` line 209:
  - Change: `this.persist = new Persist(app) as Persist & Persist_t`
  - To: `this.persist = this.fn.persist.create(app) as Persist & Persist_t`
- [ ] Update `src/UI.ts` line 69:
  - Change: `this.persist = new Persist(app) as Persist & Persist_t`
  - To: `this.persist = this.fn.persist.create(app) as Persist & Persist_t`
- [ ] Test persistence works (2 files updated)

#### 3.3 Migrate UI

- [ ] Add `static readonly id = 'ui'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: Diagnostics, OS, Persist methods
- [ ] Move any `init()` logic into constructor (currently empty)
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for explicit cleanup
- [ ] Test UI operations work

---

### Stage 4: Migrate Middle-Tier Components ⏸️

#### 4.1 Migrate TabInspector

- [ ] Add `static readonly id = 'tabinspector'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: VSCodeAPIs, Diagnostics
- [ ] Move any `init()` logic into constructor (currently empty)
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for explicit cleanup
- [ ] Test tab inspection works

#### 4.2 Migrate Stylize

- [ ] Add `static readonly id = 'stylize'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] Request Diagnostics via Registry
- [ ] Handle async initialization with lazy pattern in constructor
- [ ] Move any `init()` logic into constructor
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for explicit cleanup
- [ ] Test syntax highlighting works

#### 4.3 Migrate UIMenuMgr

- [ ] Add `static readonly id = 'uimenumgr'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: UI, VSCodeAPIs, Diagnostics
- [ ] Move any `init()` logic into constructor (currently empty)
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for cleanup (clears menus array)
- [ ] Test menu management works

---

### Stage 5: Migrate Complex Components ⏸️

#### 5.1 Convert Coords to Singleton

- [ ] Add to Coords class:
  - `static readonly id = 'coords'` - that's it!
- [ ] Add instance property: `private fn: FnImport_t`
- [ ] Update constructor: `this.fn = app.use()` (only needs dx, always available)
- [ ] Move `init()` logging into constructor
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for explicit cleanup
- [ ] Registry manages as singleton - eliminate per-class instances
- [ ] Update PDF and DocInfo_PDF to use: `this.fn.coords.pdfPtsToCssPx()`
- [ ] Test coordinate calculations work

#### 5.2 Migrate PDF

- [ ] Add `static readonly id = 'pdf'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] Request dependencies: Stylize, UI, OS, Diagnostics methods
- [ ] Update Coords instantiation in constructor
- [ ] Move `init()` logic (tempPdfs = [], coords.init()) to constructor
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for temp file cleanup
- [ ] Test PDF generation works

#### 5.3 Convert DocInfo Classes to Factory Pattern

- [ ] Add to DocInfo_PDF:
  - `static readonly id = 'docinfo_pdf'` - that's it!
  - `static create(app: App): DocInfo_PDF`
  - Make constructor private
- [ ] Add to DocInfo_PaperPrinter:
  - `static readonly id = 'docinfo_paperprinter'` - that's it!
  - `static create(app: App): DocInfo_PaperPrinter`
  - Make constructor private
- [ ] Update usage: `this.docInfo = this.fn.docinfo_pdf.create(app)`
- [ ] Test DocInfo classes work

---

### Stage 6: Migrate Orchestration Components ⏸️

#### 6.1 Convert UIWebView to Singleton

- [ ] Add to UIWebView class:
  - `static readonly id = 'uiwebview'` - that's it!
- [ ] Add instance property: `private fn: FnImport_t`
- [ ] Update constructor to use `app.use([...])`
- [ ] Move `registerMessageHandlers()` call from `init()` to constructor
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for unregistering message handlers
- [ ] Registry manages as singleton
- [ ] Update PaperPrinter to use: `await this.fn.uiwebview.displayPdfPanel()`
- [ ] Test webview display works

#### 6.2 Migrate PaperPrinter

- [ ] Add `static readonly id = 'paperprinter'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] Request all dependencies via Registry
- [ ] Update DocInfo_PaperPrinter instantiation
- [ ] Move any `init()` logic into constructor (currently empty)
- [ ] Remove `init()` method entirely
- [ ] Keep `done()` method for explicit cleanup
- [ ] Test complete print workflow

---

### Stage 7: Cleanup and Finalization ⏸️

#### 7.1 Remove App Component Properties

- [ ] Remove `vscodeapis`, `ui`, `pdf`, etc. from App class
- [ ] Remove `componentOrder` array
- [ ] Keep only Registry property
- [ ] Update App to access components via Registry

#### 7.2 Remove Init Infrastructure, Keep Done

- [ ] Verify all `init()` methods removed from all components
- [ ] Remove `init()` method from App class
- [ ] Remove `componentOrder` array (no longer needed for init sequence)
- [ ] Remove `app.init()` call from `-entrypoint.ts`
- [ ] Keep all `done()` methods for explicit cleanup
- [ ] Keep `app.done()` in deactivate() for explicit cleanup
- [ ] Verify `done()` methods still work correctly

#### 7.3 Update Type Definitions

- [ ] Remove `App` type from component imports where possible
- [ ] Update all type imports
- [ ] Ensure Registry types properly exported

#### 7.4 Clean Up Unused Types and Naming

- [ ] **Pattern Rule**: Only create types that are actually used in type annotations, unions, or function signatures
  - Don't create types "just because" a constant exists
  - Use inline types and `unknown` for one-off cases
  - Follow pattern: `const kSomething` first, then `type SomethingId_t = typeof kSomething` only if needed
- [ ] Remove unused `ExtensionId_t` from `src/_entrypoint_extId_t.ts`
  - Type is never used anywhere in codebase
  - `kExtId` constant is sufficient (TypeScript infers type from `as const`)
  - **If needed later**: Should be `ExtId_t` (not `ExtensionId_t`) following naming pattern
- [ ] Remove unnecessary `WEBVIEW_ID` constant from `src/VSCodeAPIs.ts`:
  - Delete line 45: `private static readonly WEBVIEW_ID = kExtId + '.printprep';`
  - Update line 242: Change `VSCodeAPIs.WEBVIEW_ID,` to `` `${kExtId}.printprep`, ``
  - Rationale: Constant is only used once, no need for class-level definition. Inline it.
- [ ] Audit all `*_t.ts` files for other unused types
- [ ] Document type creation rules in AGENTS.md

#### 7.5 Final Testing

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

## 📋 COMPONENT DEPENDENCY MAP (REQUIRED READING)

**This section lists exactly what each component needs to request in `app.reg.use()` and shows actual code samples.**

**Format:** `ComponentName needs: ['method1', 'method2']` means that component must call:

```typescript
this.fn = app.reg.use('method1', 'method2');
```

**CRITICAL NOTES:**

1. **Property access** (e.g., `pdf.docInfo`) means the component needs access to the entire instance, not just a method. For now, list it as a method request - we'll handle this case specially.
2. **Factory methods** (e.g., `yaml.create`, `persist.create`) are static methods on the class.
3. **Methods from `always` array** (e.g., `'dx.sub'`) don't need to be requested - automatically available as `this.fn.dx.sub`.
4. Components use: `this.dx = this.fn.dx.sub('ComponentName')` (or `app.dx.sub()` during migration)
5. When implementing, translate `app.reg.component.method` to the format `'componentId.methodName'` for use() calls.

### Core Infrastructure

**VSCodeAPIs** needs:

- `os.dateAsYYYYMMDDHHMMSS`
- `os.htmlSrcPathToURI`
- `os.getExtensionRoot`
- `os.pathJoin`
- `os.fileRead`
- `os.pathBasename`
- `paperprinter.handlePrintCommandFromVSCode` (for command registration)
- `ui.handleWebviewMessage` (for message routing)
- `persist.clear` (for command registration)

**Code Sample:**

```typescript
export class VSCodeAPIs {
  static readonly id = 'vscodeapis';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(args: { app: App; vscode: typeof import('vscode'); context: ExtensionContext }) {
    const { app, vscode, context } = args;
    
    // Request dependencies via Registry
    this.fn = app.reg.use(
      'os.dateAsYYYYMMDDHHMMSS',
      'os.htmlSrcPathToURI',
      'os.getExtensionRoot',
      'os.pathJoin',
      'os.fileRead',
      'os.pathBasename',
      'paperprinter.handlePrintCommandFromVSCode',
      'ui.handleWebviewMessage',
      'persist.clear'
    );
    
    // dx.sub is always available (from always: ['dx.sub'])
    this.dx = this.fn.dx.sub('VSCodeAPIs');
    
    this.vscode = vscode;
    this.context = context;
  }
}
```

**Persist** needs:

- `vscodeapis.getGlobalState`
- `vscodeapis.updateGlobalState`
- `ui.showInfoMessage`

**Code Sample:**

```typescript
export class Persist {
  static readonly id = 'persist';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(app: App) {
    this.fn = app.reg.use(
      'vscodeapis.getGlobalState',
      'vscodeapis.updateGlobalState',
      'ui.showInfoMessage'
    );
    
    this.dx = this.fn.dx.sub('Persist');
  }
  
  static create(app: App): Persist {
    return new Persist(app);
  }
}
```

**UI** needs:

- `vscodeapis.showInformationMessage`
- `vscodeapis.showErrorMessage`
- `vscodeapis.showWarningMessage`
- `vscodeapis.showSaveDialog`
- `vscodeapis.uriFromPath`
- `vscodeapis.uriToPath`
- `uimenumgr.getUIMenus_HTML`
- `uimenumgr.getUIMenus_CSS`
- `uimenumgr.getUIMenus_JS`
- `yaml.create` (factory)
- `persist.create` (factory)

**Code Sample:**

```typescript
export class UI {
  static readonly id = 'ui';
  private fn: FnImport_t;
  private dx: Diagnostics;
  private _yaml: Yaml<typeof UI.kYaml>;
  public persist: Persist & Persist_t;

  constructor(app: App) {
    this.fn = app.reg.use(
      'vscodeapis.showInformationMessage',
      'vscodeapis.showErrorMessage',
      'vscodeapis.showWarningMessage',
      'vscodeapis.showSaveDialog',
      'vscodeapis.uriFromPath',
      'vscodeapis.uriToPath',
      'uimenumgr.getUIMenus_HTML',
      'uimenumgr.getUIMenus_CSS',
      'uimenumgr.getUIMenus_JS',
      'yaml.create',
      'persist.create'
    );
    
    this.dx = this.fn.dx.sub('UI');
    
    // Create per-instance Yaml and Persist via factories
    this._yaml = this.fn.yaml.create(app, 'src/UI.yaml', UI.kYaml);
    this.persist = this.fn.persist.create(app) as Persist & Persist_t;
    this.persist.register('toolbar_pos');
  }
}
```

**OS** (base class) needs:

- `vscodeapis.getPanelForUriConversion`

**Code Sample:**

```typescript
export abstract class OS {
  static readonly id = 'os';
  protected fn: FnImport_t;
  protected dx: Diagnostics;

  constructor(app: App) {
    this.fn = app.reg.use('vscodeapis.getPanelForUriConversion');
    this.dx = this.fn.dx.sub('OS');
  }
}
```

### Middle-Tier Components

**TabInspector** needs:

- `vscodeapis.getActiveTextEditor`
- `vscodeapis.getSelectionOrDocumentText`
- `vscodeapis.getDescriptiveName`

**Code Sample:**

```typescript
export class TabInspector {
  static readonly id = 'tabinspector';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(app: App) {
    this.fn = app.reg.use(
      'vscodeapis.getActiveTextEditor',
      'vscodeapis.getSelectionOrDocumentText',
      'vscodeapis.getDescriptiveName'
    );
    
    this.dx = this.fn.dx.sub('TabInspector');
  }
}
```

**Stylize** needs:

- `vscodeapis.getVSCodeExtensionsThemes`
- `vscodeapis.getVSCodeThemeJson`
- `vscodeapis.getActiveThemeId`
- `vscodeapis.getEditorTypography`
- `os.pathJoin`
- `os.fileRead`
- `pdf.docInfo` (property access)
- `pdf.renderTokenizedLine`

**Code Sample:**

```typescript
export class Stylize {
  static readonly id = 'stylize';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(app: App) {
    this.fn = app.reg.use(
      'vscodeapis.getVSCodeExtensionsThemes',
      'vscodeapis.getVSCodeThemeJson',
      'vscodeapis.getActiveThemeId',
      'vscodeapis.getEditorTypography',
      'os.pathJoin',
      'os.fileRead',
      'pdf.docInfo',  // Property access - accessed directly via this.app.pdf.docInfo during migration; Registry property access will be implemented in Stage 2+
      'pdf.renderTokenizedLine'
    );
    
    this.dx = this.fn.dx.sub('Stylize');
  }
}
```

**UIMenuMgr** needs:

- `stylize.getThemes`
- `pdf.docInfo` (property access)
- `os.dictReplace`

**Code Sample:**

```typescript
export class UIMenuMgr {
  static readonly id = 'uimenumgr';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(app: App) {
    this.fn = app.reg.use(
      'stylize.getThemes',
      'pdf.docInfo',  // Property access - accessed directly via this.app.pdf.docInfo during migration; Registry property access will be implemented in Stage 2+
      'os.dictReplace'
    );
    
    this.dx = this.fn.dx.sub('UIMenuMgr');
  }
}
```

### Complex Components

**Coords** needs:

- (no dependencies - pure calculation)

**Code Sample:**

```typescript
export class Coords {
  static readonly id = 'coords';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(app: App) {
    // Only needs dx.sub, which is always available
    this.fn = app.reg.use();  // Empty - only always-injected methods needed
    this.dx = this.fn.dx.sub('Coords');
  }
}
```

**PDF** needs:

- `os.dateAsYYYYMMDDHHMMSS`
- `os.sanitizeFileName`
- `os.fileDelete`
- `os.ensureDir`
- `os.pathJoin`
- `os.fileWrite`
- `os.fileOpenPrintDialog`
- `os.filePrint`
- `os.pathDirname`
- `os.fileReveal`
- `vscodeapis.getDir_Temp`
- `ui.showErrorMessage`
- `ui.chooseSaveLocation`
- `stylize.tokenize`
- `uimenumgr.getMenuItemIdSelected`
- `paperprinter.docInfo` (property access)
- `coords.pdfPtsToCssPx` (or call directly if singleton)
- `yaml.create` (factory)

**Code Sample:**

```typescript
export class PDF {
  static readonly id = 'pdf';
  private fn: FnImport_t;
  private dx: Diagnostics;
  private _yaml: Yaml<typeof PDF.kYaml>;

  constructor(app: App) {
    this.fn = app.reg.use(
      'os.dateAsYYYYMMDDHHMMSS',
      'os.sanitizeFileName',
      'os.fileDelete',
      'os.ensureDir',
      'os.pathJoin',
      'os.fileWrite',
      'os.fileOpenPrintDialog',
      'os.filePrint',
      'os.pathDirname',
      'os.fileReveal',
      'vscodeapis.getDir_Temp',
      'ui.showErrorMessage',
      'ui.chooseSaveLocation',
      'stylize.tokenize',
      'uimenumgr.getMenuItemIdSelected',
      'paperprinter.docInfo',  // Property access
      'coords.pdfPtsToCssPx',
      'yaml.create'
    );
    
    this.dx = this.fn.dx.sub('PDF');
    this._yaml = this.fn.yaml.create(app, 'src/PDF.yaml', PDF.kYaml);
  }
}
```

**UIWebView** needs:

- `pdf.docInfo` (property access)
- `ui.addToolbar`
- `ui.registerMessageHandler`
- `ui.unregisterMessageHandler`
- `ui.persist` (property access)
- `vscodeapis.getOrCreateWebviewPanel`
- `vscodeapis.removePanel`
- `os.fileRead`
- `uimenumgr.getMenuItemIdSelected`
- `uimenumgr.getValueForMenuItemId`
- `uimenumgr.handleMenuItemSelected`
- `yaml.create` (factory)

**Code Sample:**

```typescript
export class UIWebView {
  static readonly id = 'uiwebview';
  private fn: FnImport_t;
  private dx: Diagnostics;
  private _yaml: Yaml<typeof UIWebView.kYaml>;

  constructor(app: App) {
    this.fn = app.reg.use(
      'pdf.docInfo',  // Property access
      'ui.addToolbar',
      'ui.registerMessageHandler',
      'ui.unregisterMessageHandler',
      'ui.persist',  // Property access
      'vscodeapis.getOrCreateWebviewPanel',
      'vscodeapis.removePanel',
      'os.fileRead',
      'uimenumgr.getMenuItemIdSelected',
      'uimenumgr.getValueForMenuItemId',
      'uimenumgr.handleMenuItemSelected',
      'yaml.create'
    );
    
    this.dx = this.fn.dx.sub('UIWebView');
    this._yaml = this.fn.yaml.create(app, 'src/UIWebView.yaml', UIWebView.kYaml);
  }
}
```

### Orchestration Components

**PaperPrinter** needs:

- (everything - it's the orchestrator)
- `vscodeapis.getActiveTextEditor`
- `vscodeapis.getEditorTypography`
- `tabinspector.detectActiveTabCategory`
- `tabinspector.getEditorSelectionOrAll`
- `uimenumgr.getMenuItemIdSelected`
- `uimenumgr.setValueForPersistIdOnMenuId`
- `uimenumgr.getValueForMenuItemId`
- `uimenumgr.getValueForMenuItemIdSelected`
- `uimenumgr.createMenu`
- `uimenumgr.addMenu`
- `uimenumgr.getUIMenus`
- `pdf.docInfo` (property access)
- `pdf.generatePdf`
- `pdf.printWithPreview`
- `pdf.printDirectly`
- `pdf.saveAsPDF`
- `pdf.resetCaches`
- `stylize.getThemes`
- `os.dictReplace`
- `os.getLocale`
- `yaml.create` (factory)

**Code Sample:**

```typescript
export class PaperPrinter {
  static readonly id = 'paperprinter';
  private fn: FnImport_t;
  private dx: Diagnostics;
  private _yaml: Yaml<typeof PaperPrinter.kYaml>;

  constructor(app: App) {
    this.fn = app.reg.use(
      'vscodeapis.getActiveTextEditor',
      'vscodeapis.getEditorTypography',
      'tabinspector.detectActiveTabCategory',
      'tabinspector.getEditorSelectionOrAll',
      'uimenumgr.getMenuItemIdSelected',
      'uimenumgr.setValueForPersistIdOnMenuId',
      'uimenumgr.getValueForMenuItemId',
      'uimenumgr.getValueForMenuItemIdSelected',
      'uimenumgr.createMenu',
      'uimenumgr.addMenu',
      'uimenumgr.getUIMenus',
      'pdf.docInfo',  // Property access
      'pdf.generatePdf',
      'pdf.printWithPreview',
      'pdf.printDirectly',
      'pdf.saveAsPDF',
      'pdf.resetCaches',
      'stylize.getThemes',
      'os.dictReplace',
      'os.getLocale',
      'yaml.create'
    );
    
    this.dx = this.fn.dx.sub('PaperPrinter');
    this._yaml = this.fn.yaml.create(app, 'src/PaperPrinter.yaml', PaperPrinter.kYaml);
  }
}
```

### Data Container Classes

**DocInfo_PDF** needs:

- `coords.pdfPtsToCssPx` (if needed - check actual usage)

**Code Sample:**

```typescript
export class DocInfo_PDF {
  static readonly id = 'docinfo_pdf';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(app: App) {
    this.fn = app.reg.use('coords.pdfPtsToCssPx');
    this.dx = this.fn.dx.sub('DocInfo_PDF');
  }
  
  static create(app: App): DocInfo_PDF {
    return new DocInfo_PDF(app);
  }
}
```

**DocInfo_PaperPrinter** needs:

- (no dependencies - pure data)

**Code Sample:**

```typescript
export class DocInfo_PaperPrinter {
  static readonly id = 'docinfo_paperprinter';
  private fn: FnImport_t;
  private dx: Diagnostics;

  constructor(app: App) {
    this.fn = app.reg.use();  // Empty - only always-injected methods needed
    this.dx = this.fn.dx.sub('DocInfo_PaperPrinter');
  }
  
  static create(app: App): DocInfo_PaperPrinter {
    return new DocInfo_PaperPrinter(app);
  }
}
```

**UIMenu** needs:

- `persist.create` (factory)
- `yaml.create` (factory)

**Code Sample:**

```typescript
export class UIMenu {
  static readonly id = 'uimenu';
  private fn: FnImport_t;
  private dx: Diagnostics;
  private _yaml: Yaml<typeof UIMenu.kYaml>;
  private persist: Persist & Persist_t;

  constructor(app: App, id: string, displayName: string, ...) {
    this.fn = app.reg.use('persist.create', 'yaml.create');
    this.dx = this.fn.dx.sub('UIMenu');
    
    this._yaml = this.fn.yaml.create(app, 'src/UIMenu.yaml', UIMenu.kYaml);
    this.persist = this.fn.persist.create(app) as Persist & Persist_t;
  }
}
```

**Yaml** needs:

- (no dependencies)

**Code Sample:**

```typescript
export class Yaml<T extends Record<string, string>> {
  static readonly id = 'yaml';
  private fn: FnImport_t;
  private dx: Diagnostics;

  private constructor(app: App, filePath: string, dataStruct: T) {
    this.fn = app.reg.use();  // Empty - only always-injected methods needed
    this.dx = this.fn.dx.sub('Yaml');
    // ... initialization
  }
  
  static create<T>(app: App, filePath: string, dataStruct: T): Yaml<T> {
    return new Yaml(app, filePath, dataStruct);
  }
}
```

---

## 📝 ACTUAL IMPLEMENTATION TRACKING

**This section tracks actual code implementations as classes are migrated to use `app.reg.use()`.**
**Code samples above show the TARGET pattern - this section shows what's ACTUALLY implemented.**

### Migrated Classes

*No classes migrated yet - Registry infrastructure complete, component migration pending.*

**Note**: As each class is migrated in Stages 2-6, add its actual implementation code here showing the `app.reg.use()` call.

### Registry Infrastructure (Stage 0.1-0.3)

**Registry.test.ts - Test Implementation:**

```typescript
describe('Registry', () => {
  let app: App;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    app.init();
  });

  afterEach(() => {
    app.done();
  });

  test('should create Registry instance', () => {
    const reg = app.reg;
    assert.ok(reg instanceof Registry);
    assert.strictEqual(Registry.id, 'reg');
  });

  test('should verify Diagnostics is available via Registry', () => {
    const reg = app.reg;
    const fn = reg.use('dx.sub', 'dx.out', 'dx.error');
    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    const subDx = fn.dx.sub({ name: 'TestComponent' });
    assert.ok(subDx instanceof Diagnostics);
  });

  // ... 9 more tests covering method resolution, instance registration, etc.
});
```

**Registry.ts - Actual Implementation:**

```typescript
export class Registry {
  static readonly id = 'reg';
  [key: string]: unknown;
  private _instances: Map<string, unknown> = new Map();
  private components: Array<{ new (...args: any[]): any; id: string }> = [];
  private always: string[] = [];
  private dx: Diagnostics;
  private app: App;

  constructor(args: {
    app: App;
    components?: Array<{ new (...args: any[]): any; id: string }>;
    always?: string[];
  }) {
    this.app = args.app;
    this.components = args.components || [];
    this.always = args.always || [];
    this.dx = new Diagnostics({
      name: 'Registry',
      debugOn: undefined,
      parent: null,
      app: this.app,
    });
    this._instances.set('dx', this.dx);
    for (const Component of this.components) {
      if (Component.id) {
        (this as Record<string, unknown>)[Component.id] = {};
      }
    }
  }

  registerInstance(componentId: string, instance: unknown): void {
    this._instances.set(componentId, instance);
  }

  use(...methodIds: string[]): FnImport_t {
    const allMethods = [...methodIds, ...this.always];
    const result: FnImport_t = {};
    // ... method resolution logic
    return result;
  }
}
```

**App.ts - Registry Integration:**

```typescript
export class App {
  // ... existing properties
  reg: Registry;

  constructor(args: { context: ExtensionContext; vscode: typeof import('vscode') }) {
    // ... create Diagnostics
    const { context, vscode } = args;

    // Create Registry with component classes
    this.reg = new Registry({
      app: this,
      components: [
        Diagnostics,
        VSCodeAPIs,
        UI,
        PDF,
        Stylize,
        TabInspector,
        UIMenuMgr,
      ],
      always: ['dx.sub'],
    });

    // Create components the old way
    this.vscodeapis = new VSCodeAPIs({ app: this, vscode, context });
    this.ui = new UI(this);
    // ... etc

    // Register existing instances with Registry
    this.reg.registerInstance('dx', this.dx);
    this.reg.registerInstance('vscodeapis', this.vscodeapis);
    this.reg.registerInstance('ui', this.ui);
    // ... etc
  }
}
```

---

## Current Status Summary

**Registry Infrastructure:**

- ✅ Registry class created with `use()` method
- ✅ Type definitions (`FnImport_t`) created
- ✅ Registry integrated into App
- ✅ All components have `static readonly id` properties
- ✅ Registry has `registerInstance()` method to register existing instances
- ✅ Registry `use()` method can resolve methods from registered instances
- ✅ All component classes registered with Registry constructor
- ✅ All existing component instances registered via `registerInstance()`
- ✅ Circular dependency detection implemented (construction stack tracking)
- ✅ Circuit breaker pattern implemented (failed components tracked)
- ✅ Lazy instantiation cache working correctly
- ⏸️ Components still created the old way by App constructor (migration pending)
- ⏸️ No classes migrated to use `app.reg.use()` yet (Stage 2+)

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
// Singleton service component
class PDF {
  static readonly id = 'pdf';  // That's it! Registry finds methods via prototype
  
  private fn: FnImport_t;
  private dx: Diagnostics;
  
  constructor(app: App) {
    // Request methods via app.reg (variadic, no array brackets)
    // dx.sub is always available (from always: ['dx.sub'])
    this.fn = app.use(
      app.reg.ui.showErrorMessage,
      app.reg.stylize.getTokens,
      app.reg.os.fileRead,
      app.reg.coords.pdfPtsToCssPx,  // Coords is singleton too
    );
    
    // Create local diagnostics (dx.sub always available)
    this.dx = this.fn.dx.sub('PDF');
    
    // All initialization happens here - no separate init() method
    // Component is fully ready when constructor completes
  }
  
  someMethod() {
    // Access via fn organized by component
    this.fn.ui.showErrorMessage('Error');
    const px = this.fn.coords.pdfPtsToCssPx(100);
  }
  
  done(): void {
    // Explicit cleanup - called manually when needed
    this.dx.done();
  }
}

// Factory pattern for per-instance classes
class Yaml<T> {
  static readonly id = 'yaml';
  static readonly fn: FnExport_t = ['create'];
  
  static create<T>(app: App, filePath: string, dataStruct: T): Yaml<T> {
    return new Yaml(app, filePath, dataStruct);
  }
  
  private constructor(private app: App, private filePath: string, private dataStruct: T) {}
  
  get(): T {
    // Lazy load and cache
  }
  
  done(): void {
    this.cached = undefined;
  }
}

// Usage in consuming class
class UI {
  static readonly id = 'ui';
  static readonly fn: FnExport_t = ['showErrorMessage', 'showInfoMessage'];
  
  private fn: FnImport_t;
  private _yaml: Yaml<typeof UI.kYaml>;
  
  constructor(app: App) {
    // dx always available, only request what else is needed
    this.fn = app.use(
      app.reg.os.fileRead,
      app.reg.yaml.create,  // Factory method
    );
    
    // Create per-instance Yaml via factory
    this._yaml = this.fn.yaml.create(app, 'src/UI.yaml', UI.kYaml);
  }
  
  get yaml() {
    return this._yaml.get();
  }
}
```

---

## Whole Class/Component Usage Analysis

This section documents cases where components might need entire class instances vs specific methods.

### ✅ Factory Pattern with static create()

#### 1. Yaml - Per-instance with factory

**Used by:** PaperPrinter, UIWebView, UIMenu, PDF, UI  
**Current pattern:**

```typescript
this._yaml = new Yaml(app, 'src/PDF.yaml', PDF.kYaml);
const data = this._yaml.get();
```

**With Registry:**

```typescript
class Yaml {
  static readonly id = 'yaml';  // That's it!
  static create<T>(app: App, path: string, struct: T): Yaml<T> {
    return new Yaml(app, path, struct);
  }
  private constructor(...) {}
}

// Usage
this.fn = app.use(app.reg.yaml.create);
this._yaml = this.fn.yaml.create(app, 'src/PDF.yaml', PDF.kYaml);
const data = this._yaml.get();
```

**Status:** Factory pattern - each component gets own instance

#### 2. Coords - Only 4 methods needed

**Used by:** PDF (holds instance), DocInfo_PDF (creates temp instance)  
**Methods used:**

- `init()` - move to constructor
- `done()` - keep for cleanup
- `pdfPtsToCssPx(value)` - called 6 times
- `cssPxToPdfPts(value)` - called 3 times

**Current pattern:**

```typescript
this.coords = new Coords(app);
this.coords.init();
const px = this.coords.pdfPtsToCssPx(pts);
```

**With Registry:**

```typescript
this.fn = app.use(
  app.reg.coords.pdfPtsToCssPx,
  app.reg.coords.cssPxToPdfPts
);
const px = this.fn.coords.pdfPtsToCssPx(pts);
// Coords becomes singleton, no per-class instances
```

**Status:** Can eliminate class instantiation

#### 3. UIWebView - Only 2 methods needed

**Used by:** PaperPrinter (holds instance)  
**Methods used:**

- `init()` - move to constructor
- `displayPdfPanel()` - called 2 times

**Current pattern:**

```typescript
this.uiwebview = new UIWebView(this.app);
this.uiwebview.init();
await this.uiwebview.displayPdfPanel();
```

**With Registry:**

```typescript
this.fn = app.use(app.reg.uiwebview.displayPdfPanel);
await this.fn.uiwebview.displayPdfPanel();
// UIWebView becomes singleton
```

**Status:** Can eliminate class instantiation

---

### ❓ Needs Investigation - Possible Whole Class Usage

#### 4. UIMenu - Created and stored in arrays

**Used by:** UIMenuMgr  
**Pattern:**

```typescript
const menu = new UIMenu(app, id, displayName, ...);
this.menus.push(menu);  // Stored for later use
// Later: iterate through menus, call various methods
```

**Question:** Could we use method-based approach instead?  
**Status:** NEEDS REVIEW - Currently assumes whole class needed

---

### ✅ Confirmed Needs Whole Class

#### 5. DocInfo_PDF and DocInfo_PaperPrinter - Data containers

**Used by:** PDF, PaperPrinter  
**Reason:** Data objects with 10+ properties accessed throughout codebase

```typescript
this.docInfo = new DocInfo_PDF(app);
// Then accessed: docInfo.pdfDoc, docInfo.pageTotal, docInfo.theme, etc.
```

**Status:** Keep as-is - data container pattern

#### 6. Persist - Factory pattern with dynamic properties

**Used by:** UI, UIMenu  
**Reason:** Creates dynamic properties via `Object.defineProperty()`

```typescript
class Persist {
  static readonly id = 'persist';  // That's it!
  static create(app: App): Persist {
    return new Persist(app);
  }
  private constructor(app: App) {}
  register(name: string): this { /* ... */ }
}

// Usage
this.fn = app.use(app.reg.persist.create);
this.persist = this.fn.persist.create(app);
this.persist.register('toolbar_pos');
this.persist.toolbar_pos = 100;  // Dynamic property
```

**Status:** Factory pattern - each component gets own instance

---

## Overview

This document outlines a comprehensive migration plan to replace the current dependency injection pattern where every class receives a copy of `app` and accesses other classes via `this.app.componentName`, along with eliminating the requirement for `init()` routines.

## Goals

1. **Eliminate tight coupling**: Remove the need for classes to hold references to the entire `app` object
2. **Lazy initialization**: Construct components only when first used, not at startup
3. **Explicit dependencies**: Each class constructor explicitly declares what it needs via a Registry
4. **Remove init() methods**: Eliminate two-phase construction - all initialization happens in constructor
5. **Keep done() methods**: Preserve explicit cleanup methods for resource disposal
6. **Type safety**: Maintain strong typing throughout the migration
7. **Minimal startup overhead**: Only construct App and Registry at startup (Registry creates Diagnostics internally)

## Current Architecture Problems

### Issues Identified

1. **Tight Coupling**: Every class holds a reference to `app` and can access any component, creating implicit dependencies
2. **Eager Initialization**: All components are constructed at startup, even if never used
3. **Two-Phase Construction**: Constructor + `init()` creates complexity and initialization order dependencies
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
    this.coords.init();  // Two-phase construction dependency
  }

  someMethod() {
    const tokens = this.app.stylize.getTokens(...);  // Implicit dependency
    const ui = this.app.ui.showErrorMessage(...);     // Implicit dependency
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
  static readonly id = 'pdf';  // That's it! Registry finds methods via PDF.prototype
  
  private fn: FnImport_t;
  private dx: Diagnostics;
  private tempPdfs: string[] = [];

  constructor(app: App) {
    // Request via app.reg - Registry resolves to component methods
    // dx.sub is always available (from always: ['dx.sub'])
    this.fn = app.use(
      app.reg.stylize.getTokens,
      app.reg.stylize.getThemes,
      app.reg.ui.showErrorMessage,
      app.reg.ui.showInfoMessage,
      app.reg.os.fileRead,
      app.reg.os.fileWrite,
      app.reg.coords.pdfPtsToCssPx,  // Coords is singleton, not per-instance
      app.reg.coords.cssPxToPdfPts,
    );

    // Create Diagnostics instance for this class
    this.dx = this.fn.dx.sub('PDF');
    
    // All initialization happens here - no separate init() needed
    this.tempPdfs = [];
  }

  async renderPage(pageNum: number): Promise<void> {
    const subDx = this.fn.dx.sub('renderPage');

    try {
      // Use requested methods - access via component name (organized by Registry)
      const tokens = await this.fn.stylize.getTokens('code', 'javascript', 'theme');
      this.fn.ui.showInfoMessage(`Rendering page ${pageNum}`);

      const content = this.fn.os.fileRead('template.html');
    } catch (err) {
      // Error handling: log via Diagnostics and show user-friendly error
      subDx.out(
        `Failed to render page ${pageNum}: ${err instanceof Error ? err.message : String(err)}`
      );
      this.fn.ui.showErrorMessage(`Failed to render page ${pageNum}. Please try again.`);
      throw err; // Re-throw to allow caller to handle
    }
  }
}

// UI class example
class UI {
  private fn: UIDependencies;
  public readonly id = 'ui'; // Every class must have id property or id() getter

  constructor(app: App) {
    this.fn = app.use({
      create: [], // Registry finds this in Diagnostics
      sub: [], // Registry finds this in Diagnostics
      out: [], // Registry finds this in Diagnostics
      fileRead: [], // Registry finds this in OS
      showErrorMessage: [], // Registry finds this in VSCodeAPIs
      showInfoMessage: [], // Registry finds this in VSCodeAPIs
      showWarningMessage: [], // Registry finds this in VSCodeAPIs
    });

    this.dx = this.fn.dx.create('UI');
  }

  showError(msg: string): void {
    try {
      // Access methods via component organization
      // Check dependencies are available before using
      if (!this.fn.vscodeapis || !this.fn.dx) {
        throw new Error('Required dependencies not available');
      }
      this.fn.vscodeapis.showErrorMessage(msg);
      this.fn.dx.out(`Error: ${msg}`);
    } catch (err) {
      // Fallback: log to console if diagnostics unavailable
      console.error(`UI.showError failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

// Example with ambiguous method names (use component prefix)
class PaperPrinter {
  private fn: PaperPrinterDependencies;
  public readonly id = 'paperprinter'; // Every class must have id property or id() getter

  constructor(app: App) {
    this.fn = app.use({
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

    this.dx = this.fn.dx.create('PaperPrinter');
  }

  async handlePrint(): Promise<void> {
    const subDx = this.fn.dx.sub('handlePrint');

    try {
      // Check dependencies are available
      if (!this.fn.tabinspector || !this.fn.stylize || !this.fn.pdf) {
        throw new Error('Required dependencies not available for printing');
      }

      const content = this.fn.tabinspector.getActiveTabContent();
      const lang = this.fn.tabinspector.getLanguageId();
      const tokens = await this.fn.stylize.getTokens(content, lang, 'github-light');

      this.fn.pdf.setTokensForPageRender(tokens, 'github-light');
      await this.fn.pdf.renderPage(0);
    } catch (err) {
      // Error handling: log and show user-friendly message
      subDx.out(`Print failed: ${err instanceof Error ? err.message : String(err)}`);
      this.fn.ui.showErrorMessage(
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
5. **Access Phase**: Use `this.fn.componentName.methodName()` - same access pattern as current `app.componentName.methodName()`
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
  // ... all component IDs and methods
};

// Usage in classes - every component just declares its id:
class Diagnostics {
  static readonly id = 'dx';  // That's it!
  // Public methods: create(), sub(), out() - found via Diagnostics.prototype
}

class UI {
  static readonly id = 'ui';  // That's it!
  // Public methods: showError(), showInfo(), showWarning() - found via UI.prototype
}
```

Registry builds this structure dynamically:

- Reads `Component.id` from each class
- Hangs empty placeholders on `this`: `this.dx = {}`, `this.ui = {}`
- When `use()` is called, looks up methods via `Component.prototype.hasOwnProperty(methodName)`
- Components use via `app.reg.dx`, `app.reg.ui` (for intellisense)

This provides:

- Single source of truth: **the actual class prototype**
- No arrays to maintain
- No type exports needed
- Can't get out of sync - prototype IS the truth

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
- **Critical**: Every migrated class must add `static readonly id = 'xxx'` - that's it! Registry finds methods via prototype

#### 2.1: Migrate OS Classes

- [ ] Update OS base class constructor to accept App
- [ ] Remove `app` parameter  
- [ ] Add `static readonly id = 'os'` - that's it!
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

- [ ] Add `static readonly id = 'vscodeapis'` - that's it!
- [ ] Update constructor to use `app.use()`
- [ ] VSCodeAPIs accesses `app.vscode` and `app.context` directly (App stores these)
- [ ] Request Diagnostics via Registry
- [ ] Move `init()` logic (command registration) into constructor
- [ ] Registry creates VSCodeAPIs like any other component: `new VSCodeAPIs(app)`

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

### Class Declaration Pattern

Every class declares what it provides:

```typescript
class UI {
  // Component ID (lowercase)
  static readonly id = 'ui';
  
  // Exported methods (what others can use)
  static readonly fn: FnExport_t = [
    'showErrorMessage',
    'showInfoMessage',
    'showWarningMessage',
  ];
  
  // Imported methods (what this component needs)
  private fn: FnImport_t;
  
  constructor(app: App) {
    // dx always available
    this.fn = app.use(
      app.reg.os.fileRead,
    );
  }
}
```

### kId Structure (Built by Registry)

Registry scans all classes at startup and builds hierarchical kId:

```typescript
const kId = {
  dx: {
    create: 'create',
    sub: 'sub',
    out: 'out',
  },
  ui: {
    showErrorMessage: 'showErrorMessage',
    showInfoMessage: 'showInfoMessage',
  },
  pdf: {
    generatePdf: 'generatePdf',
    renderPage: 'renderPage',
  },
  // ... all components
};
```

### Factory vs Singleton

**Singletons** (Registry creates once):

- `dx`, `ui`, `os`, `pdf`, `stylize`, `tabinspector`, `uimenumgr`, `vscodeapis`, `coords`, `uiwebview`

**Factories** (static create() returns new instance):

- `yaml`, `persist`, `docinfo_pdf`, `docinfo_paperprinter`

```typescript
// src/types/Registry_t.ts
export type Use_t = string[];
export type FnExport_t = readonly string[];
export type FnImport_t = {
  [componentId: string]: {
    [methodName: string]: Function;
  };
};

// src/Registry.ts
import type { FnExport_t, FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import { VSCodeAPIs } from './VSCodeAPIs';
import { UI } from './UI';
import { PDF } from './PDF';
import { Stylize } from './Stylize';
import { TabInspector } from './TabInspector';
import { UIMenuMgr } from './UIMenuMgr';
import { OS } from './OS';
// ... import all components

// Helper to build kId from component class metadata
function buildKId(components: Array<{ readonly id: string; readonly fn: FnExport_t }>) {
  const result: Record<string, Record<string, string>> = {};
  
  for (const Component of components) {
    const componentId = Component.id;
    result[componentId] = {};
    
    for (const methodName of Component.fn) {
      result[componentId][methodName] = methodName;
    }
  }
  
  return result;
}

// Build kId once at module level - it's just derived data from component metadata
const components = [
  Diagnostics,
  VSCodeAPIs,
  UI,
  PDF,
  Stylize,
  TabInspector,
  UIMenuMgr,
  OS,
  // ... all component classes
];

export const kId = buildKId(components);

// Registry class - manages runtime state only
class Registry {
  private instances = new Map<string, unknown>();
  private factories = new Map<string, (app: App) => unknown>();
  private dx: Diagnostics;
  private app: App;

  constructor(app: App) {
    this.app = app;
    this.dx = new Diagnostics('Registry', undefined, null, app);
    this.instances.set('dx', this.dx);
    this.registerFactories();
  }

  use(...methodIds: string[]): FnImport_t {
    const result: Partial<FnImport_t> = {};
    
    // Parse method IDs (like 'app.reg.pdf.generatePdf', 'app.reg.ui.showError') and group by component
    const componentMethods = new Map<string, Set<string>>();
    
    for (const methodId of methodIds) {
      // methodId is a string like 'generatePdf' from app.reg.pdf.generatePdf
      // Lookup which component owns this method by checking this.components
      // ... (lookup logic)
    }

    for (const [componentName, methods] of componentMethods) {
      if (componentName === 'dx') {
        // Diagnostics is always available (created at Registry construction)
        result[componentName] = this.createScopedAccess(this.dx, Array.from(methods));
      } else {
        // Get or create component instance lazily
        if (!this.instances.has(componentName)) {
          const factory = this.factories.get(componentName);
          if (!factory) throw new Error(`No factory for component: ${componentName}`);
          this.instances.set(componentName, factory(this.app));
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

**Implementation**: Feature flags can be implemented if gradual rollout is needed during migration stages.

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

1. ✓ App reference injected via constructor - components receive `app: App` to access Registry
2. ✓ No `init()` methods - all initialization in constructors
3. ✓ Components constructed lazily on first use by Registry
4. ✓ Explicit dependency declarations in constructors via `app.use()`
5. ✓ `done()` methods preserved for explicit cleanup
6. ✓ All tests passing
7. ✓ No performance regressions
8. ✓ Code is cleaner and more maintainable

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
