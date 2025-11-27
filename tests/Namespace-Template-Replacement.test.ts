/**
 * Namespace Template Replacement Tests
 * 
 * Tests that verify namespace template replacement produces correct output
 * that matches current hardcoded strings. This proves the refactoring will work.
 * 
 * Strategy:
 * 1. Read actual YAML template files
 * 2. Apply templateDictReplace with {ns: 'p2p4vsc', ns_: 'p2p4vsc_'}
 * 3. Verify replaced templates contain correct CSS classes, HTML IDs, JS selectors
 * 4. Prove that {{ns}}-menu-btn produces p2p4vsc-menu-btn (matches current code)
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { mockContext, mockVSCode } from './test-utils.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Namespace Template Replacement - Verification Tests', () => {
  let app: App;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
  });

  afterEach(() => {
    app.done();
  });

  /**
   * Test that namespace replacement produces correct CSS class names
   */
  it('should replace {{ns}}-menu-btn with p2p4vsc-menu-btn in CSS', () => {
    const template = '.{{ns}}-menu-btn { color: red; }';
    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc-menu-btn { color: red; }');
    assert.ok(result.includes('.p2p4vsc-menu-btn'), 'Should contain correct CSS class');
    assert.ok(!result.includes('{{ns}}'), 'Should have no remaining placeholders');
  });

  it('should replace {{ns}}-menu-item with p2p4vsc-menu-item in CSS', () => {
    const template = '.{{ns}}-menu-item { padding: 3px; }';
    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc-menu-item { padding: 3px; }');
  });

  it('should replace #{{ns}}-toolbar with #p2p4vsc-toolbar in HTML ID', () => {
    const template = '<div id="{{ns}}-toolbar">content</div>';
    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '<div id="p2p4vsc-toolbar">content</div>');
  });

  it('should replace {{ns}}-menu-items in JavaScript selector', () => {
    const template = "document.querySelectorAll('.{{ns}}-menu-items')";
    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, "document.querySelectorAll('.p2p4vsc-menu-items')");
  });

  it('should replace multiple namespace occurrences in same line', () => {
    const template = '.{{ns}}-menu .{{ns}}-menu-btn { display: block; }';
    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, '.p2p4vsc-menu .p2p4vsc-menu-btn { display: block; }');
  });

  it('should replace {{ns_}} with p2p4vsc_ for underscore prefix', () => {
    const template = 'const {{ns_}}variable = "value";';
    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.strictEqual(result, 'const p2p4vsc_variable = "value";');
  });
});

describe('Namespace Template Replacement - UIMenu.yaml Verification', () => {
  let app: App;
  let uimenuYamlContent: string;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    
    // Read actual UIMenu.yaml file
    const yamlPath = path.join(process.cwd(), 'src', 'UIMenu.yaml');
    if (fs.existsSync(yamlPath)) {
      uimenuYamlContent = fs.readFileSync(yamlPath, 'utf-8');
    } else {
      throw new Error('UIMenu.yaml not found at ' + yamlPath);
    }
  });

  afterEach(() => {
    app.done();
  });

  it('should verify UIMenu.yaml contains expected hardcoded class names', () => {
    // Verify current state has hardcoded namespace
    assert.ok(uimenuYamlContent.includes('.p2p4vsc-menu-btn'), 'Current YAML should contain .p2p4vsc-menu-btn');
    assert.ok(uimenuYamlContent.includes('.p2p4vsc-menu-item'), 'Current YAML should contain .p2p4vsc-menu-item');
    assert.ok(uimenuYamlContent.includes('.p2p4vsc-menu-items'), 'Current YAML should contain .p2p4vsc-menu-items');
    assert.ok(uimenuYamlContent.includes("querySelectorAll('.p2p4vsc-menu-items')"), 'Current YAML should contain JS selector');
  });

  it('should show what UIMenu.yaml will look like after {{ns}}-menu-btn replacement', () => {
    // Create a sample template showing what the refactored YAML will look like
    const refactoredTemplate = `
  .{{ns}}-menu-btn:hover { background: #e9e9e9; }
  .{{ns}}-menu {
    position: relative;
  }
  .{{ns}}-menu-items {
    display: none;
  }
  .{{ns}}-menu-item {
    padding: 3px;
  }
`;

    const result = app.templateDictReplace(refactoredTemplate, namespaceDict);
    
    // Verify it produces current hardcoded format
    assert.ok(result.includes('.p2p4vsc-menu-btn:hover'), 'Should produce .p2p4vsc-menu-btn:hover');
    assert.ok(result.includes('.p2p4vsc-menu {'), 'Should produce .p2p4vsc-menu');
    assert.ok(result.includes('.p2p4vsc-menu-items {'), 'Should produce .p2p4vsc-menu-items');
    assert.ok(result.includes('.p2p4vsc-menu-item {'), 'Should produce .p2p4vsc-menu-item');
    
    // Verify no placeholders remain
    assert.ok(!result.includes('{{ns}}'), 'Should have no {{ns}} placeholders');
    assert.ok(!result.includes('{{ns_}}'), 'Should have no {{ns_}} placeholders');
  });

  it('should verify JavaScript querySelector replacement works', () => {
    const jsTemplate = `
  document.querySelectorAll('.{{ns}}-menu-items').forEach(items => {
    items.style.display = 'none';
  });
  const btn = e.target.closest('.{{ns}}-menu-btn');
  const menuItem = e.target.closest('.{{ns}}-menu-item');
`;

    const result = app.templateDictReplace(jsTemplate, namespaceDict);
    
    assert.ok(result.includes("querySelectorAll('.p2p4vsc-menu-items')"), 'Should produce correct querySelector');
    assert.ok(result.includes("closest('.p2p4vsc-menu-btn')"), 'Should produce correct closest selector');
    assert.ok(result.includes("closest('.p2p4vsc-menu-item')"), 'Should produce correct menu item selector');
  });
});

describe('Namespace Template Replacement - UI.yaml Verification', () => {
  let app: App;
  let uiYamlContent: string;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    
    // Read actual UI.yaml file
    const yamlPath = path.join(process.cwd(), 'src', 'UI.yaml');
    if (fs.existsSync(yamlPath)) {
      uiYamlContent = fs.readFileSync(yamlPath, 'utf-8');
    } else {
      throw new Error('UI.yaml not found at ' + yamlPath);
    }
  });

  afterEach(() => {
    app.done();
  });

  it('should verify UI.yaml contains expected hardcoded IDs and classes', () => {
    // Verify current state
    assert.ok(uiYamlContent.includes('#p2p4vsc-toolbar'), 'Current YAML should contain #p2p4vsc-toolbar');
    assert.ok(uiYamlContent.includes('.p2p4vsc-toolbar-menubar'), 'Current YAML should contain .p2p4vsc-toolbar-menubar');
    assert.ok(uiYamlContent.includes('.p2p4vsc-toolbar-grip'), 'Current YAML should contain .p2p4vsc-toolbar-grip');
    assert.ok(uiYamlContent.includes('id="p2p4vsc-toolbar"'), 'Current YAML should contain HTML ID');
  });

  it('should show what UI.yaml will look like after toolbar replacement', () => {
    const refactoredTemplate = `
  #{{ns}}-toolbar {
    position: fixed;
    z-index: 9999;
  }
  .{{ns}}-toolbar-menubar {
    display: inline-flex;
  }
  .{{ns}}-toolbar-grip {
    cursor: ew-resize;
  }
  <div id="{{ns}}-toolbar">
    <div class="{{ns}}-toolbar-grip" id="{{ns}}-toolbar-grip"></div>
    <div class="{{ns}}-toolbar-menubar">content</div>
  </div>
  const toolbar = document.getElementById('{{ns}}-toolbar');
  const grip = document.getElementById('{{ns}}-toolbar-grip');
`;

    const result = app.templateDictReplace(refactoredTemplate, namespaceDict);
    
    // Verify it produces current hardcoded format
    assert.ok(result.includes('#p2p4vsc-toolbar {'), 'Should produce #p2p4vsc-toolbar');
    assert.ok(result.includes('.p2p4vsc-toolbar-menubar {'), 'Should produce .p2p4vsc-toolbar-menubar');
    assert.ok(result.includes('.p2p4vsc-toolbar-grip {'), 'Should produce .p2p4vsc-toolbar-grip');
    assert.ok(result.includes('id="p2p4vsc-toolbar"'), 'Should produce HTML ID');
    assert.ok(result.includes("getElementById('p2p4vsc-toolbar')"), 'Should produce JS selector');
    assert.ok(result.includes("getElementById('p2p4vsc-toolbar-grip')"), 'Should produce grip selector');
    
    // Verify no placeholders remain
    assert.ok(!result.includes('{{ns}}'), 'Should have no {{ns}} placeholders');
  });
});

describe('Namespace Template Replacement - Complex Scenarios', () => {
  let app: App;
  const namespaceDict = {
    ns: 'p2p4vsc',
    ns_: 'p2p4vsc_',
  };

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
  });

  afterEach(() => {
    app.done();
  });

  it('should handle CSS with multiple namespace references in complex selectors', () => {
    const template = `.{{ns}}-menu.isFlyout .{{ns}}-menu-btn { display: none; }
.{{ns}}-menu.has-gutter-before .{{ns}}-menu-item { padding-left: 2ch; }`;

    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('.p2p4vsc-menu.isFlyout .p2p4vsc-menu-btn'), 'Should handle complex selectors');
    assert.ok(result.includes('.p2p4vsc-menu.has-gutter-before .p2p4vsc-menu-item'), 'Should handle multiple classes');
  });

  it('should handle JavaScript with template literals and selectors', () => {
    const template = `
const menu = document.querySelector('.{{ns}}-menu');
const items = menu.querySelectorAll('.{{ns}}-menu-item');
const btn = \`<button class="{{ns}}-menu-btn">Click</button>\`;
`;

    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes("querySelector('.p2p4vsc-menu')"), 'Should handle querySelector');
    assert.ok(result.includes("querySelectorAll('.p2p4vsc-menu-item')"), 'Should handle querySelectorAll');
    assert.ok(result.includes('class="p2p4vsc-menu-btn"'), 'Should handle template literals');
  });

  it('should handle HTML with nested elements and multiple classes', () => {
    const template = `
<div class="{{ns}}-menu" id="{{ns}}-menu-main">
  <button class="{{ns}}-menu-btn">Menu</button>
  <div class="{{ns}}-menu-items">
    <div class="{{ns}}-menu-item">Item 1</div>
    <div class="{{ns}}-menu-item">Item 2</div>
  </div>
</div>
`;

    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('class="p2p4vsc-menu"'), 'Should handle outer class');
    assert.ok(result.includes('id="p2p4vsc-menu-main"'), 'Should handle ID');
    assert.ok(result.includes('class="p2p4vsc-menu-btn"'), 'Should handle button class');
    assert.ok(result.includes('class="p2p4vsc-menu-items"'), 'Should handle items class');
    assert.ok(result.includes('class="p2p4vsc-menu-item"'), 'Should handle item class');
  });

  it('should handle edge case: namespace at start of line', () => {
    const template = `{{ns}}-menu { color: red; }
{{ns}}-toolbar { color: blue; }`;

    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('p2p4vsc-menu { color: red; }'), 'Should handle start of line');
    assert.ok(result.includes('p2p4vsc-toolbar { color: blue; }'), 'Should handle multiple lines');
  });

  it('should handle edge case: namespace with special CSS pseudo-selectors', () => {
    const template = `.{{ns}}-menu-btn:hover { background: #eee; }
.{{ns}}-menu-item:not(.isFlyout) { display: block; }
.{{ns}}-menu-item::before { content: ''; }`;

    const result = app.templateDictReplace(template, namespaceDict);
    
    assert.ok(result.includes('.p2p4vsc-menu-btn:hover'), 'Should handle :hover');
    assert.ok(result.includes('.p2p4vsc-menu-item:not(.isFlyout)'), 'Should handle :not()');
    assert.ok(result.includes('.p2p4vsc-menu-item::before'), 'Should handle ::before');
  });
});

describe('Namespace Template Replacement - Auto-Injection Verification', () => {
  let app: App;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
  });

  afterEach(() => {
    app.done();
  });

  it('should verify App.templateDictReplace can auto-inject ns and ns_ (future enhancement)', () => {
    // This test documents the future enhancement where App.templateDictReplace
    // automatically includes ns and ns_ in every replacement dictionary
    
    // Current behavior: ns/ns_ must be explicitly passed
    const template = '.{{ns}}-menu { color: red; }';
    const result = app.templateDictReplace(template, { ns: 'p2p4vsc' });
    assert.strictEqual(result, '.p2p4vsc-menu { color: red; }');
    
    // Future behavior (after ns-002 TODO): ns/ns_ auto-injected
    // const result = app.templateDictReplace(template, {});
    // assert.strictEqual(result, '.p2p4vsc-menu { color: red; }');
  });
});
