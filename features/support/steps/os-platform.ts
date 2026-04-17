import { Given, When, Then, Before } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';
import { OSWin } from '../../../out/src/OSWin.js';
import { OSLinux } from '../../../out/src/OSLinux.js';

// Track exec calls (reset per scenario by Before hook below to avoid
// cross-scenario leakage of cached OS instances or mutations).
const execState = {
  lastCommand: '',
  lastFile: '',
  lastArgs: [] as string[],
  osWin: null as any,
  osLinux: null as any,
};

Before(() => {
  execState.lastCommand = '';
  execState.lastFile = '';
  execState.lastArgs = [];
  execState.osWin = null;
  execState.osLinux = null;
});

// Helper to get platform OS instances
function getMacOS(world: P2PWorld): any {
  // On macOS, app.os IS OSMac
  return world.app.os;
}

function getWinOS(world: P2PWorld): any {
  if (!execState.osWin) {
    execState.osWin = new OSWin({ reg: world.app.reg });
  }
  return execState.osWin;
}

function getLinuxOS(world: P2PWorld): any {
  if (!execState.osLinux) {
    execState.osLinux = new OSLinux({ reg: world.app.reg });
  }
  return execState.osLinux;
}

// -- Given steps ---------------------------------------------------------

Given('macOS exec is mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getMacOS(world);
  execState.lastCommand = '';
  os.execAsync = async (cmd: string) => {
    execState.lastCommand = cmd;
    return { stdout: '', stderr: '' };
  };
});

Given('Linux exec is mocked', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getLinuxOS(world);
  execState.lastFile = '';
  execState.lastArgs = [];
  os.execFileAsync = async (file: string, args: string[]) => {
    execState.lastFile = file;
    execState.lastArgs = args;
    return { stdout: '', stderr: '' };
  };
});

// -- When steps ----------------------------------------------------------

When('I escape a path with special characters for macOS', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getMacOS(world);
  const testPath = '/tmp/test $file "quoted" `backtick`';
  world.result = os.escapePath(testPath);
});

When('I escape a path for AppleScript', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getMacOS(world);
  const testPath = '/tmp/test "file" with\\backslash';
  world.result = os.escapePathForAppleScript(testPath);
});

When('I open a file in default app on macOS', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getMacOS(world);
  await os.fileOpenInDefaultApp('/tmp/test.pdf');
});

When('I print a file on macOS', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getMacOS(world);
  await os.filePrint('/tmp/test.pdf');
});

When('I get the Documents directory on macOS', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getMacOS(world);
  world.result = os.getDir_Documents();
});

When('I escape a path with cmd metacharacters for Windows', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getWinOS(world);
  const testPath = 'C:\\test "file" %var%\r\n';
  world.result = os.escapePath(testPath);
});

When('I escape a path for Linux', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getLinuxOS(world);
  const testPath = '/tmp/test file $special';
  world.result = os.escapePath(testPath);
});

When('I open a file in default app on Linux', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const os = getLinuxOS(world);
  await os.fileOpenInDefaultApp('/tmp/test.pdf');
});

// -- Then steps ----------------------------------------------------------

Then('the macOS escaped path should have metacharacters escaped', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const escaped = world.result as string;
  // Dollar sign should be escaped
  assert.ok(escaped.includes('\\$'), 'Dollar sign should be escaped');
  // Backtick should be escaped
  assert.ok(escaped.includes('\\`'), 'Backtick should be escaped');
  // Double quote should be escaped
  assert.ok(escaped.includes('\\"'), 'Double quote should be escaped');
});

Then('the AppleScript path should have quotes escaped', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const escaped = world.result as string;
  // Double quote should be escaped
  assert.ok(escaped.includes('\\"'), 'Double quote should be escaped');
  // Backslash should be escaped
  assert.ok(escaped.includes('\\\\'), 'Backslash should be escaped');
});

Then('the open command should be called', (t: TestCaseContext) => {
  assert.ok(execState.lastCommand.startsWith('open '), 'Should use open command');
  assert.ok(execState.lastCommand.includes('test.pdf'), 'Should include filename');
});

Then('the lpr command should be called', (t: TestCaseContext) => {
  assert.ok(execState.lastCommand.startsWith('lpr '), 'Should use lpr command');
  assert.ok(execState.lastCommand.includes('test.pdf'), 'Should include filename');
});

Then(
  'the path should end with {string}',
  (t: TestCaseContext, suffix: string) => {
    const world = t.world as P2PWorld;
    const path = world.result as string;
    assert.ok(path.endsWith(suffix), `Path "${path}" should end with "${suffix}"`);
  }
);

Then('the Windows escaped path should have metacharacters escaped', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const escaped = world.result as string;
  // Double quotes should be doubled
  assert.ok(escaped.includes('""'), 'Double quotes should be doubled');
  // Percent signs should be doubled
  assert.ok(escaped.includes('%%'), 'Percent signs should be doubled');
  // CR/LF should be stripped
  assert.ok(!escaped.includes('\r'), 'CR should be stripped');
  assert.ok(!escaped.includes('\n'), 'LF should be stripped');
});

Then('the Linux path should be unchanged', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, '/tmp/test file $special', 'Path should be unchanged');
});

Then('the xdg-open command should be called', (t: TestCaseContext) => {
  assert.strictEqual(execState.lastFile, 'xdg-open', 'Should use xdg-open');
  assert.ok(execState.lastArgs.includes('/tmp/test.pdf'), 'Should include filepath');
});
