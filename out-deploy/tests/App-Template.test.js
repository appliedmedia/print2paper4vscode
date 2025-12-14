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
(0, node_test_1.describe)('Template Dictionary Replacement', () => {
    let app;
    let utils;
    (0, node_test_1.beforeEach)(() => {
        app = new App_js_1.App({ context: test_utils_js_1.mockContext, vscode: test_utils_js_1.mockVSCode });
        utils = app.reg.getInstance('utils');
    });
    (0, node_test_1.afterEach)(() => {
        app.done();
    });
    (0, node_test_1.it)('should replace all placeholders with dictionary values', () => {
        const source = 'Hello {{NAME}}, your age is {{AGE}} and you live in {{CITY}}';
        const dictionary = {
            NAME: 'John',
            AGE: '30',
            CITY: 'New York',
        };
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John, your age is 30 and you live in New York');
    });
    (0, node_test_1.it)('should handle empty dictionary', () => {
        const source = 'Hello {{NAME}}, your age is {{AGE}}';
        const dictionary = {};
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello {{NAME}}, your age is {{AGE}}');
    });
    (0, node_test_1.it)('should handle empty string values in dictionary', () => {
        const source = '123{{ITEM_PREFIX}}456{{ITEM_SUFFIX}}789';
        const dictionary = {
            ITEM_PREFIX: '',
            ITEM_SUFFIX: '',
        };
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, '123456789');
    });
    (0, node_test_1.it)('should handle missing keys in dictionary', () => {
        const source = 'Hello {{NAME}}, your age is {{AGE}} and you live in {{CITY}}';
        const dictionary = {
            NAME: 'John',
            AGE: '30',
            // CITY is missing
        };
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John, your age is 30 and you live in {{CITY}}');
    });
    (0, node_test_1.it)('should handle no placeholders in source', () => {
        const source = 'Hello World, this is a simple string';
        const dictionary = {
            NAME: 'John',
            AGE: '30',
        };
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello World, this is a simple string');
    });
    (0, node_test_1.it)('should handle special characters in values', () => {
        const source = 'Message: {{MESSAGE}}';
        const dictionary = {
            MESSAGE: 'Hello & <world> with "quotes" and \'apostrophes\'',
        };
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Message: Hello & <world> with "quotes" and \'apostrophes\'');
    });
    (0, node_test_1.it)('should handle multiple occurrences of the same placeholder', () => {
        const source = '{{GREETING}} {{NAME}}! {{GREETING}} again, {{NAME}}!';
        const dictionary = {
            GREETING: 'Hello',
            NAME: 'John',
        };
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John! Hello again, John!');
    });
    (0, node_test_1.it)('should handle complex nested placeholders with multi-pass', () => {
        const source = '{{SECTION_1_TITLE}}: {{SECTION_1_CONTENT}} | {{SECTION_2_TITLE}}: {{SECTION_2_CONTENT}}';
        const dictionary = {
            SECTION_1_TITLE: 'Introduction',
            SECTION_1_CONTENT: 'Welcome to {{APP_NAME}}',
            SECTION_2_TITLE: 'Conclusion',
            SECTION_2_CONTENT: 'Thanks for using {{APP_NAME}}',
            APP_NAME: 'MyApp',
        };
        const result = utils.templateDictReplace(source, dictionary);
        // With multi-pass replacement (up to 4 iterations), nested {{APP_NAME}} should be replaced
        assert.strictEqual(result, 'Introduction: Welcome to MyApp | Conclusion: Thanks for using MyApp');
    });
    (0, node_test_1.it)('should handle whitespace in placeholder names', () => {
        const source = 'Hello {{FIRST_NAME}} {{LAST_NAME}}';
        const dictionary = {
            FIRST_NAME: 'John',
            LAST_NAME: 'Doe',
        };
        const result = utils.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John Doe');
    });
});
//# sourceMappingURL=App-Template.test.js.map