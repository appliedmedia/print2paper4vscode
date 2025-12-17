import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp } from './test-utils.js';
import { mockContext, mockVSCode } from './test-utils.js';
import { getFn } from './test-helpers.js';

describe('System Integration Tests', () => {
  test('should initialize all components correctly', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    
    // Verify all major components are created
    assert.ok(app.vscodeapis, 'Should have VSCodeAPIs');
    assert.ok(app.ui, 'Should have UI');
    assert.ok(app.os, 'Should have OS');
    assert.ok(app.pdf, 'Should have PDF');
    assert.ok(app.paperprinter, 'Should have PaperPrinter');
    assert.ok(app.stylize, 'Should have Stylize');
    assert.ok(app.tabinspector, 'Should have TabInspector');
    assert.ok(app.uimenumgr, 'Should have UIMenuMgr');
    
    app.done();
  });

  test('should handle Shiki theme workflow', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    // Note: Stylize no longer has init() - highlighter initialized lazily when needed
    
    // Test that Shiki themes are loaded
    const shikiThemes = fn.stylize.getShikiThemes();
    assert.ok(shikiThemes.length > 0, 'Should have Shiki themes');
    assert.ok(
      shikiThemes.some((t: any) => t.id.includes('light')),
      'Should have light themes'
    );

    // Test theme filtering
    const lightThemes = fn.stylize.getShikiThemes('light|bright|day');
    assert.ok(lightThemes.length > 0, 'Should have filtered themes');
    assert.ok(
      lightThemes.every((t: any) => /light|bright|day/i.test(t.id)),
      'Themes should match filter'
    );
    
    app.done();
  });

  test('should validate template system integration', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    const utils = app.reg.getInstance<import('../src/Utils.js').Utils>('utils')!;
    
    // Test template replacement
    const template = 'Hello {{NAME}}, welcome to {{PRODUCT}}!';
    const result = utils.templateDictReplace(template, {
      NAME: 'Developer',
      PRODUCT: 'VSCode Extension',
    });

    assert.strictEqual(
      result,
      'Hello Developer, welcome to VSCode Extension!',
      'Template replacement should work'
    );
    
    app.done();
  });

  test('should handle page size and orient functionality', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });

    // Test page size menu items
    const pageMenuItems = (app.paperprinter as any).menuItems_Page();
    assert.ok(pageMenuItems.length >= 3, 'Should have page menu items');
    assert.ok(
      pageMenuItems.every((item: any) => item.id && item.displayName),
      'All items should have id and displayName'
    );

    // Test orient menu items
    const orientMenuItems = (app.paperprinter as any).menuItems_Orient();
    assert.strictEqual(orientMenuItems.length, 2, 'Should have 2 orient options');
    
    const orientIds = orientMenuItems.map((item: any) => item.id);
    assert.ok(orientIds.includes('portrait'), 'Should have portrait');
    assert.ok(orientIds.includes('landscape'), 'Should have landscape');
    
    app.done();
  });

  test('should handle PDF generation workflow', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    
    // Set up document
    fn.paperprinter.docInfo().rawCode = 'const x = 42;';
    fn.paperprinter.docInfo().languageId = 'javascript';
    fn.paperprinter.docInfo().printTitle = 'Test';
    
    // Create menus
    (app.paperprinter as any).createMenus();
    
    // Generate PDF
    await (app.paperprinter as any).generatePdf();
    
    assert.ok(fn.pdf.docInfo().pdfDoc, 'Should generate PDF');
    assert.ok(fn.pdf.docInfo().pageTotal > 0, 'Should have pages');
    
    app.done();
  });

  test('should coordinate between components', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    
    // Test that components can access registry
    assert.strictEqual(app.stylize['reg'], app.reg, 'Stylize should reference registry');
    assert.strictEqual(app.pdf['reg'], app.reg, 'PDF should reference registry');
    assert.strictEqual(app.paperprinter['reg'], app.reg, 'PaperPrinter should reference registry');
    
    // Test that shared services work
    const typography = fn.vscodeapis.getEditorTypography();
    assert.ok(typography.fontSize > 0, 'Should get typography');
    assert.ok(typography.sizeToHeightRatio > 0, 'Should have ratio');
    
    app.done();
  });
});
