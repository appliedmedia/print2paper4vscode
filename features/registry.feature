Feature: Registry Error Paths
  Verify error handling in Registry dependency injection.

  Scenario: use() throws when component ID not found
    Given a new Print2Paper application
    When I call use with an unknown component ID
    Then an error should be thrown containing "not found"

  Scenario: Lazy proxy throws when method does not exist on instance
    Given a new Print2Paper application
    When I call a non-existent method via lazy proxy
    Then an error should be thrown containing "not a function"

  Scenario: done() continues cleanup when a component throws
    Given a new Print2Paper application
    And a component whose done method throws
    When I call done on the registry
    Then no errors should occur

  Scenario: getInstance returns undefined for unknown component
    Given a new Print2Paper application
    When I get instance of "nonexistent_component"
    Then the result should be undefined

  Scenario: use() throws when method name not found in any prototype
    Given a new Print2Paper application
    When I call use with a method-only name that does not exist
    Then an error should be thrown containing "not found"
