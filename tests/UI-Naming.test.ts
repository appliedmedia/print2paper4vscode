import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('UI Naming Standardization', () => {
    let yamlContent: string;

    // Read the YAML file to test the naming
    const yamlPath = join(process.cwd(), 'src', 'PaperPrinter.yaml');
    yamlContent = readFileSync(yamlPath, 'utf-8');

    it('should have standardized menu group IDs', () => {
        // Check that all menu groups use the standardized naming
        assert.ok(yamlContent.includes('id="grp-menuPrint"'), 'Should have grp-menuPrint');
        assert.ok(yamlContent.includes('id="grp-menuThemes"'), 'Should have grp-menuThemes');
        assert.ok(yamlContent.includes('id="grp-menuText"'), 'Should have grp-menuText');
        assert.ok(yamlContent.includes('id="grp-menuHistory"'), 'Should have grp-menuHistory');
    });

    it('should have standardized button IDs', () => {
        // Check that all buttons use the standardized naming
        assert.ok(yamlContent.includes('id="btn-menuPrint"'), 'Should have btn-menuPrint');
        assert.ok(yamlContent.includes('id="btn-menuThemes"'), 'Should have btn-menuThemes');
        assert.ok(yamlContent.includes('id="btn-menuText"'), 'Should have btn-menuText');
        assert.ok(yamlContent.includes('id="btn-menuHistory"'), 'Should have btn-menuHistory');
    });

    it('should have standardized dropdown IDs', () => {
        // Check that all dropdowns use the standardized naming
        assert.ok(yamlContent.includes('id="dd-menuPrint"'), 'Should have dd-menuPrint');
        assert.ok(yamlContent.includes('id="dd-menuThemes"'), 'Should have dd-menuThemes');
        assert.ok(yamlContent.includes('id="dd-menuText"'), 'Should have dd-menuText');
        assert.ok(yamlContent.includes('id="dd-menuHistory"'), 'Should have dd-menuHistory');
    });

    it('should have standardized template variables', () => {
        // Check that template variables use the standardized naming
        assert.ok(yamlContent.includes('{{THEME_PICKER_LIST}}'), 'Should have THEME_PICKER_LIST');
        assert.ok(yamlContent.includes('{{TEXT_PICKER_LIST}}'), 'Should have TEXT_PICKER_LIST');
        assert.ok(yamlContent.includes('{{HISTORY_PICKER_LIST}}'), 'Should have HISTORY_PICKER_LIST');
    });

    it('should have standardized JavaScript variable references', () => {
        // Check that JavaScript variables use the standardized naming
        assert.ok(yamlContent.includes('ddMenuPrint'), 'Should reference ddMenuPrint');
        assert.ok(yamlContent.includes('ddMenuThemes'), 'Should reference ddMenuThemes');
        assert.ok(yamlContent.includes('ddMenuText'), 'Should reference ddMenuText');
        assert.ok(yamlContent.includes('ddMenuHistory'), 'Should reference ddMenuHistory');
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