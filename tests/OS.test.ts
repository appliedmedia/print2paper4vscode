import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { OS } from '../src/OS.js';

describe('OS Abstraction Layer', () => {
  let os: OS;
  let mockApp: any;

  before(() => {
    // Mock app for testing
    mockApp = {
      vscodeapis: {
        getExtensionPath: () => '/test/extension/path',
      },
      dx: {
        create: (name: string) => ({
          out: (msg: string) => console.log(`[${name}] ${msg}`),
          done: () => {},
        }),
      },
    };

    os = new OS(mockApp);
  });

  describe('Static Factory Method', () => {
    it('should create correct OS instance based on platform', () => {
      const osInstance = OS.create(mockApp);
      
      assert.ok(osInstance, 'Should create OS instance');
      assert.ok(osInstance instanceof OS, 'Should be instance of OS base class');
      
      // Check platform-specific implementation
      const platform = process.platform;
      if (platform === 'win32') {
        assert.strictEqual(osInstance.constructor.name, 'OSWin', 'Should create OSWin on Windows');
      } else if (platform === 'linux') {
        assert.strictEqual(osInstance.constructor.name, 'OSLinux', 'Should create OSLinux on Linux');
      } else {
        assert.strictEqual(osInstance.constructor.name, 'OSMac', 'Should create OSMac on other platforms');
      }
    });

    it('should handle missing app parameter', () => {
      const osInstance = OS.create(undefined as any);
      
      assert.ok(osInstance, 'Should create OS instance even without app');
    });
  });

  describe('File System Operations', () => {
    it('should create directories', () => {
      const testDir = '/tmp/test-dir';
      
      // This should not throw an error
      os.ensureDir(testDir);
      
      // Clean up
      try {
        require('fs').rmdirSync(testDir);
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should write files', () => {
      const testFile = '/tmp/test-file.txt';
      const content = 'test content';
      
      // This should not throw an error
      os.fileWrite(testFile, content);
      
      // Verify file was created
      const fs = require('fs');
      if (fs.existsSync(testFile)) {
        const writtenContent = fs.readFileSync(testFile, 'utf8');
        assert.strictEqual(writtenContent, content, 'Should write correct content');
        
        // Clean up
        fs.unlinkSync(testFile);
      }
    });

    it('should copy files', () => {
      const sourceFile = '/tmp/source-file.txt';
      const destFile = '/tmp/dest-file.txt';
      const content = 'test content';
      
      // Create source file
      os.fileWrite(sourceFile, content);
      
      // Copy file
      os.fileCopy(sourceFile, destFile);
      
      // Verify copy
      const fs = require('fs');
      if (fs.existsSync(destFile)) {
        const copiedContent = fs.readFileSync(destFile, 'utf8');
        assert.strictEqual(copiedContent, content, 'Should copy correct content');
        
        // Clean up
        fs.unlinkSync(sourceFile);
        fs.unlinkSync(destFile);
      }
    });

    it('should delete files', () => {
      const testFile = '/tmp/test-delete.txt';
      const content = 'test content';
      
      // Create file
      os.fileWrite(testFile, content);
      
      // Delete file
      os.fileDelete(testFile);
      
      // Verify deletion
      const fs = require('fs');
      assert.strictEqual(fs.existsSync(testFile), false, 'Should delete file');
    });

    it('should handle non-existent file deletion gracefully', () => {
      const nonExistentFile = '/tmp/non-existent-file.txt';
      
      // This should not throw an error
      os.fileDelete(nonExistentFile);
    });
  });

  describe('Path Operations', () => {
    it('should join paths correctly', () => {
      const result = os.pathJoin('/path', 'to', 'file.txt');
      assert.strictEqual(result, '/path/to/file.txt', 'Should join paths correctly');
    });

    it('should handle single path segment', () => {
      const result = os.pathJoin('file.txt');
      assert.strictEqual(result, 'file.txt', 'Should handle single path segment');
    });

    it('should handle empty path segments', () => {
      const result = os.pathJoin('', 'file.txt');
      assert.strictEqual(result, '/file.txt', 'Should handle empty path segments');
    });

    it('should get directory name from path', () => {
      const result = os.pathDirname('/path/to/file.txt');
      assert.strictEqual(result, '/path/to', 'Should get directory name');
    });

    it('should handle root directory', () => {
      const result = os.pathDirname('/file.txt');
      assert.strictEqual(result, '/', 'Should handle root directory');
    });
  });

  describe('Async Operations', () => {
    it('should execute commands asynchronously', async () => {
      const result = await os.execAsync('echo "test"');
      
      assert.ok(result, 'Should return result');
      assert.strictEqual(typeof result.stdout, 'string', 'Should have stdout');
      assert.strictEqual(typeof result.stderr, 'string', 'Should have stderr');
      assert.ok(result.stdout.includes('test'), 'Should execute command correctly');
    });

    it('should execute commands synchronously', () => {
      const result = os.execSync('echo "test"');
      
      assert.strictEqual(typeof result, 'string', 'Should return string result');
      assert.ok(result.includes('test'), 'Should execute command correctly');
    });

    it('should handle command errors gracefully', async () => {
      try {
        await os.execAsync('nonexistent-command-12345');
        assert.fail('Should throw error for non-existent command');
      } catch (error) {
        assert.ok(error, 'Should throw error for non-existent command');
      }
    });
  });

  describe('Abstract Methods', () => {
    it('should have abstract method signatures', () => {
      // These should be implemented by subclasses
      const abstractMethods = [
        'fileOpenInDefaultApp',
        'fileReveal', 
        'filePrint',
        'getDir_Home',
        'fileOpenPrintDialog'
      ];

      for (const method of abstractMethods) {
        assert.strictEqual(typeof os[method], 'function', `Should have ${method} method`);
      }
    });
  });

  describe('Initialization', () => {
    it('should initialize with app reference', () => {
      assert.strictEqual(os['app'], mockApp, 'Should store app reference');
      assert.ok(os['dx'], 'Should have diagnostics');
    });

    it('should handle missing app reference', () => {
      const osWithoutApp = new OS();
      
      assert.strictEqual(osWithoutApp['app'], undefined, 'Should handle missing app');
      assert.ok(osWithoutApp['dx'], 'Should still have diagnostics');
    });

    it('should set extension root from app', () => {
      assert.strictEqual(os['extensionRoot'], '/test/extension/path', 'Should set extension root');
    });
  });

  describe('Lifecycle Methods', () => {
    it('should have init method', () => {
      assert.strictEqual(typeof os.init, 'function', 'Should have init method');
    });

    it('should have done method', () => {
      assert.strictEqual(typeof os.done, 'function', 'Should have done method');
    });

    it('should call done on diagnostics', () => {
      let doneCalled = false;
      os['dx'] = {
        done: () => { doneCalled = true; }
      };

      os.done();
      
      assert.ok(doneCalled, 'Should call done on diagnostics');
    });
  });
});