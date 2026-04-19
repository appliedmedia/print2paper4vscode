Feature: Stylize Coverage Gaps Extended
  Exercise getVSCodeThemes conversion failures and active theme paths.

  Scenario: getVSCodeThemes skips themes with no colors data
    Given a new Print2Paper application
    And VSCode extensions return themes without colors
    When I get VS Code themes for coverage
    Then the result should be an empty array

  Scenario: getVSCodeThemes handles conversion error gracefully
    Given a new Print2Paper application
    And VSCode extensions return themes that fail conversion
    When I get VS Code themes for coverage
    Then the result should be an empty array

  Scenario: getVSCodeThemes adds active theme when not in list
    Given a new Print2Paper application
    And VSCode extensions return empty themes with active theme available
    When I get VS Code themes for coverage
    Then the active theme result should have entries

  Scenario: getVSCodeThemes skips active theme with no data
    Given a new Print2Paper application
    And VSCode extensions return empty themes with no active theme data
    When I get VS Code themes for coverage
    Then the result should be an empty array

  Scenario: convertVSCodeThemeToShiki handles conversion error
    Given a new Print2Paper application
    When I convert a theme that causes error
    Then the fallback theme should be returned
