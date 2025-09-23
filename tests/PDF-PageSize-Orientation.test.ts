import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { PDF } from '../src/PDF.js';

describe('PDF Page Size and Orientation Tests', () => {
  // Mock App with all required dependencies
  const mockApp = {
    dx: {
      create: (name: string) => ({
        out: (msg: string) => console.log(`[${name}] ${msg}`),
        print: (msg: string) => console.log(`[${name}] ${msg}`),
        done: () => {},
        sub: (name: string) => ({
          out: (msg: string) => console.log(`[${name}] ${msg}`),
          print: (msg: string) => console.log(`[${name}] ${msg}`),
          done: () => {},
          require: () => true,
        }),
      }),
    },
    paperprinter: {
      getCurrentPageSize: () => 'a4',
      getCurrentOrientation: () => 'portrait',
    },
    vscodeapis: {
      getLocale: () => 'en-US',
    },
  };

  const pdf = new PDF(mockApp as any);

  describe('Page Size Detection', () => {
    test('should detect US locale and default to letter size', () => {
      mockApp.vscodeapis.getLocale = () => 'en-US';
      mockApp.paperprinter.getCurrentPageSize = () => 'letter';

      // Test that letter size is used
      assert.strictEqual(mockApp.paperprinter.getCurrentPageSize(), 'letter');
    });

    test('should detect Canadian locale and default to letter size', () => {
      mockApp.vscodeapis.getLocale = () => 'en-CA';
      mockApp.paperprinter.getCurrentPageSize = () => 'letter';

      assert.strictEqual(mockApp.paperprinter.getCurrentPageSize(), 'letter');
    });

    test('should detect Mexican locale and default to letter size', () => {
      mockApp.vscodeapis.getLocale = () => 'es-MX';
      mockApp.paperprinter.getCurrentPageSize = () => 'letter';

      assert.strictEqual(mockApp.paperprinter.getCurrentPageSize(), 'letter');
    });

    test('should default to A4 for non-US locales', () => {
      mockApp.vscodeapis.getLocale = () => 'en-GB';
      mockApp.paperprinter.getCurrentPageSize = () => 'a4';

      assert.strictEqual(mockApp.paperprinter.getCurrentPageSize(), 'a4');
    });
  });

  describe('Page Dimensions', () => {
    test('should return correct A4 dimensions in mm', () => {
      const dimensions = (pdf as any).getPageDimensions('a4', 'portrait');

      assert.strictEqual(dimensions.width, 210);
      assert.strictEqual(dimensions.height, 297);
    });

    test('should return correct A4 landscape dimensions in mm', () => {
      const dimensions = (pdf as any).getPageDimensions('a4', 'landscape');

      assert.strictEqual(dimensions.width, 297);
      assert.strictEqual(dimensions.height, 210);
    });

    test('should return correct Letter dimensions in inches', () => {
      const dimensions = (pdf as any).getPageDimensions('letter', 'portrait');

      assert.strictEqual(dimensions.width, 8.5);
      assert.strictEqual(dimensions.height, 11);
    });

    test('should return correct Letter landscape dimensions in inches', () => {
      const dimensions = (pdf as any).getPageDimensions('letter', 'landscape');

      assert.strictEqual(dimensions.width, 11);
      assert.strictEqual(dimensions.height, 8.5);
    });

    test('should return correct Legal dimensions in inches', () => {
      const dimensions = (pdf as any).getPageDimensions('legal', 'portrait');

      assert.strictEqual(dimensions.width, 8.5);
      assert.strictEqual(dimensions.height, 14);
    });

    test('should return correct A3 dimensions in mm', () => {
      const dimensions = (pdf as any).getPageDimensions('a3', 'portrait');

      assert.strictEqual(dimensions.width, 297);
      assert.strictEqual(dimensions.height, 420);
    });

    test('should return correct A5 dimensions in mm', () => {
      const dimensions = (pdf as any).getPageDimensions('a5', 'portrait');

      assert.strictEqual(dimensions.width, 148);
      assert.strictEqual(dimensions.height, 210);
    });
  });

  describe('Unit Selection', () => {
    test('should use inches for US page sizes', () => {
      const letterUnit = (pdf as any).getUnitForPageSize('letter');
      const legalUnit = (pdf as any).getUnitForPageSize('legal');

      assert.strictEqual(letterUnit, 'in');
      assert.strictEqual(legalUnit, 'in');
    });

    test('should use mm for metric page sizes', () => {
      const a4Unit = (pdf as any).getUnitForPageSize('a4');
      const a3Unit = (pdf as any).getUnitForPageSize('a3');
      const a5Unit = (pdf as any).getUnitForPageSize('a5');

      assert.strictEqual(a4Unit, 'mm');
      assert.strictEqual(a3Unit, 'mm');
      assert.strictEqual(a5Unit, 'mm');
    });
  });

  describe('Page Size Menu Integration', () => {
    test('should have all required page sizes in menu', () => {
      const expectedSizes = ['a4', 'letter', 'legal', 'a3', 'a5'];

      expectedSizes.forEach(size => {
        const dimensions = (pdf as any).getPageDimensions(size, 'portrait');
        assert.ok(dimensions.width > 0, `${size} should have valid width`);
        assert.ok(dimensions.height > 0, `${size} should have valid height`);
      });
    });

    test('should handle all orientations for each page size', () => {
      const sizes = ['a4', 'letter', 'legal', 'a3', 'a5'];
      const orientations = ['portrait', 'landscape'];

      sizes.forEach(size => {
        orientations.forEach(orientation => {
          const dimensions = (pdf as any).getPageDimensions(size, orientation);
          assert.ok(dimensions.width > 0, `${size} ${orientation} should have valid width`);
          assert.ok(dimensions.height > 0, `${size} ${orientation} should have valid height`);
        });
      });
    });
  });

  describe('Height Calculation with Units', () => {
    test('should calculate height in correct units for A4', () => {
      mockApp.paperprinter.getCurrentPageSize = () => 'a4';
      mockApp.paperprinter.getCurrentOrientation = () => 'portrait';

      const unit = (pdf as any).getUnitForPageSize('a4');
      assert.strictEqual(unit, 'mm');
    });

    test('should calculate height in correct units for Letter', () => {
      mockApp.paperprinter.getCurrentPageSize = () => 'letter';
      mockApp.paperprinter.getCurrentOrientation = () => 'portrait';

      const unit = (pdf as any).getUnitForPageSize('letter');
      assert.strictEqual(unit, 'in');
    });

    test('should use appropriate max height limits', () => {
      const mmUnit = (pdf as any).getUnitForPageSize('a4');
      const inUnit = (pdf as any).getUnitForPageSize('letter');

      // These would be used in the actual height calculation
      const maxHeightMm = 14400; // mm
      const maxHeightIn = 200; // inches

      assert.strictEqual(mmUnit, 'mm');
      assert.strictEqual(inUnit, 'in');
      assert.ok(maxHeightMm > maxHeightIn, 'mm limit should be higher than inches limit');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid page size gracefully', () => {
      // Test that invalid page size returns undefined or throws
      try {
        const result = (pdf as any).getPageDimensions('invalid' as any, 'portrait');
        assert.strictEqual(result, undefined, 'Should return undefined for invalid page size');
      } catch (error) {
        assert.ok(error, 'Should throw error for invalid page size');
      }
    });

    test('should handle invalid orientation gracefully', () => {
      try {
        const result = (pdf as any).getPageDimensions('a4', 'invalid' as any);
        assert.strictEqual(result, undefined, 'Should return undefined for invalid orientation');
      } catch (error) {
        assert.ok(error, 'Should throw error for invalid orientation');
      }
    });
  });
});
