Feature: VSCodeAPIs Fallback Paths
  Verify fallback behavior in VS Code API wrappers.

  Scenario: getActiveTabName falls back to tab groups when no editor
    Given a new Print2Paper application
    And no active text editor is open
    When I get the active tab name
    Then the result should be the tab group label

  Scenario: getActiveTabName returns Unknown Tab as last resort
    Given a new Print2Paper application
    And no active text editor is open
    And no active tab group exists
    When I get the active tab name
    Then the result should equal "Unknown Tab"

  Scenario: getDescriptiveName handles untitled documents
    Given a new Print2Paper application
    And a document with URI "untitled:Untitled-1"
    When I get the descriptive name
    Then the result should equal "Untitled-1"

  Scenario: showWarningMessage returns a Promise
    Given a new Print2Paper application
    When I call showWarningMessage with "test warning"
    Then the result should be a resolved Promise
