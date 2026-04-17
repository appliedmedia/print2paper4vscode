Feature: PDF Generation Error Paths
  Verify error handling and validation in PDF generation.

  Scenario: render throws when no tokens or HTML provided
    Given a new Print2Paper application
    When I render with empty result
    Then an error should be thrown containing "No tokens or HTML"

  Scenario: finishPdf throws when no PDF document exists
    Given a new Print2Paper application
    When I finish PDF without document
    Then an error should be thrown containing "No PDF document"

  Scenario: shouldBreakPage returns false when no PDF document
    Given a new Print2Paper application
    When I check shouldBreakPage without PDF
    Then the result should be boolean false

  Scenario: addPageBreak does nothing when no PDF document
    Given a new Print2Paper application
    When I add page break without PDF
    Then no errors should occur

  Scenario: renderPageTotals returns early without PDF document
    Given a new Print2Paper application
    When I render page totals without PDF
    Then no errors should occur

  Scenario: printWithPreview throws when not ready
    Given a new Print2Paper application
    When I print with preview without generating
    Then an error should be thrown containing "not generated"

  Scenario: printDirectly throws when not ready
    Given a new Print2Paper application
    When I print directly without generating
    Then an error should be thrown containing "not generated"

  Scenario: generatePdf throws on tokenize error
    Given a new Print2Paper application
    And PDF docInfo has valid code
    And tokenize is mocked to throw
    When I generate PDF
    Then an error should be thrown containing "tokenize"
