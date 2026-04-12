Feature: Application Smoke Test

  Scenario: Application creates without errors
    Given a new Print2Paper application
    Then no errors should occur

  Scenario: Application has registered components
    Given a new Print2Paper application
    Then the application should have registered components
