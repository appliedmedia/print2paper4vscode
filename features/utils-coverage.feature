Feature: Utils Coverage Gaps
  Exercise forceNumbers edge cases and forceContents.

  Scenario: forceNumbers adds missing required keys
    Given a new Print2Paper application
    When I call forceNumbers with missing required keys
    Then the result should contain the required keys

  Scenario: forceNumbers handles empty dict
    Given a new Print2Paper application
    When I call forceNumbers with empty dict
    Then the result should have a fallback key

  Scenario: forceContent returns useForEmpty for null
    Given a new Print2Paper application
    When I call forceContent with null
    Then the force content result should be empty string

  Scenario: forceContents adds required keys
    Given a new Print2Paper application
    When I call forceContents with required keys
    Then the result should contain all required keys
