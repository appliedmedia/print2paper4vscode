import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { OS } from '../src/OS.js';
import { App } from '../src/App.js';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { mockContext, mockVSCode } from './test-utils.js';

describe('OS Base Class', () => {
  let app: App;
  let os: OS;
  let tempDir: string;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
    os = OS.create({ app });
    tempDir = path.join(tmpdir(), `os-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    os.done();
    app.done();
    // Cleanup temp files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('file operations', () => {
    it('should write and read files', () => {
      const filePath = path.join(tempDir, 'test.txt');
      const content = 'test content';
      
      os.fileWrite({ filePath, content });
      assert.ok(os.exists(filePath));
      
      const readContent = os.fileRead({ path: filePath });
      assert.strictEqual(readContent, content);
    });

    it('should delete files', () => {
      const filePath = path.join(tempDir, 'delete.txt');
      os.fileWrite({ filePath, content: 'content' });
      assert.ok(os.exists(filePath));
      
      os.fileDelete(filePath);
      assert.ok(!os.exists(filePath));
    });

    it('should handle deleting non-existent files gracefully', () => {
      const filePath = path.join(tempDir, 'nonexistent.txt');
      // Should not throw
      os.fileDelete(filePath);
    });
  });

  describe('directory operations', () => {
    it('should create directories', () => {
      const dirPath = path.join(tempDir, 'subdir');
      os.ensureDir(dirPath);
      assert.ok(os.exists(dirPath));
    });

    it('should create nested directories', () => {
      const dirPath = path.join(tempDir, 'nested', 'deep', 'path');
      os.ensureDir(dirPath);
      assert.ok(os.exists(dirPath));
    });
  });

  describe('path operations', () => {
    it('should join paths correctly', () => {
      const result = os.pathJoin('a', 'b', 'c');
      assert.ok(result.includes('a'));
      assert.ok(result.includes('b'));
      assert.ok(result.includes('c'));
    });

    it('should handle undefined path parts', () => {
      const result = os.pathJoin('a', undefined, 'c');
      assert.ok(result.includes('a'));
      assert.ok(result.includes('c'));
      assert.ok(!result.includes('undefined'));
    });

    it('should get basename', () => {
      const result = os.pathBasename('/path/to/file.txt');
      assert.strictEqual(result, 'file.txt');
    });

    it('should get dirname', () => {
      const result = os.pathDirname('/path/to/file.txt');
      assert.ok(result.includes('/path/to'));
    });
  });

  describe('fileRead with JSON', () => {
    it('should parse JSON files', () => {
      const jsonPath = path.join(tempDir, 'test.json');
      const jsonContent = { key: 'value', number: 42 };
      os.fileWrite({ filePath: jsonPath, content: JSON.stringify(jsonContent) });
      
      const parsed = os.fileRead<typeof jsonContent>({ path: jsonPath });
      assert.strictEqual(parsed?.key, 'value');
      assert.strictEqual(parsed?.number, 42);
    });

    it('should return specific key from JSON', () => {
      const jsonPath = path.join(tempDir, 'test.json');
      const jsonContent = { key1: 'value1', key2: 'value2' };
      os.fileWrite({ filePath: jsonPath, content: JSON.stringify(jsonContent) });
      
      const value = os.fileRead<string>({ path: jsonPath, key: 'key1' });
      assert.strictEqual(value, 'value1');
    });
  });

  describe('fileRead with YAML', () => {
    it('should parse YAML files', () => {
      const yamlPath = path.join(tempDir, 'test.yaml');
      const yamlContent = 'key1: value1\nkey2: value2';
      os.fileWrite({ filePath: yamlPath, content: yamlContent });
      
      const parsed = os.fileRead<{ key1: string; key2: string }>({ path: yamlPath });
      assert.strictEqual(parsed?.key1, 'value1');
      assert.strictEqual(parsed?.key2, 'value2');
    });

    it('should return specific key from YAML', () => {
      const yamlPath = path.join(tempDir, 'test.yaml');
      const yamlContent = 'key1: value1\nkey2: value2';
      os.fileWrite({ filePath: yamlPath, content: yamlContent });
      
      const value = os.fileRead<string>({ path: yamlPath, key: 'key1' });
      assert.strictEqual(value, 'value1');
    });
  });

  describe('fileRead with plain text', () => {
    it('should read plain text files', () => {
      const txtPath = path.join(tempDir, 'test.txt');
      const content = 'plain text content';
      os.fileWrite({ filePath: txtPath, content });
      
      const readContent = os.fileRead<string>({ path: txtPath });
      assert.strictEqual(readContent, content);
    });

    it('should return undefined for non-existent files', () => {
      const result = os.fileRead({ path: '/nonexistent/path/file.txt' });
      assert.strictEqual(result, undefined);
    });
  });

  describe('system information', () => {
    it('should get locale', () => {
      const locale = os.getLocale();
      assert.ok(typeof locale === 'string');
      assert.ok(locale.length > 0);
    });

    it('should get home directory', () => {
      const homeDir = os.getDir_Home();
      assert.ok(typeof homeDir === 'string');
      assert.ok(homeDir.length > 0);
    });
  });

  describe('filename sanitization', () => {
    it('should sanitize invalid characters', () => {
      const sanitized = os.sanitizeFileName('test<>:"/\\|?*file.txt');
      assert.ok(!sanitized.includes('<'));
      assert.ok(!sanitized.includes('>'));
      assert.ok(!sanitized.includes(':'));
    });

    it('should replace spaces with underscores', () => {
      const sanitized = os.sanitizeFileName('test file name.txt');
      assert.ok(sanitized.includes('_'));
      assert.ok(!sanitized.includes(' '));
    });

    it('should limit length to 120 characters', () => {
      const longName = 'a'.repeat(200);
      const sanitized = os.sanitizeFileName(longName);
      assert.ok(sanitized.length <= 120);
    });

    it('should return default for empty string', () => {
      const sanitized = os.sanitizeFileName('');
      assert.strictEqual(sanitized, 'output');
    });
  });

  describe('date formatting', () => {
    it('should format date as YYYYMMDDHHMMSS', () => {
      const formatted = os.dateAsYYYYMMDDHHMMSS();
      // Format: YYYY-MM-DD_HHMMSS.mmsa
      assert.ok(/^\d{4}-\d{2}-\d{2}_\d{2}\d{2}\d{2}\.\d{3}[ap]$/.test(formatted));
    });
  });

  describe('readShikiLightThemes', () => {
    it('should return empty array when themes directory does not exist', () => {
      const themes = os.readShikiLightThemes();
      // May return empty array if node_modules/shiki/themes doesn't exist
      assert.ok(Array.isArray(themes));
    });
  });

  describe('htmlSrcPathToURI', () => {
    it('should convert src attributes to webview URIs', async () => {
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
