Feature: OS Coverage Gaps
  Exercise error paths and untested branches in OS.ts.

  Scenario: resolveDir rejects path with null byte
    Given a new Print2Paper application
    When I resolve a dir with null byte path
    Then a bad path error should be thrown

  Scenario: resolveDir rejects empty path
    Given a new Print2Paper application
    When I resolve a dir with empty path
    Then a bad path error should be thrown

  Scenario: resolveDir rejects relative path
    Given a new Print2Paper application
    When I resolve a dir with relative path
    Then a bad path error should be thrown

  Scenario: fileWrite throws on write failure
    Given a new Print2Paper application
    And fs.writeFileSync is mocked to throw
    When I write a file that fails
    Then a write error should be thrown

  Scenario: fileRead returns undefined when extensionRoot missing
    Given a new Print2Paper application
    And extensionRoot is cleared
    When I read an extension-relative file
    Then the result should be undefined

  Scenario: htmlSrcPathToURI returns unchanged when extensionRoot missing
    Given a new Print2Paper application
    And extensionRoot is cleared
    When I convert HTML src paths to URI
    Then the result should equal the original HTML

  Scenario: htmlSrcPathToURI returns unchanged when webview panel missing
    Given a new Print2Paper application
    And getPanelForUriConversion returns null
    When I convert HTML src paths to URI
    Then the result should equal the original HTML

  Scenario: sanitizeFileName returns output for all-special-chars input
    Given a new Print2Paper application
    When I sanitize filename "<>:\"|?*"
    Then the result should equal "output"

  Scenario: readShikiLightThemes returns empty when extensionRoot missing
    Given a new Print2Paper application
    And extensionRoot is cleared
    When I read Shiki light themes
    Then the result should be an empty array
