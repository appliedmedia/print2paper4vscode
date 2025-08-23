import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('PaperPrinter Variable Naming Standardization', () => {
    let tsContent: string;

    // Read the TypeScript file to test the naming
    const tsPath = join(process.cwd(), 'src', 'PaperPrinter.ts');
    tsContent = readFileSync(tsPath, 'utf-8');

    it('should use standardized variable names for theme picker list', () => {
        // Check that the property is named correctly
        assert.ok(tsContent.includes('private themePickerList:'), 'Should have themePickerList property');
        
        // Check that the variable is named correctly
        assert.ok(tsContent.includes('this.themePickerList ='), 'Should assign to themePickerList');
        
        // Check that template rendering uses correct variable name
        assert.ok(tsContent.includes('THEME_PICKER_LIST: themePickerList'), 'Should pass THEME_PICKER_LIST to template');
    });

    it('should use standardized variable names for text picker list', () => {
        // Check that the variable is named correctly
        assert.ok(tsContent.includes('const textPickerList ='), 'Should declare textPickerList');
        
        // Check that template rendering uses correct variable name
        assert.ok(tsContent.includes('TEXT_PICKER_LIST: textPickerList'), 'Should pass TEXT_PICKER_LIST to template');
    });

    it('should use standardized variable names for history picker list', () => {
        // Check that the variable is named correctly
        assert.ok(tsContent.includes('const historyPickerList ='), 'Should declare historyPickerList');
        
        // Check that template rendering uses correct variable name
        assert.ok(tsContent.includes('HISTORY_PICKER_LIST: historyPickerList'), 'Should pass HISTORY_PICKER_LIST to template');
    });

    it('should not contain old variable naming conventions', () => {
        // Ensure old naming is completely removed
        assert.ok(!tsContent.includes('availableThemes'), 'Should not have old availableThemes');
        assert.ok(!tsContent.includes('themesMarkup'), 'Should not have old themesMarkup');
        assert.ok(!tsContent.includes('textSizesMarkup'), 'Should not have old textSizesMarkup');
        assert.ok(!tsContent.includes('historyItems'), 'Should not have old historyItems');
    });

    it('should use correct method calls for theme composition', () => {
        // Check that it calls the standardized method
        assert.ok(tsContent.includes('this.app.stylize.getThemes('), 'Should call stylize.getThemes');
        
        // Check that it passes the correct parameters
        assert.ok(tsContent.includes("'light|bright|day', 'top'"), 'Should pass correct filter and position');
    });

    it('should have consistent template variable mapping', () => {
        // Check that all template variables are properly mapped
        const templateVars = [
            'THEME_PICKER_LIST: themePickerList',
            'TEXT_PICKER_LIST: textPickerList', 
            'HISTORY_PICKER_LIST: historyPickerList'
        ];
        
        templateVars.forEach(varMapping => {
            assert.ok(tsContent.includes(varMapping), `Should have template mapping: ${varMapping}`);
        });
    });
});