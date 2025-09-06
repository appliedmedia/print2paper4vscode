import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { ClipboardCapture } from '../src/ClipboardCapture.js';

describe('ClipboardCapture Functionality', () => {
  let clipboardCapture: ClipboardCapture;
  let mockApp: any;

  before(() => {
    // Mock app for testing
    mockApp = {
      dx: {
        create: (name: string) => ({
          out: (msg: string) => console.log(`[${name}] ${msg}`),
          done: () => {},
        }),
      },
      vscodeapis: {
        getActiveTextEditor: () => ({
          selection: { isEmpty: false, text: 'selected code' },
          document: { getText: () => 'full document', languageId: 'javascript' },
        }),
      },
    };

    clipboardCapture = new ClipboardCapture(mockApp);
  });

  describe('Capture Method', () => {
    it('should capture clipboard content', async () => {
      const result = await clipboardCapture.capture();

      assert.ok(result, 'Should return a result');
      assert.strictEqual(typeof result.html, 'string', 'Should return HTML content');
      assert.strictEqual(typeof result.rawCode, 'string', 'Should return raw code');
      assert.strictEqual(typeof result.language, 'string', 'Should return language');
    });

    it('should handle empty clipboard', async () => {
      // Mock empty clipboard
      const originalClipboard = require('child_process').execSync;
      require('child_process').execSync = () => '';

      const result = await clipboardCapture.capture();

      assert.ok(result, 'Should return a result even for empty clipboard');
      assert.strictEqual(result.rawCode, '', 'Should return empty string for empty clipboard');

      // Restore original
      require('child_process').execSync = originalClipboard;
    });

    it('should detect language from active editor', async () => {
      const result = await clipboardCapture.capture();

      assert.strictEqual(result.language, 'javascript', 'Should detect language from active editor');
    });

    it('should handle different languages', async () => {
      // Test with different language
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'def hello():' },
        document: { getText: () => 'def hello():', languageId: 'python' },
      });

      const result = await clipboardCapture.capture();

      assert.strictEqual(result.language, 'python', 'Should detect Python language');
    });

    it('should handle selection vs full document', async () => {
      // Test with selection
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'selected code' },
        document: { getText: () => 'full document', languageId: 'javascript' },
      });

      const result = await clipboardCapture.capture();

      assert.ok(result.rawCode.includes('selected'), 'Should capture selected text');
    });

    it('should handle no active editor', async () => {
      // Mock no active editor
      mockApp.vscodeapis.getActiveTextEditor = () => undefined;

      const result = await clipboardCapture.capture();

      assert.ok(result, 'Should return a result even without active editor');
      assert.strictEqual(result.language, 'plaintext', 'Should default to plaintext language');
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard read errors gracefully', async () => {
      // Mock clipboard read failure
      const originalExecSync = require('child_process').execSync;
      require('child_process').execSync = () => {
        throw new Error('Clipboard read failed');
      };

      const result = await clipboardCapture.capture();

      assert.ok(result, 'Should return a result even on clipboard read failure');
      assert.strictEqual(result.rawCode, '', 'Should return empty string on error');

      // Restore original
      require('child_process').execSync = originalExecSync;
    });

    it('should handle invalid language detection', async () => {
      // Mock invalid language
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'code' },
        document: { getText: () => 'code', languageId: 'invalid-language' },
      });

      const result = await clipboardCapture.capture();

      assert.ok(result, 'Should return a result even with invalid language');
      assert.strictEqual(result.language, 'invalid-language', 'Should preserve the language as-is');
    });
  });

  describe('HTML Generation', () => {
    it('should generate HTML from code', async () => {
      const result = await clipboardCapture.capture();

      assert.ok(result.html.includes('<'), 'Should contain HTML tags');
      assert.ok(result.html.includes('selected'), 'Should contain the captured code');
    });

    it('should handle special characters in code', async () => {
      // Mock code with special characters
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: '<div>test & "quotes"</div>' },
        document: { getText: () => '<div>test & "quotes"</div>', languageId: 'html' },
      });

      const result = await clipboardCapture.capture();

      assert.ok(result.html.includes('&lt;'), 'Should escape HTML characters');
      assert.ok(result.html.includes('&amp;'), 'Should escape ampersands');
      assert.ok(result.html.includes('&quot;'), 'Should escape quotes');
    });

    it('should handle multi-line code', async () => {
      const multiLineCode = `function test() {
  return "hello";
}`;

      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: multiLineCode },
        document: { getText: () => multiLineCode, languageId: 'javascript' },
      });

      const result = await clipboardCapture.capture();

      assert.ok(result.html.includes('function test()'), 'Should contain first line');
      assert.ok(result.html.includes('return "hello"'), 'Should contain second line');
    });
  });

  describe('Language Detection', () => {
    it('should detect common programming languages', async () => {
      const languages = [
        { code: 'console.log("test");', lang: 'javascript' },
        { code: 'def hello():', lang: 'python' },
        { code: 'public class Test { }', lang: 'java' },
        { code: 'SELECT * FROM users;', lang: 'sql' },
        { code: '#include <stdio.h>', lang: 'c' },
        { code: '<div>test</div>', lang: 'html' },
        { code: 'body { color: red; }', lang: 'css' },
      ];

      for (const testCase of languages) {
        mockApp.vscodeapis.getActiveTextEditor = () => ({
          selection: { isEmpty: false, text: testCase.code },
          document: { getText: () => testCase.code, languageId: testCase.lang },
        });

        const result = await clipboardCapture.capture();

        assert.strictEqual(result.language, testCase.lang, `Should detect ${testCase.lang} language`);
      }
    });

    it('should fallback to plaintext for unknown languages', async () => {
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'some random text' },
        document: { getText: () => 'some random text', languageId: 'unknown' },
      });

      const result = await clipboardCapture.capture();

      assert.strictEqual(result.language, 'unknown', 'Should preserve unknown language');
    });
  });
});