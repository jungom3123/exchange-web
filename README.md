# 환전 어디서? — 여행 환전 비교 계산기

국내 은행(하나은행) 환전 · 현지 환전소(원화/보유 외화) · 이중 환전 중 어디가 이득인지
실시간 환율로 비교하는 한국어 웹사이트. 기획은 [PRD.md](PRD.md) 참고.

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

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
| `components/FloatingInfo.tsx` | 플로팅 환율 정보 박스 (3개월 그래프 등) |

## 계산 공식

- 하나은행 현찰 살 때 = `매매기준율 × (1 + 스프레드율 × (1 − 우대율))`
- 현금 환전 우대율: USD 90% / JPY·EUR 80% / HKD·SGD·AUD·CAD·NZD·CNY·THB·GBP·CHF 30%
- 카드/ATM(현금 아닌 모든 경우): 전 통화 100% 우대 = 매매기준율 (벤치마크로 표시)
- 보유 외화(경로 ③)의 원화 가치는 현재 매매기준율 기준 기회비용으로 환산
