Feature: PDF Coverage Gaps
  Exercise header/footer and error paths in PDF.ts.

  Scenario: formatContent returns null for total when pageTotal is 0
    Given a new Print2Paper application
    And menus are created
    And a PDF document with 0 page total
    When I call addHeaderAndFooter with total element
    Then the header should have no content

  Scenario: formatContent returns null for invalid element
    Given a new Print2Paper application
    And menus are created
    And a PDF document is set up for headers
    And header_middle returns an invalid element
    When I call addHeaderAndFooter
    Then no errors should occur

  Scenario: renderPageTotals catches errors gracefully
    Given a new Print2Paper application
    And menus are created
    And a PDF document with throwing setPage
    When I render page totals
    Then no errors should occur

  Scenario: formatContent pushes content only when non-null
    Given a new Print2Paper application
    And menus are created
    And a PDF document is set up for headers
    And header positions return mixed values
    When I call addHeaderAndFooter
    Then no errors should occur
