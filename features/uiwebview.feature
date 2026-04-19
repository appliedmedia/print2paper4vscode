Feature: UIWebView Validation and Message Handling
  Verify webview PDF validation, toolbar persistence, and message forwarding.

  Scenario: displayPdfPanel rejects missing arrayBuffer
    Given a new Print2Paper application
    And a PDF docInfo with null arrayBuffer
    When I display the PDF panel
    Then an error should be thrown containing "arrayBuffer"

  Scenario: displayPdfPanel rejects invalid pageTotal
    Given a new Print2Paper application
    And a PDF docInfo with zero pageTotal
    When I display the PDF panel
    Then an error should be thrown containing "pageTotal"

  Scenario: displayPdfPanel rejects missing pageSizePx
    Given a new Print2Paper application
    And a PDF docInfo with null pageSizePx
    When I display the PDF panel
    Then an error should be thrown containing "pageSizePx"

  Scenario: handleDragEnd persists toolbar position
    Given a new Print2Paper application
    When I send a dragEnd message with left position 42
    Then the toolbar position should be persisted as 42

  Scenario: handleMenuItemSelected forwards to UIMenuMgr
    Given a new Print2Paper application
    And handleMenuItemSelected on UIMenuMgr is mocked
    When I send a menuItemSelected message
    Then the menu selection should be forwarded

  Scenario: handleDxMessage logs diagnostic output
    Given a new Print2Paper application
    When I send a dx message with content "test diagnostic"
    Then no errors should occur
