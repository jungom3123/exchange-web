import { type RefObject } from "react";
import { rankRoutes, type RouteResult } from "@/lib/calc";
import { formatAmount } from "@/lib/config";
import InfoTooltip from "./InfoTooltip";

const STATUS_TEXT: Record<RouteResult["status"], string> = {
  ready: "", "missing-rate": "환율을 입력하면 비교할 수 있어요.",
  "missing-reference": "계산에 필요한 기준 환율을 확인할 수 없어요.",
  unavailable: "이 통화는 국내 은행에서 현찰로 바꿀 수 없어요.",
  "invalid-amount": "계산할 수 있는 금액을 입력해 주세요.",
};

export default function ComparisonResults({ results, localCode, fxCode, midLocal, holding, amount, pending, headingRef }: {
  results: RouteResult[]; localCode: string; fxCode: string; midLocal: number | null;
  holding: string; amount: number | null; pending: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const ranked = rankRoutes(results);
  const sameCurrency = holding === localCode;
  const fxName = fxCode === "USD" ? "달러" : "유로";
  const titles = {
    bank: "출국 전에 하나은행에서 바꾸기",
    localKrw: "여행지에서 원화로 바꾸기",
    heldFx: `이미 가진 ${fxName}로 바꾸기`,
    double: `${fxName}로 바꾼 뒤 한 번 더 환전하기`,
    card: "카드·ATM 참고 금액",
  };
  const message = ranked.count === 0 ? pending
    : ranked.count === 1 ? "현재 1개 방법만 계산할 수 있어요."
      : `입력한 조건으로 현금 환전 ${ranked.count}개 방법을 비교했어요.`;
  const cashLabel = sameCurrency ? "원화 출발 환전 방법" : "현금 환전 방법";
  return <section className="results-panel" aria-labelledby="results-title">
    <div className="section-heading">
      <p className="eyebrow">비교 결과</p>
      <h2 id="results-title" ref={headingRef} tabIndex={-1}>환전 방법별 예상 수령액{localCode && <span className="heading-currency">{localCode}</span>}</h2>
    </div>
    {sameCurrency && amount !== null && <article className="reference-card" aria-label="환전 없이 사용">
      <h3>환전 없이 사용</h3>
      <p className="receipt">{formatAmount(amount, localCode)} <span className="receipt-currency">{localCode}</span></p>
      <p className="help-text">이미 여행지에서 쓸 돈을 가지고 있어요. 아래는 같은 원화 가치로 새로 환전할 때의 비교예요.</p>
    </article>}
    {holding !== "KRW" && localCode && <p className="comparison-condition">같은 원화 가치의 금액으로 비교합니다.
      <InfoTooltip label="보유 외화 비교 설명">이미 가진 달러·유로는 현재 기준 환율로 원화 가치를 계산해 비교해요. 예전에 산 가격으로 계산한 수익이나 손실은 아니에요.</InfoTooltip>
    </p>}
    <div className="comparison-status" role="status" aria-live="polite" aria-atomic="true">
      <p>{message}</p>
      <p className="help-text">현재 계산 가능한 {cashLabel}: {ranked.count}개</p>
    </div>
    {ranked.count >= 1 && <p className="scope-note">{sameCurrency ? "원화로 시작하는 방법끼리 비교해요. " : ""}입력한 환율과 이용 가능한 방법만 비교해요.</p>}
    <div className="result-list">
      {ranked.main.map((route) => {
        const difference = route.local !== null && ranked.best !== null ? ranked.best - route.local : null;
        const percent = difference !== null && ranked.best ? difference / ranked.best * 100 : null;
        const won = difference !== null && midLocal !== null ? difference * midLocal : null;
        const joint = route.rank !== null && ranked.main.filter((r) => r.rank === route.rank).length > 1;
        return <article key={route.key} data-route={route.key} className={`result-card${route.isBest ? " result-best" : ""}${route.local === null ? " result-pending" : ""}`} aria-label={titles[route.key]}>
          <div className="result-method">
            {route.rank !== null && <span className="rank-badge">{joint ? "공동 " : ""}{route.rank}위</span>}
            <h3>{titles[route.key]}{route.key === "double" && <InfoTooltip label="이중 환전 설명">한국에서 원화를 달러·유로로 바꾼 다음, 여행지에서 쓸 돈으로 한 번 더 바꾸는 방법이에요.</InfoTooltip>}</h3>
          </div>
          {route.local !== null ? <>
            <p className="receipt">{formatAmount(route.local, localCode)} <span className="receipt-currency">{localCode}</span></p>
            {route.isBest && <p className="recommendation">✓ 입력한 조건에서 가장 많이 받아요.</p>}
            {ranked.count >= 2 && percent !== null && percent > 0 && <div className="result-difference">
              <p>최대 수령액보다 {percent < 0.01 ? "0.01% 미만" : `${percent.toFixed(2)}%`} 적음</p>
              {won !== null && <p className="help-text">약 {formatAmount(won, "KRW")}원 차이
                <InfoTooltip label="원화 환산 차액 설명">가장 큰 수령액과의 차이를 현재 기준 환율로 원화로 환산한 근사값이에요. 실제 원화 환전 금액은 달라질 수 있어요.</InfoTooltip>
              </p>}
            </div>}
          </> : <p className="help-text pending-reason">{STATUS_TEXT[route.status]}</p>}
        </article>;
      })}
    </div>
    {ranked.card?.local !== null && ranked.card?.local !== undefined && <article className="reference-card card-reference" aria-label="카드·ATM 참고 금액">
      <h3>카드·ATM 참고 금액 <InfoTooltip label="카드·ATM 참고 금액 설명">입력 금액의 원화 가치를 기준 환율로 나눈 참고값이에요. 환율 우대 100%를 가정하며 현금 환전 순위에는 포함하지 않아요.</InfoTooltip></h3>
      <p className="receipt reference-receipt">{formatAmount(ranked.card.local, localCode)} <span className="receipt-currency">{localCode}</span></p>
      <p className="help-text">수수료를 반영하지 않은 금액이에요.</p>
    </article>}
  </section>;
}
