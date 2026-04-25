import { OS } from './OS';
import { Diagnostics } from './Diagnostics';
import type { Registry } from './Registry';

/**
 * OSWin - Windows-specific operating system operations
 *
 * Provides Windows-specific implementations for file operations and printing.
 * Uses execFileAsync (no shell) for cmd.exe, explorer.exe, and PowerShell commands.
 *
 * @input reg - Registry instance for accessing shared services
 * @output File operations, print commands via PowerShell, Explorer integration
 *
 * @example
 * const os = new OSWin({ reg });
 * await os.fileOpenInDefaultApp('C:\\path\\to\\file.pdf');
 * await os.filePrint('C:\\path\\to\\file.pdf');
 * await os.fileReveal('C:\\path\\to\\file.pdf');
 */
export class OSWin extends OS {
  constructor(args: { reg: Registry }) {
    super(args);
    // Override dx with OSWin-specific context
    this.dx = this.fn.dx.sub({ name: 'OSWin' });
  }

  protected getOSKeys(): Record<string, string> {
    return {
      'os-ctrl-cmd': 'Ctrl',
    };
  }

  protected escapePath(path: string): string {
    // Inside cmd.exe double quotes, only " and % need escaping.
    // Backslash is NOT a cmd.exe metacharacter - do not escape it.
    // Other metacharacters (^, &, |, <, >) are already neutralized by double quotes.
    return path
      .replace(/"/g, '""')
      .replace(/%/g, '%%')
      .replace(/\r/g, '')
      .replace(/\n/g, '');
  }

  async fileOpenInDefaultApp(path: string): Promise<void> {
    await this.execFileAsync('cmd', ['/c', 'start', '""', path]);
  }

  async fileReveal(path: string): Promise<void> {
    await this.execFileAsync('explorer.exe', ['/select,' + path]);
  }

  async filePrint(path: string): Promise<void> {
    const escapedPath = path.replace(/'/g, "''");
    try {
      const { stderr } = await this.execFileAsync('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        `Start-Process -FilePath '${escapedPath}' -Verb Print`
      ]);
      // Some PowerShell error conditions surface via stderr without rejecting.
      if (stderr) {
        const message = this.mapPowerShellErrorToMessage(stderr);
        if (message) {
          await this.fn.ui.showErrorMessage(message);
          return;
        }
        throw new Error(stderr);
      }
    } catch (error) {
      const stderr = String((error as any)?.stderr ?? (error as any)?.message ?? error);
      const message = this.mapPowerShellErrorToMessage(stderr);
      if (message) {
        await this.fn.ui.showErrorMessage(message);
        return;
      }
      throw error;
    }
  }

  /**
   * Translate a PowerShell stderr blob into a user-actionable message for the
   * Windows print failure modes that filePrint can encounter. Returns null if
   * the text does not match a known mode; the caller is then responsible for
   * propagating the original error.
   */
  protected mapPowerShellErrorToMessage(stderr: string): string | null {
    const text = stderr.toLowerCase();
    if (text.includes('default printer') || text.includes('no printer')) {
      return 'No default printer is set. Configure one in Settings > Bluetooth & devices > Printers & scanners, then try again.';
    }
    if (text.includes('verb') && text.includes('not supported')) {
      return 'The associated PDF handler does not support the Print verb. Install a PDF reader that does, such as Microsoft Edge, Adobe Reader, or Foxit Reader.';
    }
    if (
      text.includes('execution policy') ||
      text.includes('about_execution_policies') ||
      text.includes('running scripts is disabled')
    ) {
      return 'PowerShell blocked the print command via execution policy. From an elevated PowerShell, run: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned';
    }
    return null;
  }

  async fileOpenPrintDialog(path: string): Promise<void> {
    // Programmatic Windows print dialog.
    //
    // Approach: shell out to PowerShell, instantiate System.Windows.Forms.PrintDialog
    // for printer/page selection, and on OK fire Start-Process -Verb PrintTo against
    // the chosen printer. User cancellation (DialogResult != OK) is a no-op; no
    // error surfaces.
    //
    // Do NOT regress this method to delegate to fileOpenInDefaultApp. That stub
    // relied on the user clicking Print inside the viewer and was the explicit
    // motivation for the Windows print rewrite (see
    // docs/plans/2026-04-17_plan_inProgress_WindowsPrint.md, "Print dialog"
    // section).
    const escapedPath = path.replace(/'/g, "''");
    const script =
      "Add-Type -AssemblyName System.Windows.Forms | Out-Null;" +
      " $dlg = New-Object System.Windows.Forms.PrintDialog;" +
      " $dlg.AllowSomePages = $false;" +
      " $dlg.AllowPrintToFile = $false;" +
      " $dlg.UseEXDialog = $true;" +
      " if ($dlg.ShowDialog() -eq 'OK') {" +
      ` Start-Process -FilePath '${escapedPath}' -Verb PrintTo` +
      " -ArgumentList ('\"' + $dlg.PrinterSettings.PrinterName + '\"')" +
      " -WindowStyle Hidden }";
    await this.execFileAsync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command',
      script
    ]);
  }

  getDir_Documents(): string {
    // On Windows, try USERPROFILE\Documents first, fallback to standard location
    const userProfile = process.env.USERPROFILE || process.env.HOME;
    if (userProfile) {
      return this.pathJoin(userProfile, 'Documents');
    }
    // Fallback to home directory + Documents
    return this.pathJoin(this.getDir_Home(), 'Documents');
  }

  done(): void {
    this.dx.done();
  }
}

// end, OSWin.ts
