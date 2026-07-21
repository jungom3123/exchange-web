// 도시별 환전 팁 DB — 한국인 인기 여행지 Top 30 (아고다 2025 검색 순위 + 국가별 출국 통계 기반, 치앙마이 포함)
// 팁 내용은 공개 자료 기반 참고 정보이며, 수수료·KRW 취급 여부는 시점·지점에 따라 달라질 수 있음

export interface CityTip {
  id: string;
  nameKo: string;
  country: string;
  currency: string;
  cashNeedLevel: "high" | "medium" | "low";
  krwAccepted: boolean | null; // null = 정보 없음/편차 큼
  tips: string[];
  knownBooths?: { name: string; area: string }[];
}

export const CASH_LEVEL_LABEL = {
  high: { label: "현금 필수 지역", color: "red" },
  medium: { label: "현금 비상금 권장", color: "yellow" },
  low: { label: "카드 중심 가능", color: "green" },
} as const;

const JP_COMMON = [
  "카드·IC카드 보급이 높지만 소규모 식당·신사·시장은 현금 필요",
  "JPY는 국내 80% 우대 환전이 유리한 경우가 많음 — 현지 환전과 비교",
  "세븐뱅크·우체국 ATM에서 해외카드 출금 가능 (카드사 수수료 확인)",
  "원화(DCC) 결제 제안은 거절하고 엔화 결제 선택",
];
const VN_COMMON = [
  "소액 구매는 현금이 일반적 — 소액 VND 준비, 큰 금액은 카드 병행",
  "국내 VND 환전은 스프레드 11.8%·우대 없음 — USD 이중 환전 또는 현지 KRW 환전과 비교 필수",
  "현지 ATM은 회당 3만~10만동 수준 수수료 + 1회 인출 한도 낮음",
  "달러 고액권($100)이 소액권보다 우대되는 경우 많음",
  "환전 시 영수증 수령, 권종이 비슷하니 그 자리에서 세어보기",
];
const TH_COMMON = [
  "시장·노점은 현금 필수 — 대형몰·호텔은 카드 가능",
  "KRW 현찰 직접 환전 가능 (주요 환전소 환율표에 KRW 표시) — 깨끗한 5만원권 우대",
  "해외카드 ATM 출금 시 회당 220밧 수수료 — 100% 우대 카드여도 소액 인출은 불리",
  "원화(DCC) 결제 제안은 거절하고 밧 결제 선택",
];
const PH_COMMON = [
  "소상점·교통·팁은 현금 위주 — 카드 커버리지 낮은 편",
  "해외카드 ATM 출금 시 회당 250페소 내외 수수료",
  "달러 신권·고액권이 우대되는 경향 — 구권·낙서권 거절 가능",
  "중앙은행(BSP) 등록 환전소 이용 권장",
];

export const CITIES: CityTip[] = [
  // ---- 일본 ----
  { id: "tokyo", nameKo: "도쿄", country: "일본", currency: "JPY", cashNeedLevel: "medium", krwAccepted: true,
    tips: JP_COMMON,
    knownBooths: [{ name: "Ninja Money Exchange (InterBank)", area: "신주쿠 니시구치역 D3 출구 앞" }] },
  { id: "fukuoka", nameKo: "후쿠오카", country: "일본", currency: "JPY", cashNeedLevel: "medium", krwAccepted: true,
    tips: [...JP_COMMON, "한국인 방문이 많아 텐진·하카타 환전소에서 KRW 취급 일반적"] },
  { id: "osaka", nameKo: "오사카", country: "일본", currency: "JPY", cashNeedLevel: "medium", krwAccepted: true,
    tips: [...JP_COMMON, "도톤보리·난바 일대 사설 환전기 환율은 은행보다 나쁜 경우 많음 — 입력해서 비교"] },
  { id: "sapporo", nameKo: "삿포로", country: "일본", currency: "JPY", cashNeedLevel: "medium", krwAccepted: null,
    tips: [...JP_COMMON, "환전소가 도쿄·오사카보다 적음 — 출국 전 환전 또는 편의점 ATM 활용"] },
  { id: "okinawa", nameKo: "오키나와", country: "일본", currency: "JPY", cashNeedLevel: "medium", krwAccepted: null,
    tips: [...JP_COMMON, "렌터카 여행 시 지방 식당·주차장은 현금만 받는 곳 있음"] },
  { id: "nagoya", nameKo: "나고야", country: "일본", currency: "JPY", cashNeedLevel: "medium", krwAccepted: null,
    tips: JP_COMMON },

  // ---- 베트남 ----
  { id: "nhatrang", nameKo: "나트랑", country: "베트남", currency: "VND", cashNeedLevel: "high", krwAccepted: true,
    tips: [...VN_COMMON, "한국인 관광객이 많아 시내 환전소 KRW 취급 일반적"] },
  { id: "danang", nameKo: "다낭", country: "베트남", currency: "VND", cashNeedLevel: "high", krwAccepted: true,
    tips: [...VN_COMMON, "한시장 주변 금은방 환전이 유명 — 허가·당일 환율 현장 확인"] },
  { id: "phuquoc", nameKo: "푸꾸옥", country: "베트남", currency: "VND", cashNeedLevel: "high", krwAccepted: null,
    tips: [...VN_COMMON, "환전소가 적고 환율 편차 큼 — 큰 금액은 은행(Vietcombank 등) 창구가 안전"],
    knownBooths: [{ name: "Vietcombank Phú Quốc", area: "즈엉동 30/4 거리" }] },
  { id: "hanoi", nameKo: "하노이", country: "베트남", currency: "VND", cashNeedLevel: "high", krwAccepted: true,
    tips: [...VN_COMMON, "하쭝(Hà Trung) 거리 금은방 환전이 유명 — 두 곳 이상 비교"],
    knownBooths: [{ name: "Quoc Trinh Gold Shop", area: "하쭝 거리 27–29, 호안끼엠" }] },
  { id: "hochiminh", nameKo: "호찌민", country: "베트남", currency: "VND", cashNeedLevel: "high", krwAccepted: true,
    tips: VN_COMMON,
    knownBooths: [{ name: "Hà Tâm Jewelry", area: "벤탄시장 인근, 1군" }] },

  // ---- 태국 ----
  { id: "bangkok", nameKo: "방콕", country: "태국", currency: "THB", cashNeedLevel: "high", krwAccepted: true,
    tips: [...TH_COMMON, "공항에서는 시내 이동 비용만 환전하고 시내 환전소에서 비교"],
    knownBooths: [
      { name: "SuperRich 1965 (Orange) 본점", area: "랏차담리 로드" },
      { name: "Vasu Exchange", area: "수쿰빗, 아속·나나 인근" },
    ] },
  { id: "chiang-mai", nameKo: "치앙마이", country: "태국", currency: "THB", cashNeedLevel: "high", krwAccepted: true,
    tips: [...TH_COMMON, "KRW 직접 환전 시 달러 이중 환전과 환율 차이가 거의 없다는 후기 다수 — 입력해서 직접 비교"],
    knownBooths: [
      { name: "S.K. Money Exchange", area: "나이트 바자·핑강 인근" },
      { name: "Super Rich Chiang Mai", area: "로이끄로 로드" },
    ] },
  { id: "phuket", nameKo: "푸껫", country: "태국", currency: "THB", cashNeedLevel: "high", krwAccepted: true,
    tips: [...TH_COMMON, "빠통 해변가 환전소 환율 편차 큼 — 큰길 안쪽 환전소가 나은 경우 많음"] },
  { id: "pattaya", nameKo: "파타야", country: "태국", currency: "THB", cashNeedLevel: "high", krwAccepted: true,
    tips: TH_COMMON },

  // ---- 대만/중화권 ----
  { id: "taipei", nameKo: "타이베이", country: "대만", currency: "TWD", cashNeedLevel: "medium", krwAccepted: null,
    tips: [
      "야시장·소규모 상점은 현금 필수 — 이지카드 충전도 현금",
      "국내 TWD 환전은 스프레드 13.1%·우대 없음으로 매우 불리 — 100% 우대 카드 또는 현지 공항 은행 환전이 일반적",
      "공항 은행(대만은행 등) 환전 시 여권 필요, 건당 소액(30TWD) 수수료",
      "해외카드 ATM 출금 시 회당 100TWD 내외 현지 수수료",
    ],
    knownBooths: [{ name: "Bank of Taiwan 공항 환전소", area: "타오위안 공항 T1/T2 입국장" }] },
  { id: "hongkong", nameKo: "홍콩", country: "홍콩", currency: "HKD", cashNeedLevel: "medium", krwAccepted: true,
    tips: [
      "카드·옥토퍼스 중심, 소액 현금 병행",
      "시내 환전소는 QTS(홍콩관광청 인증) 매장 위주로 이용 — 중경맨션 등 밀집 지역은 비교 쉬움",
      "원화(DCC) 결제 제안은 거절하고 HKD 결제 선택",
    ],
    knownBooths: [{ name: "Sheng En Foreign Exchange", area: "침사추이 스타하우스" }] },
  { id: "macau", nameKo: "마카오", country: "마카오", currency: "HKD", cashNeedLevel: "medium", krwAccepted: null,
    tips: [
      "홍콩달러(HKD)가 1:1로 통용 — 별도 MOP 환전 불필요한 경우 많음",
      "단, 거스름돈은 MOP로 받게 되며 홍콩에서는 사용 불가 — 소액만 남기기",
      "카지노·호텔은 카드 가능, 노포 식당·베이커리는 현금",
    ] },
  { id: "shanghai", nameKo: "상하이", country: "중국", currency: "CNY", cashNeedLevel: "low", krwAccepted: null,
    tips: [
      "현금보다 Alipay/WeChat Pay가 핵심 — 출국 전 해외카드 연결 설정 우선",
      "현금은 소액만 — 위조지폐 우려로 고액권 거부하는 상점 있음",
      "은행 환전은 여권 필요·대기 긴 편 — 국내에서 소액 환전해 가는 것이 편함",
    ] },
  { id: "beijing", nameKo: "베이징", country: "중국", currency: "CNY", cashNeedLevel: "low", krwAccepted: null,
    tips: [
      "현금보다 Alipay/WeChat Pay가 핵심 — 출국 전 해외카드 연결 설정 우선",
      "관광지 입장권은 대부분 온라인 사전 예약제 — 현금 사용처가 계속 줄어드는 중",
      "은행 환전은 여권 필요 — 국내에서 소액 환전해 가는 것이 편함",
    ] },

  // ---- 동남아 기타 ----
  { id: "bali", nameKo: "발리", country: "인도네시아", currency: "IDR", cashNeedLevel: "high", krwAccepted: null,
    tips: [
      "환전 사기가 잦은 지역 — 비정상적으로 높은 환율 광고는 피하기",
      "Bank Indonesia 허가 표지(PVA Berizin)·CCTV 있는 공식 환전소 이용",
      "현금 수령 후 그 자리에서 직접 세어보기 (직원 손 거치지 않고)",
      "달러 고액권($100, 신권)이 우대되는 경향",
    ],
    knownBooths: [
      { name: "BMC Money Changer", area: "우붓·쿠타·스미냑 등 지점" },
      { name: "Central Kuta Money Exchange", area: "쿠타 권역" },
    ] },
  { id: "cebu", nameKo: "세부", country: "필리핀", currency: "PHP", cashNeedLevel: "high", krwAccepted: null,
    tips: PH_COMMON,
    knownBooths: [
      { name: "SLB Money Changer", area: "푸엔테 오스메냐 서클" },
      { name: "Portside Money Changer", area: "세부항 여객터미널 1" },
    ] },
  { id: "manila", nameKo: "마닐라", country: "필리핀", currency: "PHP", cashNeedLevel: "high", krwAccepted: null,
    tips: PH_COMMON,
    knownBooths: [
      { name: "Czarina Foreign Exchange", area: "마카티 아얄라 타워 원 등 다수 지점" },
      { name: "Sanry's Money Changer", area: "마카티 글로리에타 2 등 다수 지점" },
    ] },
  { id: "boracay", nameKo: "보라카이", country: "필리핀", currency: "PHP", cashNeedLevel: "high", krwAccepted: null,
    tips: [...PH_COMMON, "섬 내 환율은 마닐라·세부보다 불리 — 본토에서 미리 환전해 입도 권장"] },
  { id: "kualalumpur", nameKo: "쿠알라룸푸르", country: "말레이시아", currency: "MYR", cashNeedLevel: "medium", krwAccepted: null,
    tips: [
      "쇼핑몰·체인점은 카드 가능, 호커·야시장은 현금",
      "국내 MYR 환전은 스프레드 7.4%·우대 없음 — 현지 환전소가 유리한 경우 많음",
      "부킷빈탕·KLCC 쇼핑몰 내 환전소 환율 비교 용이",
    ] },
  { id: "kotakinabalu", nameKo: "코타키나발루", country: "말레이시아", currency: "MYR", cashNeedLevel: "medium", krwAccepted: null,
    tips: [
      "리조트·몰은 카드 가능, 수상마을·야시장·투어 팁은 현금",
      "국내 MYR 환전은 스프레드 7.4%·우대 없음 — 현지 환전소 또는 100% 우대 카드가 유리",
      "시내 위스마 메르데카 쇼핑몰 내 환전소가 유명",
    ] },
  { id: "singapore", nameKo: "싱가포르", country: "싱가포르", currency: "SGD", cashNeedLevel: "low", krwAccepted: true,
    tips: [
      "카드·모바일 결제 중심 — 호커센터용 소액 현금만 준비",
      "환전소 간 환율 차이가 있으니 비교 후 이용",
      "원화(DCC) 결제 제안은 거절하고 SGD 결제 선택",
    ],
    knownBooths: [{ name: "Mustafa Foreign Exchange", area: "리틀인디아, Mustafa Centre" }] },

  // ---- 미주/유럽 ----
  { id: "guam", nameKo: "괌", country: "미국(괌)", currency: "USD", cashNeedLevel: "low", krwAccepted: null,
    tips: [
      "카드 중심 — 팁·소액용 현금 $1·$5 소액권 준비",
      "USD는 국내 90% 우대 환전이 유리 — 현지 환전소가 사실상 없음",
      "레스토랑 팁 15~20% 관행 — 현금 팁용 잔돈 유용",
    ] },
  { id: "honolulu", nameKo: "호놀룰루(하와이)", country: "미국", currency: "USD", cashNeedLevel: "low", krwAccepted: null,
    tips: [
      "카드 중심 — 팁·주차·푸드트럭용 소액권 준비",
      "USD는 국내 90% 우대 환전이 유리 — 현지 환전은 환율 나쁨",
      "레스토랑 팁 18~22% 관행",
    ] },
  { id: "paris", nameKo: "파리", country: "프랑스", currency: "EUR", cashNeedLevel: "low", krwAccepted: false,
    tips: [
      "대부분 카드 결제 — 비상용 소액 유로만 준비",
      "EUR는 국내 80% 우대 환전이 유리 — 시내 환전소는 원화 취급 제한적·수수료 높음",
      "원화(DCC) 결제 제안은 거절하고 유로 결제 선택, 소매치기 주의로 현금 분산 보관",
    ],
    knownBooths: [{ name: "Comptoir de Change Opéra", area: "오페라역 인근, 9 rue Scribe" }] },
];

export const cityById = (id: string) => CITIES.find((c) => c.id === id);
