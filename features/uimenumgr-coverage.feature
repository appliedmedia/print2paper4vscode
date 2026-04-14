Feature: UIMenuMgr Coverage Gaps
  Exercise resolver type filtering and YAML fallback paths.

  Scenario: Value resolver returns boolean
    Given a new Print2Paper application
    And menus are created
    When a value resolver returns a boolean
    Then the resolved value should be boolean false

  Scenario: getUIMenus_JS returns empty when YAML property missing
    Given a new Print2Paper application
    And menus are created
    And uimenu_generic_handlers YAML property is cleared
    When I get the menu JavaScript
    Then the result should be empty string

  Scenario: getUIMenus_CSS returns empty when YAML property missing
    Given a new Print2Paper application
    And menus are created
    And uimenu_css YAML property is cleared
    When I get the menu CSS
    Then the result should be empty string
