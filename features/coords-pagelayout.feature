Feature: Coords Page Layout
  Advanced coordinate transformation tests covering round-trip conversions,
  margin calculations, page break detection, and content area sizing
  for different page sizes.

  Background:
    Given a new Print2Paper application
    And a Coords instance from the registry

  Scenario: Y-axis coordinate round-trip on Letter size page
    Given a page height of 792 points
    When I convert screen Y 100 to PDF Y with page height 792
    And I convert the result back to screen Y with page height 792
    Then the round-trip screen Y should be 100

  Scenario: Margin positions on Letter size page
    Given a page height of 792 points
    When I calculate the PDF Y for top margin start with page height 792 and top margin 72
    Then the result should be 720
    When I get the PDF Y for bottom margin start with bottom margin 72
    Then the result should be 72

  Scenario: Page break detection above, at, and below margin
    Given a bottom margin Y of 72
    When I check if PDF Y 172 has reached bottom margin 72
    Then the boolean result should be false
    When I check if PDF Y 72 has reached bottom margin 72
    Then the boolean result should be true
    When I check if PDF Y 62 has reached bottom margin 72
    Then the boolean result should be true

  Scenario: Line movement round-trip
    Given a starting Y of 700 and a line height of 20 CSS pixels
    When I move down one line from 700 using the PDF points line height
    And I move up one line from the result using the same line height
    Then the round-trip Y should be 700

  Scenario: Content area for Letter size page with 1-inch margins
    Given a page height of 792 points
    When I calculate available height with page height 792, top margin 72, and bottom margin 72
    Then the result should be 648
    When I calculate available width with page width 612, left margin 72, and right margin 72
    Then the result should be 468
