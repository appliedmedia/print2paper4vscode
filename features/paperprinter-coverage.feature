Feature: PaperPrinter Coverage Gaps
  Exercise header/footer toggle and zoom error paths.

  Scenario: handleSelection_HeaderFooter toggle deselects same item
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And header_begin is persisted as "title"
    When I select header_begin with item "title"
    Then the selection should toggle to none

  Scenario: handleSelection_HeaderFooter selects new item
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And header_begin is persisted as "none"
    When I select header_begin with item "page"
    Then the selection should be "page"

  Scenario: handleSelection_HeaderFooter default for header_middle
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select header_middle with the default item
    Then the selection should be "title"

  Scenario: handleSelection_HeaderFooter default for footer_middle
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I select footer_middle with the default item
    Then the selection should be "pageTotal"

  Scenario: handleSelection_ZoomInOut with unknown menuId
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    When I call handleSelection_ZoomInOut with unknown menuId
    Then the selection should have empty values

  Scenario: handleSelection_ZoomInOut with invalid current zoom
    Given a new Print2Paper application
    And menus are created
    And regenerateAndUpdateWebview is mocked
    And current zoom value is invalid
    When I click the zoom in button
    Then the zoom should use fallback value
