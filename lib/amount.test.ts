import assert from "node:assert/strict";
import { test } from "node:test";
import { formatAmountEdit } from "./amount.ts";

test("amount formatting retains all decimal digits and large integer digits", () => {
  for (const [raw, expected] of [
    ["1000000", "1,000,000"], ["1000.", "1,000."], ["1000.50", "1,000.50"],
    ["9007199254740993.0100", "9,007,199,254,740,993.0100"], ["0.50", "0.50"], ["", ""],
  ]) {
    assert.equal(formatAmountEdit("", raw, raw.length, "insertFromPaste", null).value, expected);
  }
});

test("digit edits regroup existing separators and preserve the logical caret", () => {
  assert.deepEqual(formatAmountEdit("999", "9999", 4, "insertText", "9"), { value: "9,999", caret: 5 });
  assert.deepEqual(formatAmountEdit("1,000", "1,0000", 6, "insertText", "0"), { value: "10,000", caret: 6 });
  assert.deepEqual(formatAmountEdit("1,000", "1,00", 4, "deleteContentBackward", null), { value: "100", caret: 3 });
  assert.deepEqual(formatAmountEdit("100.5", "1200.5", 2, "insertText", "2"), { value: "1,200.5", caret: 3 });
  assert.deepEqual(formatAmountEdit("1,005", "1,00.5", 5, "insertText", "."), { value: "100.5", caret: 4 });
});

test("malformed replacements stay visible for validation instead of changing their meaning", () => {
  for (const raw of ["1,00", "1,2", "1.2.3", "100abc", "-2", "1e4"]) {
    assert.deepEqual(formatAmountEdit("1,000", raw, raw.length, "insertFromPaste", null), { value: raw, caret: raw.length });
    assert.deepEqual(formatAmountEdit("1,000", raw, raw.length, "insertText", raw), { value: raw, caret: raw.length });
  }
});

test("pasted fragments can move old separators without accepting ambiguous pasted grouping", () => {
  assert.deepEqual(formatAmountEdit("1,234", "1,5678", 6, "insertFromPaste", "5678"), { value: "15,678", caret: 6 });
  assert.deepEqual(formatAmountEdit("1,000", "1,0000", 6, "insertFromPaste", "0"), { value: "10,000", caret: 6 });
  assert.deepEqual(formatAmountEdit("1,000", "1,00", 4, "insertFromPaste", "1,00"), { value: "1,00", caret: 4 });
});

test("deleting only a separator without keydown lets the caret pass the comma", () => {
  assert.deepEqual(formatAmountEdit("1,234", "1234", 1, "deleteContentForward", null), { value: "1,234", caret: 2 });
  assert.deepEqual(formatAmountEdit("1,234", "1234", 1, "deleteContentBackward", null), { value: "1,234", caret: 1 });
});
