import assert from "node:assert/strict";
import { test } from "node:test";
import { readRecentCities } from "./recent-cities.ts";

test("recent cities retain valid IDs in order, deduplicate, and cap at five", () => {
  const input = JSON.stringify([null, 5, "tokyo", "unknown", "bangkok", "tokyo", {}, "osaka", "danang", "taipei", "cebu"]);

  assert.deepEqual(readRecentCities(input), ["tokyo", "bangkok", "osaka", "danang", "taipei"]);
});

test("invalid stored JSON and non-array values are harmless", () => {
  for (const input of ["not-json", "null", "{}", "42", '"tokyo"', "[]"]) {
    assert.deepEqual(readRecentCities(input), []);
  }
});
