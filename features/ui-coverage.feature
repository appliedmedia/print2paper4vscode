Feature: UI and UIMenu Coverage Gaps
  Exercise message handler paths and UIMenu error handling.

  Scenario: registerMessageHandler adds second handler for same type
    Given a new Print2Paper application
    And a message handler is registered for type "test"
    And a second handler is registered for type "test"
    When a webview message of type "test" is received
    Then both handlers should have been called

  Scenario: unregisterMessageHandler removes existing handler
    Given a new Print2Paper application
    And a tracked handler is registered for type "unreg"
    When the handler is unregistered for type "unreg"
    And a webview message of type "unreg" is received
    Then the unregistered handler should not be called

  Scenario: unregisterMessageHandler ignores non-existent type
    Given a new Print2Paper application
    When a non-existent handler is unregistered
    Then no errors should occur

  Scenario: handleWebviewMessage re-throws handler errors
    Given a new Print2Paper application
    And a throwing handler is registered for type "err"
    When a webview message of type "err" is received
    Then a handler error should be thrown

  Scenario: UIMenu text_edit without constrain returns empty
    Given a new Print2Paper application
    And menus are created
    When I render text_edit without constrain
    Then the text_edit result should be empty

  Scenario: UIMenu getHTML detects cycle
    Given a new Print2Paper application
    And menus are created
    When I call getHTML with a pre-visited menu
    Then the result should contain "Cycle detected"

  Scenario: UIMenu done cleans up diagnostics
    Given a new Print2Paper application
    And menus are created
    When I call done on a menu
    Then no errors should occur
