# EDM Refactor TODOs: CJS to EDM + Shiki v3 Upgrade

## Overview
Convert this VSCode extension from CommonJS to EDM (ES Modules) and upgrade from Shiki v0.14.7 to Shiki v3.11.0.

## Key Requirements
- **One Shiki light theme**: GitHub-light for consistent printing
- **All VSCode themes**: Dynamic discovery from extensions
- **Current VSCode theme**: Pass theme JSON directly to Shiki
- **Generic filtering**: Use regex patterns like "light|bright|day"
- **On-demand language loading**: Only load languages when needed
- **Proper terminology**: Use "style/styler" not "highlight/highlighter"

## Phase 1: Project Configuration Updates

### Step 1.1: Update package.json for EDM
- [ ] Add `"type": "module"` to package.json
- [ ] Remove `vscode-oniguruma` and `vscode-textmate` dependencies
- [ ] Update Shiki to `^3.11.0`
- [ ] Keep other dependencies unchanged

### Step 1.2: Update TypeScript Configuration
- [ ] Change `"module": "commonjs"` to `"module": "ESNext"`
- [ ] Add `"moduleResolution": "bundler"`
- [ ] Update target to `"ES2022"`
- [ ] Add `"allowImportingTsExtensions": true`
- [ ] Add `"resolveJsonModule": true`

## Phase 2: Code Updates for Shiki v3 API

### Step 2.1: Update Stylize.ts
- [ ] Import `getHighlighter` from 'shiki'
- [ ] Import `all as allThemes` from 'shiki/langs'
- [ ] Rename variables: `shikiHighlighter` → `shikiStyler`
- [ ] Rename variables: `vscodeThemeHighlighter` → `vscodeThemeStyler`
- [ ] Rename method: `highlightToHtml` → `styleToHtml`
- [ ] Implement on-demand language loading (start with empty langs array)
- [ ] Add `ensureLanguage()` method for lazy loading
- [ ] Add `loadedLanguages: Set<Lang>` to track loaded languages
- [ ] Implement `filterThemes(filterString: string)` with generic regex filtering
- [ ] Remove all business logic case statements from filtering
- [ ] Add `getAvailableShikiThemes()` returning all themes
- [ ] Add `getLoadedLanguages()` returning currently loaded languages
- [ ] Add `isLanguageLoaded(languageId: string)` for validation
- [ ] Add `validateLanguageSupport(languageId: string)` for pre-validation

### Step 2.2: Update VSCodeAPIs.ts
- [ ] Implement `getVSThemes(optionalFilter?: string)` method
- [ ] Use generic regex filtering on theme labels
- [ ] Remove all category-specific methods (light/dark/high-contrast)
- [ ] Update `getActiveThemeShikiTheme()` to use Stylize's default light theme
- [ ] Keep VSCode theme JSON object passing to Shiki

### Step 2.3: Update PaperPrinter.ts
- [ ] Update theme loading to use `filterThemes('light|bright|day')`
- [ ] Update theme refresh to use `getVSThemes()`
- [ ] Remove hardcoded theme lists
- [ ] Update method calls from `highlightToHtml` to `styleToHtml`

### Step 2.4: Update All Import Statements
- [ ] Add `.js` extensions to all relative imports
- [ ] Update `src/-entrypoint.ts` imports
- [ ] Update `src/App.ts` imports
- [ ] Update all other file imports

## Phase 3: Update Method Names Throughout

### Step 3.1: Rename Methods
- [ ] Search and replace `highlightToHtml` → `styleToHtml`
- [ ] Search and replace `highlight` → `style` in method names
- [ ] Search and replace `highlighter` → `styler` in variable names
- [ ] Keep Shiki API method names unchanged internally

## Phase 4: Testing and Validation

### Step 4.1: Create Test Suite
- [ ] Create `src/tests/Stylize.test.ts` for Stylize class
- [ ] Test generic theme filtering with regex patterns
- [ ] Test on-demand language loading
- [ ] Test language validation
- [ ] Test theme discovery

### Step 4.2: Create Integration Tests
- [ ] Create `src/tests/integration.test.ts` for Shiki v3 integration
- [ ] Test VSCode theme object handling
- [ ] Test built-in theme handling
- [ ] Test language support validation

### Step 4.3: Update Test Scripts
- [ ] Add `"test": "node --test out/tests/**/*.test.js"` to package.json
- [ ] Add `"test:watch": "node --test --watch out/tests/**/*.test.js"`
- [ ] Add `"test:verbose": "node --test --reporter spec out/tests/**/*.test.js"`

## Phase 5: Build and Validation

### Step 5.1: Update Build Process
- [ ] Update `"compile"` script if needed for EDM
- [ ] Test compilation: `npm run compile`
- [ ] Test linting: `npm run lint`
- [ ] Test tests: `npm run test`

### Step 5.2: Validation Checklist
- [ ] All TypeScript compilation errors resolved
- [ ] ESLint passes without errors
- [ ] All tests pass
- [ ] Extension loads in VSCode without errors
- [ ] Syntax styling works correctly
- [ ] Theme switching works
- [ ] Print functionality works as expected

## Implementation Notes

### Shiki v3 Key Changes
- `getHighlighter()` now takes `langs: []` for on-demand loading
- `loadLanguage(lang)` method for lazy language loading
- Direct VSCode theme JSON object support
- Better performance and memory efficiency

### EDM Key Changes
- All imports must use `.js` extensions
- `"type": "module"` in package.json
- `import`/`export` syntax throughout
- No `require()` or `module.exports`

### Generic Filtering Pattern
```typescript
filterThemes(filterString: string): Array<{ id: string; label: string; source: 'shiki' }> {
    const filterRegex = new RegExp(filterString, 'i');
    return this.availableShikiThemes
        .filter(theme => {
            if (!theme.name) return false;
            return filterRegex.test(theme.name);
        })
        .map(theme => ({
            id: theme.name!,
            label: theme.name!,
            source: 'shiki' as const
        }));
}
```

### Usage Examples
```typescript
// Get all light themes
const lightThemes = stylize.filterThemes('light|bright|day');

// Get all VSCode themes
const allVSCodeThemes = vscodeAPIs.getVSThemes();

// Get filtered VSCode themes
const lightVSCodeThemes = vscodeAPIs.getVSThemes('light|bright|day');
```

## Expected Benefits
- **Better Performance**: Shiki v3 is significantly faster
- **Modern Standards**: EDM support for better tree-shaking
- **Maintained**: Active development and security updates
- **Smaller Bundle**: Better tree-shaking and modern bundling
- **Future-Proof**: Aligned with modern Node.js standards
- **Generic**: Flexible theme filtering without business logic
- **Efficient**: On-demand language loading