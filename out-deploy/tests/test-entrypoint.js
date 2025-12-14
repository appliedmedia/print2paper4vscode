"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// Minimal test entrypoint
function activate(context) {
    console.log('Test extension activated!');
}
function deactivate() {
    console.log('Test extension deactivated!');
}
//# sourceMappingURL=test-entrypoint.js.map