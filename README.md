# 환전 어디서? — 여행 환전 비교 계산기

국내 은행(하나은행) 환전 · 현지 환전소(원화/보유 외화) · 이중 환전 중 어디가 이득인지
실시간 환율로 비교하는 한국어 웹사이트. 기획은 [PRD.md](PRD.md) 참고.

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

## 입력과 비교

- `원화 / 이미 가진 달러 / 이미 가진 유로` 중 하나를 선택하고 그 통화로 금액을 입력합니다. 보유 외화의 비교 경로는 해당 외화를 선택한 경우에만 표시합니다.
- 금액 입력은 소수점과 쉼표를 포함한 원문을 유지합니다. 계산 가능한 현금 환전 방법이 2개 이상일 때만 순위와 추천을 표시합니다.
- 도시·국가 검색, 빠른 선택, 최근 도시 5개 저장, 통화 직접 선택을 지원합니다. 최근 도시는 같은 브라우저에만 저장됩니다.
- 통화쌍을 변경하면 해당 환전소 환율을 지웁니다. 같은 통화를 쓰는 도시로 이동하면 입력을 유지합니다.
- 이미 여행지 통화를 가진 경우에는 ‘환전 없이 사용’ 금액과 같은 원화 가치의 환전 방법을 구분해서 보여줍니다. 카드·ATM 참고 금액은 수수료를 반영하지 않으며 순위에 포함하지 않습니다.

## 검증

Node 24에서 다음 명령으로 실행합니다.

```bash
npm test                  # 기존 계산 공식 + 입력 상태·경로·추천 회귀 검증
npm run typecheck
npm run build
npx playwright install chromium  # 최초 1회
npm run test:e2e           # 프로덕션 빌드로 실행, 포트 3100 사용
```

브라우저 테스트는 고정 환율 응답을 사용합니다. 소수점 순차 입력·실제 붙여넣기·커서 수정, 통화 전환, 검색·최근 도시, API 로딩·실패·일부 누락, 키보드·터치, 툴팁과 360/390/768/1280px 화면을 검증합니다. 캡처는 `test-results/`에 저장합니다.

`.env.local`에 한국수출입은행 API 키를 넣으면 국내 고시환율이 1순위로 적용됩니다
(없어도 Frankfurter/Open ER API 폴백으로 동작):

```
KOREAEXIM_API_KEY=발급받은키
```

키 발급: https://www.koreaexim.go.kr/ir/HPHKIR020M01?apino=2

## 구조

| 경로 | 역할 |
|---|---|
| `lib/config.ts` | 통화 목록, 하나은행 현찰 스프레드율·환율우대율 설정 |
| `lib/calc.ts` | 환전 경로 비교 계산 (순수 함수) — `node lib/calc.test.ts`로 테스트 |
| `app/api/rates/route.ts` | 매매기준율 취합 프록시 (수출입은행 > Frankfurter > Open ER API, 30분 캐시) |
| `data/cities.ts` | 도시별 환전 팁 DB |
| `components/RatePairInput.tsx` | 방향 혼동 방지형 환율 입력 (양방향 표기 + 역수 미러 + 방향 오류 경고) |
| `components/FloatingInfo.tsx` | 결과 아래의 환율 정보 박스 (기존 3개월 그래프 등) |
| `lib/input.ts` | 금액 검증 및 통화쌍별 입력 상태 전환 |
| `components/DestinationPicker.tsx` | 도시·국가 검색, 빠른 선택, 최근 도시 |
| `components/ComparisonResults.tsx` | 비교 상태와 순위, 예상 수령액 및 참고 금액 |
| `components/InfoTooltip.tsx` | 마우스 호버 전용 부가 설명 |

## 계산 공식

- 하나은행 현찰 살 때 = `매매기준율 × (1 + 스프레드율 × (1 − 우대율))`
- 현금 환전 우대율: USD 90% / JPY·EUR 80% / HKD·SGD·AUD·CAD·NZD·CNY·THB·GBP·CHF 30%
- 카드·ATM 참고 금액 = 원화 환산 예산 ÷ 기준 환율 (100% 환율 우대 가정, 수수료 미반영)
- 보유 외화의 원화 가치는 현재 기준 환율로 환산하며, 과거 매입 가격에 따른 수익·손실을 의미하지 않음
