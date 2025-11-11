import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { App } from '../src/App.js';
import { PaperPrinter } from '../src/PaperPrinter.js';
import type * as vscode from 'vscode';
import type { ExtensionContext } from 'vscode';

// Mock VS Code context and APIs
const mockContext = {
  subscriptions: [],
  globalState: {
    get: () => undefined,
    update: () => {},
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

const mockVSCode = {
  commands: { registerCommand: () => ({}) },
  window: { 
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    showWarningMessage: () => {},
  },
  workspace: {
    getConfiguration: () => ({
      get: (key: string) => {
        if (key === 'fontSize') return 14;
        if (key === 'lineHeight') return 1.5;
        if (key === 'fontFamily') return 'Monaco';
        return undefined;
      }
    })
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
} as unknown as typeof vscode;

describe('PaperPrinter Integration Tests', () => {
  test('should generate same PDF for webview and print operations', async () => {
    const app = new App(mockContext, mockVSCode);
    app.init();
    
    const paperPrinter = app.paperprinter;
    
    // Set up test document
    paperPrinter.docInfo.rawCode = `function test() {
  console.log("Hello World");
  return 42;
}`;
    paperPrinter.docInfo.languageId = 'javascript';
    
    // Generate PDF
    await paperPrinter['generatePdf']();
    const pdfDoc = paperPrinter['pdfDoc'];
    
    assert(pdfDoc, 'PDF document should be generated');
    assert.equal(typeof pdfDoc.getNumberOfPages(), 'number', 'Should have page count');
    assert(pdfDoc.getNumberOfPages() > 0, 'Should have at least one page');
    
    // Get ArrayBuffer for webview
    const arrayBuffer = pdfDoc.asArrayBuffer();
    assert(arrayBuffer instanceof ArrayBuffer, 'Should return ArrayBuffer');
    assert(arrayBuffer.byteLength > 1000, 'PDF should have substantial content');
    
    // Verify same PDF object is reused
    const sameArrayBuffer = pdfDoc.asArrayBuffer();
    assert.equal(arrayBuffer.byteLength, sameArrayBuffer.byteLength, 'Same PDF should produce same ArrayBuffer size');
    
    app.done();
  });

  test('should regenerate PDF when theme changes', async () => {
    const app = new App(mockContext, mockVSCode);
    app.init();
    
    const paperPrinter = app.paperprinter;
    paperPrinter.docInfo.rawCode = `const message = "test";
console.log(message);`;
    paperPrinter.docInfo.languageId = 'javascript';
    
    // Create menus
    paperPrinter['createMenus']();
    const themeMenu = app.uimenumgr.getMenuById('theme');
    
    // Set initial theme and generate PDF
    themeMenu.persist.theme = 'github-light';
    await paperPrinter['generatePdf']();
    const lightPdf = paperPrinter['pdfDoc'];
    const lightArrayBuffer = lightPdf?.asArrayBuffer();
    
    assert(lightArrayBuffer, 'Should generate PDF with light theme');
    
    // Change theme and regenerate
    themeMenu.persist.theme = 'github-dark';
    await paperPrinter['generatePdf']();
    const darkPdf = paperPrinter['pdfDoc'];
    const darkArrayBuffer = darkPdf?.asArrayBuffer();
    
    assert(darkArrayBuffer, 'Should generate PDF with dark theme');
    
    // PDFs should be different (different themes = different colors)
    assert.notEqual(
      lightArrayBuffer.byteLength, 
      darkArrayBuffer.byteLength, 
      'Different themes should produce different PDFs'
    );
    
    app.done();
  });

  test('should regenerate PDF when font size changes', async () => {
    const app = new App(mockContext, mockVSCode);
    app.init();
    
    const paperPrinter = app.paperprinter;
    paperPrinter.docInfo.rawCode = `// Test code with multiple lines
function calculateSum(a, b) {
  const result = a + b;
  console.log(\`Sum: \${result}\`);
  return result;
}

const numbers = [1, 2, 3, 4, 5];
const total = numbers.reduce(calculateSum, 0);`;
    paperPrinter.docInfo.languageId = 'javascript';
    
    // Create menus
    paperPrinter['createMenus']();
    const fontMenu = app.uimenumgr.getMenuById('fontSizeId');
    
    // Test with small font
    fontMenu.persist.fontSizeId = '10';
    await paperPrinter['generatePdf']();
    const smallFontPdf = paperPrinter['pdfDoc'];
    const smallFontPages = smallFontPdf?.getNumberOfPages() || 0;
    const smallArrayBuffer = smallFontPdf?.asArrayBuffer();
    
    // Test with large font
    fontMenu.persist.fontSizeId = '18';
    await paperPrinter['generatePdf']();
    const largeFontPdf = paperPrinter['pdfDoc'];
    const largeFontPages = largeFontPdf?.getNumberOfPages() || 0;
    const largeArrayBuffer = largeFontPdf?.asArrayBuffer();
    
    assert(smallArrayBuffer && largeArrayBuffer, 'Both PDFs should be generated');
    
    // Larger font should typically result in more pages for same content
    assert(largeFontPages >= smallFontPages, 'Larger font should not reduce page count');
    
    // PDFs should be different
    assert.notEqual(
      smallArrayBuffer.byteLength,
      largeArrayBuffer.byteLength,
      'Different font sizes should produce different PDFs'
    );
    
    app.done();
  });

  test('should handle PDF ArrayBuffer conversion for webview', async () => {
    const app = new App(mockContext, mockVSCode);
    app.init();
    
    const paperPrinter = app.paperprinter;
    paperPrinter.docInfo.rawCode = 'console.log("PDF conversion test");';
    paperPrinter.docInfo.languageId = 'javascript';
    
    await paperPrinter['generatePdf']();
    const pdfDoc = paperPrinter['pdfDoc'];
    
    assert(pdfDoc, 'PDF should be generated');
    
    // Test ArrayBuffer conversion
    const arrayBuffer = pdfDoc.asArrayBuffer();
    assert(arrayBuffer instanceof ArrayBuffer, 'Should return ArrayBuffer');
    
    // Test base64 conversion (what webview uses)
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    assert(typeof base64 === 'string', 'Should convert to base64 string');
    assert(base64.length > 100, 'Base64 should have substantial length');
    assert(base64.startsWith('JVBER'), 'Base64 should start with PDF header');
    
    // Test data URL format
    const dataUrl = `data:application/pdf;base64,${base64}`;
    assert(dataUrl.startsWith('data:application/pdf;base64,'), 'Should create proper data URL');
    
    app.done();
  });
});
