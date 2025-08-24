import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { join } from 'path';
describe('UI Naming Standardization', () => {
    let yamlContent;
    // Read the YAML file to test the naming
    const yamlPath = join(process.cwd(), 'src', 'PaperPrinter.yaml');
    yamlContent = readFileSync(yamlPath, 'utf-8');
    it('should have standardized menu group IDs', () => {
        // Check that all menu groups use the standardized naming
        assert.ok(yamlContent.includes('id="menuPrint"'), 'Should have menuPrint');
        assert.ok(yamlContent.includes('id="menuThemes"'), 'Should have menuThemes');
        assert.ok(yamlContent.includes('id="menuText"'), 'Should have menuText');
        assert.ok(yamlContent.includes('id="menuHistory"'), 'Should have menuHistory');
    });
    it('should have standardized button IDs', () => {
        // Check that all buttons use the standardized naming
        assert.ok(yamlContent.includes('id="menuPrint-btn"'), 'Should have menuPrint-btn');
        assert.ok(yamlContent.includes('id="menuThemes-btn"'), 'Should have menuThemes-btn');
        assert.ok(yamlContent.includes('id="menuText-btn"'), 'Should have menuText-btn');
        assert.ok(yamlContent.includes('id="menuHistory-btn"'), 'Should have menuHistory-btn');
    });
    it('should have standardized picker IDs', () => {
        // Check that all pickers use the standardized naming
        assert.ok(yamlContent.includes('id="menuPrint-picker"'), 'Should have menuPrint-picker');
        assert.ok(yamlContent.includes('id="menuThemes-picker"'), 'Should have menuThemes-picker');
        assert.ok(yamlContent.includes('id="menuText-picker"'), 'Should have menuText-picker');
        assert.ok(yamlContent.includes('id="menuHistory-picker"'), 'Should have menuHistory-picker');
    });
    it('should have standardized template variables', () => {
        // Check that template variables use the standardized naming
        assert.ok(yamlContent.includes('{{PRINT_PICKER_LIST}}'), 'Should have PRINT_PICKER_LIST');
        assert.ok(yamlContent.includes('{{THEMES_PICKER_LIST}}'), 'Should have THEMES_PICKER_LIST');
        assert.ok(yamlContent.includes('{{TEXT_PICKER_LIST}}'), 'Should have TEXT_PICKER_LIST');
        assert.ok(yamlContent.includes('{{HISTORY_PICKER_LIST}}'), 'Should have HISTORY_PICKER_LIST');
    });
    it('should have standardized JavaScript variable references', () => {
        // Check that JavaScript variables use the standardized naming
        assert.ok(yamlContent.includes('menuPrintPicker'), 'Should reference menuPrintPicker');
        assert.ok(yamlContent.includes('menuThemesPicker'), 'Should reference menuThemesPicker');
        assert.ok(yamlContent.includes('menuTextPicker'), 'Should reference menuTextPicker');
        assert.ok(yamlContent.includes('menuHistoryPicker'), 'Should reference menuHistoryPicker');
    });
    it('should not contain old naming conventions', () => {
        // Ensure old naming is completely removed
        assert.ok(!yamlContent.includes('grp-print'), 'Should not have old grp-print');
        assert.ok(!yamlContent.includes('grp-theme'), 'Should not have old grp-theme');
        assert.ok(!yamlContent.includes('grp-text'), 'Should not have old grp-text');
        assert.ok(!yamlContent.includes('grp-history'), 'Should not have old grp-history');
        assert.ok(!yamlContent.includes('btn-print'), 'Should not have old btn-print');
        assert.ok(!yamlContent.includes('btn-theme'), 'Should not have old btn-theme');
        assert.ok(!yamlContent.includes('btn-text'), 'Should not have old btn-text');
        assert.ok(!yamlContent.includes('btn-history'), 'Should not have old btn-history');
        assert.ok(!yamlContent.includes('dd-print'), 'Should not have old dd-print');
        assert.ok(!yamlContent.includes('dd-theme'), 'Should not have old dd-theme');
        assert.ok(!yamlContent.includes('dd-text'), 'Should not have old dd-text');
        assert.ok(!yamlContent.includes('dd-history'), 'Should not have old dd-history');
        assert.ok(!yamlContent.includes('{{THEMES}}'), 'Should not have old {{THEMES}}');
        assert.ok(!yamlContent.includes('{{TEXT_SIZES}}'), 'Should not have old {{TEXT_SIZES}}');
        assert.ok(!yamlContent.includes('{{HISTORY_ITEMS}}'), 'Should not have old {{HISTORY_ITEMS}}');
    });
    it('should have consistent data attributes', () => {
        // Check that data attributes are consistent
        assert.ok(yamlContent.includes('data-target="dd-menuPrint"'), 'Should target dd-menuPrint');
        assert.ok(yamlContent.includes('data-target="dd-menuThemes"'), 'Should target dd-menuThemes');
        assert.ok(yamlContent.includes('data-target="dd-menuText"'), 'Should target dd-menuText');
        assert.ok(yamlContent.includes('data-target="dd-menuHistory"'), 'Should target dd-menuHistory');
        assert.ok(yamlContent.includes('data-group="grp-menuPrint"'), 'Should group grp-menuPrint');
        assert.ok(yamlContent.includes('data-group="grp-menuThemes"'), 'Should group grp-menuThemes');
        assert.ok(yamlContent.includes('data-group="grp-menuText"'), 'Should group grp-menuText');
        assert.ok(yamlContent.includes('data-group="grp-menuHistory"'), 'Should group grp-menuHistory');
    });
});
//# sourceMappingURL=UI-Naming.test.js.map