Feature: PDF Coverage Gaps Extended
  Exercise finishPdf and renderPageTotals error paths.

  Scenario: finishPdf throws when no PDF document exists
    Given a new Print2Paper application
    And menus are created
    And a PDF document with no pdfDoc
    When I call finishPdf
    Then a no-PDF-document error should be thrown

  Scenario: renderPageTotals catches setPage error gracefully
    Given a new Print2Paper application
    And menus are created
    And a PDF document with 2 pages and throwing setPage
    When I render page totals
    Then no errors should occur

  Scenario: formatContent with pageTotal element when pageTotal is non-zero
    Given a new Print2Paper application
    And menus are created
    And a PDF document with 5 page total
    And header_middle returns pageTotal element
    When I call addHeaderAndFooter
    Then no errors should occur

  Scenario: formatContent pushes content for footer positions
    Given a new Print2Paper application
    And menus are created
    And a PDF document with 3 page total and footer content
    When I call addHeaderAndFooter
    Then no errors should occur

  Scenario: addHeaderAndFooter renders text for title element
    Given a new Print2Paper application
    And menus are created
    And a PDF document with text tracking and title header
    When I call addHeaderAndFooter
    Then the header text should have been rendered

  Scenario: renderPageTotals iterates all pages with headers
    Given a new Print2Paper application
    And menus are created
    And a PDF document with 3 pages and title headers
    When I render page totals
    Then no errors should occur

  Scenario: pageSizePx returns dimensions from config when no PDF exists
    Given a new Print2Paper application
    And menus are created
    And PDF pageSizeId and orient are configured
    When I get pageSizePx from PDF
    Then the page size should have valid dimensions

  Scenario: DocInfo_PDF marginPts setter works
    Given a new Print2Paper application
    And menus are created
    And a PDF document with 3 page total and footer content
    When I set marginPts on DocInfo_PDF
    Then the margins should be updated

  Scenario: DocInfo_PDF getPageTotal returns total
    Given a new Print2Paper application
    And menus are created
    And a PDF document with 5 page total
    When I call getPageTotal on DocInfo_PDF
    Then the page total should be 5

  Scenario: PDF yaml returns yaml data
    Given a new Print2Paper application
    And menus are created
    When I call yaml on PDF
    Then the PDF yaml result should exist

  Scenario: PDF done catches fileDelete errors gracefully
    Given a new Print2Paper application
    And menus are created
    And PDF has temp files with throwing fileDelete
    When I call done on PDF
    Then no errors should occur

  Scenario: saveAsPDF throws when PDF not ready
    Given a new Print2Paper application
    And menus are created
    And a PDF document with no pdfDoc
    When I call saveAsPDF on PDF
    Then a save-PDF-not-generated error should be thrown

  Scenario: renderFromTokens throws when no pdfDoc
    Given a new Print2Paper application
    And menus are created
    And a PDF document with no pdfDoc
    When I call renderFromTokens with empty tokens
    Then a renderFromTokens-not-initialized error should be thrown

  Scenario: shouldBreakPage returns false with zero lineHeight
    Given a new Print2Paper application
    And menus are created
    And a PDF document with zero line height
    When I call shouldBreakPage with large y position
    Then the shouldBreakPage result should be false

  Scenario: addHeaderAndFooter returns silently with no pdfDoc
    Given a new Print2Paper application
    And menus are created
    And a PDF document with no pdfDoc
    When I call addHeaderAndFooter with no pdfDoc
    Then no errors should occur

  Scenario: findCharacterBreakPoint returns text length when no pdfDoc
    Given a new Print2Paper application
    And menus are created
    And a PDF document with no pdfDoc
    When I call findCharacterBreakPoint with no pdfDoc
    Then the break point result should equal the text length
