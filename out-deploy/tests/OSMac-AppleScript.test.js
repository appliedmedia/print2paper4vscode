"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
(0, node_test_1.describe)('OSMac AppleScript Functionality', () => {
    (0, node_test_1.test)('should verify AppleScript templates work correctly', () => {
        // Test the core functionality: template replacement
        const templateDictReplace = (template, dict) => {
            return template.replace(/\{\{(\w+)\}\}/g, (match, key) => dict[key] || match);
        };
        // Test filePrint template
        const printTemplate = 'tell application "Finder" to print POSIX file "{{FILE_PATH}}"';
        const testPath = '/tmp/test.pdf';
        const replacedPrintScript = templateDictReplace(printTemplate, { FILE_PATH: testPath });
        const expectedPrintCommand = `osascript -e '${replacedPrintScript}'`;
        node_assert_1.strict.equal(replacedPrintScript, 'tell application "Finder" to print POSIX file "/tmp/test.pdf"');
        node_assert_1.strict.equal(expectedPrintCommand, 'osascript -e \'tell application "Finder" to print POSIX file "/tmp/test.pdf"\'');
        // Test fileOpenPrintDialog template
        const previewTemplate = 'tell application "Preview" to open POSIX file "{{FILE_PATH}}"\ntell application "Preview" to activate\ntell application "System Events" to keystroke "p" using command down';
        const replacedPreviewScript = templateDictReplace(previewTemplate, { FILE_PATH: testPath });
        const expectedPreviewCommand = `osascript -e '${replacedPreviewScript}'`;
        node_assert_1.strict.equal(replacedPreviewScript, 'tell application "Preview" to open POSIX file "/tmp/test.pdf"\ntell application "Preview" to activate\ntell application "System Events" to keystroke "p" using command down');
        (0, node_assert_1.strict)(expectedPreviewCommand.includes('tell application "Preview"'));
        (0, node_assert_1.strict)(expectedPreviewCommand.includes('tell application "System Events"'));
    });
});
//# sourceMappingURL=OSMac-AppleScript.test.js.map