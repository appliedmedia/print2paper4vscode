Feature: Coordinate Conversions
  The Coords module handles conversions between CSS pixels, PDF points,
  and screen/PDF Y-axis coordinates used in page layout.

  Background:
    Given a new Print2Paper application
    And a Coords instance from the registry

  Scenario Outline: CSS pixels to PDF points conversion
    When I convert <css_px> CSS pixels to PDF points
    Then the result should be <pdf_pts>

    Examples:
      | css_px | pdf_pts |
      | 96     | 72      |
      | 100    | 75      |
      | 0      | 0       |

  Scenario Outline: PDF points to CSS pixels conversion
    When I convert <pdf_pts> PDF points to CSS pixels
    Then the result should be <css_px>

    Examples:
      | pdf_pts | css_px |
      | 72      | 96     |
      | 75      | 100    |
      | 0       | 0      |

  Scenario Outline: PDF Y coordinate to screen Y coordinate
    When I convert PDF Y <pdf_y> to screen Y with page height <page_height>
    Then the result should be <screen_y>

    Examples:
      | pdf_y | page_height | screen_y |
      | 100   | 842         | 742      |
      | 842   | 842         | 0        |

  Scenario Outline: Screen Y coordinate to PDF Y coordinate
    When I convert screen Y <screen_y> to PDF Y with page height <page_height>
    Then the result should be <pdf_y>

    Examples:
      | screen_y | page_height | pdf_y |
      | 100      | 842         | 742   |
      | 0        | 842         | 842   |

  Scenario: Top margin PDF Y calculation
    When I calculate the PDF Y for top margin start with page height 842 and top margin 72
    Then the result should be 770

  Scenario: Bottom margin PDF Y is the margin value itself
    When I get the PDF Y for bottom margin start with bottom margin 72
    Then the result should be 72

  Scenario: Moving down one line decreases PDF Y
    When I move PDF Y 700 down one line with line height 14
    Then the result should be 686

  Scenario: Moving up one line increases PDF Y
    When I move PDF Y 700 up one line with line height 14
    Then the result should be 714

  Scenario Outline: Bottom margin detection
    When I check if PDF Y <y> has reached bottom margin <margin>
    Then the boolean result should be <reached>

    Examples:
      | y   | margin | reached |
      | 72  | 72     | true    |
      | 50  | 72     | true    |
      | 100 | 72     | false   |

  Scenario: Available height for content
    When I calculate available height with page height 842, top margin 72, and bottom margin 72
    Then the result should be 698

  Scenario: Available width for content
    When I calculate available width with page width 595, left margin 72, and right margin 72
    Then the result should be 451

  Scenario: Margin gutter minimum constant
    Then the Coords margin gutter minimum should be 28.8
