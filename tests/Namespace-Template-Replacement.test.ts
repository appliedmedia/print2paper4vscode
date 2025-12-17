/**
 * Namespace Template Replacement Tests
 * 
 * Tests that verify namespace template replacement produces correct NEW naming convention.
 * We are moving FROM kebab-case TO underscore+camelCase.
 * 
 * NAMING CONVENTION CHANGE:
 * - OLD: .p2p4vsc-menu-btn (kebab-case)
 * - NEW: .{{ns_}}menuBtn → .p2p4vsc_menuBtn (underscore + camelCase)
 * 
 * Strategy:
 * 1. Verify {{ns_}} + camelCase produces correct underscore+camelCase output
 * 2. Verify templates are internally consistent
 * 3. Verify CSS classes, HTML IDs, and JS selectors all use same convention
 * 4. These tests do NOT compare to old code - they verify NEW convention works
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { Utils } from '../src/Utils.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('Namespace Template Replacement - Auto-Injection', () => {
  let app: App;
  let utils: Utils;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    utils = app.reg.getInstance<Utils>('utils')!;
  });

  afterEach(() => {
    app.done();
  });

  it('should auto-inject ns and ns_ without explicit dictionary entries', () => {
    const template = '.{{ns_}}menuBtn { color: red; }';
    // Pass empty dictionary - ns/ns_ should be auto-injected
    const result = utils.templateDictReplace(template, {});
    
    assert.strictEqual(result, '.p2p4vsc_menuBtn { color: red; }');
    assert.ok(!result.includes('{{ns_}}'), 'Should have no remaining placeholders');
  });

  it('should allow callers to override ns/ns_ values if needed', () => {
    const template = '.{{ns_}}menu { color: blue; }';
    // Override with custom values - caller values should win
    const result = utils.templateDictReplace(template, { ns: 'custom', ns_: 'custom_' });
    
    assert.strictEqual(result, '.custom_menu { color: blue; }');
    assert.ok(result.includes('custom_'), 'Should use overridden values');
  });
});

describe('Namespace Template Replacement - New Convention Verification', () => {
  let app: App;
  let utils: Utils;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    utils = app.reg.getInstance<Utils>('utils')!;
  });

  afterEach(() => {
    app.done();
  });

  /**
   * Test CSS class name replacement: kebab-case → underscore+camelCase
   */
  it('should replace .{{ns_}}menuBtn with .p2p4vsc_menuBtn in CSS', () => {
    const template = '.{{ns_}}menuBtn { color: red; }';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc_menuBtn { color: red; }');
    assert.ok(result.includes('.p2p4vsc_menuBtn'), 'Should contain underscore+camelCase class');
    assert.ok(!result.includes('{{ns_}}'), 'Should have no remaining placeholders');
  });

  it('should replace .{{ns_}}menuItem with .p2p4vsc_menuItem in CSS', () => {
    const template = '.{{ns_}}menuItem { padding: 3px; }';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc_menuItem { padding: 3px; }');
  });

  it('should replace .{{ns_}}menuItems with .p2p4vsc_menuItems in CSS', () => {
    const template = '.{{ns_}}menuItems { display: none; }';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc_menuItems { display: none; }');
  });

  it('should replace #{{ns_}}toolbar with #p2p4vsc_toolbar in HTML ID', () => {
    const template = '<div id="{{ns_}}toolbar">content</div>';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '<div id="p2p4vsc_toolbar">content</div>');
  });

  it('should replace {{ns_}}toolbarMenubar in CSS class', () => {
    const template = '.{{ns_}}toolbarMenubar { display: flex; }';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc_toolbarMenubar { display: flex; }');
  });

  it('should replace {{ns_}}toolbarGrip in CSS class', () => {
    const template = '.{{ns_}}toolbarGrip { cursor: ew-resize; }';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc_toolbarGrip { cursor: ew-resize; }');
  });

  it('should replace {{ns_}}menuItems in JavaScript selector', () => {
    const template = "document.querySelectorAll('.{{ns_}}menuItems')";
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, "document.querySelectorAll('.p2p4vsc_menuItems')");
  });

  it('should replace multiple namespace occurrences in same line', () => {
    const template = '.{{ns_}}menu .{{ns_}}menuBtn { display: block; }';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc_menu .p2p4vsc_menuBtn { display: block; }');
  });

  it('should handle {{ns_}} for data attributes with underscore+camelCase convention', () => {
    const template = 'data-{{ns_}}actionType="print"';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, 'data-p2p4vsc_actionType="print"');
  });
});

describe('Namespace Template Replacement - UIMenu New Convention', () => {
  let app: App;
  let utils: Utils;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    utils = app.reg.getInstance<Utils>('utils')!;
  });

  afterEach(() => {
    app.done();
  });

  it('should show what UIMenu.yaml will look like with NEW convention', () => {
    // This shows the refactored YAML with underscore+camelCase convention
    const refactoredTemplate = `
  .{{ns_}}menuBtn:hover { background: #e9e9e9; }
  .{{ns_}}menu {
    position: relative;
  }
  .{{ns_}}menuItems {
    display: none;
  }
  .{{ns_}}menuItem {
    padding: 3px;
  }
`;

    const result = utils.templateDictReplace(refactoredTemplate, namespaceDict);
    
    // Verify it produces NEW underscore+camelCase format
    assert.ok(result.includes('.p2p4vsc_menuBtn:hover'), 'Should produce .p2p4vsc_menuBtn:hover');
    assert.ok(result.includes('.p2p4vsc_menu {'), 'Should produce .p2p4vsc_menu');
    assert.ok(result.includes('.p2p4vsc_menuItems {'), 'Should produce .p2p4vsc_menuItems');
    assert.ok(result.includes('.p2p4vsc_menuItem {'), 'Should produce .p2p4vsc_menuItem');
    
    // Verify no placeholders remain
    assert.ok(!result.includes('{{ns}}'), 'Should have no {{ns}} placeholders');
    assert.ok(!result.includes('{{ns_}}'), 'Should have no {{ns_}} placeholders');
    
    // Verify NO kebab-case remains
    assert.ok(!result.includes('p2p4vsc-menu-btn'), 'Should NOT contain old kebab-case');
    assert.ok(!result.includes('p2p4vsc-menu-item'), 'Should NOT contain old kebab-case');
  });

  it('should verify JavaScript querySelector uses NEW convention', () => {
    const jsTemplate = `
  document.querySelectorAll('.{{ns_}}menuItems').forEach(items => {
    items.style.display = 'none';
  });
  const btn = e.target.closest('.{{ns_}}menuBtn');
  const menuItem = e.target.closest('.{{ns_}}menuItem');
`;

    const result = utils.templateDictReplace(jsTemplate, namespaceDict);
    
    assert.ok(result.includes("querySelectorAll('.p2p4vsc_menuItems')"), 'Should produce correct querySelector');
    assert.ok(result.includes("closest('.p2p4vsc_menuBtn')"), 'Should produce correct closest selector');
    assert.ok(result.includes("closest('.p2p4vsc_menuItem')"), 'Should produce correct menu item selector');
    
    // Verify NO kebab-case in JS
    assert.ok(!result.includes('p2p4vsc-menu'), 'Should NOT contain old kebab-case in JS');
  });

  it('should handle complex CSS selectors with NEW convention', () => {
    const template = `.{{ns_}}menu.isFlyout .{{ns_}}menuBtn { display: none; }
.{{ns_}}menu.hasGutterBefore .{{ns_}}menuItem { padding-left: 2ch; }
.{{ns_}}menuItem.isSelected .gutterBefore::before { content: '✓'; }`;

    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('.p2p4vsc_menu.isFlyout .p2p4vsc_menuBtn'), 'Should handle complex selectors');
    assert.ok(result.includes('.p2p4vsc_menu.hasGutterBefore .p2p4vsc_menuItem'), 'Should handle multiple classes');
    assert.ok(result.includes('.p2p4vsc_menuItem.isSelected'), 'Should handle state classes');
  });
});

describe('Namespace Template Replacement - UI.yaml New Convention', () => {
  let app: App;
  let utils: Utils;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    utils = app.reg.getInstance<Utils>('utils')!;
  });

  afterEach(() => {
    app.done();
  });

  it('should show what UI.yaml will look like with NEW toolbar convention', () => {
    const refactoredTemplate = `
  #{{ns_}}toolbar {
    position: fixed;
    z-index: 9999;
  }
  .{{ns_}}toolbarMenubar {
    display: inline-flex;
  }
  .{{ns_}}toolbarGrip {
    cursor: ew-resize;
  }
  <div id="{{ns_}}toolbar">
    <div class="{{ns_}}toolbarGrip" id="{{ns_}}toolbarGrip"></div>
    <div class="{{ns_}}toolbarMenubar">content</div>
  </div>
  const toolbar = document.getElementById('{{ns_}}toolbar');
  const grip = document.getElementById('{{ns_}}toolbarGrip');
`;

    const result = utils.templateDictReplace(refactoredTemplate, namespaceDict);
    
    // Verify NEW convention
    assert.ok(result.includes('#p2p4vsc_toolbar {'), 'Should produce #p2p4vsc_toolbar');
    assert.ok(result.includes('.p2p4vsc_toolbarMenubar {'), 'Should produce .p2p4vsc_toolbarMenubar');
    assert.ok(result.includes('.p2p4vsc_toolbarGrip {'), 'Should produce .p2p4vsc_toolbarGrip');
    assert.ok(result.includes('id="p2p4vsc_toolbar"'), 'Should produce HTML ID with underscore');
    assert.ok(result.includes("getElementById('p2p4vsc_toolbar')"), 'Should produce JS selector');
    assert.ok(result.includes("getElementById('p2p4vsc_toolbarGrip')"), 'Should produce grip selector');
    
    // Verify no placeholders remain
    assert.ok(!result.includes('{{ns}}'), 'Should have no {{ns}} placeholders');
    assert.ok(!result.includes('{{ns_}}'), 'Should have no {{ns_}} placeholders');
    
    // Verify NO kebab-case remains
    assert.ok(!result.includes('p2p4vsc-toolbar'), 'Should NOT contain old kebab-case');
  });

  it('should handle zoom controls with NEW convention', () => {
    const template = `
  .{{ns_}}zoomControls { display: flex; }
  .{{ns_}}zoomBtn { padding: 4px; }
  .{{ns_}}zoomLevel { font-size: 12px; }
  const zoomControls = document.getElementById('{{ns_}}zoomControls');
`;

    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('.p2p4vsc_zoomControls'), 'Should use underscore+camelCase');
    assert.ok(result.includes('.p2p4vsc_zoomBtn'), 'Should use underscore+camelCase');
    assert.ok(result.includes('.p2p4vsc_zoomLevel'), 'Should use underscore+camelCase');
    assert.ok(result.includes("getElementById('p2p4vsc_zoomControls')"), 'Should use underscore in JS');
  });
});

describe('Namespace Template Replacement - UIWebView New Convention', () => {
  let app: App;
  let utils: Utils;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    utils = app.reg.getInstance<Utils>('utils')!;
  });

  afterEach(() => {
    app.done();
  });

  it('should verify UIWebView.yaml uses NEW convention for zoom and menu', () => {
    const template = `
  const zoomControls = document.getElementById('{{ns_}}zoomControls');
  const menuItems = document.querySelectorAll('.{{ns_}}menuItem');
`;

    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes("getElementById('p2p4vsc_zoomControls')"), 'Should use underscore convention');
    assert.ok(result.includes("querySelectorAll('.p2p4vsc_menuItem')"), 'Should use underscore convention');
  });
});

describe('Namespace Template Replacement - Complex Scenarios with NEW Convention', () => {
  let app: App;
  let utils: Utils;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    utils = app.reg.getInstance<Utils>('utils')!;
  });

  afterEach(() => {
    app.done();
  });

  it('should handle HTML with nested elements using NEW convention', () => {
    const template = `
<div class="{{ns_}}menu" id="{{ns_}}menuMain">
  <button class="{{ns_}}menuBtn">Menu</button>
  <div class="{{ns_}}menuItems">
    <div class="{{ns_}}menuItem">Item 1</div>
    <div class="{{ns_}}menuItem">Item 2</div>
  </div>
</div>
`;

    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('class="p2p4vsc_menu"'), 'Should use underscore+camelCase');
    assert.ok(result.includes('id="p2p4vsc_menuMain"'), 'Should use underscore+camelCase in ID');
    assert.ok(result.includes('class="p2p4vsc_menuBtn"'), 'Should use underscore+camelCase');
    assert.ok(result.includes('class="p2p4vsc_menuItems"'), 'Should use underscore+camelCase');
    assert.ok(result.includes('class="p2p4vsc_menuItem"'), 'Should use underscore+camelCase');
  });

  it('should handle CSS with pseudo-selectors using NEW convention', () => {
    const template = `.{{ns_}}menuBtn:hover { background: #eee; }
.{{ns_}}menuItem:not(.isFlyout) { display: block; }
.{{ns_}}menuItem::before { content: ''; }`;

    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('.p2p4vsc_menuBtn:hover'), 'Should handle :hover');
    assert.ok(result.includes('.p2p4vsc_menuItem:not(.isFlyout)'), 'Should handle :not()');
    assert.ok(result.includes('.p2p4vsc_menuItem::before'), 'Should handle ::before');
  });

  it('should verify internal consistency: CSS classes match JS selectors', () => {
    const cssTemplate = '.{{ns_}}menuBtn { color: red; }';
    const jsTemplate = "const btn = document.querySelector('.{{ns_}}menuBtn');";
    
    const cssResult = utils.templateDictReplace(cssTemplate, namespaceDict);
    const jsResult = utils.templateDictReplace(jsTemplate, namespaceDict);
    
    // Verify both produce the same class name
    assert.ok(cssResult.includes('.p2p4vsc_menuBtn'), 'CSS should contain .p2p4vsc_menuBtn');
    assert.ok(jsResult.includes("'.p2p4vsc_menuBtn'"), 'JS selector should contain .p2p4vsc_menuBtn');
    assert.strictEqual(cssResult, '.p2p4vsc_menuBtn { color: red; }', 'CSS should match expected format');
    assert.strictEqual(jsResult, "const btn = document.querySelector('.p2p4vsc_menuBtn');", 'JS should match expected format');
  });

  it('should handle data attributes with {{ns_}} using underscore+camelCase convention', () => {
    // data attributes use underscore+camelCase format: data-{{ns_}}menuItemId
    const template = '<div data-{{ns_}}menuItemId="123" data-{{ns_}}actionType="click"></div>';
    const result = utils.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(
      result,
      '<div data-p2p4vsc_menuItemId="123" data-p2p4vsc_actionType="click"></div>',
    );
  });
});
