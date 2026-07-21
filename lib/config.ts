// 통화 메타데이터 + 하나은행 현찰 스프레드/우대율 설정
// spreadPct: 현찰 살 때 스프레드(매매기준율 대비 %). null = 하나은행 현찰 미취급.
// TODO(research): 스프레드율은 하나은행 고시 조사 결과로 확정 예정 (현재 통상값 기반 추정치)
// discount: 현금 환전 환율우대 (현재 이벤트 우대율)

export interface Currency {
  code: string;
  nameKo: string;
  flag: string;
  koreaexim?: string; // 수출입은행 cur_unit 매칭 키 (없으면 미지원)
  unit: number; // 고시 단위 (JPY/IDR = 100)
  frankfurter: boolean;
  spreadPct: number | null;
  discount: number;
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", nameKo: "미국 달러", flag: "🇺🇸", koreaexim: "USD", unit: 1, frankfurter: true, spreadPct: 1.75, discount: 0.9, decimals: 2 },
  { code: "JPY", nameKo: "일본 엔", flag: "🇯🇵", koreaexim: "JPY(100)", unit: 100, frankfurter: true, spreadPct: 1.75, discount: 0.8, decimals: 0 },
  { code: "EUR", nameKo: "유로", flag: "🇪🇺", koreaexim: "EUR", unit: 1, frankfurter: true, spreadPct: 1.99, discount: 0.8, decimals: 2 },
  { code: "THB", nameKo: "태국 밧", flag: "🇹🇭", koreaexim: "THB", unit: 1, frankfurter: true, spreadPct: 6, discount: 0.3, decimals: 0 },
  { code: "VND", nameKo: "베트남 동", flag: "🇻🇳", unit: 1, frankfurter: false, spreadPct: 11.8, discount: 0, decimals: 0 },
  { code: "TWD", nameKo: "대만 달러", flag: "🇹🇼", unit: 1, frankfurter: false, spreadPct: 9, discount: 0, decimals: 0 },
  { code: "HKD", nameKo: "홍콩 달러", flag: "🇭🇰", koreaexim: "HKD", unit: 1, frankfurter: true, spreadPct: 1.97, discount: 0.3, decimals: 2 },
  { code: "SGD", nameKo: "싱가포르 달러", flag: "🇸🇬", koreaexim: "SGD", unit: 1, frankfurter: true, spreadPct: 1.99, discount: 0.3, decimals: 2 },
  { code: "PHP", nameKo: "필리핀 페소", flag: "🇵🇭", unit: 1, frankfurter: true, spreadPct: 10, discount: 0, decimals: 0 },
  { code: "IDR", nameKo: "인도네시아 루피아", flag: "🇮🇩", koreaexim: "IDR(100)", unit: 100, frankfurter: true, spreadPct: 12, discount: 0, decimals: 0 },
  { code: "MYR", nameKo: "말레이시아 링깃", flag: "🇲🇾", koreaexim: "MYR", unit: 1, frankfurter: true, spreadPct: 5.9, discount: 0, decimals: 2 },
  { code: "CNY", nameKo: "중국 위안", flag: "🇨🇳", koreaexim: "CNH", unit: 1, frankfurter: true, spreadPct: 5, discount: 0.3, decimals: 2 },
  { code: "GBP", nameKo: "영국 파운드", flag: "🇬🇧", koreaexim: "GBP", unit: 1, frankfurter: true, spreadPct: 1.97, discount: 0.3, decimals: 2 },
  { code: "CHF", nameKo: "스위스 프랑", flag: "🇨🇭", koreaexim: "CHF", unit: 1, frankfurter: true, spreadPct: 1.9, discount: 0.3, decimals: 2 },
  { code: "AUD", nameKo: "호주 달러", flag: "🇦🇺", koreaexim: "AUD", unit: 1, frankfurter: true, spreadPct: 1.97, discount: 0.3, decimals: 2 },
  { code: "CAD", nameKo: "캐나다 달러", flag: "🇨🇦", koreaexim: "CAD", unit: 1, frankfurter: true, spreadPct: 1.97, discount: 0.3, decimals: 2 },
  { code: "NZD", nameKo: "뉴질랜드 달러", flag: "🇳🇿", koreaexim: "NZD", unit: 1, frankfurter: true, spreadPct: 1.97, discount: 0.3, decimals: 2 },
];

export const currencyByCode = (code: string) =>
  CURRENCIES.find((c) => c.code === code);

export const BASE_CURRENCIES = ["KRW", "USD", "EUR"] as const;
export type BaseCurrency = (typeof BASE_CURRENCIES)[number];

export function formatAmount(v: number, code: string): string {
  const decimals = code === "KRW" ? 0 : currencyByCode(code)?.decimals ?? 2;
  return v.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// 환율 표시용 유효자릿수 포맷 (0.02596 / 38.52 / 941.2 모두 자연스럽게)
export function formatRate(v: number): string {
  if (!isFinite(v) || v <= 0) return "-";
  const digits = v >= 100 ? 2 : v >= 1 ? 4 : 6;
  return v.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}
