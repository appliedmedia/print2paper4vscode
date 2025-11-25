import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { OSLinux } from '../src/OSLinux.js';
import { OSWin } from '../src/OSWin.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('OS Platform-Specific Classes', () => {
  let app: App;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
  });

  afterEach(() => {
    app.done();
  });

  describe('OSLinux', () => {
    it('should initialize OSLinux instance', () => {
      const osLinux = new OSLinux(app);
      assert.ok(osLinux instanceof OSLinux);
      osLinux.done();
    });

    it('should provide Linux-specific OS keys', () => {
      const osLinux = new OSLinux(app);
      const keys = (osLinux as any).getOSKeys();
      assert.ok(keys, 'Should have OS keys');
      assert.strictEqual(keys['os-ctrl-cmd'], 'Ctrl', 'Linux uses Ctrl key');
      osLinux.done();
    });

    it('should have platform-specific file operations', () => {
      const osLinux = new OSLinux(app);
      
      // Should have the required methods
      assert.ok(typeof osLinux.fileOpenInDefaultApp === 'function');
      assert.ok(typeof osLinux.fileReveal === 'function');
      assert.ok(typeof osLinux.filePrint === 'function');
      assert.ok(typeof osLinux.fileOpenPrintDialog === 'function');
      
      osLinux.done();
    });
  });

  describe('OSWin', () => {
    it('should initialize OSWin instance', () => {
      const osWin = new OSWin(app);
      assert.ok(osWin instanceof OSWin);
      osWin.done();
    });

    it('should provide Windows-specific OS keys', () => {
      const osWin = new OSWin(app);
      const keys = (osWin as any).getOSKeys();
      assert.ok(keys, 'Should have OS keys');
      assert.strictEqual(keys['os-ctrl-cmd'], 'Ctrl', 'Windows uses Ctrl key');
      osWin.done();
    });

    it('should have platform-specific file operations', () => {
      const osWin = new OSWin(app);
      
      // Should have the required methods
      assert.ok(typeof osWin.fileOpenInDefaultApp === 'function');
      assert.ok(typeof osWin.fileReveal === 'function');
      assert.ok(typeof osWin.filePrint === 'function');
      assert.ok(typeof osWin.fileOpenPrintDialog === 'function');
      
      osWin.done();
    });
  });

  describe('Platform Detection', () => {
    it('should detect platform correctly', () => {
      const platform = process.platform;
      assert.ok(['darwin', 'linux', 'win32'].includes(platform), 'Should return valid platform');
    });

    it('should create correct OS instance for platform', () => {
      // The app.os should be one of the platform-specific classes
      assert.ok(app.os, 'Should have OS instance');
      assert.ok(typeof app.os.fileOpenInDefaultApp === 'function');
      assert.ok(typeof app.os.fileReveal === 'function');
    });
  });
});
