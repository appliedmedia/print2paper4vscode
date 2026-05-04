Feature: UIMenuMgr Coverage Gaps Extended
  Exercise getValueOfMenuItemIdForMenuId edge cases and text_edit paths.

  Scenario: getValueOfMenuItemIdForMenuId throws on invalid args
    Given a new Print2Paper application
    And menus are created
    When I get value with invalid args
    Then an invalid-args error should be thrown

  Scenario: getValueOfMenuFxnByCalcValue returns result for resolver error
    Given a new Print2Paper application
    And menus are created
    When a value resolver throws an error
    Then the resolved value should be undefined

  Scenario: getUIMenus_JS returns empty when no menus exist
    Given a new Print2Paper application without menus
    When I get the menu JavaScript
    Then the result should be empty string

  Scenario: getUIMenus_CSS returns empty when no menus exist
    Given a new Print2Paper application without menus
    When I get the menu CSS
    Then the result should be empty string

  Scenario: handleMenuItemSelected with text_edit context
    Given a new Print2Paper application
    And menus are created
    And menu dispatch is mocked
    When I handle text_edit selection for zoomLevel
    Then the menu dispatch should have been called

  Scenario: handleMenuItemSelected with invalid menuItemId after transform
    Given a new Print2Paper application
    And menus are created
    When I handle menu item with invalid transformed value
    Then no errors should occur

  Scenario: getValueOfMenuItemIdForMenuId with menuItemId equal to menuId
    Given a new Print2Paper application
    And menus are created
    And zoomLevel persist has a saved value
    When I get value for zoomLevel with menuItemId equal to menuId
    Then the zoom value result should be numeric

  Scenario: getValueOfMenuItemIdForMenuId resolves function value
    Given a new Print2Paper application
    And menus are created
    When I get value for zoomLevel fitWidth item
    Then the zoom value result should be numeric

  Scenario: getDynamicValueForMenuItemIdOfMenuId routes function-typed shortcut to the shortcut resolver
    Given a new Print2Paper application
    And menus are created
    When I get dynamic value for menuId "about" menuItemId "shortcut"
    Then the dynamic value result should be a string

  Scenario: getDynamicValueForMenuItemIdOfMenuId returns undefined for an item with no function-typed field
    Given a new Print2Paper application
    And menus are created
    When I get dynamic value for menuId "about" menuItemId "about"
    Then the resolved value should be undefined
