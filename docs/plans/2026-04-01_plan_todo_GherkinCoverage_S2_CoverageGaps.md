# Swimlane 2: Coverage Gaps - New Gherkin Tests

**Status:** TODO
**Created:** 2026-04-01
**Orchestrator:** `2026-04-01_plan_todo_GherkinCoverage.md`
**Master Orchestrator:** `2026-04-01_plan_todo_Orchestrator.md` (Phase 2, Stream C2)
**Branch:** `feature/gherkin-coverage`
**PR Target:** `main` (CodeRabbit review required)
**Blocked by:** Swimlane 1 (Infrastructure) — S1 PR must be merged first
**Parallel with:** Swimlane 3 (Test Migration)
**Estimated Time:** 6-8 hours

---

## Objective

Write new Gherkin tests targeting uncovered code paths. All new tests go directly into `.feature` files (no point writing in node:test then migrating).

## Coverage Baseline (2026-04-01)

**Overall: 85.18% statements, 75.41% branches**

---

## Batches (ordered by coverage impact)

### Batch A: Stylize.ts (63.92% → target 90%)

**Uncovered areas:** Theme loading error paths, theme filtering, fallback behavior

```gherkin
# features/stylize.feature
Feature: Syntax Highlighting with Shiki
  The Stylize component loads Shiki themes and applies syntax highlighting.

  Scenario: Load a valid theme by name
    Given a new Print2Paper application
    When I request the theme "github-dark"
    Then the theme should load successfully

  Scenario: Handle invalid theme name gracefully
    Given a new Print2Paper application
    When I request the theme "nonexistent-theme"
    Then a fallback theme should be used

  Scenario: Filter themes by category
    Given a new Print2Paper application
    When I request light themes only
    Then all returned themes should be light variants

  Scenario: Theme loading with empty theme list
    Given a new Print2Paper application
    When no themes are available
    Then a default theme should be provided
```

**Step definitions:** `features/support/steps/stylize.ts`
**Impact:** ~2% overall coverage gain

### Batch B: UI.ts (77.94% → target 95%)

**Uncovered lines:** 189, 220-222, 279-318, 320-327 (CSS generation, save dialog, template replacement)

```gherkin
# features/ui.feature
Feature: UI Utilities
  UI provides CSS generation, template replacement, and save dialog handling.

  Scenario: Generate CSS for code display
    Given a new Print2Paper application
    When I generate CSS for font size 14
    Then the CSS should contain the correct font-size declaration

  Scenario: Replace template variables in HTML
    Given a new Print2Paper application
    And a template with placeholder "{{title}}"
    When I replace "title" with "My Document"
    Then the output should contain "My Document"

  Scenario: Save dialog returns chosen path
    Given a new Print2Paper application
    And the save dialog will return "/tmp/output.pdf"
    When I open the save dialog
    Then the save path should be "/tmp/output.pdf"

  Scenario: Save dialog cancelled by user
    Given a new Print2Paper application
    And the save dialog will be cancelled
    When I open the save dialog
    Then no save path should be returned
```

**Step definitions:** `features/support/steps/ui.ts`
**Impact:** ~1.5% overall coverage gain

### Batch C: UIMenuMgr.ts (75.39% → target 90%)

**Uncovered lines:** 464, 480-501, 551-552, 566-567 (menu selection tracking, ID validation edge cases)

```gherkin
# features/uimenumgr.feature
Feature: Menu Manager
  UIMenuMgr validates menu IDs and tracks user selections.

  Scenario: Register a new menu with valid ID
    Given a new Print2Paper application
    When I register a menu with ID "theme-selector"
    Then the menu should be retrievable by ID

  Scenario: Reject menu with invalid ID format
    Given a new Print2Paper application
    When I try to register a menu with ID ""
    Then an error should indicate invalid menu ID

  Scenario: Track menu selection changes
    Given a new Print2Paper application
    And a menu "font-size" with options ["10", "12", "14"]
    When the user selects "12"
    Then the selected value should be "12"

  Scenario: Menu selection persists across sessions
    Given a new Print2Paper application
    And a menu "theme" with a persisted selection of "monokai"
    When the application reloads
    Then the menu "theme" should show "monokai" as selected
```

**Step definitions:** `features/support/steps/menu.ts`
**Impact:** ~1% overall coverage gain

### Batch D: VSCodeAPIs.ts (75.76% → target 90%)

**Uncovered lines:** 516, 518-522, 530-531, 549-550 (workspace config, extension API wrappers)

```gherkin
# features/vscodeapis.feature
Feature: VS Code API Wrappers
  VSCodeAPIs provides safe wrappers around VS Code extension APIs.

  Scenario: Read workspace configuration value
    Given a new Print2Paper application
    And a workspace config "editor.fontSize" is set to 14
    When I read the config "editor.fontSize"
    Then the value should be 14

  Scenario: Handle missing workspace configuration
    Given a new Print2Paper application
    When I read a config key that does not exist
    Then the default value should be returned

  Scenario: Show information message to user
    Given a new Print2Paper application
    When I show an information message "Print complete"
    Then the VS Code API should be called with "Print complete"

  Scenario: Register a command
    Given a new Print2Paper application
    When I register command "p2p4vsc.testCmd"
    Then the command should be available in the command palette
```

**Step definitions:** `features/support/steps/vscodeapis.ts`
**Impact:** ~1% overall coverage gain

### Batch E: PaperPrinter.ts (79.61% → target 90%)

**Uncovered lines:** 971-981, 1002-1009, 1033-1085 (print workflow branches, error paths)

```gherkin
# features/paperprinter-workflow.feature
Feature: Print Workflow
  PaperPrinter orchestrates the full print workflow from code to paper.

  Scenario: Print preview for a JavaScript file
    Given a new Print2Paper application
    And an open file "example.js" with content "console.log('hello');"
    When I trigger print preview
    Then a webview panel should open with the rendered code

  Scenario: Handle empty file gracefully
    Given a new Print2Paper application
    And an open file with no content
    When I trigger print preview
    Then the preview should show an appropriate message

  Scenario: Print with custom page size
    Given a new Print2Paper application
    And the page size is set to "A4"
    When I generate the PDF
    Then the PDF dimensions should match A4 size

  Scenario: Print workflow error recovery
    Given a new Print2Paper application
    And PDF generation will fail
    When I trigger print
    Then an error message should be shown to the user
    And the application should remain in a usable state
```

**Step definitions:** `features/support/steps/paperprinter.ts`
**Impact:** ~1% overall coverage gain

### Batch F: Registry.ts (80.74% → target 95%)

**Uncovered lines:** 221, 230-232, 235-242, 263-264 (collision protection, lifecycle edge cases)

```gherkin
# features/registry.feature
Feature: Dependency Injection Registry
  Registry manages component lifecycle and dependency resolution.

  Scenario: Register and retrieve a singleton component
    Given an empty registry
    When I register component "pdf" as a singleton
    Then requesting "pdf" twice should return the same instance

  Scenario: Prevent namespace collision with built-in properties
    Given an empty registry
    When I try to register a component with ID "constructor"
    Then an error should indicate namespace collision

  Scenario: Component cleanup on disposal
    Given a registry with registered components
    When I call done() on the registry
    Then all components should be disposed
```

**Step definitions:** `features/support/steps/registry.ts`
**Impact:** ~0.5% overall coverage gain

### Batch G: OS Platform Stubs (OSWin 58%, OSLinux 65%, OSMac 55%)

**Note:** These files have low coverage because they contain platform-specific code (AppleScript, CUPS, PowerShell) that can only truly run on their respective platforms. We can test:
- Method existence and signatures
- Error handling for unavailable platform commands
- Mock-based execution paths.

```gherkin
# features/os-platform.feature
Feature: Cross-Platform OS Abstraction
  OS classes provide platform-specific file and print operations.

  Scenario Outline: OS class has required methods
    Given the "<platform>" OS class
    Then it should have method "fileOpenPrintDialog"
    And it should have method "filePrint"
    And it should have method "fileWrite"
    And it should have method "fileRead"

    Examples:
      | platform |
      | mac      |
      | win      |
      | linux    |

  Scenario: macOS print command uses proper escaping
    Given a new Print2Paper application on macOS
    When I print file "/tmp/test file.pdf"
    Then the shell command should properly escape the path

  Scenario: Windows print uses PowerShell
    Given the Windows OS class
    When I construct a print command for "test.pdf"
    Then the command should use "powershell"

  Scenario: Linux print checks for CUPS availability
    Given the Linux OS class
    When I attempt to print without CUPS installed
    Then an error should mention CUPS installation
```

**Step definitions:** `features/support/steps/os.ts`
**Impact:** ~3% overall coverage gain (biggest single batch)
**Limitation:** Some platform paths may remain uncovered. Set per-file exceptions if needed.

---

## Expected Coverage After All Batches

| Metric | Before | After | Change |
| --- | --- | --- | --- |
| Statements | 85.18% | ~92% | +7% |
| Branches | 75.41% | ~87% | +12% |
| Functions | 83.18% | ~92% | +9% |

**Note:** Targets account for platform-limited files (OSWin, OSLinux, OSMac) which max out at 70-80% coverage due to platform-specific code paths (AppleScript, CUPS, PowerShell) that cannot run in CI. Per-file exceptions are set for these files.

## Execution Order

Batches are independent and can be worked in parallel. Recommended order if sequential:

1. **Batch A (Stylize)** - Highest relative coverage gain per effort
2. **Batch G (OS Platform)** - Biggest absolute coverage gain
3. **Batch B (UI)** - Straightforward mock-based tests
4. **Batch D (VSCodeAPIs)** - Similar pattern to UI
5. **Batch C (UIMenuMgr)** - Requires understanding menu system
6. **Batch E (PaperPrinter)** - Complex workflow testing
7. **Batch F (Registry)** - Smallest gain, most architectural

---

## Verification

After each batch:

```bash
npm run test:coverage
```

Check that:
- New .feature tests pass
- Existing tests unaffected
- Coverage % increases as expected
- No regressions in previously covered code
