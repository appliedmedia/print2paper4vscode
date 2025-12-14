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
const OSLinux_js_1 = require("../src/OSLinux.js");
const OSWin_js_1 = require("../src/OSWin.js");
const test_utils_js_1 = require("./test-utils.js");
(0, node_test_1.describe)('OS Platform-Specific Classes', () => {
    let app;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.describe)('OSLinux', () => {
        (0, node_test_1.it)('should initialize OSLinux instance', () => {
            const osLinux = new OSLinux_js_1.OSLinux({ reg: app.reg });
            assert.ok(osLinux instanceof OSLinux_js_1.OSLinux);
            osLinux.done();
        });
        (0, node_test_1.it)('should provide Linux-specific OS keys', () => {
            const osLinux = new OSLinux_js_1.OSLinux({ reg: app.reg });
            const keys = osLinux.getOSKeys();
            assert.ok(keys, 'Should have OS keys');
            assert.strictEqual(keys['os-ctrl-cmd'], 'Ctrl', 'Linux uses Ctrl key');
            osLinux.done();
        });
        (0, node_test_1.it)('should have platform-specific file operations', () => {
            const osLinux = new OSLinux_js_1.OSLinux({ reg: app.reg });
            // Should have the required methods
            assert.ok(typeof osLinux.fileOpenInDefaultApp === 'function');
            assert.ok(typeof osLinux.fileReveal === 'function');
            assert.ok(typeof osLinux.filePrint === 'function');
            assert.ok(typeof osLinux.fileOpenPrintDialog === 'function');
            osLinux.done();
        });
    });
    (0, node_test_1.describe)('OSWin', () => {
        (0, node_test_1.it)('should initialize OSWin instance', () => {
            const osWin = new OSWin_js_1.OSWin({ reg: app.reg });
            assert.ok(osWin instanceof OSWin_js_1.OSWin);
            osWin.done();
        });
        (0, node_test_1.it)('should provide Windows-specific OS keys', () => {
            const osWin = new OSWin_js_1.OSWin({ reg: app.reg });
            const keys = osWin.getOSKeys();
            assert.ok(keys, 'Should have OS keys');
            assert.strictEqual(keys['os-ctrl-cmd'], 'Ctrl', 'Windows uses Ctrl key');
            osWin.done();
        });
        (0, node_test_1.it)('should have platform-specific file operations', () => {
            const osWin = new OSWin_js_1.OSWin({ reg: app.reg });
            // Should have the required methods
            assert.ok(typeof osWin.fileOpenInDefaultApp === 'function');
            assert.ok(typeof osWin.fileReveal === 'function');
            assert.ok(typeof osWin.filePrint === 'function');
            assert.ok(typeof osWin.fileOpenPrintDialog === 'function');
            osWin.done();
        });
    });
    (0, node_test_1.describe)('Platform Detection', () => {
        (0, node_test_1.it)('should detect platform correctly', () => {
            const platform = process.platform;
            assert.ok(['darwin', 'linux', 'win32'].includes(platform), 'Should return valid platform');
        });
        (0, node_test_1.it)('should create correct OS instance for platform', () => {
            // The app.os should be one of the platform-specific classes
            assert.ok(app.os, 'Should have OS instance');
            assert.ok(typeof app.os.fileOpenInDefaultApp === 'function');
            assert.ok(typeof app.os.fileReveal === 'function');
        });
    });
});
//# sourceMappingURL=OS-Platform.test.js.map