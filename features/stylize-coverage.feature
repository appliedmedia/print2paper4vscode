Feature: Stylize Coverage Gaps
  Exercise error paths and untested branches in Stylize.ts.

  Scenario: getVSCodeThemes returns empty on exception
    Given a new Print2Paper application
    And getVSCodeExtensionsThemes is mocked to throw
    When I get VS Code themes
    Then the result should be an empty array

  Scenario: tokenize throws on invalid language
    Given a new Print2Paper application
    When I tokenize with an invalid language ID
    Then a tokenize error should be thrown

  Scenario: generateHtmlFromTokens throws when template missing
    Given a new Print2Paper application
    And fileRead is mocked to return null for Stylize.yaml
    When I generate HTML from mock tokens expecting error
    Then a template error should be thrown

  Scenario: createHtmlPage produces valid HTML document
    Given a new Print2Paper application
    When I create an HTML page with title "Test Doc"
    Then the result should contain "<!DOCTYPE html>"
    And the result should contain "<title>Test Doc</title>"
    And the result should contain "<body>"
