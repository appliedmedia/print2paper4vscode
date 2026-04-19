Feature: TabInspector Edge Cases
  Verify tab inspection when no editor is active or errors occur.

  Scenario: detectActiveTabCategory returns preview when no editor
    Given a new Print2Paper application
    And no active text editor is open
    When I detect the active tab category
    Then the result should equal "preview"

  Scenario: inspectTab returns empty metadata when no editor
    Given a new Print2Paper application
    And no active text editor is open
    When I inspect the active tab
    Then the tab metadata should be empty

  Scenario: inspectTab handles errors gracefully
    Given a new Print2Paper application
    And getActiveTextEditor throws an error
    When I inspect the active tab
    Then the tab metadata should be empty

  Scenario: inspectVisibleEditors handles errors gracefully
    Given a new Print2Paper application
    And getActiveTextEditor throws an error
    When I inspect visible editors
    Then the result should be an empty array
