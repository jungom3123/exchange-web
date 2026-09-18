// node lib/calc.test.ts 로 실행 (Node 24 타입 스트리핑)
import assert from "node:assert";
import { cashSellRate, cashBuyRate, compareRoutes, normalizeRate, looksFlipped, rankRoutes, type CompareInput } from "./calc.ts";

const approx = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);

// 스프레드 1.75%, 우대 90% → 실효 스프레드 0.175%
approx(cashSellRate(1000, 1.75, 0.9), 1001.75);
approx(cashBuyRate(1000, 1.75, 0.9), 998.25);
// 우대 0% → 풀 스프레드
approx(cashSellRate(1000, 1.75, 0), 1017.5);

const r = compareRoutes({
  holdingCurrency: "USD", localCode: "THB",
  budgetKrw: 1_000_000,
  midLocal: 38.5, // THB
  local: { spreadPct: 6, discount: 0.3 },
  midFx: 1390, // USD
  fx: { spreadPct: 1.75, discount: 0.9 },
  fxCode: "USD",
  r2: 1 / 39.5, // 환전소 39.5원/밧
  r3: 35.8, // 1달러당 35.8밧
  r4: 35.8,
});

const byKey = Object.fromEntries(r.map((x) => [x.key, x.local]));
// ① 1,000,000 / (38.5 * 1.042) = 24,926.5...
assert.ok(Math.abs(byKey.bank! - 1_000_000 / (38.5 * 1.042)) < 0.01);
// ② 1,000,000 / 39.5 = 25,316.4...
assert.ok(Math.abs(byKey.localKrw! - 1_000_000 / 39.5) < 0.01);
// ③ (1,000,000 / 1390) * 35.8 = 25,755.3...
assert.ok(Math.abs(byKey.heldFx! - (1_000_000 / 1390) * 35.8) < 0.01);
// ④ 1,000,000 / (1390*1.00175) * 35.8 — ③보다 약간 적어야 함 (환전 수수료)
assert.ok(byKey.double! < byKey.heldFx!);
// 카드 벤치마크가 ①보다 유리
assert.ok(byKey.card! > byKey.bank!);

// 미취급 통화 → bank null
const r2 = compareRoutes({
  holdingCurrency: "KRW", localCode: "VND",
  budgetKrw: 1000, midLocal: 0.06, local: { spreadPct: null, discount: 0 },
  midFx: 1390, fx: { spreadPct: 1.75, discount: 0.9 }, fxCode: "USD",
});
assert.strictEqual(r2.find((x) => x.key === "bank")!.local, null);

// 방향 정규화: KRW/JPY 10원 입력(inverted) → 0.1엔/원
assert.strictEqual(normalizeRate(10, true), 0.1);
assert.strictEqual(normalizeRate(0.1, false), 0.1);

// 뒤집힘 감지: 기대 38.5인데 0.026 입력 → flipped
assert.ok(looksFlipped(0.026, 38.5));
assert.ok(!looksFlipped(39.5, 38.5));

const input: CompareInput = {
  budgetKrw: 1_000_000, holdingCurrency: "KRW", localCode: "THB",
  midLocal: 40, local: { spreadPct: 5, discount: 0.3 },
  midFx: 1400, fx: { spreadPct: 1.75, discount: 0.9 }, fxCode: "USD",
};
const one = rankRoutes(compareRoutes(input));
assert.equal(one.count, 1);
assert.ok(one.main.every((route) => !route.isBest && route.rank === null));
assert.ok(one.main.every((route) => route.key !== "heldFx"));
const two = rankRoutes(compareRoutes({ ...input, r2: 1 / 41 }));
assert.equal(two.count, 2);
assert.equal(two.main.filter((route) => route.isBest).length, 1);
assert.equal(two.card?.status, "ready");
assert.equal(rankRoutes(compareRoutes({ ...input, midLocal: null })).count, 0);
assert.equal(rankRoutes(compareRoutes({ ...input, midFx: null, r2: .025 })).count, 2);
assert.equal(rankRoutes(compareRoutes({ ...input, midLocal: null, r2: .025 })).count, 1);
assert.ok(compareRoutes({ ...input, r2: -1, r4: Infinity }).every((route) => route.key === "bank" || route.key === "card" || route.local === null));
const held = compareRoutes({ ...input, holdingCurrency: "USD", heldAmount: 100.5, budgetKrw: 140700, r3: 35 });
assert.equal(held.find((route) => route.key === "heldFx")?.local, 3517.5);
assert.equal(compareRoutes({ ...input, holdingCurrency: "EUR", r3: 35 }).some((route) => route.key === "heldFx"), false);
const same = compareRoutes({ ...input, holdingCurrency: "USD", localCode: "USD", r3: 1, r4: 1 });
assert.deepEqual(same.map((route) => route.key), ["bank", "localKrw", "card"]);
const joint = rankRoutes([
  { key: "bank", local: 100, status: "ready" },
  { key: "localKrw", local: 100, status: "ready" },
  { key: "double", local: 90, status: "ready" },
  { key: "card", local: 110, status: "ready" },
]);
assert.equal(joint.count, 3);
assert.deepEqual(joint.main.map((route) => route.rank), [1, 1, 3]);
assert.equal(joint.main.filter((route) => route.isBest).length, 2);

console.log("calc.test.ts: all passed");
