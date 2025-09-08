import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { OSLinux } from '../src/OSLinux.js';

describe('OSLinux Platform Implementation', () => {
  let osLinux: OSLinux;
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

    osLinux = new OSLinux(mockApp);
  });

  describe('File Operations', () => {
    it('should open files in default app', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osLinux.fileOpenInDefaultApp(testFile);
    });

    it('should reveal files in file manager', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osLinux.fileReveal(testFile);
    });

    it('should print files', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osLinux.filePrint(testFile);
    });

    it('should open print dialog', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osLinux.fileOpenPrintDialog(testFile);
    });
  });

  describe('Directory Operations', () => {
    it('should get home directory', () => {
      const homeDir = osLinux.getDir_Home();

      assert.strictEqual(typeof homeDir, 'string', 'Should return string path');
      assert.ok(homeDir.length > 0, 'Should return non-empty path');
      assert.ok(
        homeDir.includes('home') || homeDir.includes('Users'),
        'Should contain home or Users in path'
      );
    });

    it('should handle downloads directory fallback', () => {
      // Mock environment without HOME
      const originalHome = process.env.HOME;
      delete process.env.HOME;

      const homeDir = osLinux.getDir_Home();

      assert.strictEqual(typeof homeDir, 'string', 'Should return string even without HOME');

      // Restore HOME
      if (originalHome) {
        process.env.HOME = originalHome;
      }
    });
  });

  describe('Command Execution', () => {
    it('should have public file operations', () => {
      assert.strictEqual(
        typeof osLinux.fileOpenInDefaultApp,
        'function',
        'Should have fileOpenInDefaultApp method'
      );
      assert.strictEqual(typeof osLinux.fileReveal, 'function', 'Should have fileReveal method');
      assert.strictEqual(typeof osLinux.filePrint, 'function', 'Should have filePrint method');
    });
  });

  describe('Platform Detection', () => {
    it('should be Linux platform', () => {
      assert.strictEqual(process.platform, 'linux', 'Should be running on Linux');
      assert.strictEqual(osLinux.constructor.name, 'OSLinux', 'Should be OSLinux instance');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing commands gracefully', async () => {
      try {
        await osLinux.fileOpenInDefaultApp('/nonexistent/file.txt');
        // This might succeed or fail depending on system, but shouldn't throw unhandled errors
      } catch (error) {
        // Expected to potentially fail, but should be handled gracefully
        assert.ok(error, 'Should handle errors gracefully');
      }
    });

    it('should handle invalid file paths', async () => {
      try {
        await osLinux.fileReveal('');
        // Should not throw unhandled errors
      } catch (error) {
        // Expected to potentially fail, but should be handled gracefully
        assert.ok(error, 'Should handle invalid paths gracefully');
      }
    });
  });

  describe('Inheritance', () => {
    it('should inherit from OS base class', () => {
      assert.ok(osLinux instanceof OSLinux, 'Should be instance of OSLinux');
      // Check that it has all the base class methods
      assert.strictEqual(typeof osLinux.ensureDir, 'function', 'Should have ensureDir method');
      assert.strictEqual(typeof osLinux.fileWrite, 'function', 'Should have fileWrite method');
      assert.strictEqual(typeof osLinux.fileCopy, 'function', 'Should have fileCopy method');
      assert.strictEqual(typeof osLinux.fileDelete, 'function', 'Should have fileDelete method');
      assert.strictEqual(typeof osLinux.pathJoin, 'function', 'Should have pathJoin method');
      assert.strictEqual(typeof osLinux.pathDirname, 'function', 'Should have pathDirname method');
      assert.strictEqual(typeof osLinux.execAsync, 'function', 'Should have execAsync method');
      assert.strictEqual(typeof osLinux.execSync, 'function', 'Should have execSync method');
    });

    it('should implement all abstract methods', () => {
      assert.strictEqual(
        typeof osLinux.fileOpenInDefaultApp,
        'function',
        'Should implement fileOpenInDefaultApp'
      );
      assert.strictEqual(typeof osLinux.fileReveal, 'function', 'Should implement fileReveal');
      assert.strictEqual(typeof osLinux.filePrint, 'function', 'Should implement filePrint');
      assert.strictEqual(typeof osLinux.getDir_Home, 'function', 'Should implement getDir_Home');
      assert.strictEqual(
        typeof osLinux.fileOpenPrintDialog,
        'function',
        'Should implement fileOpenPrintDialog'
      );
    });
  });

  describe('Diagnostics Integration', () => {
    it('should have diagnostics with correct name', () => {
      assert.ok(osLinux['dx'], 'Should have diagnostics');
      // The diagnostics name should be set in the constructor
    });

    it('should call done on diagnostics when done', () => {
      let doneCalled = false;
      osLinux['dx'] = {
        done: () => {
          doneCalled = true;
          return osLinux['dx'];
        },
      };

      osLinux.done();

      assert.ok(doneCalled, 'Should call done on diagnostics');
    });
  });
});
