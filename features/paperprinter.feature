Feature: PaperPrinter Zoom and Markdown Selection
  Verify non-default selection handlers for zoom and markdown mode.

  Scenario: handleSelection_ZoomLevel with non-default zoom
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select a non-default zoom level
    Then the zoom value should be persisted

  Scenario: handleSelection_Md with non-default markdown mode
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select a non-default markdown mode
    Then no errors should occur

  Scenario: handleSelection_ZoomInOut zoom in
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I click the zoom in button
    Then the zoom should increase

  Scenario: handleSelection_ZoomInOut zoom out
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I click the zoom out button
    Then the zoom should decrease

  Scenario: handleSelection_ZoomInOut clamps at maximum
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And the current zoom is at maximum
    When I click the zoom in button
    Then the zoom should remain at maximum
