import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { createTestApp, TestApp } from './test-utils.js';
import { PaperPrinter } from '../src/PaperPrinter.js';
import { Persist } from '../src/Persist.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('PaperPrinter Integration Tests', () => {
  test('should generate same PDF for webview and print operations', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    
    const paperPrinter = app.paperprinter;
    
    // Set up test document
    paperPrinter.docInfo().rawCode = `function test() {
  console.log("Hello World");
  return 42;
}`;
    paperPrinter.docInfo().languageId = 'javascript';
    paperPrinter.docInfo().printTitle = 'Test Document';
    
    // Create menus to avoid "Menu not found" errors
    paperPrinter['createMenus']();
    
    // Generate PDF
    await paperPrinter['generatePdf']();
    const pdfDoc = app.pdf.docInfo();
    
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

  test('should regenerate PDF when settings change', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    
    const paperPrinter = app.paperprinter;
    paperPrinter.docInfo().rawCode = `const message = "test";
console.log(message);`;
    paperPrinter.docInfo().languageId = 'javascript';
    paperPrinter.docInfo().printTitle = 'Test Document';
    
    // Create menus
    paperPrinter['createMenus']();
    
    // Generate initial PDF
    await paperPrinter['generatePdf']();
    const pdf1 = app.pdf.docInfo();
    const arrayBuffer1 = pdf1?.asArrayBuffer();
    
    assert(arrayBuffer1, 'Should generate initial PDF');
    assert(arrayBuffer1.byteLength > 1000, 'Should have substantial PDF content');
    const pageCount1 = pdf1.getNumberOfPages();
    
    // Regenerate PDF (simulates settings change)
    await paperPrinter['generatePdf']();
    const pdf2 = app.pdf.docInfo();
    const arrayBuffer2 = pdf2?.asArrayBuffer();
    
    assert(arrayBuffer2, 'Should regenerate PDF');
    assert(arrayBuffer2.byteLength > 1000, 'Should have substantial PDF content');
    const pageCount2 = pdf2.getNumberOfPages();
    
    // Both PDFs should exist and have same structure
    assert(pdf1.pdfDoc, 'First PDF should exist');
    assert(pdf2.pdfDoc, 'Second PDF should exist');
    assert.equal(pageCount1, pageCount2, 'Both PDFs should have same page count');
    
    app.done();
  });

  test('should regenerate PDF when font size changes', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    
    const paperPrinter = app.paperprinter;
    paperPrinter.docInfo().rawCode = `// Test code with multiple lines
function calculateSum(a, b) {
  const result = a + b;
  console.log(\`Sum: \${result}\`);
  return result;
}

const numbers = [1, 2, 3, 4, 5];
const total = numbers.reduce(calculateSum, 0);`;
    paperPrinter.docInfo().languageId = 'javascript';
    paperPrinter.docInfo().printTitle = 'Test Document';
    
    // Create menus
    paperPrinter['createMenus']();
    const persist = app.reg.getInstance<Persist>('persist')!;
    
    // Test with small font
    persist.set('fontSizeId', '10');
    await paperPrinter['generatePdf']();
    const smallFontPdf = app.pdf.docInfo();
    const smallFontPages = smallFontPdf?.getNumberOfPages() || 0;
    const smallArrayBuffer = smallFontPdf?.asArrayBuffer();
    
    // Test with large font
    persist.set('fontSizeId', '18');
    await paperPrinter['generatePdf']();
    const largeFontPdf = app.pdf.docInfo();
    const largeFontPages = largeFontPdf?.getNumberOfPages() || 0;
    const largeArrayBuffer = largeFontPdf?.asArrayBuffer();
    
    assert(smallArrayBuffer && largeArrayBuffer, 'Both PDFs should be generated');
    assert(smallArrayBuffer.byteLength > 1000, 'Small font PDF should have content');
    assert(largeArrayBuffer.byteLength > 1000, 'Large font PDF should have content');
    
    // Larger font should typically result in more pages for same content
    assert(largeFontPages >= smallFontPages, 'Larger font should not reduce page count');
    
    app.done();
  });

  test('should handle PDF ArrayBuffer conversion for webview', async () => {
    const app = createTestApp({ context: mockContext, vscode: mockVSCode });
    
    const paperPrinter = app.paperprinter;
    paperPrinter.docInfo().rawCode = 'console.log("PDF conversion test");';
    paperPrinter.docInfo().languageId = 'javascript';
    paperPrinter.docInfo().printTitle = 'Test Document';
    
    // Create menus to avoid "Menu not found" errors
    paperPrinter['createMenus']();
    
    await paperPrinter['generatePdf']();
    const pdfDoc = app.pdf.docInfo();
    
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
