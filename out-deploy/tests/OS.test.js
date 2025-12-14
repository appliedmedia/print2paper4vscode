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
const OS_js_1 = require("../src/OS.js");
const App_js_1 = require("../src/App.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('OS Base Class', () => {
    let app;
    let os;
    let tempDir;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        os = OS_js_1.OS.create({ reg: app.reg });
        tempDir = path.join((0, os_1.tmpdir)(), `os-test-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        os.done();
        app.done();
        // Cleanup temp files
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        }
        catch {
            // Ignore cleanup errors
        }
    });
    (0, node_test_1.describe)('file operations', () => {
        (0, node_test_1.it)('should write and read files', () => {
            const filePath = path.join(tempDir, 'test.txt');
            const content = 'test content';
            os.fileWrite({ filePath, content });
            assert.ok(os.exists(filePath));
            const readContent = os.fileRead({ path: filePath });
            assert.strictEqual(readContent, content);
        });
        (0, node_test_1.it)('should delete files', () => {
            const filePath = path.join(tempDir, 'delete.txt');
            os.fileWrite({ filePath, content: 'content' });
            assert.ok(os.exists(filePath));
            os.fileDelete(filePath);
            assert.ok(!os.exists(filePath));
        });
        (0, node_test_1.it)('should handle deleting non-existent files gracefully', () => {
            const filePath = path.join(tempDir, 'nonexistent.txt');
            // Should not throw
            os.fileDelete(filePath);
        });
    });
    (0, node_test_1.describe)('directory operations', () => {
        (0, node_test_1.it)('should create directories', () => {
            const dirPath = path.join(tempDir, 'subdir');
            os.ensureDir(dirPath);
            assert.ok(os.exists(dirPath));
        });
        (0, node_test_1.it)('should create nested directories', () => {
            const dirPath = path.join(tempDir, 'nested', 'deep', 'path');
            os.ensureDir(dirPath);
            assert.ok(os.exists(dirPath));
        });
    });
    (0, node_test_1.describe)('path operations', () => {
        (0, node_test_1.it)('should join paths correctly', () => {
            const result = os.pathJoin('a', 'b', 'c');
            assert.ok(result.includes('a'));
            assert.ok(result.includes('b'));
            assert.ok(result.includes('c'));
        });
        (0, node_test_1.it)('should handle undefined path parts', () => {
            const result = os.pathJoin('a', undefined, 'c');
            assert.ok(result.includes('a'));
            assert.ok(result.includes('c'));
            assert.ok(!result.includes('undefined'));
        });
        (0, node_test_1.it)('should get basename', () => {
            const result = os.pathBasename('/path/to/file.txt');
            assert.strictEqual(result, 'file.txt');
        });
        (0, node_test_1.it)('should get dirname', () => {
            const result = os.pathDirname('/path/to/file.txt');
            assert.ok(result.includes('/path/to'));
        });
    });
    (0, node_test_1.describe)('fileRead with JSON', () => {
        (0, node_test_1.it)('should parse JSON files', () => {
            const jsonPath = path.join(tempDir, 'test.json');
            const jsonContent = { key: 'value', number: 42 };
            os.fileWrite({ filePath: jsonPath, content: JSON.stringify(jsonContent) });
            const parsed = os.fileRead({ path: jsonPath });
            assert.strictEqual(parsed?.key, 'value');
            assert.strictEqual(parsed?.number, 42);
        });
        (0, node_test_1.it)('should return specific key from JSON', () => {
            const jsonPath = path.join(tempDir, 'test.json');
            const jsonContent = { key1: 'value1', key2: 'value2' };
            os.fileWrite({ filePath: jsonPath, content: JSON.stringify(jsonContent) });
            const value = os.fileRead({ path: jsonPath, key: 'key1' });
            assert.strictEqual(value, 'value1');
        });
    });
    (0, node_test_1.describe)('fileRead with YAML', () => {
        (0, node_test_1.it)('should parse YAML files', () => {
            const yamlPath = path.join(tempDir, 'test.yaml');
            const yamlContent = 'key1: value1\nkey2: value2';
            os.fileWrite({ filePath: yamlPath, content: yamlContent });
            const parsed = os.fileRead({ path: yamlPath });
            assert.strictEqual(parsed?.key1, 'value1');
            assert.strictEqual(parsed?.key2, 'value2');
        });
        (0, node_test_1.it)('should return specific key from YAML', () => {
            const yamlPath = path.join(tempDir, 'test.yaml');
            const yamlContent = 'key1: value1\nkey2: value2';
            os.fileWrite({ filePath: yamlPath, content: yamlContent });
            const value = os.fileRead({ path: yamlPath, key: 'key1' });
            assert.strictEqual(value, 'value1');
        });
    });
    (0, node_test_1.describe)('fileRead with plain text', () => {
        (0, node_test_1.it)('should read plain text files', () => {
            const txtPath = path.join(tempDir, 'test.txt');
            const content = 'plain text content';
            os.fileWrite({ filePath: txtPath, content });
            const readContent = os.fileRead({ path: txtPath });
            assert.strictEqual(readContent, content);
        });
        (0, node_test_1.it)('should return undefined for non-existent files', () => {
            const result = os.fileRead({ path: '/nonexistent/path/file.txt' });
            assert.strictEqual(result, undefined);
        });
    });
    (0, node_test_1.describe)('system information', () => {
        (0, node_test_1.it)('should get locale', () => {
            const locale = os.getLocale();
            assert.ok(typeof locale === 'string');
            assert.ok(locale.length > 0);
        });
        (0, node_test_1.it)('should get home directory', () => {
            const homeDir = os.getDir_Home();
            assert.ok(typeof homeDir === 'string');
            assert.ok(homeDir.length > 0);
        });
    });
    (0, node_test_1.describe)('filename sanitization', () => {
        (0, node_test_1.it)('should sanitize invalid characters', () => {
            const sanitized = os.sanitizeFileName('test<>:"/\\|?*file.txt');
            assert.ok(!sanitized.includes('<'));
            assert.ok(!sanitized.includes('>'));
            assert.ok(!sanitized.includes(':'));
        });
        (0, node_test_1.it)('should replace spaces with underscores', () => {
            const sanitized = os.sanitizeFileName('test file name.txt');
            assert.ok(sanitized.includes('_'));
            assert.ok(!sanitized.includes(' '));
        });
        (0, node_test_1.it)('should limit length to 120 characters', () => {
            const longName = 'a'.repeat(200);
            const sanitized = os.sanitizeFileName(longName);
            assert.ok(sanitized.length <= 120);
        });
        (0, node_test_1.it)('should return default for empty string', () => {
            const sanitized = os.sanitizeFileName('');
            assert.strictEqual(sanitized, 'output');
        });
    });
    (0, node_test_1.describe)('date formatting', () => {
        (0, node_test_1.it)('should format date as YYYYMMDDHHMMSS', () => {
            const formatted = os.dateAsYYYYMMDDHHMMSS();
            // Format: YYYY-MM-DD_HHMMSS.mmsa
            assert.ok(/^\d{4}-\d{2}-\d{2}_\d{2}\d{2}\d{2}\.\d{3}[ap]$/.test(formatted));
        });
    });
    (0, node_test_1.describe)('readShikiLightThemes', () => {
        (0, node_test_1.it)('should return empty array when themes directory does not exist', () => {
            const themes = os.readShikiLightThemes();
            // May return empty array if node_modules/shiki/themes doesn't exist
            assert.ok(Array.isArray(themes));
        });
    });
    (0, node_test_1.describe)('htmlSrcPathToURI', () => {
        (0, node_test_1.it)('should convert src attributes to webview URIs', async () => {
            const html = '<img src="test.png">';
            // Create a panel first so htmlSrcPathToURI can find it
            const panelId = await app.vscodeapis.getOrCreateWebviewPanel({ title: 'Test Panel', html: '<html></html>' });
            const result = os.htmlSrcPathToURI({ html, webviewPanelId: panelId });
            assert.ok(typeof result === 'string');
            // Should have converted the src path
            assert.ok(result.includes('vscode-webview') || result.includes('test.png'));
        });
    });
});
//# sourceMappingURL=OS.test.js.map