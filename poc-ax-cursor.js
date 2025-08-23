"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function runOsaScriptFile(content) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "poc-ax-"));
    const scptPath = path.join(tmpDir, "dump-cursor.scpt");
    fs.writeFileSync(scptPath, content, "utf8");
    try {
        const out = execFileSync("osascript", [scptPath], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        return out;
    } catch (err) {
        const stderr = err.stderr ? String(err.stderr) : "";
        return `AppleScript error: ${err.message}\n${stderr}`;
    } finally {
        try {
            fs.unlinkSync(scptPath);
        } catch {}
        try {
            fs.rmdirSync(tmpDir);
        } catch {}
    }
}

function getClipboardRTF() {
    try {
        // Prefer RTF from pasteboard
        return execFileSync("bash", ["-lc", "pbpaste -Prefer rtf"], { encoding: "utf8" });
    } catch {
        return "";
    }
}

function parseFirstColorFromRTF(rtf) {
    if (!rtf || !rtf.includes("{\\rtf")) return null;

    // Extract color table
    const colortblMatch = rtf.match(/\{\\colortbl[^}]*\}/);
    if (!colortblMatch) return null;
    const table = colortblMatch[0];

    // Build index -> {r,g,b}
    const colors = [];
    // Entries separated by ';', first is often empty default
    const entries = table.split(";");
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const rMatch = e.match(/\\red(\d{1,3})/);
        const gMatch = e.match(/\\green(\d{1,3})/);
        const bMatch = e.match(/\\blue(\d{1,3})/);
        if (rMatch && gMatch && bMatch) {
            const r = Math.max(0, Math.min(255, parseInt(rMatch[1], 10)));
            const g = Math.max(0, Math.min(255, parseInt(gMatch[1], 10)));
            const b = Math.max(0, Math.min(255, parseInt(bMatch[1], 10)));
            colors.push({ r, g, b });
        } else {
            colors.push(null);
        }
    }

    // Find first \cfN foreground color run
    const cfMatch = rtf.match(/\\cf(\d{1,3})/);
    if (!cfMatch) return null;
    const idx = parseInt(cfMatch[1], 10);
    const color = colors[idx] || null;
    if (!color) return null;
    const toHex = (n) => n.toString(16).padStart(2, "0");
    const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    return { index: idx, ...color, hex };
}

// AppleScript: select first line, then locate the element with AXSelectedText and read style attributes
const appleScript = `
with timeout of 5 seconds
  set out to "=== Cursor First Line Style (Scan) ===" & linefeed
  tell application "Cursor" to activate
  delay 0.1
  tell application "System Events"
    if not (exists application process "Cursor") then
      set out to out & "Cursor process not found" & linefeed
    else
      tell application process "Cursor"
        -- Go to first line and select it
        key code 126 using {command down}
        delay 0.05
        key code 124 using {shift down, command down}
        delay 0.05

        set theWin to missing value
        try
          set theWin to front window
        end try

        if theWin is not missing value then
          set elems to {}
          try
            set elems to entire contents of theWin
          end try

          set found to false
          set roleVal to ""
          set boldVal to ""
          set italicVal to ""
          set underlineVal to ""
          set strikeVal to ""
          set fontVal to ""
          set traitsVal to ""

          repeat with e in elems
            if found is false then
              set selTxt to ""
              try
                set selTxt to (value of attribute "AXSelectedText" of e) as text
              end try
              if selTxt is not "" then
                set found to true
                try
                  set roleVal to (value of attribute "AXRole" of e) as text
                end try
                try
                  set boldVal to (value of attribute "AXBold" of e) as text
                end try
                try
                  set italicVal to (value of attribute "AXItalic" of e) as text
                end try
                try
                  set underlineVal to (value of attribute "AXUnderline" of e) as text
                end try
                try
                  set strikeVal to (value of attribute "AXStrikethrough" of e) as text
                end try
                try
                  set fontVal to (value of attribute "AXFont" of e) as text
                end try
                try
                  set traitsVal to (value of attribute "AXFontTraits" of e) as text
                end try
              end if
            end if
          end repeat

          if found then
            set out to out & "role: " & roleVal & linefeed
            set out to out & "AXBold: " & boldVal & linefeed
            set out to out & "AXItalic: " & italicVal & linefeed
            set out to out & "AXUnderline: " & underlineVal & linefeed
            set out to out & "AXStrikethrough: " & strikeVal & linefeed
            set out to out & "AXFont: " & fontVal & linefeed
            set out to out & "AXFontTraits: " & traitsVal & linefeed
          else
            set out to out & "No element with AXSelectedText found" & linefeed
          end if
        else
          set out to out & "No front window" & linefeed
        end if
      end tell
    end if
  end tell
  return out
end timeout
`;

const out = runOsaScriptFile(appleScript);
process.stdout.write(out + (out.endsWith("\n") ? "" : "\n"));
