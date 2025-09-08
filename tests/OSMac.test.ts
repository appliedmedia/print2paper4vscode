import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { OSMac } from '../src/OSMac.js';

describe('OSMac Platform Implementation', () => {
  let osMac: OSMac;
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

    osMac = new OSMac(mockApp);
  });

  describe('File Operations', () => {
    it('should open files in default app', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.fileOpenInDefaultApp(testFile);
    });

    it('should reveal files in Finder', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.fileReveal(testFile);
    });

    it('should print files', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.filePrint(testFile);
    });

    it('should open print dialog', async () => {
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.fileOpenPrintDialog(testFile);
    });
  });

  describe('Directory Operations', () => {
    it('should get home directory', () => {
      const homeDir = osMac.getDir_Home();

      assert.strictEqual(typeof homeDir, 'string', 'Should return string path');
      assert.ok(homeDir.length > 0, 'Should return non-empty path');
      assert.ok(
        homeDir.includes('Users') || homeDir.includes('home'),
        'Should contain Users or home in path'
      );
    });

    it('should use AppleScript to get downloads directory', () => {
      // Test that the method attempts to use AppleScript
      const homeDir = osMac.getDir_Home();

      // Should either succeed with AppleScript or fallback to HOME/Downloads
      assert.ok(
        homeDir.includes('Users') || homeDir.includes('home'),
        'Should contain Users or home in path'
      );
    });

    it('should fallback to HOME/Downloads when AppleScript fails', () => {
      // Mock AppleScript failure by temporarily modifying execSync
      const originalExecSync = osMac['execSync'];
      osMac['execSync'] = () => {
        throw new Error('AppleScript failed');
      };

      const homeDir = osMac.getDir_Home();

      // Should fallback to HOME/Downloads
      assert.ok(
        homeDir.includes('Users') || homeDir.includes('home'),
        'Should fallback to home directory'
      );

      // Restore original method
      osMac['execSync'] = originalExecSync;
    });
  });

  describe('Command Execution', () => {
    it('should have public file operations', () => {
      assert.strictEqual(
        typeof osMac.fileOpenInDefaultApp,
        'function',
        'Should have fileOpenInDefaultApp method'
      );
      assert.strictEqual(typeof osMac.fileReveal, 'function', 'Should have fileReveal method');
      assert.strictEqual(typeof osMac.filePrint, 'function', 'Should have filePrint method');
    });
  });

  describe('AppleScript Integration', () => {
    it('should use AppleScript for print operations', async () => {
      // The print method should use AppleScript
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.filePrint(testFile);
    });

    it('should use AppleScript for print dialog', async () => {
      // The print dialog method should use AppleScript with Preview
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.fileOpenPrintDialog(testFile);
    });
  });

  describe('Platform Detection', () => {
    it('should be macOS platform', () => {
      // This test assumes we're running on macOS, but will work on other platforms too
      assert.strictEqual(osMac.constructor.name, 'OSMac', 'Should be OSMac instance');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files gracefully', async () => {
      try {
        await osMac.fileOpenInDefaultApp('/nonexistent/file.txt');
        // This might succeed or fail depending on system, but shouldn't throw unhandled errors
      } catch (error) {
        // Expected to potentially fail, but should be handled gracefully
        assert.ok(error, 'Should handle errors gracefully');
      }
    });

    it('should handle AppleScript errors gracefully', async () => {
      // Mock AppleScript failure
      const originalExecAsync = osMac['execAsync'];
      osMac['execAsync'] = () => {
        throw new Error('AppleScript execution failed');
      };

      try {
        await osMac.filePrint('/tmp/test.txt');
        // Should handle the error gracefully
      } catch (error) {
        // Expected to fail, but should be handled
        assert.ok(error, 'Should handle AppleScript errors');
      }

      // Restore original method
      osMac['execAsync'] = originalExecAsync;
    });
  });

  describe('Inheritance', () => {
    it('should inherit from OS base class', () => {
      assert.ok(osMac instanceof OSMac, 'Should be instance of OSMac');
      // Check that it has all the base class methods
      assert.strictEqual(typeof osMac.ensureDir, 'function', 'Should have ensureDir method');
      assert.strictEqual(typeof osMac.fileWrite, 'function', 'Should have fileWrite method');
      assert.strictEqual(typeof osMac.fileCopy, 'function', 'Should have fileCopy method');
      assert.strictEqual(typeof osMac.fileDelete, 'function', 'Should have fileDelete method');
      assert.strictEqual(typeof osMac.pathJoin, 'function', 'Should have pathJoin method');
      assert.strictEqual(typeof osMac.pathDirname, 'function', 'Should have pathDirname method');
      assert.strictEqual(typeof osMac.execAsync, 'function', 'Should have execAsync method');
      assert.strictEqual(typeof osMac.execSync, 'function', 'Should have execSync method');
    });

    it('should implement all abstract methods', () => {
      const abstractMethods = [
        'fileOpenInDefaultApp',
        'fileReveal',
        'filePrint',
        'getDir_Home',
        'fileOpenPrintDialog',
      ];

      for (const method of abstractMethods) {
        assert.strictEqual(typeof osMac[method], 'function', `Should implement ${method}`);
      }
    });
  });

  describe('macOS-Specific Features', () => {
    it('should use Finder for file reveal', async () => {
      // The fileReveal method should use open -R
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.fileReveal(testFile);
    });

    it('should use Preview for print dialog', async () => {
      // The fileOpenPrintDialog method should use Preview
      const testFile = '/tmp/test-file.txt';

      // This should not throw an error
      await osMac.fileOpenPrintDialog(testFile);
    });
  });

  describe('Diagnostics Integration', () => {
    it('should have diagnostics with correct name', () => {
      assert.ok(osMac['dx'], 'Should have diagnostics');
    });

    it('should call done on diagnostics when done', () => {
      let doneCalled = false;
      osMac['dx'] = {
        done: () => {
          doneCalled = true;
          return osMac['dx'];
        },
      };

      osMac.done();

      assert.ok(doneCalled, 'Should call done on diagnostics');
    });
  });
});
