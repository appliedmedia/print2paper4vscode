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

    it('should not call showErrorMessage on the success path', async () => {
      let errorMsgCalls = 0;
      (osWin as any).execFileAsync = async () => ({ stdout: '', stderr: '' });
      (osWin as any).fn.ui.showErrorMessage = (_msg: string) => {
        errorMsgCalls += 1;
        return Promise.resolve(undefined);
      };

      await osWin.filePrint('C:\\test.pdf');
      assert.strictEqual(errorMsgCalls, 0);
    });

    it('should surface a Settings hint when PowerShell reports no default printer', async () => {
      const messages: string[] = [];
      (osWin as any).execFileAsync = async () => {
        const err: any = new Error('Start-Process failed');
        err.stderr = 'Start-Process : No default printer is configured for this user.';
        throw err;
      };
      (osWin as any).fn.ui.showErrorMessage = (msg: string) => {
        messages.push(msg);
        return Promise.resolve(undefined);
      };

      await osWin.filePrint('C:\\test.pdf');

      assert.strictEqual(messages.length, 1);
      assert.ok(/Settings/i.test(messages[0]), `expected Settings hint; got: ${messages[0]}`);
      assert.ok(/Printers/i.test(messages[0]), `expected Printers hint; got: ${messages[0]}`);
    });

    it('should surface a reader hint when the Print verb is not supported', async () => {
      const messages: string[] = [];
      (osWin as any).execFileAsync = async () => {
        const err: any = new Error('Start-Process failed');
        err.stderr = "Start-Process : The Verb 'Print' is not supported by this object.";
        throw err;
      };
      (osWin as any).fn.ui.showErrorMessage = (msg: string) => {
        messages.push(msg);
        return Promise.resolve(undefined);
      };

      await osWin.filePrint('C:\\test.pdf');

      assert.strictEqual(messages.length, 1);
      assert.ok(/PDF reader/i.test(messages[0]), `expected reader hint; got: ${messages[0]}`);
      assert.ok(/Edge|Adobe|Foxit/.test(messages[0]), `expected reader names; got: ${messages[0]}`);
    });

    it('should surface a Set-ExecutionPolicy hint when PowerShell blocks the script', async () => {
      const messages: string[] = [];
      (osWin as any).execFileAsync = async () => {
        const err: any = new Error('PowerShell blocked');
        err.stderr = 'File cannot be loaded because running scripts is disabled on this system. See about_Execution_Policies.';
        throw err;
      };
      (osWin as any).fn.ui.showErrorMessage = (msg: string) => {
        messages.push(msg);
        return Promise.resolve(undefined);
      };

      await osWin.filePrint('C:\\test.pdf');

      assert.strictEqual(messages.length, 1);
      assert.ok(/Set-ExecutionPolicy/.test(messages[0]), `expected Set-ExecutionPolicy hint; got: ${messages[0]}`);
      assert.ok(/RemoteSigned/.test(messages[0]), `expected RemoteSigned policy; got: ${messages[0]}`);
    });

    it('should rethrow when stderr does not match a known failure mode', async () => {
      (osWin as any).execFileAsync = async () => {
        const err: any = new Error('mystery failure');
        err.stderr = 'something went wrong that we have never seen before';
        throw err;
      };
      let errorMsgCalls = 0;
      (osWin as any).fn.ui.showErrorMessage = (_msg: string) => {
        errorMsgCalls += 1;
        return Promise.resolve(undefined);
      };

      await assert.rejects(() => osWin.filePrint('C:\\test.pdf'), /mystery failure/);
      assert.strictEqual(errorMsgCalls, 0);
    });

    it('should also map failure modes that surface via resolved stderr', async () => {
      const messages: string[] = [];
      (osWin as any).execFileAsync = async () => ({
        stdout: '',
        stderr: 'No default printer.'
      });
      (osWin as any).fn.ui.showErrorMessage = (msg: string) => {
        messages.push(msg);
        return Promise.resolve(undefined);
      };

      await osWin.filePrint('C:\\test.pdf');

      assert.strictEqual(messages.length, 1);
      assert.ok(/Settings/i.test(messages[0]));
    });
  });

  describe('mapPowerShellErrorToMessage', () => {
    it('should return null for stderr that does not match a known failure mode', () => {
      const result = (osWin as any).mapPowerShellErrorToMessage('totally unrelated error text');
      assert.strictEqual(result, null);
    });

    it('should be case-insensitive', () => {
      const result = (osWin as any).mapPowerShellErrorToMessage('NO DEFAULT PRINTER FOUND');
      assert.ok(result && /Settings/i.test(result));
    });
  });

  describe('fileOpenPrintDialog', () => {
    it('should call execFileAsync with powershell and -NoProfile -NonInteractive -Command', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileOpenPrintDialog('C:\\test\\file.pdf');

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].file, 'powershell');
      assert.strictEqual(calls[0].args[0], '-NoProfile');
      assert.strictEqual(calls[0].args[1], '-NonInteractive');
      assert.strictEqual(calls[0].args[2], '-Command');
      assert.strictEqual(calls[0].args.length, 4);
    });

    it('should invoke System.Windows.Forms.PrintDialog and PrintTo on OK', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileOpenPrintDialog('C:\\test\\file.pdf');

      const script = calls[0].args[3];
      assert.ok(
        script.includes('System.Windows.Forms.PrintDialog'),
        `script must instantiate PrintDialog; got: ${script}`
      );
      assert.ok(
        script.includes('-Verb PrintTo'),
        `script must use PrintTo verb; got: ${script}`
      );
      assert.ok(
        script.includes('PrinterSettings.PrinterName'),
        `script must pass chosen printer to PrintTo; got: ${script}`
      );
      assert.ok(
        script.includes("ShowDialog() -eq 'OK'"),
        `script must guard PrintTo behind dialog OK; got: ${script}`
      );
    });

    it('should escape single quotes in path for the PowerShell string literal', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileOpenPrintDialog("C:\\Users\\O'Brien\\file.pdf");

      const script = calls[0].args[3];
      assert.ok(
        script.includes("'C:\\Users\\O''Brien\\file.pdf'"),
        `single quotes must be doubled inside the PowerShell literal; got: ${script}`
      );
    });

    it('should not delegate to fileOpenInDefaultApp', async () => {
      const calls: { file: string; args: string[] }[] = [];
      (osWin as any).execFileAsync = async (file: string, args: string[]) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '' };
      };

      await osWin.fileOpenPrintDialog('C:\\test\\file.pdf');

      // Must not invoke `cmd /c start ...` (the fileOpenInDefaultApp signature).
      assert.ok(
        !calls.some(c => c.file === 'cmd'),
        'fileOpenPrintDialog must not invoke cmd /c start'
      );
    });

    it('should not call execAsync (Bug 5 fix carry-over)', async () => {
      let execAsyncCalled = false;
      (osWin as any).execAsync = async () => {
        execAsyncCalled = true;
        return { stdout: '', stderr: '' };
      };
      (osWin as any).execFileAsync = async () => ({ stdout: '', stderr: '' });

      await osWin.fileOpenPrintDialog('C:\\test.pdf');
      assert.strictEqual(execAsyncCalled, false, 'execAsync must not be called');
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
        } else {
          delete process.env.HOME;
        }
      }
    });
  });
});
