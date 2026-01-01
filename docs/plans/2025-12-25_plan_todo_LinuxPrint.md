# Linux Printing Implementation Plan

**Status:** TODO  
**Created:** 2025-12-25  
**Priority:** Medium - Platform expansion  
**Estimated Time:** 4-6 hours

## Overview

Implement native Linux printing support for Print2Paper4VSCode extension. Currently, the extension has full macOS support via AppleScript, but Linux uses stub implementations. This plan adds real Linux printing commands compatible with major distributions and desktop environments.

---

## Current State

| Component | Status | Notes |
| --- | --- | --- |
| OSLinux.ts | ⚠️ Exists with stubs | No actual printing commands |
| File generation | ✅ Works | PDF generation platform-agnostic |
| Print dialog | ❌ Not implemented | Needs Linux command |
| Direct printing | ❌ Not implemented | Needs Linux command |
| Testing | ❌ No Linux tests | Requires Linux environment |

---

## Goals

1. Implement `fileOpenPrintDialog()` for multiple desktop environments
2. Implement `filePrint()` using CUPS/lp command
3. Add Linux distribution detection and fallbacks
4. Create Linux platform tests
5. Document Linux printing behavior across distros

---

## Implementation Plan

### Task 1: Implement Print Dialog (2-3 hours)

**File:** `src/OSLinux.ts`

**Challenge:** Linux has multiple desktop environments with different PDF viewers.

**Approach:** Try viewers in order of popularity, fallback to xdg-open.

```typescript
async fileOpenPrintDialog(args: { path: string }): Promise<void> {
  const dx = this.dx.sub({ name: 'fileOpenPrintDialog' });
  const { path } = args;
  dx.require(args, ['path']);
  
  try {
    // Linux: Try common PDF viewers in order of preference
    const viewers = [
      'evince',      // GNOME default
      'okular',      // KDE default
      'atril',       // MATE default
      'xreader',     // Linux Mint default
      'qpdfview',    // Lightweight
      'xdg-open'     // Universal fallback
    ];
    
    for (const viewer of viewers) {
      try {
        // Check if viewer exists
        await this.execAsync(`which ${viewer}`);
        
        // Open PDF with viewer
        await this.execAsync(`${viewer} "${path}" &`);
        dx.out(`Opened print dialog with ${viewer}: ${path}`);
        return;
      } catch {
        // Try next viewer
        continue;
      }
    }
    
    throw new Error('No PDF viewer found. Please install evince, okular, or atril.');
    
  } catch (err) {
    dx.error(`Failed to open print dialog: ${err}`);
    throw err;
  } finally {
    dx.done();
  }
}
```

**Desktop Environment Support:**

- GNOME → evince
- KDE → okular
- MATE → atril
- XFCE → xreader or evince
- Cinnamon → xreader
- LXQt → qpdfview

---

### Task 2: Implement Direct Printing (2 hours)

**File:** `src/OSLinux.ts`

**Approach:** Use CUPS `lp` command (standard across all Linux distributions).

```typescript
async filePrint(args: { path: string }): Promise<void> {
  const dx = this.dx.sub({ name: 'filePrint' });
  const { path } = args;
  dx.require(args, ['path']);
  
  try {
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(path)) {
      throw new Error(`File not found: ${path}`);
    }
    
    // Check if lp command is available (CUPS)
    try {
      await this.execAsync('which lp');
    } catch {
      throw new Error('CUPS printing system not found. Please install cups package.');
    }
    
    // Check if any printer is configured
    const lpstatResult = await this.execAsync('lpstat -p 2>/dev/null || echo "no printers"');
    if (lpstatResult.includes('no printers') || lpstatResult.trim() === '') {
      throw new Error('No printers configured. Please add a printer in system settings.');
    }
    
    // Linux: Use lp command to print to default printer
    await this.execAsync(`lp "${path}"`);
    dx.out(`Sent to default printer: ${path}`);
    
  } catch (err) {
    dx.error(`Failed to print: ${err}`);
    throw err;
  } finally {
    dx.done();
  }
}
```

#### Alternative: lpstat for printer selection

```typescript
async listPrinters(): Promise<string[]> {
  const dx = this.dx.sub({ name: 'listPrinters' });
  
  try {
    const result = await this.execAsync('lpstat -p');
    const lines = result.split('\n').filter(l => l.startsWith('printer'));
    const printers = lines.map(l => l.split(' ')[1]);
    dx.out(`Found ${printers.length} printers: ${printers.join(', ')}`);
    return printers;
  } catch (err) {
    dx.error(`Failed to list printers: ${err}`);
    return [];
  } finally {
    dx.done();
  }
}
```

---

### Task 3: Distribution Detection (1 hour)

**File:** `src/OSLinux.ts`

**Purpose:** Better error messages and viewer selection.

```typescript
async detectDistribution(): Promise<string> {
  const dx = this.dx.sub({ name: 'detectDistribution' });
  
  try {
    // Try to read /etc/os-release
    const fs = require('fs');
    if (fs.existsSync('/etc/os-release')) {
      const content = fs.readFileSync('/etc/os-release', 'utf-8');
      const idLine = content.split('\n').find(l => l.startsWith('ID='));
      if (idLine) {
        const distro = idLine.split('=')[1].replace(/"/g, '');
        dx.out(`Detected distribution: ${distro}`);
        return distro;
      }
    }
    
    // Fallback: Try lsb_release
    const result = await this.execAsync('lsb_release -si 2>/dev/null || echo "unknown"');
    const distro = result.trim().toLowerCase();
    dx.out(`Detected distribution: ${distro}`);
    return distro;
    
  } catch {
    dx.out('Could not detect distribution, assuming generic Linux');
    return 'linux';
  } finally {
    dx.done();
  }
}
```

---

### Task 4: Create Linux Tests (1 hour)

**File:** `tests/OSLinux.test.ts`

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { OSLinux } from '../src/OSLinux.js';

test('OSLinux - fileOpenPrintDialog finds PDF viewer', async () => {
  if (process.platform !== 'linux') {
    console.log('Skipping Linux-specific test');
    return;
  }
  
  const os = new OSLinux({ /* mock registry */ });
  const testPdf = 'test-output.pdf';
  
  // Should not throw if any viewer is available
  await os.fileOpenPrintDialog({ path: testPdf });
});

test('OSLinux - detectDistribution returns valid distro', async () => {
  if (process.platform !== 'linux') {
    console.log('Skipping Linux-specific test');
    return;
  }
  
  const os = new OSLinux({ /* mock registry */ });
  const distro = await os.detectDistribution();
  
  assert.ok(typeof distro === 'string');
  assert.ok(distro.length > 0);
});

test('OSLinux - filePrint checks for CUPS', async () => {
  if (process.platform !== 'linux') {
    console.log('Skipping Linux-specific test');
    return;
  }
  
  const os = new OSLinux({ /* mock registry */ });
  const testPdf = 'test-output.pdf';
  
  // May throw if CUPS not installed - that's expected
  try {
    await os.filePrint({ path: testPdf });
  } catch (err) {
    assert.ok(err.message.includes('CUPS') || err.message.includes('printer'));
  }
});

test('OSLinux - listPrinters returns array', async () => {
  if (process.platform !== 'linux') {
    console.log('Skipping Linux-specific test');
    return;
  }
  
  const os = new OSLinux({ /* mock registry */ });
  const printers = await os.listPrinters();
  
  assert.ok(Array.isArray(printers));
});
```

---

### Task 5: Documentation (30 min)

**Update:** `README.md`

```markdown
## Platform Support

### Linux (Full Support) ✅

- ✅ PDF generation and syntax highlighting
- ✅ Print dialog support (GNOME, KDE, MATE, XFCE, Cinnamon)
- ✅ Direct printing via CUPS
- ⚠️ Requires CUPS printing system
- ⚠️ Requires PDF viewer installed

**Supported Desktop Environments:**
- GNOME (evince)
- KDE (okular)
- MATE (atril)
- XFCE (xreader/evince)
- Cinnamon (xreader)
- LXQt (qpdfview)

**Requirements:**
- CUPS printing system (`cups` package)
- At least one PDF viewer installed
- Printer configured in system settings

**Install Requirements:**

```bash
# Ubuntu/Debian
sudo apt install cups evince

# Fedora/RHEL
sudo dnf install cups evince

# Arch Linux
sudo pacman -S cups evince

# Enable CUPS service
sudo systemctl enable --now cups
```

---

## Testing Strategy

### Manual Testing Checklist

**Test Distributions:**

- [ ] Ubuntu 22.04/24.04 (GNOME)
- [ ] Fedora (GNOME)
- [ ] KDE Neon (KDE Plasma)
- [ ] Linux Mint (Cinnamon)
- [ ] Elementary OS (Pantheon)

**Test Cases:**

1. [ ] Print dialog opens with evince (GNOME)
2. [ ] Print dialog opens with okular (KDE)
3. [ ] Print dialog opens with atril (MATE)
4. [ ] Fallback to xdg-open works
5. [ ] Direct print to CUPS default printer
6. [ ] List available printers
7. [ ] Error: CUPS not installed
8. [ ] Error: No printers configured
9. [ ] Error: PDF viewer not found

### Automated Testing

- Unit tests in `tests/OSLinux.test.ts`
- Platform check: Skip on non-Linux
- Mock exec commands for error cases
- Integration tests with real printer (manual verification)

---

## Implementation Order

1. **Phase 1 (2 hours):** Implement `fileOpenPrintDialog()`
   - Multi-viewer support
   - Desktop environment detection
   - Manual testing on 2-3 distros

2. **Phase 2 (2 hours):** Implement `filePrint()`
   - CUPS lp command
   - Printer detection
   - Manual testing

3. **Phase 3 (1 hour):** Enhanced features
   - Distribution detection
   - Printer listing
   - Better error messages

4. **Phase 4 (1 hour):** Tests and documentation
   - Unit tests
   - Multi-distro test checklist
   - README updates

---

## Dependencies

- CUPS printing system (standard on most Linux distros)
- PDF viewer (evince, okular, atril, etc.)
- systemd (optional, for service management)

---

## Success Criteria

- [ ] Print dialog opens on GNOME, KDE, MATE, XFCE
- [ ] Direct printing works via CUPS
- [ ] Fallback to xdg-open if no known viewer
- [ ] Clear error messages for missing dependencies
- [ ] Tests pass on Linux platform
- [ ] Tested on at least 3 distributions
- [ ] Documentation complete with install instructions
- [ ] No regressions on macOS/Windows

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| CUPS not installed | High | Clear error with install instructions |
| No PDF viewer | High | Fallback to xdg-open, document install |
| Desktop environment variations | Medium | Support multiple viewers, use xdg-open fallback |
| Printer not configured | Medium | Clear error with system settings link |
| Wayland vs X11 differences | Low | Use viewer apps (work on both) |

---

## Distribution-Specific Notes

### Ubuntu/Debian

- CUPS usually pre-installed
- evince default viewer
- `apt install cups evince`

### Fedora/RHEL

- CUPS usually pre-installed
- evince default viewer
- `dnf install cups evince`

### Arch Linux

- CUPS not pre-installed
- No default viewer
- `pacman -S cups evince`
- Must enable cups service: `systemctl enable --now cups`

### Linux Mint

- CUPS pre-installed
- xreader default viewer
- Should work out of box

---

## Related Files

- `src/OSLinux.ts` - Implementation
- `tests/OSLinux.test.ts` - Tests
- `README.md` - Documentation
- `docs/plans/2025-12-25_plan_todo_WinPrint.md` - Windows equivalent

---

## Future Enhancements

1. Printer selection dialog (GTK/Qt)
2. Print settings UI (copies, orientation, paper size)
3. Network printer support
4. PDF preview before printing
5. Print queue management
