Feature: Registry Coverage Gaps
  Exercise lazy proxy error paths and done() cleanup errors.

  Scenario: Lazy proxy throws when instance is null
    Given a new Print2Paper application
    When I invoke a lazy proxy for a missing instance
    Then a missing instance error should be thrown

  Scenario: Lazy proxy throws when method is not a function
    Given a new Print2Paper application
    When I invoke a lazy proxy for a non-function property
    Then a not-a-function error should be thrown

  Scenario: Registry done handles component done errors
    Given a new Print2Paper application
    And a component done method throws
    When I call registry done
    Then no errors should occur

  Scenario: Use throws for non-function property on registered instance
    Given a new Print2Paper application
    When I use a non-function on a registered instance
    Then a not-a-function error should be thrown
