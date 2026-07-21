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
  note?: string;
}

export interface CompareInput {
  budgetKrw: number; // 원화 환산 예산
  midLocal: number; // 현지 화폐 매매기준율 (KRW per 1)
  local: CurrencyCalcInfo;
  midFx: number; // 경유 외화(USD/EUR) 매매기준율
  fx: CurrencyCalcInfo;
  fxCode: string; // "USD" | "EUR"
  r2?: number | null; // 현지 환전소: 원화 1원당 받는 현지화폐 (정규화 후)
  r3?: number | null; // 현지 환전소: 보유 외화 1단위당 받는 현지화폐
  r4?: number | null; // 현지 환전소: (한국에서 환전한) 외화 1단위당 받는 현지화폐
}

export function compareRoutes(i: CompareInput): RouteResult[] {
  const results: RouteResult[] = [];

  // ① 출국 전 하나은행에서 현지 화폐 환전
  if (i.local.spreadPct == null) {
    results.push({ key: "bank", local: null, note: "하나은행 현찰 미취급 통화" });
  } else {
    results.push({
      key: "bank",
      local: i.budgetKrw / cashSellRate(i.midLocal, i.local.spreadPct, i.local.discount),
    });
  }

  // ② 현지 환전소: KRW → 현지 화폐
  results.push({
    key: "localKrw",
    local: i.r2 ? i.budgetKrw * i.r2 : null,
    note: i.r2 ? undefined : "환전소 환율을 입력하세요",
  });

  // ③ 기존 보유 USD/EUR → 현지 화폐 (보유 외화의 원화 가치 = 매매기준율 기준 기회비용)
  results.push({
    key: "heldFx",
    local: i.r3 ? (i.budgetKrw / i.midFx) * i.r3 : null,
    note: i.r3 ? undefined : "환전소 환율을 입력하세요",
  });

  // ④ 한국에서 KRW → USD/EUR 환전 후 현지에서 재환전 (이중 환전)
  if (i.fx.spreadPct == null) {
    results.push({ key: "double", local: null, note: "국내 환전 불가 통화" });
  } else {
    const fxAmount = i.budgetKrw / cashSellRate(i.midFx, i.fx.spreadPct, i.fx.discount);
    results.push({
      key: "double",
      local: i.r4 ? fxAmount * i.r4 : null,
      note: i.r4 ? undefined : "환전소 환율을 입력하세요",
    });
  }

  // 벤치마크: 100% 우대 카드/ATM (트래블월렛 등) = 매매기준율 그대로
  results.push({ key: "card", local: i.budgetKrw / i.midLocal });

  return results;
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
