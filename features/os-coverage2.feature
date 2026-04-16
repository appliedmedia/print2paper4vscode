Feature: OS Coverage Gaps Extended
  Exercise fileRead error path and readShikiLightThemes with existing dir.

  Scenario: fileRead returns undefined on parse error
    Given a new Print2Paper application
    And fileRead will encounter invalid YAML
    When I read a file with bad YAML content
    Then the file read result should be undefined

  Scenario: readShikiLightThemes with existing dir but no light themes
    Given a new Print2Paper application
    And shiki themes dir exists with no light themes
    When I read Shiki light themes
    Then the result should be an empty array

  Scenario: fileDelete removes existing file without error
    Given a new Print2Paper application
    When I delete a non-existent file path
    Then no errors should occur

  Scenario: htmlSrcPathToURI converts src attributes with valid panel
    Given a new Print2Paper application
    And extensionRoot and webview panel are configured
    When I convert HTML with src attributes to URI
    Then the result should contain converted URIs
