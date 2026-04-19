Feature: UI Message Handling and Save Dialog
  Verify message dispatch and save location retry logic.

  Scenario: handleWebviewMessage dispatches to registered handler
    Given a new Print2Paper application
    And a message handler is registered for type "dx"
    When a webview message of type "dx" is received
    Then the handler should have been called

  Scenario: handleWebviewMessage with no handlers for type
    Given a new Print2Paper application
    When a webview message of type "dx" is received
    Then no errors should occur

  Scenario: showWarningMessage delegates to vscodeapis
    Given a new Print2Paper application
    When I call UI showWarningMessage with "test warning"
    Then no errors should occur

  Scenario: chooseSaveLocation retries on save failure then succeeds
    Given a new Print2Paper application
    And a save operation that fails once then succeeds
    When I choose a save location with the save operation
    Then the save should succeed

  Scenario: chooseSaveLocation user cancels retry
    Given a new Print2Paper application
    And a save operation that always fails
    And the user will cancel on error
    When I choose a save location expecting failure
    Then a save error should be thrown

  Scenario: chooseSaveLocation with no save operation returns path
    Given a new Print2Paper application
    When I choose a save location without a save operation
    Then a path should be returned
