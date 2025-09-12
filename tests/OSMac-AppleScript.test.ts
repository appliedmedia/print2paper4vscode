import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { OSMac } from '../src/OSMac';

describe('OSMac AppleScript Functionality', () => {
  test('should execute filePrint with correct AppleScript command', async () => {
    // Create a minimal app mock that provides only what OSMac needs
    const mockApp = {
      vscodeapis: {
        getExtensionPath: () => process.cwd() // Use current working directory
      },
      dx: {
        create: () => ({ out: () => {}, sub: () => ({ out: () => {}, done: () => {} }) })
      },
      os: {
        readExtensionYaml: (path: string) => {
          if (path === 'src/OSMac.yaml') {
            return {
              apple_script_print_via_finder: 'tell application "Finder" to print POSIX file "{{FILE_PATH}}"'
            };
          }
          return {};
        }
      },
      templateDictReplace: (template: string, dict: Record<string, string>) => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => dict[key] || match);
      }
    };

    // Mock execAsync to capture the command without executing it
    let capturedCommand = '';
    const originalExecAsync = OSMac.prototype.execAsync;
    OSMac.prototype.execAsync = async (cmd: string) => {
      capturedCommand = cmd;
      return { stdout: '', stderr: '' };
    };

    try {
      const os = new OSMac(mockApp as any);
      const testPath = '/tmp/test.pdf';
      
      await os.filePrint(testPath);
      
      // Verify the command was constructed correctly
      assert.equal(capturedCommand, 'osascript -e \'tell application "Finder" to print POSIX file "/tmp/test.pdf"\'');
    } finally {
      // Restore original method
      OSMac.prototype.execAsync = originalExecAsync;
    }
  });

  test('should execute fileOpenPrintDialog with correct AppleScript command', async () => {
    const mockApp = {
      vscodeapis: {
        getExtensionPath: () => process.cwd()
      },
      dx: {
        create: () => ({ out: () => {}, sub: () => ({ out: () => {}, done: () => {} }) })
      },
      os: {
        readExtensionYaml: (path: string) => {
          if (path === 'src/OSMac.yaml') {
            return {
              apple_script_open_preview_print_dialog: 'tell application "Preview" to open POSIX file "{{FILE_PATH}}"\ntell application "Preview" to activate\ntell application "System Events" to keystroke "p" using command down'
            };
          }
          return {};
        }
      },
      templateDictReplace: (template: string, dict: Record<string, string>) => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => dict[key] || match);
      }
    };

    let capturedCommand = '';
    const originalExecAsync = OSMac.prototype.execAsync;
    OSMac.prototype.execAsync = async (cmd: string) => {
      capturedCommand = cmd;
      return { stdout: '', stderr: '' };
    };

    try {
      const os = new OSMac(mockApp as any);
      const testPath = '/tmp/test.pdf';
      
      await os.fileOpenPrintDialog(testPath);
      
      // Verify the command was constructed correctly
      const expectedCommand = 'osascript -e \'tell application "Preview" to open POSIX file "/tmp/test.pdf"\ntell application "Preview" to activate\ntell application "System Events" to keystroke "p" using command down\'';
      assert.equal(capturedCommand, expectedCommand);
    } finally {
      OSMac.prototype.execAsync = originalExecAsync;
    }
  });
});
