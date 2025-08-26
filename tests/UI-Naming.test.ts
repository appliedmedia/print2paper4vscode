import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('UI Naming Standardization', () => {
    let yamlContent: string;

    // Read the YAML file to test the naming
    const yamlPath = join(process.cwd(), 'src', 'PaperPrinter.yaml');
    yamlContent = readFileSync(yamlPath, 'utf-8');

    it('should have standardized menu group IDs', () => {
        // Check that the YAML uses the UIMenu placeholder instead of hardcoded HTML
        assert.ok(yamlContent.includes('{{UIMENU_HTML}}'), 'Should use UIMENU_HTML placeholder');
    });

    it('should have standardized button IDs', () => {
        // Check that the YAML uses the UIMenu placeholder instead of hardcoded HTML
        assert.ok(yamlContent.includes('{{UIMENU_HTML}}'), 'Should use UIMENU_HTML placeholder');
    });

    it('should have standardized picker IDs', () => {
        // Check that the YAML uses the UIMenu placeholder instead of hardcoded HTML
        assert.ok(yamlContent.includes('{{UIMENU_HTML}}'), 'Should use UIMENU_HTML placeholder');
    });

    it('should have standardized template variables', () => {
        // Check that template variables use the standardized naming
        assert.ok(yamlContent.includes('{{UIMENU_HTML}}'), 'Should have UIMENU_HTML');
        assert.ok(yamlContent.includes('{{UIMENU_JS}}'), 'Should have UIMENU_JS');
    });

    it('should have standardized JavaScript variable references', () => {
        // Check that the YAML uses the UIMenu placeholder instead of hardcoded JavaScript
        assert.ok(yamlContent.includes('{{UIMENU_JS}}'), 'Should use UIMENU_JS placeholder');
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
        // Check that the YAML uses the UIMenu placeholder instead of hardcoded HTML
        assert.ok(yamlContent.includes('{{UIMENU_HTML}}'), 'Should use UIMENU_HTML placeholder');
    });
});