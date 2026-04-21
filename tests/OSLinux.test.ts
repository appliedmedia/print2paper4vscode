import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { createTestApp, TestApp } from './test-utils.js';
import { OSLinux } from '../src/OSLinux.js';
import { mockContext, mockVSCode } from './test-utils.js';

const isLinux = process.platform === 'linux';

describe('OSLinux smoke', () => {
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

  it('fileOpenPrintDialog launches the first available viewer', { skip: !isLinux }, async () => {
    const calls: Array<{ file: string; args: string[] }> = [];
    (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
      calls.push({ file, args });
      return { stdout: '', stderr: '' };
    };

    await osLinux.fileOpenPrintDialog('/tmp/test.pdf');

    assert.strictEqual(calls[0].file, 'which');
    assert.deepStrictEqual(calls[0].args, ['evince']);
    assert.strictEqual(calls[1].file, 'evince');
    assert.deepStrictEqual(calls[1].args, ['/tmp/test.pdf']);
    assert.strictEqual(calls.length, 2);
  });

  it('fileOpenPrintDialog falls back to fileOpenInDefaultApp when every viewer probe fails', { skip: !isLinux }, async () => {
    const calls: Array<{ file: string; args: string[] }> = [];
    (osLinux as any).execFileAsync = async (file: string, args: string[]) => {
      calls.push({ file, args });
      if (file === 'which') {
        throw new Error('not found');
      }
      return { stdout: '', stderr: '' };
    };

    await osLinux.fileOpenPrintDialog('/tmp/test.pdf');

    const whichCalls = calls.filter(c => c.file === 'which');
    assert.strictEqual(whichCalls.length, 4);
    assert.deepStrictEqual(
      whichCalls.map(c => c.args[0]),
      ['evince', 'okular', 'atril', 'xreader']
    );

    const lastCall = calls[calls.length - 1];
    assert.strictEqual(lastCall.file, 'xdg-open');
    assert.deepStrictEqual(lastCall.args, ['/tmp/test.pdf']);
  });

  it('filePrint rethrows a friendly CUPS error when execFileAsync throws ENOENT', { skip: !isLinux }, async () => {
    (osLinux as any).execFileAsync = async (file: string, _args: string[]) => {
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

  it('getDir_Documents returns a non-empty string', { skip: !isLinux }, () => {
    const result = osLinux.getDir_Documents();
    assert.strictEqual(typeof result, 'string');
    assert.ok(result.length > 0, 'getDir_Documents should return a non-empty string');
  });
});
