// Test file for Diagnostics class
// Run with: node test_diagnostics.js

// Import the Diagnostics class
const Diagnostics = require('./Diagnostics.js');

console.log("=== Diagnostics Class Test Suite ===\n");

// Test 1: Basic functionality and global debug state
console.log("Test 1: Basic functionality and global debug state");
console.log("Global debug state (default):", Diagnostics.debugOn());
Diagnostics.debugOn(true);
console.log("Global debug state (set to true):", Diagnostics.debugOn());
console.log();

// Test 2: Instance creation and inheritance
console.log("Test 2: Instance creation and inheritance");
const dx1 = new Diagnostics("TestClass");
console.log("Instance debug state (inherits from global):", dx1.debugOn());
console.log("Instance className:", dx1.className);
console.log();

// Test 3: Instance debug override
console.log("Test 3: Instance debug override");
const dx2 = new Diagnostics("TestClass2", false);
console.log("Instance debug state (explicitly false):", dx2.debugOn());
dx2.debugOn(true);
console.log("Instance debug state (changed to true):", dx2.debugOn());
console.log();

// Test 4: Sub-context creation and inheritance
console.log("Test 4: Sub-context creation and inheritance");
const methodDx1 = dx1.sub("testMethod");
console.log("Method debug state (inherits from parent):", methodDx1.debugOn());
console.log("Method className:", methodDx1.className);
console.log();

// Test 5: Sub-context debug override
console.log("Test 5: Sub-context debug override");
const methodDx2 = dx1.sub("testMethod2", false);
console.log("Method debug state (explicitly false):", methodDx2.debugOn());
console.log("Method className:", methodDx2.className);
console.log();

// Test 6: Null/undefined handling in sub-contexts
console.log("Test 6: Null/undefined handling in sub-contexts");
const methodDx3 = dx1.sub("testMethod3", null);
console.log("Method debug state (null - inherits from parent):", methodDx3.debugOn());

const methodDx4 = dx1.sub("testMethod4", undefined);
console.log("Method debug state (undefined - inherits from parent):", methodDx4.debugOn());
console.log();

// Test 7: Timing functionality
console.log("Test 7: Timing functionality");
const timingDx = dx1.sub("timingMethod");
timingDx.out("Starting timing test...");

// Simulate some work
setTimeout(() => {
    timingDx.out("Work in progress...");
    
    setTimeout(() => {
        timingDx.out("Almost done...");
        timingDx.done("Timing test completed");
    }, 100);
}, 50);
console.log();

// Test 8: Multiple async methods (no conflicts)
console.log("Test 8: Multiple async methods (no conflicts)");
const async1 = dx1.sub("asyncMethod1");
const async2 = dx1.sub("asyncMethod2");

async1.out("Async method 1 starting");
async2.out("Async method 2 starting");

setTimeout(() => {
    async1.out("Async method 1 still working");
    async2.out("Async method 2 still working");
    
    setTimeout(() => {
        async1.done("Async method 1 completed");
        async2.done("Async method 2 completed");
    }, 100);
}, 100);
console.log();

// Test 9: Print vs Out methods
console.log("Test 9: Print vs Out methods");
const printDx = dx2.sub("printMethod"); // dx2 has debug = false
printDx.out("This won't show (debug disabled)");
printDx.print("This will always show");
printDx.done("Print test completed");
console.log();

// Test 10: Debug state changes during runtime
console.log("Test 10: Debug state changes during runtime");
const runtimeDx = dx1.sub("runtimeMethod");
console.log("Initial debug state:", runtimeDx.debugOn());

Diagnostics.debugOn(false); // Change global state
console.log("After global change - global:", Diagnostics.debugOn());
console.log("After global change - instance:", dx1.debugOn());
console.log("After global change - method:", runtimeDx.debugOn());

// Reset for final tests
Diagnostics.debugOn(true);
console.log();

// Test 11: Complex inheritance chain
console.log("Test 11: Complex inheritance chain");
const level1 = dx1.sub("level1");
const level2 = level1.sub("level2");
const level3 = level2.sub("level3");

console.log("Level 1 className:", level1.className);
console.log("Level 2 className:", level2.className);
console.log("Level 3 className:", level3.className);
console.log("Level 3 debug state:", level3.debugOn());
console.log();

// Test 12: Method context tracking
console.log("Test 12: Method context tracking");
const contextDx = dx1.sub("contextMethod");
console.log("Current method:", contextDx.getCurrentMethod());
contextDx.done("Context test completed");
console.log("Current method after done():", contextDx.getCurrentMethod());
console.log();

// Test 13: Separator access
console.log("Test 13: Separator access");
console.log("Static separator:", Diagnostics.separator);
console.log();

// Test 14: Final verification
console.log("Test 14: Final verification");
console.log("Final global debug state:", Diagnostics.debugOn());
console.log("Final instance debug state:", dx1.debugOn());

console.log("\n=== All Tests Completed ===");
console.log("Check the output above to verify functionality.");
console.log("Look for timing information in the async method outputs.");