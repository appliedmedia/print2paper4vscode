import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { TabInspector } from '../src/TabInspector.js';

describe('TabInspector Functionality', () => {
  let tabInspector: TabInspector;
  let mockApp: any;

  // Setup before each test
  const setup = () => {
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
          document: { 
            getText: () => 'full document content',
            languageId: 'javascript',
            fileName: 'test.js',
            uri: { fsPath: '/path/to/test.js' }
          },
        }),
        getVisibleTextEditors: () => [
          {
            selection: { isEmpty: false, text: 'visible code' },
            document: { 
              getText: () => 'visible document',
              languageId: 'typescript',
              fileName: 'visible.ts',
              uri: { fsPath: '/path/to/visible.ts' }
            },
          }
        ],
      },
    };

    tabInspector = new TabInspector(mockApp);
  };

  describe('Initialization', () => {
    it('should initialize with app reference', () => {
      assert.strictEqual(tabInspector['app'], mockApp, 'Should store app reference');
    });

    it('should have diagnostics', () => {
      assert.ok(tabInspector['dx'], 'Should have diagnostics');
    });
  });

  describe('Tab Inspection', () => {
    it('should inspect active tab', async () => {
      const result = await tabInspector.inspectTab();
      
      assert.ok(result, 'Should return a result');
      assert.strictEqual(typeof result.code, 'string', 'Should return code');
      assert.strictEqual(typeof result.language, 'string', 'Should return language');
      assert.strictEqual(typeof result.fileName, 'string', 'Should return filename');
      assert.strictEqual(typeof result.filePath, 'string', 'Should return file path');
    });

    it('should get code from active editor', async () => {
      const result = await tabInspector.inspectTab();
      
      assert.strictEqual(result.code, 'full document content', 'Should get full document content');
      assert.strictEqual(result.language, 'javascript', 'Should get language from active editor');
      assert.strictEqual(result.fileName, 'test.js', 'Should get filename from active editor');
      assert.strictEqual(result.filePath, '/path/to/test.js', 'Should get file path from active editor');
    });

    it('should handle no active editor', async () => {
      mockApp.vscodeapis.getActiveTextEditor = () => undefined;

      const result = await tabInspector.inspectTab();
      
      assert.ok(result, 'Should return a result even without active editor');
      assert.strictEqual(result.code, '', 'Should return empty code');
      assert.strictEqual(result.language, 'plaintext', 'Should default to plaintext language');
      assert.strictEqual(result.fileName, '', 'Should return empty filename');
      assert.strictEqual(result.filePath, '', 'Should return empty file path');
    });

    it('should handle different file types', async () => {
      const testCases = [
        { language: 'python', fileName: 'test.py', expected: 'python' },
        { language: 'typescript', fileName: 'test.ts', expected: 'typescript' },
        { language: 'html', fileName: 'test.html', expected: 'html' },
        { language: 'css', fileName: 'test.css', expected: 'css' },
        { language: 'json', fileName: 'test.json', expected: 'json' },
      ];

      for (const testCase of testCases) {
        mockApp.vscodeapis.getActiveTextEditor = () => ({
          selection: { isEmpty: false, text: 'test code' },
          document: { 
            getText: () => 'test code',
            languageId: testCase.language,
            fileName: testCase.fileName,
            uri: { fsPath: `/path/to/${testCase.fileName}` }
          },
        });

        const result = await tabInspector.inspectTab();
        
        assert.strictEqual(result.language, testCase.expected, `Should detect ${testCase.expected} language`);
        assert.strictEqual(result.fileName, testCase.fileName, `Should get ${testCase.fileName} filename`);
      }
    });
  });

  describe('Visible Editors Inspection', () => {
    it('should inspect all visible editors', async () => {
      const result = await tabInspector.inspectVisibleEditors();
      
      assert.ok(Array.isArray(result), 'Should return an array');
      assert.ok(result.length > 0, 'Should have visible editors');
      
      const editor = result[0];
      assert.strictEqual(typeof editor.code, 'string', 'Should return code for each editor');
      assert.strictEqual(typeof editor.language, 'string', 'Should return language for each editor');
      assert.strictEqual(typeof editor.fileName, 'string', 'Should return filename for each editor');
      assert.strictEqual(typeof editor.filePath, 'string', 'Should return file path for each editor');
    });

    it('should handle no visible editors', async () => {
      mockApp.vscodeapis.getVisibleTextEditors = () => [];

      const result = await tabInspector.inspectVisibleEditors();
      
      assert.ok(Array.isArray(result), 'Should return an array');
      assert.strictEqual(result.length, 0, 'Should return empty array when no visible editors');
    });

    it('should process multiple visible editors', async () => {
      mockApp.vscodeapis.getVisibleTextEditors = () => [
        {
          selection: { isEmpty: false, text: 'code1' },
          document: { 
            getText: () => 'document1',
            languageId: 'javascript',
            fileName: 'file1.js',
            uri: { fsPath: '/path/to/file1.js' }
          },
        },
        {
          selection: { isEmpty: false, text: 'code2' },
          document: { 
            getText: () => 'document2',
            languageId: 'typescript',
            fileName: 'file2.ts',
            uri: { fsPath: '/path/to/file2.ts' }
          },
        },
      ];

      const result = await tabInspector.inspectVisibleEditors();
      
      assert.strictEqual(result.length, 2, 'Should process all visible editors');
      assert.strictEqual(result[0].language, 'javascript', 'Should process first editor correctly');
      assert.strictEqual(result[1].language, 'typescript', 'Should process second editor correctly');
    });
  });

  describe('Error Handling', () => {
    it('should handle VS Code API errors gracefully', async () => {
      mockApp.vscodeapis.getActiveTextEditor = () => {
        throw new Error('VS Code API error');
      };

      const result = await tabInspector.inspectTab();
      assert.ok(result, 'Should return a result even on error');
      assert.strictEqual(result.code, '', 'Should return empty code on error');
      assert.strictEqual(result.language, 'plaintext', 'Should default to plaintext on error');
    });

    it('should handle missing document properties', async () => {
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'test' },
        document: {
          getText: () => 'test',
          languageId: 'javascript',
          // Missing fileName and uri
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.ok(result, 'Should return a result even with missing properties');
      assert.strictEqual(result.fileName, '', 'Should handle missing fileName');
      assert.strictEqual(result.filePath, '', 'Should handle missing filePath');
    });

    it('should handle null/undefined values', async () => {
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'test' },
        document: {
          getText: () => null,
          languageId: null,
          fileName: null,
          uri: null,
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.ok(result, 'Should return a result even with null values');
      assert.strictEqual(result.code, '', 'Should handle null getText');
      assert.strictEqual(result.language, 'plaintext', 'Should default language for null languageId');
      assert.strictEqual(result.fileName, '', 'Should handle null fileName');
      assert.strictEqual(result.filePath, '', 'Should handle null uri');
    });
  });

  describe('Code Content Handling', () => {
    it('should handle empty code', async () => {
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: '' },
        document: { 
          getText: () => '',
          languageId: 'javascript',
          fileName: 'empty.js',
          uri: { fsPath: '/path/to/empty.js' }
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.strictEqual(result.code, '', 'Should handle empty code');
      assert.strictEqual(result.language, 'javascript', 'Should still detect language');
    });

    it('should handle large code files', async () => {
      const largeCode = 'console.log("test");\n'.repeat(1000);
      
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: largeCode },
        document: { 
          getText: () => largeCode,
          languageId: 'javascript',
          fileName: 'large.js',
          uri: { fsPath: '/path/to/large.js' }
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.strictEqual(result.code, largeCode, 'Should handle large code files');
      assert.ok(result.code.length > 1000, 'Should preserve large code content');
    });

    it('should handle special characters in code', async () => {
      const specialCode = 'const str = "test with \'quotes\' and \"double quotes\" and \\backslashes\\";';
      
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: specialCode },
        document: { 
          getText: () => specialCode,
          languageId: 'javascript',
          fileName: 'special.js',
          uri: { fsPath: '/path/to/special.js' }
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.strictEqual(result.code, specialCode, 'Should handle special characters');
    });
  });

  describe('File Path Handling', () => {
    it('should extract file path from URI', async () => {
      const testPath = '/path/to/test/file.js';
      
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'test' },
        document: { 
          getText: () => 'test',
          languageId: 'javascript',
          fileName: 'file.js',
          uri: { fsPath: testPath }
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.strictEqual(result.filePath, testPath, 'Should extract file path from URI');
    });

    it('should handle Windows file paths', async () => {
      const windowsPath = 'C:\\Users\\test\\file.js';
      
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'test' },
        document: { 
          getText: () => 'test',
          languageId: 'javascript',
          fileName: 'file.js',
          uri: { fsPath: windowsPath }
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.strictEqual(result.filePath, windowsPath, 'Should handle Windows file paths');
    });

    it('should handle relative file paths', async () => {
      const relativePath = './src/file.js';
      
      mockApp.vscodeapis.getActiveTextEditor = () => ({
        selection: { isEmpty: false, text: 'test' },
        document: { 
          getText: () => 'test',
          languageId: 'javascript',
          fileName: 'file.js',
          uri: { fsPath: relativePath }
        },
      });

      const result = await tabInspector.inspectTab();
      
      assert.strictEqual(result.filePath, relativePath, 'Should handle relative file paths');
    });
  });
});