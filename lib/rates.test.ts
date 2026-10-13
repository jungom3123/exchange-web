import assert from "node:assert/strict";
import { test } from "node:test";
import { erRatesSchema, frankfurterRatesSchema, koreaEximRatesSchema, ratesResponseSchema } from "./rates.ts";

test("provider rates preserve valid quotes without coercing malformed entries", () => {
  const result = erRatesSchema.parse({ rates: {
    USD: 1 / 1400, THB: .025, EUR: "0.001", JPY: 0, TWD: -2,
    VND: null, GBP: Infinity, CHF: Number.MIN_VALUE,
  } });

  assert.equal(result.rates.USD, 1 / 1400);
  assert.equal(result.rates.THB, .025);

  for (const code of ["EUR", "JPY", "TWD", "VND", "GBP", "CHF"]) {
    assert.equal(result.rates[code], undefined, code);
  }
});

test("provider and client payloads reject absent or non-dictionary rates", () => {
  for (const payload of [null, [], {}, { rates: [] }, { rates: null }, { rates: "invalid" }]) {
    assert.equal(erRatesSchema.safeParse(payload).success, false);
    assert.equal(ratesResponseSchema.safeParse(payload).success, false);
  }
});

test("Frankfurter requires a valid date before replacing source dates", () => {
  assert.equal(frankfurterRatesSchema.parse({ date: "2026-10-13", rates: { USD: .001 } }).date, "2026-10-13");

  for (const date of ["2026-02-30", "yesterday", null, 42]) {
    assert.equal(frankfurterRatesSchema.safeParse({ date, rates: {} }).success, false);
  }
});

test("Korea Exim parses complete numeric amounts and discards failed or corrupt rows", () => {
  const rows = koreaEximRatesSchema.parse([
    { cur_unit: "USD", deal_bas_r: "1,400.50", result: 1 },
    { cur_unit: "JPY(100)", deal_bas_r: "950.25", result: 1 },
    { cur_unit: "EUR", deal_bas_r: "1,500", result: 2 },
    { cur_unit: "THB", deal_bas_r: "40abc", result: 1 },
    { cur_unit: "TWD", deal_bas_r: "1,00", result: 1 },
    { cur_unit: "VND", deal_bas_r: "0", result: 1 },
    null,
  ]);

  assert.deepEqual(rows, [
    { cur_unit: "USD", deal_bas_r: 1400.5, result: 1 },
    { cur_unit: "JPY(100)", deal_bas_r: 950.25, result: 1 },
  ]);
  assert.deepEqual(koreaEximRatesSchema.parse([]), []);
  assert.equal(koreaEximRatesSchema.safeParse({ result: 2 }).success, false);
});

test("Korea Exim error-only responses do not look like an empty holiday response", () => {
  assert.equal(koreaEximRatesSchema.safeParse([{ result: 2 }]).success, false);
  assert.equal(koreaEximRatesSchema.safeParse([{ cur_unit: "USD", deal_bas_r: "oops", result: 1 }]).success, false);
});

test("client parsing keeps valid partial rates and ignores invalid quotes", () => {
  const response = ratesResponseSchema.parse({ date: 42, rates: {
    THB: { mid: 40, source: "test" }, USD: null,
    EUR: { mid: "1500", source: "test" }, JPY: { mid: -10, source: "test" },
  } });

  assert.equal(response.date, "");
  assert.deepEqual(response.rates.THB, { mid: 40, source: "test" });
  assert.equal(response.rates.USD, undefined);
  assert.equal(response.rates.EUR, undefined);
  assert.equal(response.rates.JPY, undefined);
});
