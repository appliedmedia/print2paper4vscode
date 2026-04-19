Feature: Cross-Platform OS Operations
  Verify platform-specific file operations and path escaping.

  Scenario: macOS escapePath escapes shell metacharacters
    Given a new Print2Paper application
    When I escape a path with special characters for macOS
    Then the macOS escaped path should have metacharacters escaped

  Scenario: macOS escapePathForAppleScript escapes quotes
    Given a new Print2Paper application
    When I escape a path for AppleScript
    Then the AppleScript path should have quotes escaped

  Scenario: macOS fileOpenInDefaultApp uses open command
    Given a new Print2Paper application
    And macOS exec is mocked
    When I open a file in default app on macOS
    Then the open command should be called

  Scenario: macOS filePrint uses lpr command
    Given a new Print2Paper application
    And macOS exec is mocked
    When I print a file on macOS
    Then the lpr command should be called

  Scenario: macOS getDir_Documents returns Documents path
    Given a new Print2Paper application
    When I get the Documents directory on macOS
    Then the path should end with "Documents"

  Scenario: Windows escapePath escapes cmd metacharacters
    Given a new Print2Paper application
    When I escape a path with cmd metacharacters for Windows
    Then the Windows escaped path should have metacharacters escaped

  Scenario: Linux escapePath is identity
    Given a new Print2Paper application
    When I escape a path for Linux
    Then the Linux path should be unchanged

  Scenario: Linux fileOpenInDefaultApp uses xdg-open
    Given a new Print2Paper application
    And Linux exec is mocked
    When I open a file in default app on Linux
    Then the xdg-open command should be called
