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
