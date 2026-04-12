Feature: Application Smoke Test
  Verify that the Print2Paper extension initializes correctly
  and core components are registered.

  Scenario: Application creates without errors
    Given a new Print2Paper application
    Then no errors should occur

  Scenario: Application has core components registered
    Given the application is initialized
    Then the application should have the "pdf" component
    And the application should have the "ui" component
    And the application should have the "os" component
