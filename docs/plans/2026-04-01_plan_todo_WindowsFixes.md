# Windows Code Fixes & Testing Plan

**Status:** TODO
**Created:** 2026-04-01
**Master Orchestrator:** `2026-04-01_plan_todo_Orchestrator.md` (Phase 1, Stream A)
**Branch:** `feature/windows-fixes`
**PR Target:** `main` (CodeRabbit review required)
**Blocks:** Stream B (Marketplace Publish)
**Priority:** High - critical bugs in OSWin.ts
**Estimated Time:** 3-4 hours

---

## Critical Code Review: OSWin.ts

A line-by-line review of `src/OSWin.ts` against `OSMac.ts` and `OSLinux.ts` revealed **5 bugs**, several critical. The Windows code appears to be a rough draft that was never tested on actual Windows.

---

## Bug 1: `escapePath()` Double-Escaping (CRITICAL)

**File:** `src/OSWin.ts:33-46`

**Problem:** The `^` escape runs AFTER `%` escaping, causing double-escaping.

```typescript
// Current (BROKEN):
.replace(/%/g, '^%')     // line 38: % → ^%
.replace(/\^/g, '^^')    // line 39: ^ → ^^ (BUT also catches ^ from line 38!)
```

A path containing `%TEMP%` becomes `^^%TEMP^^%` instead of `^%TEMP^%`.

**Fix:** Move `^` escaping before all caret-based escapes, or restructure entirely.

## Bug 2: Unnecessary Backslash Doubling (HIGH)

**File:** `src/OSWin.ts:36`

**Problem:** `\` is NOT a `cmd.exe` metacharacter — it's a path separator. This line was copied from the macOS version where `\` IS a bash metacharacter.

```typescript
// Current (WRONG):
.replace(/\\/g, '\\\\')  // C:\Users\Test → C:\\Users\\Test
```

This accidentally works because Windows path APIs normalize redundant separators, but it's incorrect and could cause subtle issues with path comparisons or UNC paths.

**Fix:** Remove this line entirely. Backslashes do not need escaping in `cmd.exe`.

## Bug 3: Over-Escaping for Quoted Context (MEDIUM)

**File:** `src/OSWin.ts:33-46`

**Problem:** The escaped path is always used inside double quotes (`"${escapedPath}"`). Inside `cmd.exe` double quotes, only `%` and `"` need escaping. Characters `^`, `&`, `|`, `<`, `>` are all literal inside double quotes.

**Fix:** Simplify to only escape `"` and `%`:

```typescript
protected escapePath(path: string): string {
  return path
    .replace(/"/g, '""')        // Escape double quotes (cmd.exe convention)
    .replace(/%/g, '%%')        // Escape percent signs (cmd.exe variable expansion)
    .replace(/\r/g, '')         // Strip carriage returns
    .replace(/\n/g, '');        // Strip newlines
}
```

**Or better:** Follow OSLinux's pattern and use `execFileAsync` to avoid shell escaping entirely (see Bug 5).

## Bug 4: `filePrint()` Uses Wrong DLL (CRITICAL)

**File:** `src/OSWin.ts:58-63`

**Problem:** `shimgvw.dll,ImageView_PrintTo` is the **Windows Photo Viewer** shell extension. It handles images (JPEG, PNG, BMP) — NOT PDFs. This command will fail silently or error on every PDF file.

Additionally, the `/pt` flag requires a printer name argument that is missing:
```
// Expected: /pt "filepath" "printer_name" "driver" "port"
// Actual:   /pt "filepath"  (incomplete!)
```

**Fix:** Use PowerShell's `Start-Process` with the `Print` verb, which delegates to the default PDF handler:

```typescript
async filePrint(path: string): Promise<void> {
  // Use execFileAsync to avoid shell escaping issues entirely
  await this.execFileAsync('powershell', [
    '-NoProfile', '-Command',
    `Start-Process -FilePath '${path.replace(/'/g, "''")}' -Verb Print -Wait`
  ]);
}
```

Or use `execFileAsync` with the `print` verb directly:
```typescript
async filePrint(path: string): Promise<void> {
  await this.execFileAsync('cmd', ['/c', 'start', '/wait', '', '/print', path]);
}
```

## Bug 5: Should Use `execFileAsync` Like OSLinux (MEDIUM)

**File:** `src/OSWin.ts:48-68`

**Problem:** All methods use `execAsync` (spawns `cmd.exe` shell), requiring complex escaping. OSLinux correctly uses `execFileAsync` (passes arguments as an array, no shell involved).

**Fix:** Rewrite methods to use `execFileAsync` or `execFile` where possible:

```typescript
async fileOpenInDefaultApp(path: string): Promise<void> {
  // 'start' is a cmd.exe builtin, so we need cmd /c
  // But explorer.exe is a standalone executable
  await this.execFileAsync('cmd', ['/c', 'start', '""', path]);
}

async fileReveal(path: string): Promise<void> {
  await this.execFileAsync('explorer.exe', ['/select,', path]);
}
```

---

## Proposed Rewrite: OSWin.ts

```typescript
export class OSWin extends OS {
  constructor(args: { reg: Registry }) {
    super(args);
    this.dx = this.fn.dx.sub({ name: 'OSWin' });
  }

  protected getOSKeys(): Record<string, string> {
    return { 'os-ctrl-cmd': 'Ctrl' };
  }

  protected escapePath(path: string): string {
    // Minimal escaping for cmd.exe double-quoted context
    // Inside "...", only % and " need escaping
    return path
      .replace(/"/g, '""')
      .replace(/%/g, '%%')
      .replace(/\r/g, '')
      .replace(/\n/g, '');
  }

  async fileOpenInDefaultApp(path: string): Promise<void> {
    // 'start' is a cmd.exe builtin — must use cmd /c
    // First arg after 'start' is window title (empty), second is the file
    await this.execFileAsync('cmd', ['/c', 'start', '""', path]);
  }

  async fileReveal(path: string): Promise<void> {
    // explorer.exe is a standalone executable — no shell needed
    await this.execFileAsync('explorer.exe', [`/select,${path}`]);
  }

  async filePrint(path: string): Promise<void> {
    // Use PowerShell's Start-Process with Print verb
    // This delegates to the system's default PDF handler
    const escapedPath = path.replace(/'/g, "''");
    await this.execFileAsync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command',
      `Start-Process -FilePath '${escapedPath}' -Verb Print`
    ]);
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    // Open in default app — user prints from there
    await this.fileOpenInDefaultApp(path);
  }

  getDir_Documents(): string {
    const userProfile = process.env.USERPROFILE || process.env.HOME;
    if (userProfile) {
      return this.pathJoin(userProfile, 'Documents');
    }
    return this.pathJoin(this.getDir_Home(), 'Documents');
  }

  done(): void {
    this.dx.done();
  }
}
```

---

## Testing Strategy

### What Can Be Tested on macOS (No Windows Needed)

`process.platform` is `configurable: true` in Node.js, so you can mock it:

```typescript
const original = process.platform;
Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
// ... test ...
Object.defineProperty(process, 'platform', { value: original, configurable: true });
```

**Testable on macOS:**

1. **`escapePath()`** — pure string manipulation, test with adversarial inputs
2. **Command string construction** — mock `execAsync`/`execFileAsync`, capture the command, assert correctness
3. **`getDir_Documents()`** — set `process.env.USERPROFILE`, verify return value
4. **`getOSKeys()`** — verify `os-ctrl-cmd` returns `'Ctrl'`
5. **`OS.create()` factory** — mock `process.platform`, verify `OSWin` instance returned

**NOT testable on macOS (needs real Windows):**

1. Shell commands actually executing (`start`, `explorer.exe`, `powershell`)
2. Windows path separator behavior (`path.join` always uses `/` on macOS)
3. Real PDF handler interaction
4. Environment variable resolution (`USERPROFILE`, `%systemroot%`)

### Recommended Testing Approach

1. **Unit tests on macOS** (mock `execFileAsync`, verify arguments):
   - Test every method with normal paths, paths with spaces, paths with special characters
   - Test `escapePath` with `%`, `"`, `^`, `&`, `|`, `<`, `>`, newlines
   - Test `getDir_Documents` with and without `USERPROFILE`

2. **CI on Windows** — add `windows-latest` to GitHub Actions matrix:
   ```yaml
   strategy:
     matrix:
       os: [ubuntu-latest, windows-latest]
   ```
   **Note:** The `compile` script uses `rm -rf out` which fails on Windows. Fix with cross-platform alternative.

3. **Parallels smoke test before release**:
   - Install VSIX in Windows VS Code
   - Test Alt+P → preview opens
   - Test Save PDF → file appears in Documents
   - Test Print → system print dialog opens
   - Test with filenames containing spaces and special characters

---

## Tasks

### Task 0: Verify Current Failures on Windows (30 min)

Before making changes, capture the current failure state:

1. Boot a Windows runner (GitHub Actions `windows-latest` or local Parallels)
2. Run the current OSWin.ts flows and capture failing cases and error logs for:
   - `escapePath` with special characters (`%`, `"`, spaces, UNC paths)
   - `filePrint` with a PDF file (expected: shimgvw.dll failure)
   - `fileReveal` with paths containing spaces
   - `getDir_Documents` with/without `USERPROFILE` set
   - `execFileAsync` vs `execAsync` behavior differences
3. Document actual error messages and stack traces
4. Use these as acceptance criteria for Task 1

### Task 1: Fix OSWin.ts Bugs (2-3 hours)

#### 1a. Rewrite `escapePath()` (45 min)
- Remove backslash doubling (not a cmd.exe metacharacter)
- Fix double-escaping of `%` and `^`
- Simplify for quoted context: only escape `"` (as `""`) and `%` (as `%%`)
- Strip CR/LF
- **Acceptance:** Unit tests pass with adversarial inputs from Task 0

#### 1b. Replace `filePrint()` with PowerShell (30 min)
- Use `Start-Process -Verb Print` instead of `shimgvw.dll`
- Use `execFileAsync` to avoid shell escaping
- **Acceptance:** Mock test verifies correct PowerShell arguments

#### 1c. Convert methods to `execFileAsync` (30 min)
- `fileOpenInDefaultApp` -> `execFileAsync('cmd', ['/c', 'start', ...])`
- `fileReveal` -> `execFileAsync('explorer.exe', ['/select,', path])`
- **Acceptance:** Mock tests verify correct argument arrays

#### 1d. Update `fileReveal()` (15 min)
- Call `explorer.exe` directly as standalone executable
- **Acceptance:** Mock test verifies `/select,` argument format

### Task 2: Write Unit Tests (1 hour)

Write tests that mock `execFileAsync` and verify:
- Correct arguments for each method
- `escapePath` handles adversarial inputs
- `getDir_Documents` with various env vars
- Error handling for missing executables

### Task 3: Add Windows to CI (30 min)

- Add `windows-latest` to CI matrix
- Fix `rm -rf` in compile script (use `rimraf` or Node.js `fs.rm`)
- Verify all tests pass on Windows runner

### Task 4: Parallels Smoke Test (30 min)

- Install Windows in Parallels (if not already)
- Build VSIX on macOS
- Install and test in Windows VS Code via shared folders

---

## Success Criteria

- [ ] All 5 bugs in OSWin.ts fixed
- [ ] Unit tests verify command construction on macOS
- [ ] CI runs on both ubuntu-latest and windows-latest
- [ ] Parallels smoke test passes (if VM available)
- [ ] No regressions on macOS or Linux
