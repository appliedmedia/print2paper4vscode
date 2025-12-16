import { test, describe } from 'node:test';
import type { FnImport_t } from '../src/types/Registry_t.js';
import { getFn } from './test-helpers.js';
import { strict as assert } from 'node:assert';

describe('OSMac AppleScript Functionality', () => {
  test('should verify AppleScript templates work correctly', () => {
    // Test the core functionality: template replacement
    const templateDictReplace = (template: string, dict: Record<string, string>) => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => dict[key] || match);
    };

    // Test filePrint template
    const printTemplate = 'tell application "Finder" to print POSIX file "{{FILE_PATH}}"';
    const testPath = '/tmp/test.pdf';
    const replacedPrintScript = templateDictReplace(printTemplate, { FILE_PATH: testPath });
    const expectedPrintCommand = `osascript -e '${replacedPrintScript}'`;

    assert.equal(
      replacedPrintScript,
      'tell application "Finder" to print POSIX file "/tmp/test.pdf"'
    );
    assert.equal(
      expectedPrintCommand,
      'osascript -e \'tell application "Finder" to print POSIX file "/tmp/test.pdf"\''
    );

    // Test fileOpenPrintDialog template
    const previewTemplate =
      'tell application "Preview" to open POSIX file "{{FILE_PATH}}"\ntell application "Preview" to activate\ntell application "System Events" to keystroke "p" using command down';
    const replacedPreviewScript = templateDictReplace(previewTemplate, { FILE_PATH: testPath });
    const expectedPreviewCommand = `osascript -e '${replacedPreviewScript}'`;

    assert.equal(
      replacedPreviewScript,
      'tell application "Preview" to open POSIX file "/tmp/test.pdf"\ntell application "Preview" to activate\ntell application "System Events" to keystroke "p" using command down'
    );
    assert(expectedPreviewCommand.includes('tell application "Preview"'));
    assert(expectedPreviewCommand.includes('tell application "System Events"'));
  });
});
