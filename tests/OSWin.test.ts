import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp } from './test-utils.js';
import { OSWin } from '../src/OSWin.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('OSWin', () => {
  let app: TestApp;
  let osWin: OSWin;

  beforeEach(() => {
    app = createTestApp({ context: mockContext, vscode: mockVSCode });
    osWin = new OSWin({ reg: app.reg });
  });

  afterEach(() => {
    osWin.done();
    app.done();
    mock.restoreAll();
  });

  describe('fileOpenInDefaultApp', () => {
    it('should call execFileAsync with cmd /c start', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileOpenInDefaultApp('C:\\test\\file.pdf');

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].file, 'cmd');
      assert.deepStrictEqual(calls[0].args, ['/c', 'start', '""', 'C:\\test\\file.pdf']);
    });

    it('should pass path as-is without shell escaping', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileOpenInDefaultApp('C:\\Program Files\\my file.pdf');

      assert.strictEqual(calls[0].args[3], 'C:\\Program Files\\my file.pdf');
    });

    it('should not call execAsync (Bug 5 fix)', async () => {
      let execAsyncCalled = false;
      (osWin as any).execAsync = async () => {
        execAsyncCalled = true;
        return { stdout: '', stderr: '' };
      };
      (osWin as any).execFileAsync = async () => ({ stdout: '', stderr: '' });

      await osWin.fileOpenInDefaultApp('C:\\test.pdf');
      assert.strictEqual(execAsyncCalled, false, 'execAsync must not be called');
    });
  });

  describe('fileReveal', () => {
    it('should call execFileAsync with explorer.exe /select,', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileReveal('C:\\test\\file.pdf');

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].file, 'explorer.exe');
      assert.deepStrictEqual(calls[0].args, ['/select,C:\\test\\file.pdf']);
    });

    it('should concatenate /select, with path (no space)', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileReveal('C:\\Users\\name\\Documents\\report.pdf');
      assert.strictEqual(calls[0].args[0], '/select,C:\\Users\\name\\Documents\\report.pdf');
    });

    it('should not call execAsync (Bug 5 fix)', async () => {
      let execAsyncCalled = false;
      (osWin as any).execAsync = async () => {
        execAsyncCalled = true;
        return { stdout: '', stderr: '' };
      };
      (osWin as any).execFileAsync = async () => ({ stdout: '', stderr: '' });

      await osWin.fileReveal('C:\\test.pdf');
      assert.strictEqual(execAsyncCalled, false, 'execAsync must not be called');
    });
  });

  describe('filePrint', () => {
    it('should call execFileAsync with powershell Start-Process -Verb Print (Bug 4 fix)', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.filePrint('C:\\test\\file.pdf');

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].file, 'powershell');
      assert.deepStrictEqual(calls[0].args, [
        '-NoProfile', '-NonInteractive', '-Command',
        "Start-Process -FilePath 'C:\\test\\file.pdf' -Verb Print"
      ]);
    });

    it('should not use shimgvw.dll (Bug 4 fix)', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };
      (osWin as any).execAsync = async (cmd: string) => {
        calls.push({ file: cmd, args: [] });
        return { stdout: '', stderr: '' };
      };

      await osWin.filePrint('C:\\test\\file.pdf');

      const allText = calls.map(c => c.file + ' ' + c.args.join(' ')).join(' ');
      assert.ok(!allText.includes('shimgvw'), 'Must not reference shimgvw.dll');
      assert.ok(!allText.includes('rundll32'), 'Must not use rundll32');
    });

    it('should escape single quotes in path for PowerShell', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.filePrint("C:\\Users\\O'Brien\\file.pdf");

      const command = calls[0].args[3];
      assert.strictEqual(command, "Start-Process -FilePath 'C:\\Users\\O''Brien\\file.pdf' -Verb Print");
    });

    it('should not call execAsync (Bug 5 fix)', async () => {
      let execAsyncCalled = false;
      (osWin as any).execAsync = async () => {
        execAsyncCalled = true;
        return { stdout: '', stderr: '' };
      };
      (osWin as any).execFileAsync = async () => ({ stdout: '', stderr: '' });

      await osWin.filePrint('C:\\test.pdf');
      assert.strictEqual(execAsyncCalled, false, 'execAsync must not be called');
    });
  });

  describe('fileOpenPrintDialog', () => {
    it('should delegate to fileOpenInDefaultApp', async () => {
      const calls: string[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push(file);
        return { stdout: '', stderr: '' };
      };

      await osWin.fileOpenPrintDialog('C:\\test\\file.pdf');

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0], 'cmd');
    });
  });

  describe('getDir_Documents', () => {
    it('should use USERPROFILE when available', () => {
      const origProfile = process.env.USERPROFILE;
      const origHome = process.env.HOME;
      try {
        process.env.USERPROFILE = 'C:\\Users\\TestUser';
        delete process.env.HOME;
        const dir = osWin.getDir_Documents();
        assert.ok(dir.includes('TestUser'));
        assert.ok(dir.includes('Documents'));
      } finally {
        if (origProfile !== undefined) { process.env.USERPROFILE = origProfile; } else { delete process.env.USERPROFILE; }
        if (origHome !== undefined) { process.env.HOME = origHome; } else { delete process.env.HOME; }
      }
    });

    it('should fall back to HOME when USERPROFILE is not set', () => {
      const origProfile = process.env.USERPROFILE;
      const origHome = process.env.HOME;
      try {
        delete process.env.USERPROFILE;
        process.env.HOME = 'C:\\Users\\HomeUser';
        const dir = osWin.getDir_Documents();
        assert.ok(dir.includes('HomeUser'));
        assert.ok(dir.includes('Documents'));
      } finally {
        if (origProfile !== undefined) { process.env.USERPROFILE = origProfile; } else { delete process.env.USERPROFILE; }
        if (origHome !== undefined) { process.env.HOME = origHome; } else { delete process.env.HOME; }
      }
    });

    it('should fall back to getDir_Home() when env vars are cleared', () => {
      const origProfile = process.env.USERPROFILE;
      const origHome = process.env.HOME;
      const sentinel = 'Z:\\SentinelHomeDir';

      try {
        delete process.env.USERPROFILE;
        delete process.env.HOME;

        // Stub getDir_Home to return a sentinel so we can verify the fallback path
        (osWin as any).getDir_Home = () => sentinel;

        const dir = osWin.getDir_Documents();
        assert.ok(
          dir.includes(sentinel),
          `Should use getDir_Home() sentinel; got "${dir}"`
        );
        assert.ok(
          dir.includes('Documents'),
          'Should append Documents to the home directory'
        );
      } finally {
        // Restore getDir_Home to the prototype method
        delete (osWin as any).getDir_Home;
        if (origProfile !== undefined) {
          process.env.USERPROFILE = origProfile;
        } else {
          delete process.env.USERPROFILE;
        }
        if (origHome !== undefined) {
          process.env.HOME = origHome;
        }
      }
    });
  });
});
