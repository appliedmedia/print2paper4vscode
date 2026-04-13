Feature: UIMenuMgr Error Paths
  Verify error handling in menu manager resolver functions.

  Scenario: isHidden resolver throws defaults to visible
    Given a new Print2Paper application
    And menus are created
    When a menu isHidden resolver throws an error
    Then the menu should default to visible

  Scenario: Value resolver returns unsupported type
    Given a new Print2Paper application
    And menus are created
    When a value resolver returns an object
    Then the resolved value should be undefined

  Scenario: Value resolver throws an error
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

  Scenario: setContextDict merges with existing context
    Given a new Print2Paper application
    And menus are created
    When I set context dict with key "width" value "800"
    And I set context dict with key "height" value "600"
    Then the context dict should contain key "width"
    And the context dict should contain key "height"

  Scenario: isMenuItemId accepts numeric strings
    Given a new Print2Paper application
    And menus are created
    When I validate menu item ID "14"
    Then the validation result should be true

  Scenario: getPersistForMenuId returns undefined initially
    Given a new Print2Paper application
    And menus are created
    When I get persist for menu "zoomLevel"
    Then the result should be undefined

  Scenario: handleMenuItemSelected dispatches valid selection
    Given a new Print2Paper application
    And menus are created
    And menu dispatch is mocked
    When I handle menu item selected "theme" with item "github-light"
    Then the menu dispatch should have been called

  Scenario: getValueOfPersistIdForMenuId reads persist value
    Given a new Print2Paper application
    And menus are created
    When I get persist value for persistId "testKey" on menu "zoomLevel"
    Then no errors should occur
