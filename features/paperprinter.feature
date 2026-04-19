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

  Scenario: handleSelection_Theme with non-default theme
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select a non-default theme
    Then the selection result should have an id

  Scenario: handleSelection_Text with non-default font size
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select a non-default font size
    Then the selection result should have an id

  Scenario: handleSelection_PageSizeId with non-default page size
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select a non-default page size
    Then the selection result should have an id

  Scenario: handleSelection_Orient with non-default orientation
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select a non-default orientation
    Then the selection result should have an id

  Scenario: handleSelection_MarginId with non-default margin
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select a non-default margin
    Then the selection result should have an id

  Scenario: menus are only created once
    Given a new Print2Paper application
    And menus are created
    When menus are created again
    Then the menu count should not change
