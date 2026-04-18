Feature: YAML File Loading
  The Yaml module loads, caches, and provides default fallbacks
  for YAML configuration files.

  Background:
    Given a new Print2Paper application

  Scenario: Load and cache a YAML file
    Given a temp YAML file containing "key1: value1\nkey2: value2"
    When I create a Yaml instance with defaults {key1: "", key2: ""}
    And I call get()
    Then the YAML result key "key1" should be "value1"
    And the YAML result key "key2" should be "value2"
    When I call get() again
    Then the cached result should be the same object reference

  Scenario: Return defaults when file does not exist
    Given a nonexistent YAML file path
    When I create a Yaml instance with defaults {key1: "default1", key2: "default2"}
    And I call get()
    Then the YAML result key "key1" should be "default1"
    And the YAML result key "key2" should be "default2"

  Scenario: Return defaults when file path is invalid
    Given an invalid YAML file path
    When I create a Yaml instance with defaults {key1: "default"}
    And I call get()
    Then the YAML result key "key1" should be "default"

  Scenario: Cache clears on done() allowing reload
    Given a temp YAML file containing "key1: value1"
    When I create a Yaml instance with defaults {key1: ""}
    And I call get()
    Then the YAML result key "key1" should be "value1"
    When I call done() on the Yaml instance
    And I update the temp YAML file to "key1: newvalue"
    And I call get()
    Then the YAML result key "key1" should be "newvalue"

  Scenario: Handle complex nested YAML structures
    Given a temp YAML file with nested content
    When I create a Yaml instance with empty defaults
    And I call get()
    Then the YAML result should have nested key "nested.key1" equal to "value1"
    And the YAML result should have an array "array" with 2 items
