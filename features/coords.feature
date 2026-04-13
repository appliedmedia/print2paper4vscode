Feature: Coords Debug Logging
  Verify coordinate system debug output and edge cases.

  Scenario: debugCoords logs page dimensions and margins
    Given a new Print2Paper application
    When I call debugCoords with test dimensions
    Then no errors should occur
