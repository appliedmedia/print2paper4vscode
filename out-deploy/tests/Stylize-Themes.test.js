"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const App_js_1 = require("../src/App.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('Stylize Simple Unit Tests', () => {
    let app;
    (0, node_test_1.beforeEach)(async () => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        // Note: Stylize no longer has init() - highlighter initialized lazily when needed
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should initialize and load Shiki themes', async () => {
        const themes = app.stylize.getShikiThemes();
        assert.ok(themes.length > 0, 'Should have Shiki themes');
        assert.ok(themes.some(t => t.id.includes('light')), 'Should have light themes');
    });
    (0, node_test_1.it)('should filter themes by regex pattern', async () => {
        const lightThemes = app.stylize.getShikiThemes('light|bright|day');
        assert.ok(lightThemes.length > 0, 'Should have light themes');
        lightThemes.forEach(theme => {
            const name = theme.displayName.toLowerCase();
            assert.ok(name.includes('light') || name.includes('bright') || name.includes('day'), `Theme ${theme.displayName} should match filter`);
        });
    });
    (0, node_test_1.it)('should get all themes including Shiki themes', async () => {
        const allThemes = app.stylize.getThemes();
        assert.ok(allThemes.length > 0, 'Should have themes');
        // Themes should have required structure
        const theme = allThemes[0];
        assert.ok(theme.id, 'Theme should have ID');
        assert.ok(theme.displayName, 'Theme should have displayName');
    });
    (0, node_test_1.it)('should tokenize code with a theme', async () => {
        const code = 'const x = 42;';
        const result = await app.stylize.tokenize({ code, languageId: 'javascript', theme: 'github-light' });
        assert.ok(result.tokens, 'Should return tokens');
        assert.ok(Array.isArray(result.tokens), 'Tokens should be array');
        assert.ok(result.tokens.length > 0, 'Should have tokens');
        assert.ok(Array.isArray(result.tokens[0]), 'Each line should be array of tokens');
    });
    (0, node_test_1.it)('should resolve active theme', async () => {
        const theme = app.stylize.resolveActiveTheme();
        assert.ok(typeof theme === 'string', 'Should return theme ID');
        assert.ok(theme.length > 0, 'Theme ID should not be empty');
    });
    (0, node_test_1.it)('should get font family from theme', async () => {
        const themes = app.stylize.getThemes();
        if (themes.length > 0) {
            const fontFamily = app.stylize.getFontFamilyFromTheme(themes[0]);
            assert.ok(typeof fontFamily === 'string', 'Should return font family string');
        }
    });
    (0, node_test_1.it)('should convert VSCode theme to Shiki format', async () => {
        const vscodeTheme = {
            name: 'test-theme',
            colors: {
                'editor.background': '#ffffff',
                'editor.foreground': '#000000',
            },
            tokenColors: [
                {
                    scope: 'keyword',
                    settings: {
                        foreground: '#0000ff',
                    },
                },
            ],
        };
        const converted = app.stylize.convertVSCodeThemeToShiki(vscodeTheme);
        assert.ok(converted, 'Should convert theme');
        assert.strictEqual(converted.name, 'test-theme', 'Should preserve name');
        assert.ok(converted.colors, 'Should have colors');
        assert.ok(Array.isArray(converted.tokenColors), 'Should have token colors');
    });
    (0, node_test_1.it)('should handle empty filter to return all themes', async () => {
        const allThemes = app.stylize.getShikiThemes();
        const filteredThemes = app.stylize.getShikiThemes('');
        assert.strictEqual(allThemes.length, filteredThemes.length, 'Empty filter should return all');
    });
});
//# sourceMappingURL=Stylize-Themes.test.js.map