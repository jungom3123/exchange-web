// 도시별 환전 팁 DB — 시드 데이터 (deep-research 결과로 30개 도시 확정 예정)

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

export const CITIES: CityTip[] = [
  {
    id: "bangkok", nameKo: "방콕", country: "태국", currency: "THB",
    cashNeedLevel: "high", krwAccepted: true,
    tips: [
      "시장·노점·툭툭은 현금 필수 — 대형몰·호텔은 카드 가능",
      "공항에서는 시내 이동 비용만 환전하고 시내 환전소에서 비교",
      "KRW 현찰 직접 환전 가능 (SuperRich 등 주요 환전소 환율표에 KRW 표시)",
      "깨끗한 5만원권일수록 우대 — 구권·훼손권은 거절될 수 있음",
      "해외카드 ATM 출금 시 회당 220밧 수수료 — 100% 우대 카드여도 소액 인출은 불리",
      "카드 결제 시 원화(DCC) 결제 제안은 거절하고 밧 결제 선택",
    ],
    knownBooths: [
      { name: "SuperRich 1965 (Orange) 본점", area: "랏차담리 로드, 빅C 인근" },
      { name: "Vasu Exchange", area: "수쿰빗, 아속·나나 인근" },
    ],
  },
  {
    id: "chiang-mai", nameKo: "치앙마이", country: "태국", currency: "THB",
    cashNeedLevel: "high", krwAccepted: true,
    tips: [
      "시장·노점·송태우는 현금 필수",
      "KRW 직접 환전 가능한 환전소 다수 — USD 이중 환전이 불필요한 경우 많음",
      "해외카드 ATM 출금 시 회당 220밧 수수료 발생",
      "카드 결제 시 원화(DCC) 결제 제안은 거절하고 밧 결제 선택",
    ],
    knownBooths: [
      { name: "S.K. Money Exchange", area: "나이트 바자·핑강 인근" },
      { name: "Super Rich Chiang Mai", area: "로이끄로 로드" },
    ],
  },
  {
    id: "danang", nameKo: "다낭", country: "베트남", currency: "VND",
    cashNeedLevel: "high", krwAccepted: true,
    tips: [
      "현금 비중 높음 — 소액 VND 필수, 큰 금액은 카드 병행",
      "국내에서 VND 환전은 우대율이 낮아 불리한 경우 많음 — USD 이중 환전 또는 현지 KRW 환전과 비교 필수",
      "금은방 환전 시 KRW 취급 여부·당일 환율을 현장에서 재확인",
      "환전 시 영수증을 받아두면 문제 발생 시 대응 가능",
      "권종이 비슷하게 생겨 헷갈림 — 수령 후 그 자리에서 세어보기",
    ],
  },
  {
    id: "hochiminh", nameKo: "호찌민", country: "베트남", currency: "VND",
    cashNeedLevel: "high", krwAccepted: true,
    tips: [
      "소액 구매는 현금이 일반적 — 소액 VND 준비",
      "벤탄시장 인근 금은방 환전이 유명하나 허가·KRW 취급은 현장 확인",
      "달러 고액권($100)이 소액권보다 환율 우대되는 경우 많음",
      "환전 시 영수증 수령 권장",
    ],
    knownBooths: [
      { name: "Hà Tâm Jewelry", area: "벤탄시장 인근, 1군" },
    ],
  },
  {
    id: "tokyo", nameKo: "도쿄", country: "일본", currency: "JPY",
    cashNeedLevel: "medium", krwAccepted: true,
    tips: [
      "카드·IC카드(스이카) 보급이 높지만 소규모 식당·신사 등은 현금",
      "JPY는 국내 80% 우대 환전이 유리한 경우가 많음 — 현지 환전과 비교",
      "세븐뱅크·우체국 ATM에서 해외카드 출금 가능 (카드사 수수료 확인)",
      "원화(DCC) 결제 제안은 거절하고 엔화 결제 선택",
    ],
    knownBooths: [
      { name: "Ninja Money Exchange (InterBank)", area: "신주쿠 니시구치역 D3 출구 앞" },
    ],
  },
  {
    id: "osaka", nameKo: "오사카", country: "일본", currency: "JPY",
    cashNeedLevel: "medium", krwAccepted: true,
    tips: [
      "카드 보급 확대 중이나 소규모 상점·시장은 현금 필요",
      "JPY는 국내 80% 우대 환전이 유리한 경우가 많음",
      "세븐일레븐 ATM 해외카드 출금 가능",
    ],
  },
  {
    id: "taipei", nameKo: "타이베이", country: "대만", currency: "TWD",
    cashNeedLevel: "medium", krwAccepted: null,
    tips: [
      "야시장·소규모 상점은 현금 필수 — 이지카드 충전도 현금",
      "TWD는 국내 은행 취급이 제한적 — 현지 공항 은행 환전 또는 100% 우대 카드가 일반적",
      "공항 은행(대만은행 등) 환전 시 여권 필요, 소액 수수료 부과",
    ],
    knownBooths: [
      { name: "Bank of Taiwan 공항 환전소", area: "타오위안 공항 T1/T2 입국장" },
    ],
  },
  {
    id: "singapore", nameKo: "싱가포르", country: "싱가포르", currency: "SGD",
    cashNeedLevel: "low", krwAccepted: true,
    tips: [
      "카드·모바일 결제 중심 — 호커센터용 소액 현금만 준비",
      "환전소 간 환율 차이가 있으니 비교 후 이용",
      "원화(DCC) 결제 제안은 거절하고 SGD 결제 선택",
    ],
    knownBooths: [
      { name: "Mustafa Foreign Exchange", area: "리틀인디아, Mustafa Centre" },
    ],
  },
  {
    id: "hongkong", nameKo: "홍콩", country: "홍콩", currency: "HKD",
    cashNeedLevel: "medium", krwAccepted: true,
    tips: [
      "카드·옥토퍼스 중심, 소액 현금 병행",
      "시내 환전소는 QTS(홍콩관광청 인증) 매장 위주로 이용",
      "원화(DCC) 결제 제안은 거절하고 HKD 결제 선택",
    ],
    knownBooths: [
      { name: "Sheng En Foreign Exchange", area: "침사추이 스타하우스" },
    ],
  },
  {
    id: "bali", nameKo: "발리", country: "인도네시아", currency: "IDR",
    cashNeedLevel: "high", krwAccepted: null,
    tips: [
      "환전 사기가 잦은 지역 — 비정상적으로 높은 환율 광고는 피하기",
      "Bank Indonesia 허가 표지(PVA Berizin)·CCTV 있는 공식 환전소 이용",
      "현금 수령 후 그 자리에서 직접 세어보기 (직원 손 거치지 않고)",
      "달러 고액권($100, 신권)이 우대되는 경향",
    ],
    knownBooths: [
      { name: "BMC Money Changer", area: "우붓·쿠타·스미냑 등 지점" },
      { name: "Central Kuta Money Exchange", area: "쿠타 권역" },
    ],
  },
];

export const cityById = (id: string) => CITIES.find((c) => c.id === id);
