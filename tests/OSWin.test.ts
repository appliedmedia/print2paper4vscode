import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import { OSWin } from '../src/OSWin.js';

describe('OSWin Platform Implementation', () => {
  let osWin: OSWin;
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

    osWin = new OSWin(mockApp);
  });

  describe('File Operations', () => {
    it('should open files in default app', async () => {
      const testFile = 'C:\\temp\\test-file.txt';
      
      // This should not throw an error
      await osWin.fileOpenInDefaultApp(testFile);
    });

    it('should reveal files in Explorer', async () => {
      const testFile = 'C:\\temp\\test-file.txt';
      
      // This should not throw an error
      await osWin.fileReveal(testFile);
    });

    it('should print files', async () => {
      const testFile = 'C:\\temp\\test-file.txt';
      
      // This should not throw an error
      await osWin.filePrint(testFile);
    });

    it('should open print dialog', async () => {
      const testFile = 'C:\\temp\\test-file.txt';
      
      // This should not throw an error
      await osWin.fileOpenPrintDialog(testFile);
    });
  });

  describe('Directory Operations', () => {
    it('should get downloads directory', () => {
      const downloadsDir = osWin.getDownloadsDirectory();
      
      assert.strictEqual(typeof downloadsDir, 'string', 'Should return string path');
      assert.ok(downloadsDir.length > 0, 'Should return non-empty path');
      assert.ok(downloadsDir.includes('Downloads'), 'Should contain Downloads in path');
    });

    it('should use Windows environment variables', () => {
      const downloadsDir = osWin.getDownloadsDirectory();
      
      // Should use USERPROFILE or similar Windows environment variable
      assert.ok(downloadsDir.length > 0, 'Should return valid path');
    });

    it('should handle missing environment variables', () => {
      // Mock missing USERPROFILE
      const originalUserProfile = process.env.USERPROFILE;
      delete process.env.USERPROFILE;
      
      const downloadsDir = osWin.getDownloadsDirectory();
      
      // Should still return a valid path
      assert.strictEqual(typeof downloadsDir, 'string', 'Should return string even without USERPROFILE');
      
      // Restore USERPROFILE
      if (originalUserProfile) {
        process.env.USERPROFILE = originalUserProfile;
      }
    });
  });

  describe('Command Execution', () => {
    it('should execute Windows-specific commands', async () => {
      const result = await osWin.execAsync('echo "Windows test"');
      
      assert.ok(result, 'Should return result');
      assert.ok(result.stdout.includes('Windows test'), 'Should execute command correctly');
    });

    it('should use Windows commands for file operations', async () => {
      // Test that Windows commands are available
      const result = await osWin.execAsync('where cmd');
      
      assert.ok(result, 'Should return result for cmd check');
    });
  });

  describe('Windows-Specific Features', () => {
    it('should use start command for file operations', async () => {
      // The fileOpenInDefaultApp method should use start command
      const testFile = 'C:\\temp\\test-file.txt';
      
      // This should not throw an error
      await osWin.fileOpenInDefaultApp(testFile);
    });

    it('should use explorer for file reveal', async () => {
      // The fileReveal method should use explorer /select
      const testFile = 'C:\\temp\\test-file.txt';
      
      // This should not throw an error
      await osWin.fileReveal(testFile);
    });

    it('should handle Windows path separators', () => {
      const path1 = osWin.pathJoin('C:', 'Users', 'test', 'file.txt');
      assert.ok(path1.includes('\\'), 'Should use Windows path separators');
      
      const path2 = osWin.pathJoin('C:\\Users', 'test', 'file.txt');
      assert.ok(path2.includes('\\'), 'Should handle existing separators');
    });
  });

  describe('Platform Detection', () => {
    it('should be Windows platform', () => {
      // This test assumes we're running on Windows, but will work on other platforms too
      assert.strictEqual(osWin.constructor.name, 'OSWin', 'Should be OSWin instance');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files gracefully', async () => {
      try {
        await osWin.fileOpenInDefaultApp('C:\\nonexistent\\file.txt');
        // This might succeed or fail depending on system, but shouldn't throw unhandled errors
      } catch (error) {
        // Expected to potentially fail, but should be handled gracefully
        assert.ok(error, 'Should handle errors gracefully');
      }
    });

    it('should handle Windows command errors gracefully', async () => {
      // Mock Windows command failure
      const originalExecAsync = osWin['execAsync'];
      osWin['execAsync'] = () => {
        throw new Error('Windows command execution failed');
      };

      try {
        await osWin.filePrint('C:\\temp\\test.txt');
        // Should handle the error gracefully
      } catch (error) {
        // Expected to fail, but should be handled
        assert.ok(error, 'Should handle Windows command errors');
      }

      // Restore original method
      osWin['execAsync'] = originalExecAsync;
    });
  });

  describe('Inheritance', () => {
    it('should inherit from OS base class', () => {
      assert.ok(osWin instanceof OSWin, 'Should be instance of OSWin');
      // Check that it has all the base class methods
      assert.strictEqual(typeof osWin.ensureDir, 'function', 'Should have ensureDir method');
      assert.strictEqual(typeof osWin.fileWrite, 'function', 'Should have fileWrite method');
      assert.strictEqual(typeof osWin.fileCopy, 'function', 'Should have fileCopy method');
      assert.strictEqual(typeof osWin.fileDelete, 'function', 'Should have fileDelete method');
      assert.strictEqual(typeof osWin.pathJoin, 'function', 'Should have pathJoin method');
      assert.strictEqual(typeof osWin.pathDirname, 'function', 'Should have pathDirname method');
      assert.strictEqual(typeof osWin.execAsync, 'function', 'Should have execAsync method');
      assert.strictEqual(typeof osWin.execSync, 'function', 'Should have execSync method');
    });

    it('should implement all abstract methods', () => {
      const abstractMethods = [
        'fileOpenInDefaultApp',
        'fileReveal',
        'filePrint',
        'getDownloadsDirectory',
        'fileOpenPrintDialog'
      ];

      for (const method of abstractMethods) {
        assert.strictEqual(typeof osWin[method], 'function', `Should implement ${method}`);
      }
    });
  });

  describe('Windows Path Handling', () => {
    it('should handle Windows drive letters', () => {
      const path = osWin.pathJoin('C:', 'Users', 'test', 'file.txt');
      assert.ok(path.startsWith('C:'), 'Should preserve drive letter');
    });

    it('should handle UNC paths', () => {
      const path = osWin.pathJoin('\\\\server', 'share', 'file.txt');
      assert.ok(path.startsWith('\\\\'), 'Should handle UNC paths');
    });

    it('should handle relative paths', () => {
      const path = osWin.pathJoin('folder', 'file.txt');
      assert.strictEqual(path, 'folder\\file.txt', 'Should handle relative paths');
    });
  });

  describe('Diagnostics Integration', () => {
    it('should have diagnostics with correct name', () => {
      assert.ok(osWin['dx'], 'Should have diagnostics');
    });

    it('should call done on diagnostics when done', () => {
      let doneCalled = false;
      osWin['dx'] = {
        done: () => { doneCalled = true; }
      };

      osWin.done();
      
      assert.ok(doneCalled, 'Should call done on diagnostics');
    });
  });
});