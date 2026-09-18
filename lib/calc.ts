// 환전 경로 비교 계산 — 순수 함수만. 모든 환율은 "KRW per 1단위" (mid = 매매기준율).

export interface CurrencyCalcInfo {
  spreadPct: number | null; // null = 국내 현찰 환전 불가
  discount: number; // 우대율 0~1
}

// 현찰 살 때(은행이 팔 때) 환율 — 우대 적용
export function cashSellRate(mid: number, spreadPct: number, discount: number): number {
  return mid * (1 + (spreadPct / 100) * (1 - discount));
}

// 현찰 팔 때(은행이 살 때) 환율 — 우대 적용 (정보 박스 표시용)
export function cashBuyRate(mid: number, spreadPct: number, discount: number): number {
  return mid * (1 - (spreadPct / 100) * (1 - discount));
}

export type RouteKey = "bank" | "localKrw" | "heldFx" | "double" | "card";

export interface RouteResult {
  key: RouteKey;
  local: number | null; // 최종 수령 현지 화폐. null = 계산 불가(입력 없음/미취급)
  status: "ready" | "missing-rate" | "missing-reference" | "unavailable" | "invalid-amount";
}

export interface CompareInput {
  budgetKrw: number | null; // 원화 환산 예산
  holdingCurrency: "KRW" | "USD" | "EUR";
  heldAmount?: number | null;
  localCode: string;
  midLocal: number | null; // 현지 화폐 매매기준율 (KRW per 1)
  local: CurrencyCalcInfo;
  midFx: number | null; // 경유 외화(USD/EUR) 매매기준율
  fx: CurrencyCalcInfo;
  fxCode: string; // "USD" | "EUR"
  r2?: number | null; // 현지 환전소: 원화 1원당 받는 현지화폐 (정규화 후)
  r3?: number | null; // 현지 환전소: 보유 외화 1단위당 받는 현지화폐
  r4?: number | null; // 현지 환전소: (한국에서 환전한) 외화 1단위당 받는 현지화폐
}

export function compareRoutes(i: CompareInput): RouteResult[] {
  const results: RouteResult[] = [];
  const positive = (v: number | null | undefined): v is number =>
    typeof v === "number" && Number.isFinite(v) && v > 0;
  const add = (key: RouteKey, value: number | null, status: RouteResult["status"]) => {
    results.push({ key, local: positive(value) ? value : null,
      status: positive(value) ? "ready" : value !== null ? "invalid-amount" : status });
  };
  const budget = positive(i.budgetKrw) ? i.budgetKrw : null;
  const budgetStatus = i.budgetKrw === null ? "missing-reference" : "invalid-amount";
  const hasLocal = positive(i.midLocal);
  const hasFx = positive(i.midFx);

  add("bank", budget && hasLocal && i.local.spreadPct !== null
    ? budget / cashSellRate(i.midLocal!, i.local.spreadPct, i.local.discount) : null,
    i.local.spreadPct === null ? "unavailable" : !budget ? budgetStatus : "missing-reference");
  add("localKrw", budget && positive(i.r2) ? budget * i.r2 : null,
    !budget ? budgetStatus : "missing-rate");

  if (i.holdingCurrency !== "KRW" && i.holdingCurrency === i.fxCode && i.holdingCurrency !== i.localCode) {
    const held = positive(i.heldAmount) ? i.heldAmount : budget && hasFx ? budget / i.midFx! : null;
    add("heldFx", held && positive(i.r3) ? held * i.r3 : null,
      !held ? budgetStatus : "missing-rate");
  }
  // If the intermediate currency is already the destination, this duplicates bank.
  if (i.fxCode !== i.localCode) {
    add("double", budget && hasFx && i.fx.spreadPct !== null && positive(i.r4)
      ? budget / cashSellRate(i.midFx!, i.fx.spreadPct, i.fx.discount) * i.r4 : null,
      i.fx.spreadPct === null ? "unavailable" : !budget ? budgetStatus : !hasFx ? "missing-reference" : "missing-rate");
  }
  add("card", budget && hasLocal ? budget / i.midLocal! : null,
    !budget ? budgetStatus : "missing-reference");
  return results;
}

export function rankRoutes(results: RouteResult[]) {
  const cash = results.filter((r) => r.key !== "card");
  const valid = cash.filter((r) => r.status === "ready" && r.local !== null)
    .sort((a, b) => b.local! - a.local!);
  const count = valid.length;
  const best = valid[0]?.local ?? null;
  return {
    count, best,
    main: [...valid, ...cash.filter((r) => r.status !== "ready")].map((r) => ({
      ...r,
      rank: count >= 2 && r.local !== null ? valid.findIndex((v) => v.local === r.local) + 1 : null,
      isBest: count >= 2 && r.local !== null && r.local === best,
    })),
    card: results.find((r) => r.key === "card"),
  };
}

// 입력 방향 정규화: 사용자가 "A/B" (B 1단위당 A) 형태로 입력한 값을 "B per A 1단위"로 변환
// 예) KRW/THB 칸에 38.5 입력 → THB per KRW = 1/38.5
export function normalizeRate(value: number, inverted: boolean): number {
  return inverted ? 1 / value : value;
}

// 방향 오류 감지: 입력값이 기대값 대비 ±30% 밖이고 역수는 범위 안이면 뒤집힌 것으로 추정
export function looksFlipped(input: number, expected: number): boolean {
  if (input <= 0 || expected <= 0) return false;
  const ratio = input / expected;
  const invRatio = 1 / input / expected;
  const within = (r: number) => r > 1 / 1.3 && r < 1.3;
  return !within(ratio) && within(invRatio);
}
