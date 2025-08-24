import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Stylize } from '../src/Stylize.js';
describe('Stylize', () => {
    let stylize;
    let mockApp;
    beforeEach(() => {
        mockApp = {
            vscodeapis: {
                getEditorTypography: () => ({ fontSize: 14, lineHeight: 20 })
            },
            os: {
                readExtensionYaml: () => ({ stylize_html: '<pre>{{CODE}}</pre>' }),
                templateDictReplace: (source, dictionary) => source.replace(/\{\{(\w+)\}\}/g, (match, key) => dictionary[key] || match)
            }
        };
        stylize = new Stylize(mockApp);
    });
    afterEach(async () => {
        await stylize.done();
    });
    it('should initialize with available Shiki themes', async () => {
        await stylize.init();
        const allThemes = stylize.getShikiThemes();
        // Should have many themes (Shiki v3 has 100+)
        assert.ok(allThemes.length > 10, 'Should have many themes available');
        // Should include common themes
        const themeNames = allThemes.map(t => t.id);
        assert.ok(themeNames.includes('github-light'), 'Should have GitHub light theme');
        assert.ok(themeNames.includes('github-dark'), 'Should have GitHub dark theme');
    });
    it('should filter themes by regex pattern', async () => {
        await stylize.init();
        // Test light theme filtering
        const lightThemes = stylize.getShikiThemes('light|bright|day');
        assert.ok(lightThemes.length > 0, 'Should have light themes');
        lightThemes.forEach(theme => {
            const name = theme.label.toLowerCase();
            assert.ok(name.includes('light') ||
                name.includes('bright') ||
                name.includes('day'), `Theme ${theme.label} should match light|bright|day pattern`);
        });
        // Test GitHub theme filtering
        const githubThemes = stylize.getShikiThemes('github');
        assert.ok(githubThemes.length > 0, 'Should have GitHub themes');
        githubThemes.forEach(theme => {
            assert.ok(theme.label.toLowerCase().includes('github'), `Theme ${theme.label} should contain 'github'`);
        });
    });
    it('should handle empty filter (return all themes)', async () => {
        await stylize.init();
        const allThemes = stylize.getShikiThemes();
        const filteredThemes = stylize.getShikiThemes('');
        // Empty filter should return all themes
        assert.strictEqual(allThemes.length, filteredThemes.length, 'Empty filter should return all themes');
    });
    it('should handle undefined filter (return all themes)', async () => {
        await stylize.init();
        const allThemes = stylize.getShikiThemes();
        const noFilterThemes = stylize.getShikiThemes();
        // Undefined filter should return all themes
        assert.strictEqual(allThemes.length, noFilterThemes.length, 'Undefined filter should return all themes');
    });
    it('should return themes with correct structure', async () => {
        await stylize.init();
        const themes = stylize.getShikiThemes('github');
        themes.forEach(theme => {
            assert.ok(theme.id, 'Theme should have ID');
            assert.ok(theme.label, 'Theme should have label');
            assert.strictEqual(theme.source, 'shiki', 'Theme should be from Shiki source');
            assert.strictEqual(theme.id, theme.label, 'ID and label should be the same for Shiki themes');
        });
    });
});
//# sourceMappingURL=Stylize.test.js.map