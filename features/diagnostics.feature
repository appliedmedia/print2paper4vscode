Feature: Diagnostics
  The Diagnostics module provides hierarchical debug logging,
  argument validation, and output formatting for the application.

  Scenario: Create a Diagnostics instance
    When I create a Diagnostics instance named "TestClass"
    Then the instance should be a Diagnostics object

  Scenario: Create a sub-context
    When I create a Diagnostics instance named "TestClass"
    And I create a sub-context named "testMethod"
    Then the sub-context should be a Diagnostics object

  Scenario: Method chaining with out()
    When I create a Diagnostics instance named "TestClass"
    And I chain three out calls
    Then each call should return the same Diagnostics instance

  Scenario: Validate required arguments with all present
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate present args requiring "content"
    Then the validation should pass

  Scenario: Validate required arguments with missing key
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate args missing "uri" requiring "content" and "uri"
    Then the validation should fail

  Scenario: Validate required arguments with undefined value
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate args with undefined "uri" requiring "content" and "uri"
    Then the validation should fail

  Scenario: Validate with empty required keys array
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate args requiring no keys
    Then the validation should pass

  Scenario: Validate null value is considered present
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate args with a null value requiring that key
    Then the validation should pass

  Scenario: Validate empty string is considered present
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate args with an empty string value requiring that key
    Then the validation should pass

  Scenario: Validate zero is considered present
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate args with a zero value requiring that key
    Then the validation should pass

  Scenario: Validate false is considered present
    Given a Diagnostics sub-context for "TestClass" and "testMethod"
    When I validate args with a false value requiring that key
    Then the validation should pass

  Scenario: Error messages include missing key and context path
    When I create a debug-enabled Diagnostics for "TestClass" and "testMethod"
    And I validate requiring a missing key while capturing output
    Then the captured output should include "missingKey"
    And the captured output should include "TestClass > testMethod"

  Scenario: Debug state inheritance from parent
    When I create a Diagnostics instance named "ParentClass" with debug on
    And I create a sub-context named "childMethod"
    Then the sub-context debug should be on
    When I create a further sub-context named "grandchildMethod"
    Then the further sub-context debug should be on

  Scenario: Debug state override in child
    When I create a Diagnostics instance named "ParentClass" with debug on
    And I create a sub-context named "childMethod" with debug off
    Then the sub-context debug should be off
    And the parent debug should still be on

  Scenario: Global debug state
    When I set global debug to on
    Then global debug should be on
    When I create a Diagnostics instance named "TestClass"
    Then the instance debug should be on
    When I set global debug to off
    Then global debug should be off

  Scenario: print() outputs message with class name
    When I create a Diagnostics named "TestClass" and capture output
    And I call print with message "Test message"
    Then the captured output should include "Test message"
    And the captured output should include "TestClass"
    And the print call should support chaining

  Scenario: done() outputs completion message with argument
    When I create a debug sub-context for "TestClass" and "testMethod" and capture output
    And I call done with message "completed"
    Then the captured output should include "Done"
    And the captured output should include "completed"
    And the done call should support chaining

  Scenario: done() outputs completion message without argument
    When I create a debug sub-context for "TestClass" and "testMethod" and capture output
    And I call done without a message
    Then the captured output should include "Done"
    And the done call should support chaining

  Scenario: error() outputs error with ERROR prefix
    When I create a Diagnostics named "TestClass" and capture output
    And I call error with message "Error message"
    Then the captured output should include "ERROR"
    And the captured output should include "Error message"
    And the captured output should include "TestClass"
    And the error call should support chaining

  Scenario: Duplicate messages trigger warning bookends
    When I create a no-app debug sub-context for "TestClass" and "testMethod" and capture output
    And I output the same message 15 times then a different one
    Then the captured output should include duplicate indicator
    And the captured output should include warning bookends
