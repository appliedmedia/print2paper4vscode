import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp } from './test-utils.js';
import { OSLinux } from '../src/OSLinux.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('OSLinux', () => {
  let app: TestApp;
  let osLinux: OSLinux;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
    osLinux = new OSLinux({ reg: app.reg });
  });

  afterEach(() => {
    osLinux.done();
    app.done();
  });

  describe('fileOpenPrintDialog', () => {
    it('should try PDF viewers in order and use the first available', async () => {
      const calls: Array<{ file: string; args: string[] }> = [];
      // Mock execFileAsync: evince not found, okular found
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        if (file === 'which' && args[0] === 'evince') {
          throw new Error('not found');
        }
        // okular is found via which, and launches successfully
        return { stdout: '', stderr: '' };
      };

      await osLinux.fileOpenPrintDialog('/tmp/test.pdf');

      // Should have tried: which evince (failed), which okular (success), okular /tmp/test.pdf
      assert.strictEqual(calls[0].file, 'which');
      assert.deepStrictEqual(calls[0].args, ['evince']);
      assert.strictEqual(calls[1].file, 'which');
      assert.deepStrictEqual(calls[1].args, ['okular']);
      assert.strictEqual(calls[2].file, 'okular');
      assert.deepStrictEqual(calls[2].args, ['/tmp/test.pdf']);
      assert.strictEqual(calls.length, 3);
    });

    it('should use the first viewer when it is available', async () => {
      const calls: Array<{ file: string; args: string[] }> = [];
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osLinux.fileOpenPrintDialog('/tmp/test.pdf');

      // evince found on first try: which evince (success), evince /tmp/test.pdf
      assert.strictEqual(calls[0].file, 'which');
      assert.deepStrictEqual(calls[0].args, ['evince']);
      assert.strictEqual(calls[1].file, 'evince');
      assert.deepStrictEqual(calls[1].args, ['/tmp/test.pdf']);
      assert.strictEqual(calls.length, 2);
    });

    it('should fall back to xdg-open when no PDF viewer is found', async () => {
      const calls: Array<{ file: string; args: string[] }> = [];
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        if (file === 'which') {
          throw new Error('not found');
        }
        return { stdout: '', stderr: '' };
      };

      await osLinux.fileOpenPrintDialog('/tmp/test.pdf');

      // All which checks should fail, then fallback to xdg-open
      const whichCalls = calls.filter(c => c.file === 'which');
      assert.strictEqual(whichCalls.length, 4); // evince, okular, atril, xreader
      assert.deepStrictEqual(whichCalls.map(c => c.args[0]), ['evince', 'okular', 'atril', 'xreader']);

      // Last call should be xdg-open (from fileOpenInDefaultApp fallback)
      const lastCall = calls[calls.length - 1];
      assert.strictEqual(lastCall.file, 'xdg-open');
      assert.deepStrictEqual(lastCall.args, ['/tmp/test.pdf']);
    });

    it('should try next viewer when which succeeds but viewer launch fails', async () => {
      const calls: Array<{ file: string; args: string[] }> = [];
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        // evince: which succeeds but launch fails
        if (file === 'evince') {
          throw new Error('launch failed');
        }
        // atril: which succeeds but launch fails
        if (file === 'atril') {
          throw new Error('launch failed');
        }
        return { stdout: '', stderr: '' };
      };

      await osLinux.fileOpenPrintDialog('/tmp/test.pdf');

      // evince found but fails to launch, then okular found and launches
      assert.strictEqual(calls[0].file, 'which');
      assert.deepStrictEqual(calls[0].args, ['evince']);
      assert.strictEqual(calls[1].file, 'evince');
      assert.strictEqual(calls[2].file, 'which');
      assert.deepStrictEqual(calls[2].args, ['okular']);
      assert.strictEqual(calls[3].file, 'okular');
      assert.deepStrictEqual(calls[3].args, ['/tmp/test.pdf']);
      assert.strictEqual(calls.length, 4);
    });
  });

  describe('filePrint', () => {
    it('should call lp directly to print', async () => {
      const calls: Array<{ file: string; args: string[] }> = [];
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osLinux.filePrint('/tmp/test.pdf');

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].file, 'lp');
      assert.deepStrictEqual(calls[0].args, ['/tmp/test.pdf']);
    });

    it('should throw helpful error when CUPS is not installed', async () => {
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        if (file === 'lp') {
          const err = new Error('spawn lp ENOENT') as any;
          err.code = 'ENOENT';
          throw err;
        }
        return { stdout: '', stderr: '' };
      };

      await assert.rejects(
        () => osLinux.filePrint('/tmp/test.pdf'),
        (err: Error) => {
          assert.ok(err.message.includes('CUPS printing system not found'));
          assert.ok(err.message.includes('sudo apt install cups'));
          assert.ok(err.message.includes('sudo dnf install cups'));
          return true;
        }
      );
    });

    it('should reject with CUPS error when lp is not found', async () => {
      const calls: Array<{ file: string; args: string[] }> = [];
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        const err = new Error('spawn lp ENOENT') as any;
        err.code = 'ENOENT';
        throw err;
      };

      await assert.rejects(() => osLinux.filePrint('/tmp/test.pdf'));

      // Should have called lp directly (no which check)
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].file, 'lp');
    });

    it('should rethrow non-ENOENT errors from lp', async () => {
      (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
        throw new Error('printer paper jam');
      };

      await assert.rejects(
        () => osLinux.filePrint('/tmp/test.pdf'),
        (err: Error) => {
          assert.ok(err.message.includes('printer paper jam'));
          return true;
        }
      );
    });
  });

  describe('getDir_Documents', () => {
    it('should fall back to ~/Documents when xdg-user-dir fails', () => {
      (osLinux as any).execSync = () => {
        throw new Error('command not found');
      };

      const result = osLinux.getDir_Documents();
      const expected = osLinux.pathJoin(osLinux.getDir_Home(), 'Documents');
      assert.strictEqual(result, expected);
    });

    it('should fall back to ~/Documents when xdg-user-dir returns home dir', () => {
      const homeDir = osLinux.getDir_Home();
      (osLinux as any).execSync = () => homeDir + '\n';

      const result = osLinux.getDir_Documents();
      const expected = osLinux.pathJoin(homeDir, 'Documents');
      assert.strictEqual(result, expected);
    });

    it('should use xdg-user-dir result when valid', () => {
      (osLinux as any).execSync = () => '/custom/documents/path\n';

      const result = osLinux.getDir_Documents();
      assert.strictEqual(result, '/custom/documents/path');
    });
  });
});
