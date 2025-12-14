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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('Yaml', () => {
    let app;
    let tempDir;
    let yamlPath;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        tempDir = path.join((0, os_1.tmpdir)(), `yaml-test-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        yamlPath = path.join(tempDir, 'test.yaml');
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
        // Cleanup temp files
        try {
            if (fs.existsSync(yamlPath)) {
                fs.unlinkSync(yamlPath);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        }
        catch {
            // Ignore cleanup errors
        }
    });
    (0, node_test_1.it)('should load and cache YAML file', () => {
        const yamlContent = 'key1: value1\nkey2: value2';
        fs.writeFileSync(yamlPath, yamlContent);
        const yamlFactory = app.reg.getInstance("yaml");
        const yaml = yamlFactory.create({ filePath: yamlPath, dataStruct: { key1: '', key2: '' } });
        const result = yaml.get();
        assert.strictEqual(result.key1, 'value1');
        assert.strictEqual(result.key2, 'value2');
        // Should return cached value on second call
        const result2 = yaml.get();
        assert.strictEqual(result, result2); // Same object reference
    });
    (0, node_test_1.it)('should return default structure when file does not exist', () => {
        const yamlFactory = app.reg.getInstance("yaml");
        const yaml = yamlFactory.create({ filePath: path.join(tempDir, 'nonexistent.yaml'), dataStruct: { key1: 'default1', key2: 'default2' } });
        const result = yaml.get();
        assert.strictEqual(result.key1, 'default1');
        assert.strictEqual(result.key2, 'default2');
    });
    (0, node_test_1.it)('should use default when file read fails', () => {
        const yamlFactory = app.reg.getInstance("yaml");
        const yaml = yamlFactory.create({ filePath: '/invalid/path/that/does/not/exist.yaml', dataStruct: { key1: 'default' } });
        const result = yaml.get();
        assert.strictEqual(result.key1, 'default');
    });
    (0, node_test_1.it)('should clear cache on done()', () => {
        const yamlContent = 'key1: value1';
        fs.writeFileSync(yamlPath, yamlContent);
        const yamlFactory = app.reg.getInstance("yaml");
        const yaml = yamlFactory.create({ filePath: yamlPath, dataStruct: { key1: '' } });
        const result1 = yaml.get();
        assert.strictEqual(result1.key1, 'value1');
        yaml.done();
        // Update file
        fs.writeFileSync(yamlPath, 'key1: newvalue');
        // After done(), should reload
        const result2 = yaml.get();
        assert.strictEqual(result2.key1, 'newvalue');
    });
    (0, node_test_1.it)('should handle complex YAML structures', () => {
        const yamlContent = `
nested:
  key1: value1
  key2: value2
array:
  - item1
  - item2
`;
        fs.writeFileSync(yamlPath, yamlContent);
        const yamlFactory = app.reg.getInstance('yaml');
        const yaml = yamlFactory.create({ filePath: yamlPath, dataStruct: {} });
        const result = yaml.get();
        assert.ok(result.nested);
        assert.strictEqual(result.nested.key1, 'value1');
        assert.ok(Array.isArray(result.array));
        assert.strictEqual(result.array.length, 2);
    });
});
//# sourceMappingURL=Yaml.test.js.map