import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('PaperPrinter Variable Naming Standardization', () => {
  let tsContent: string;

  // Read the TypeScript file to test the naming
  const tsPath = join(process.cwd(), 'src', 'PaperPrinter.ts');
  tsContent = readFileSync(tsPath, 'utf-8');

  it('should use UIMenu system for theme picker list', () => {
    // Check that the property is named correctly
    assert.ok(
      tsContent.includes('private themePickerList:'),
      'Should have themePickerList property'
    );

    // Check that the variable is named correctly
    assert.ok(tsContent.includes('this.themePickerList ='), 'Should assign to themePickerList');

    // Check that it uses UIMenu system
    assert.ok(
      tsContent.includes('this.app.uimenumgr.getTemplateVariableMappings()'),
      'Should use UIMenu system'
    );
  });

  it('should use UIMenu system for text picker list', () => {
    // Check that it uses UIMenu system
    assert.ok(
      tsContent.includes('this.app.uimenumgr.getTemplateVariableMappings()'),
      'Should use UIMenu system'
    );

    // Check that the method exists
    assert.ok(
      tsContent.includes('private generatePickerList_Text!'),
      'Should have generatePickerList_Text method'
    );
  });

  it('should use UIMenu system with proper method naming', () => {
    // Check that the UIMenu methods exist
    assert.ok(
      tsContent.includes('private generatePickerList_Print!'),
      'Should have generatePickerList_Print method'
    );
    assert.ok(
      tsContent.includes('private generatePickerList_Text!'),
      'Should have generatePickerList_Text method'
    );
    assert.ok(
      tsContent.includes('private generatePickerList_Themes!'),
      'Should have generatePickerList_Themes method'
    );
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
    assert.ok(
      tsContent.includes("'light|bright|day', 'top'"),
      'Should pass correct filter and position'
    );
  });

  it('should use UIMenu template variable mappings', () => {
    // Check that it uses UIMenu system for template mappings
    assert.ok(
      tsContent.includes('this.app.uimenumgr.getTemplateVariableMappings()'),
      'Should use UIMenu system'
    );
    assert.ok(tsContent.includes('...templateMappings'), 'Should spread template mappings');
  });
});
