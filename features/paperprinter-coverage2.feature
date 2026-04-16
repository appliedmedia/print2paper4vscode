Feature: PaperPrinter Coverage Gaps Extended
  Exercise print actions, markdown mode, and zoom edge cases.

  Scenario: handleSelection_Print with preview action
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And generatePdf is mocked to produce a ready PDF
    When I select print with menuItemId "preview"
    Then the print action should complete

  Scenario: handleSelection_Print with direct action
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And generatePdf is mocked to produce a ready PDF
    When I select print with menuItemId "direct"
    Then the print action should complete

  Scenario: handleSelection_Print with save action
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And generatePdf is mocked to produce a ready PDF
    When I select print with menuItemId "save"
    Then the print action should complete

  Scenario: handleSelection_Print when PDF not ready
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And generatePdf is mocked to produce no PDF
    When I select print with menuItemId "preview"
    Then the print action should complete

  Scenario: handleSelection_Print with print error
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And generatePdf is mocked with throwing print
    When I select print with menuItemId "preview"
    Then the print action should complete

  Scenario: handleSelection_Md with non-default selection
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select markdown mode "md_render"
    Then the md selection should have a value

  Scenario: regenerateAndUpdateWebview calls PDF reset and display
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview dependencies are mocked
    When I call regenerateAndUpdateWebview
    Then the regenerate should complete

  Scenario: regenerateAndUpdateWebview throws when PDF not generated
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview mocked for failure
    When I call regenerateAndUpdateWebview expecting error
    Then a PDF generation error should be thrown

  Scenario: handlePrintCommandFromVSCode with valid editor content
    Given a new Print2Paper application
    And menus are created
    And print command dependencies are mocked
    When I call handlePrintCommandFromVSCode
    Then no errors should occur

  Scenario: handlePrintCommandFromVSCode with no editor content
    Given a new Print2Paper application
    And menus are created
    And print command returns no content
    When I call handlePrintCommandFromVSCode
    Then no errors should occur

  Scenario: handlePrintCommandFromVSCode with selection range
    Given a new Print2Paper application
    And menus are created
    And print command dependencies are mocked with selection
    When I call handlePrintCommandFromVSCode
    Then no errors should occur

  Scenario: handlePrintRequest with preview type
    Given a new Print2Paper application
    And menus are created
    And print request dependencies are mocked
    When I call handlePrintRequest with type "preview"
    Then no errors should occur

  Scenario: menuItems_Text includes custom editor size
    Given a new Print2Paper application
    And editor font size is set to 15
    And menus are created
    When I check the font size menu items
    Then the font size menu should include 15
