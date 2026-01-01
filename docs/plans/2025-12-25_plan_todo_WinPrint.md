# Windows Printing Implementation Plan

**Status:** TODO  
**Created:** 2025-12-25  
**Priority:** Medium - Platform expansion  
**Estimated Time:** 4-6 hours

## Overview

Implement native Windows printing support for Print2Paper4VSCode extension. Currently, the extension has full macOS support via AppleScript, but Windows uses stub implementations. This plan adds real Windows printing commands.

---

## Current State

| Component | Status | Notes |
| --- | --- | --- |
| OSWin.ts | ⚠️ Exists with stubs | No actual printing commands |
| File generation | ✅ Works | PDF generation platform-agnostic |
| Print dialog | ❌ Not implemented | Needs Windows command |
| Direct printing | ❌ Not implemented | Needs Windows command |
| Testing | ❌ No Windows tests | Requires Windows environment |

---

## Goals

1. Implement `fileOpenPrintDialog()` for Windows
2. Implement `filePrint()` for Windows
3. Add Windows-specific error handling
4. Create Windows platform tests
5. Document Windows printing behavior

---

## Implementation Plan

### Task 1: Implement Print Dialog (2 hours)

**File:** `src/OSWin.ts`

**Approach:** Use Windows `start` command to open PDF in default viewer with print dialog.

```typescript
async fileOpenPrintDialog(args: { path: string }): Promise<void> {
  const dx = this.dx.sub({ name: 'fileOpenPrintDialog' });
  const { path } = args;
  dx.require(args, ['path']);
  
  try {
    // Windows: Open file with default PDF viewer
    // User manually triggers print from viewer
    await this.execAsync(`start "" "${path}"`);
    dx.out(`Opened PDF in default viewer: ${path}`);
  } catch (err) {
    dx.error(`Failed to open print dialog: ${err}`);
    throw err;
  } finally {
    dx.done();
  }
}
```

**Testing:**

- Verify PDF opens in default viewer (Adobe, Edge, Chrome)
- Verify file path with spaces works
- Verify error handling for missing file

---

### Task 2: Implement Direct Printing (2 hours)

**File:** `src/OSWin.ts`

**Approach:** Use PowerShell's `Start-Process -Verb Print` to send directly to default printer.

```typescript
async filePrint(args: { path: string }): Promise<void> {
  const dx = this.dx.sub({ name: 'filePrint' });
  const { path } = args;
  dx.require(args, ['path']);
  
  try {
    // Windows: Print directly using default printer
    // Uses PowerShell verb "Print"
    const cmd = `powershell -Command "Start-Process -FilePath '${path}' -Verb Print -Wait"`;
    await this.execAsync(cmd);
    dx.out(`Sent to default printer: ${path}`);
  } catch (err) {
    dx.error(`Failed to print: ${err}`);
    throw err;
  } finally {
    dx.done();
  }
}
```

**Edge Cases:**

- No default printer configured
- PDF viewer not installed
- PowerShell execution policy restrictions
- File path with special characters

---

### Task 3: Add Error Handling (1 hour)

**Enhancements:**

```typescript
async filePrint(args: { path: string }): Promise<void> {
  const dx = this.dx.sub({ name: 'filePrint' });
  const { path } = args;
  dx.require(args, ['path']);
  
  try {
    // Check if file exists first
    const fs = require('fs');
    if (!fs.existsSync(path)) {
      throw new Error(`File not found: ${path}`);
    }
    
    // Check if PowerShell is available
    try {
      await this.execAsync('powershell -Command "Write-Host test"');
    } catch {
      throw new Error('PowerShell not available');
    }
    
    // Attempt to print
    const cmd = `powershell -Command "Start-Process -FilePath '${path}' -Verb Print -Wait"`;
    await this.execAsync(cmd);
    dx.out(`Sent to default printer: ${path}`);
    
  } catch (err) {
    dx.error(`Failed to print: ${err}`);
    
    // Provide helpful error messages
    if (err.message.includes('no printer')) {
      throw new Error('No default printer configured. Please set up a printer in Windows Settings.');
    }
    
    throw err;
  } finally {
    dx.done();
  }
}
```

---

### Task 4: Create Windows Tests (1 hour)

**File:** `tests/OSWin.test.ts`

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { OSWin } from '../src/OSWin.js';

test('OSWin - fileOpenPrintDialog opens PDF', async () => {
  if (process.platform !== 'win32') {
    console.log('Skipping Windows-specific test');
    return;
  }
  
  const os = new OSWin({ /* mock registry */ });
  
  // Create test PDF
  const testPdf = 'test-output.pdf';
  
  // Should not throw
  await os.fileOpenPrintDialog({ path: testPdf });
});

test('OSWin - fileOpenPrintDialog handles missing file', async () => {
  if (process.platform !== 'win32') {
    console.log('Skipping Windows-specific test');
    return;
  }
  
  const os = new OSWin({ /* mock registry */ });
  
  await assert.rejects(
    async () => os.fileOpenPrintDialog({ path: 'nonexistent.pdf' }),
    /not found/i
  );
});

test('OSWin - filePrint sends to printer', async () => {
  if (process.platform !== 'win32') {
    console.log('Skipping Windows-specific test');
    return;
  }
  
  const os = new OSWin({ /* mock registry */ });
  const testPdf = 'test-output.pdf';
  
  // Should not throw (requires printer configured)
  await os.filePrint({ path: testPdf });
});
```

---

### Task 5: Documentation (30 min)

**Update:** `README.md`

```markdown
## Platform Support

### Windows (Full Support) ✅

- ✅ PDF generation and syntax highlighting
- ✅ Print dialog support (opens in default PDF viewer)
- ✅ Direct printing to default printer
- ⚠️ Requires default printer configured in Windows Settings
- ⚠️ Requires PowerShell for direct printing

**Requirements:**
- Windows 10/11
- Default PDF viewer (Edge, Adobe, Chrome)
- Default printer configured (for direct printing)
- PowerShell (included in Windows)
```

---

## Testing Strategy

### Manual Testing Checklist

**Environment Setup:**

- [ ] Windows 10/11 machine
- [ ] Default printer configured
- [ ] PDF viewer installed (Edge, Adobe, Chrome)
- [ ] PowerShell available

**Test Cases:**

1. [ ] Open print dialog with simple filename
2. [ ] Open print dialog with filename containing spaces
3. [ ] Direct print to default printer
4. [ ] Error handling: no printer configured
5. [ ] Error handling: PowerShell not available
6. [ ] Error handling: file not found
7. [ ] Test with different PDF viewers (Edge, Adobe, Chrome)

### Automated Testing

- Unit tests in `tests/OSWin.test.ts`
- Platform check: Skip on non-Windows
- Mock file system for error cases
- Integration tests with real printer (manual verification)

---

## Implementation Order

1. **Phase 1 (2 hours):** Implement `fileOpenPrintDialog()`
   - Basic implementation
   - Manual testing
   - Error handling

2. **Phase 2 (2 hours):** Implement `filePrint()`
   - PowerShell command
   - Manual testing
   - Error handling

3. **Phase 3 (1 hour):** Enhanced error handling
   - Helpful error messages
   - Edge case coverage

4. **Phase 4 (1 hour):** Tests and documentation
   - Unit tests
   - Manual test checklist
   - README updates

---

## Dependencies

- None (uses Windows built-in commands)
- PowerShell (included in Windows 10/11)
- Default PDF viewer (Edge, Adobe, Chrome)

---

## Success Criteria

- [ ] Windows print dialog opens PDF in default viewer
- [ ] Direct printing sends PDF to default printer
- [ ] Error messages are clear and actionable
- [ ] Tests pass on Windows platform
- [ ] Documentation updated
- [ ] No regressions on macOS/Linux

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| PowerShell execution policy | High | Document policy settings, provide alternatives |
| No default printer | Medium | Clear error message with instructions |
| PDF viewer not installed | Low | Use Windows default (Edge) |
| Path escaping issues | Medium | Thorough testing with special characters |

---

## Related Files

- `src/OSWin.ts` - Implementation
- `tests/OSWin.test.ts` - Tests
- `README.md` - Documentation
- `docs/plans/2025-12-25_plan_todo_LinuxPrint.md` - Linux equivalent

---

## Next Steps After Completion

1. Update platform support table in README
2. Mark Windows as fully supported
3. Consider adding printer selection dialog (future enhancement)
4. Consider adding print settings (copies, orientation, etc.)
