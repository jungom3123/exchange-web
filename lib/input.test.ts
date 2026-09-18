import assert from "node:assert/strict";
import { initialInput, inputReducer, normalizedRate, parsePositiveDecimal, effectiveFx } from "./input.ts";

for (const [raw, value] of [["100.5", 100.5], ["100.", 100], ["0.5", .5], ["1,000.50", 1000.5], [" 50 ", 50]] as const) {
  assert.equal(parsePositiveDecimal(raw), value);
}
for (const raw of ["", "0", "-1", "1.2.3", "100abc", "1,00", "1e4", "Infinity", " ", "1".repeat(400)]) {
  assert.equal(parsePositiveDecimal(raw), null, raw);
}
let state = inputReducer(initialInput, { type: "destination", localCode: "THB", cityId: "bangkok" });
state = inputReducer(state, { type: "rate", field: "fxRate", value: { pair: "USD/THB", direction: 1, raw: "35" } });
state = inputReducer(state, { type: "rate", field: "krwRate", value: { pair: "KRW/THB", direction: 0, raw: "40" } });
assert.equal(normalizedRate(state.fxRate), 35);
state = inputReducer(state, { type: "fx", value: "EUR" });
assert.equal(state.fxRate.raw, "");
assert.equal(normalizedRate(state.fxRate), null);
assert.equal(normalizedRate(state.krwRate), .025);
state = inputReducer(state, { type: "fx", value: "USD" });
assert.equal(normalizedRate(state.fxRate), null);
state = inputReducer(state, { type: "destination", localCode: "THB", cityId: "chiang-mai" });
assert.equal(state.krwRate.raw, "40");
state = inputReducer(state, { type: "destination", localCode: "USD", cityId: "guam" });
assert.equal(effectiveFx(state), "EUR");
assert.equal(state.fxRate.pair, "EUR/USD");
assert.equal(state.krwRate.raw, "");
state = inputReducer(state, { type: "amount", value: "100.5" });
state = inputReducer(state, { type: "holding", value: "USD" });
assert.equal(state.amount, "");
assert.equal(effectiveFx(state), "USD");
assert.equal(state.fxRate.pair, "USD/USD");
state = inputReducer(state, { type: "destination", localCode: "THB", cityId: "bangkok" });
assert.equal(state.fxRate.pair, "USD/THB");
assert.equal(state.fxRate.raw, "");
const stale = inputReducer(state, { type: "rate", field: "fxRate", value: { pair: "EUR/USD", direction: 0, raw: "35" } });
assert.equal(stale, state);
console.log("input.test.ts: all passed");
