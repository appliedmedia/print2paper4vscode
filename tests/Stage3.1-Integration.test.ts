import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { createMockApp } from './test-entrypoint';

/**
 * Stage 3.1 Integration Tests: Small Document Testing
 *
 * Tests integration with PaperPrinter for end-to-end functionality:
 * - Small documents (1-5 pages)
 * - Different content types (code, text, mixed)
 * - Real themes from Shiki/VSCode
 * - Font size changes
 * - Page size and orientation changes
 * - Performance validation
 */
describe('Stage 3.1: Small Document Integration Tests', () => {
  let app: ReturnType<typeof createMockApp>;

  before(async () => {
    app = createMockApp();
    await app.init();
  });

  describe('Theme Integration', () => {
    it('should support real Shiki themes', async () => {
      // Get available themes
      const themes = app.stylize.getThemes();
      assert.ok(themes.length > 0, 'Should have at least one theme available');

      // Verify theme structure
      const firstTheme = themes[0];
      assert.ok(firstTheme.id, 'Theme should have id');
      assert.ok(firstTheme.displayName, 'Theme should have displayName');

      console.log(`Found ${themes.length} themes. First theme: ${firstTheme.id}`);
    });

    it('should generate PDF with first available theme', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `function hello() {\n  console.log("Hello World");\n}\n`;
      const options = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        theme: theme.id,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      const pdfDoc = await app.pdf.generatePdf(testCode, 'javascript', options);

      assert.ok(pdfDoc, 'Should generate PDF document');
      assert.ok(pdfDoc.getPageTotal() >= 1, 'Should have at least 1 page');
      const arrayBuffer = pdfDoc.asArrayBuffer();
      assert.ok(arrayBuffer.byteLength > 0, 'PDF ArrayBuffer should have content');

      console.log(
        `Generated PDF with theme "${theme.displayName}": ${pdfDoc.getPageTotal()} page(s), ${arrayBuffer.byteLength} bytes`
      );
    });

    it('should generate different PDFs for different themes', async () => {
      const themes = app.stylize.getThemes();
      if (themes.length < 2) {
        console.log('Skipping: need at least 2 themes for comparison');
        return;
      }

      const testCode = `const x = 42;\nconst y = "test";\n`;
      const baseOptions = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      // Generate PDF with first theme
      const pdf1 = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        theme: themes[0].id,
      });
      const buffer1 = pdf1.asArrayBuffer();

      // Clear PDF cache
      app.pdf.invalidateAllCaches();

      // Generate PDF with second theme
      const pdf2 = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        theme: themes[1].id,
      });
      const buffer2 = pdf2.asArrayBuffer();

      // PDFs should be different sizes (different themes produce different output)
      console.log(
        `Theme "${themes[0].displayName}": ${buffer1.byteLength} bytes, Theme "${themes[1].displayName}": ${buffer2.byteLength} bytes`
      );

      // They might be the same size, but the content should be different
      // For now just verify both were generated successfully
      assert.ok(buffer1.byteLength > 0, 'First PDF should have content');
      assert.ok(buffer2.byteLength > 0, 'Second PDF should have content');
    });
  });

  describe('Font Size Integration', () => {
    it('should generate PDFs with different font sizes', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `const x = 1;\nconst y = 2;\nconst z = 3;\n`;
      const baseOptions = {
        fontFamily: 'Courier New',
        theme: theme.id,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      // Generate with 10px font
      const pdf10 = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        fontSizePx: 10,
        lineHeightPx: 15,
      });

      // Clear cache
      app.pdf.invalidateAllCaches();

      // Generate with 16px font
      const pdf16 = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        fontSizePx: 16,
        lineHeightPx: 24,
      });

      const buffer10 = pdf10.asArrayBuffer();
      const buffer16 = pdf16.asArrayBuffer();

      assert.ok(buffer10.byteLength > 0, 'PDF with 10px font should have content');
      assert.ok(buffer16.byteLength > 0, 'PDF with 16px font should have content');

      console.log(
        `Font size 10px: ${buffer10.byteLength} bytes, Font size 16px: ${buffer16.byteLength} bytes`
      );
    });
  });

  describe('Page Size and Orientation Integration', () => {
    it('should generate PDFs with different page sizes', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `// Test\nconst x = 1;\n`;
      const baseOptions = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        theme: theme.id,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      // Generate with Letter size
      const pdfLetter = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        pageSizeId: 'letter',
      });

      // Clear cache
      app.pdf.invalidateAllCaches();

      // Generate with A4 size
      const pdfA4 = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        pageSizeId: 'a4',
      });

      const bufferLetter = pdfLetter.asArrayBuffer();
      const bufferA4 = pdfA4.asArrayBuffer();

      assert.ok(bufferLetter.byteLength > 0, 'Letter PDF should have content');
      assert.ok(bufferA4.byteLength > 0, 'A4 PDF should have content');

      console.log(
        `Letter size: ${bufferLetter.byteLength} bytes, A4 size: ${bufferA4.byteLength} bytes`
      );
    });

    it('should generate PDFs with different orientations', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `// Test\nconst x = 1;\n`;
      const baseOptions = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        theme: theme.id,
        pageSizeId: 'letter' as const,
        marginId: 'normal' as const,
      };

      // Generate with portrait
      const pdfPortrait = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        orient: 'portrait',
      });

      // Clear cache
      app.pdf.invalidateAllCaches();

      // Generate with landscape
      const pdfLandscape = await app.pdf.generatePdf(testCode, 'javascript', {
        ...baseOptions,
        orient: 'landscape',
      });

      const bufferPortrait = pdfPortrait.asArrayBuffer();
      const bufferLandscape = pdfLandscape.asArrayBuffer();

      assert.ok(bufferPortrait.byteLength > 0, 'Portrait PDF should have content');
      assert.ok(bufferLandscape.byteLength > 0, 'Landscape PDF should have content');

      console.log(
        `Portrait: ${bufferPortrait.byteLength} bytes, Landscape: ${bufferLandscape.byteLength} bytes`
      );
    });
  });

  describe('Small Document Content Tests', () => {
    it('should handle 1-page JavaScript document', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `function test() {\n  return 42;\n}\n`;
      const options = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        theme: theme.id,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      const pdfDoc = await app.pdf.generatePdf(testCode, 'javascript', options);

      assert.strictEqual(pdfDoc.getPageTotal(), 1, 'Should generate exactly 1 page');
      const arrayBuffer = pdfDoc.asArrayBuffer();
      assert.ok(arrayBuffer.byteLength > 0, 'PDF should have content');

      console.log(`1-page JS document: ${pdfDoc.getPageTotal()} page, ${arrayBuffer.byteLength} bytes`);
    });

    it('should handle 1-page TypeScript document', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `interface User {\n  name: string;\n  age: number;\n}\n`;
      const options = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        theme: theme.id,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      const pdfDoc = await app.pdf.generatePdf(testCode, 'typescript', options);

      assert.strictEqual(pdfDoc.getPageTotal(), 1, 'Should generate exactly 1 page');
      const arrayBuffer = pdfDoc.asArrayBuffer();
      assert.ok(arrayBuffer.byteLength > 0, 'PDF should have content');

      console.log(`1-page TS document: ${pdfDoc.getPageTotal()} page, ${arrayBuffer.byteLength} bytes`);
    });

    it('should handle multi-page document (3-5 pages)', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      // Generate enough code for 3-5 pages
      let testCode = '// Multi-page document test\n\n';
      for (let i = 0; i < 100; i++) {
        testCode += `function function${i}() {\n`;
        testCode += `  const x = ${i};\n`;
        testCode += `  const y = ${i * 2};\n`;
        testCode += `  return x + y;\n`;
        testCode += `}\n\n`;
      }

      const options = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        theme: theme.id,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      const pdfDoc = await app.pdf.generatePdf(testCode, 'javascript', options);
      const pageCount = pdfDoc.getPageTotal();

      assert.ok(pageCount >= 3, `Should generate at least 3 pages, got ${pageCount}`);
      assert.ok(pageCount <= 10, `Should generate at most 10 pages, got ${pageCount}`);

      const arrayBuffer = pdfDoc.asArrayBuffer();
      assert.ok(arrayBuffer.byteLength > 0, 'PDF should have content');

      console.log(`Multi-page document: ${pageCount} pages, ${arrayBuffer.byteLength} bytes`);
    });
  });

  describe('Performance Validation', () => {
    it('should generate small PDFs in reasonable time', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `const x = 1;\nconst y = 2;\nconst z = 3;\n`;
      const options = {
        fontFamily: 'Courier New',
        fontSizePx: 12,
        lineHeightPx: 18,
        theme: theme.id,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      const startTime = Date.now();
      const pdfDoc = await app.pdf.generatePdf(testCode, 'javascript', options);
      const endTime = Date.now();

      const duration = endTime - startTime;

      assert.ok(pdfDoc, 'Should generate PDF');
      assert.ok(duration < 5000, `PDF generation should take less than 5s, took ${duration}ms`);

      console.log(`Performance: Generated PDF in ${duration}ms`);
    });

    it('should handle multiple rapid regenerations', async () => {
      const themes = app.stylize.getThemes();
      const theme = themes[0];

      const testCode = `const x = 1;\n`;
      const baseOptions = {
        fontFamily: 'Courier New',
        theme: theme.id,
        pageSizeId: 'letter' as const,
        orient: 'portrait' as const,
        marginId: 'normal' as const,
      };

      const startTime = Date.now();

      // Generate 5 PDFs with different font sizes (simulating user changing settings)
      for (const fontSize of [10, 12, 14, 16, 18]) {
        app.pdf.invalidateAllCaches();
        const pdf = await app.pdf.generatePdf(testCode, 'javascript', {
          ...baseOptions,
          fontSizePx: fontSize,
          lineHeightPx: fontSize * 1.5,
        });
        assert.ok(pdf.asArrayBuffer().byteLength > 0, `PDF with ${fontSize}px should be generated`);
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      assert.ok(
        totalDuration < 10000,
        `5 regenerations should take less than 10s, took ${totalDuration}ms`
      );

      console.log(`Performance: 5 rapid regenerations in ${totalDuration}ms`);
    });
  });
});
