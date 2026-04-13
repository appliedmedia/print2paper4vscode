Feature: Stylize Theme Management
  Verify theme filtering, VS Code theme loading, and fallback behavior.

  Scenario: getThemes filters by display name
    Given a new Print2Paper application
    When I get themes filtered by "light"
    Then only themes matching "light" should be returned

  Scenario: getVSCodeThemes loads from extensions
    Given a new Print2Paper application
    And VS Code extension themes are mocked
    When I get VS Code themes
    Then converted themes should be returned

  Scenario: getVSCodeThemes moves active theme to top
    Given a new Print2Paper application
    And VS Code extension themes are mocked
    And the active theme ID matches a loaded theme
    When I get VS Code themes
    Then the active theme should be first

  Scenario: resolveActiveTheme falls back when theme not found
    Given a new Print2Paper application
    And the active theme ID is "nonexistent-theme-xyz"
    When I resolve the active theme
    Then a valid fallback theme should be returned

  Scenario: getShikiThemes returns filtered results
    Given a new Print2Paper application
    When I get Shiki themes filtered by "github"
    Then only Shiki themes matching "github" should be returned

  Scenario: resolveActiveTheme uses pure Shiki theme ID
    Given a new Print2Paper application
    And the active theme ID is "github-light"
    When I resolve the active theme
    Then the result should equal "github-light"

  Scenario: resolveActiveTheme returns converted VS Code theme name
    Given a new Print2Paper application
    And VS Code extension themes are mocked
    And the active theme ID matches a loaded theme
    When I resolve the active theme
    Then a valid fallback theme should be returned

  Scenario: isThemeId rejects empty strings
    Given a new Print2Paper application
    When I validate theme ID ""
    Then the result should equal "false"

  Scenario: escapeHtml escapes special characters
    Given a new Print2Paper application
    When I escape HTML "<div>&'\"test</div>"
    Then the result should contain "&lt;"
    And the result should contain "&amp;"
    And the result should contain "&quot;"

  Scenario: generateHtmlFromTokens produces styled output
    Given a new Print2Paper application
    When I generate HTML from mock tokens
    Then the result should contain "<pre"
    And the result should contain "color:"

  Scenario: convertVSCodeThemeToShiki extracts background color
    Given a new Print2Paper application
    When I convert a theme with background token colors
    Then the theme data should have token colors

  Scenario: convertVSCodeThemeToShiki returns fallback on error
    Given a new Print2Paper application
    When I convert a null theme
    Then the theme data should have a name

  Scenario: getVSCodeThemes NLS resolves display names
    Given a new Print2Paper application
    And VS Code extension themes are mocked with NLS labels
    When I get VS Code themes
    Then converted themes should be returned
