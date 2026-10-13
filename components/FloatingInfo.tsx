"use client";
import { useEffect, useId, useState } from "react";
import { currencyByCode, formatRate } from "@/lib/config";
import { cashSellRate, cashBuyRate } from "@/lib/calc";
import InfoTooltip from "./InfoTooltip";
import Icon from "./Icon";

// 결과 아래의 환율 정보. 기존 3개월 그래프와 접기/펼치기를 유지한다.
export default function FloatingInfo({
  baseCode, // 기준 화폐 (KRW/USD/EUR)
  localCode,
  midKrwLocal, // KRW per 1 local
  midKrwBase, // KRW per 1 base (KRW면 1)
}: {
  baseCode: string;
  localCode: string;
  midKrwLocal: number | null;
  midKrwBase: number | null;
}) {
  const contentId = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(window.innerWidth >= 1024);
  }, []);
  const [series, setSeries] = useState<{ date: string; v: number }[] | null>(null);
  const [chartError, setChartError] = useState(false);

  const local = currencyByCode(localCode);
  const base = baseCode === "KRW" ? null : currencyByCode(baseCode);
  const chartSupported =
    baseCode !== localCode && (baseCode === "KRW" || base?.frankfurter) && local?.frankfurter;

  useEffect(() => {
    setSeries(null);
    setChartError(false);
    if (!chartSupported || !local) return;
    const controller = new AbortController();
    const start = new Date(Date.now() - 92 * 86400000).toISOString().slice(0, 10);
    // frankfurter: base=현지화폐 → 1 현지화폐당 기준화폐 (KRW/THB 형태)
    fetch(
      `https://api.frankfurter.dev/v1/${start}..?base=${localCode}&symbols=${baseCode}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((d: { rates: Record<string, Record<string, number>> }) => {
        if (controller.signal.aborted) return;
        const pts = Object.entries(d.rates)
          .map(([date, rr]) => ({ date, v: rr[baseCode] }))
          .filter((p) => p.v > 0)
          .sort((a, b) => a.date.localeCompare(b.date));
        setSeries(pts.length ? pts : null);
        if (!pts.length) setChartError(true);
      })
      .catch(() => { if (!controller.signal.aborted) setChartError(true); });
    return () => controller.abort();
  }, [localCode, baseCode, chartSupported, local]);

  if (!local || !midKrwLocal) return null;

  // 기준화폐 표시 환율: 1 local = ? base
  const midBaseLocal = midKrwBase ? midKrwLocal / midKrwBase : null;

  const high = series ? Math.max(...series.map((p) => p.v)) : null;
  const low = series ? Math.min(...series.map((p) => p.v)) : null;
  const prev = series && series.length >= 2 ? series[series.length - 2].v : null;
  const last = series?.length ? series[series.length - 1].v : null;
  const change = prev && last ? ((last - prev) / prev) * 100 : null;

  const spread = local.spreadPct;

  return (
    <div className="rate-info">
      <div className="rate-info-shell">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          className="rate-info-toggle"
        >
          <span className="rate-info-label"><Icon name="chart" />
            {baseCode}/{localCode} 환율 정보
          </span>
          <Icon name="chevron" className={open ? "chevron-open" : ""} />
        </button>
        {open && (
          <div id={contentId} className="rate-info-content space-y-3">
            <div className="rate-info-row">
              <span className="muted">기준 환율<InfoTooltip label="매매기준율 설명">은행이 외화를 사고팔 때 기준으로 삼는 환율이에요. 현찰 환전 수수료를 더하기 전의 값이에요.</InfoTooltip></span>
              <span className="font-mono font-semibold">
                {midBaseLocal ? formatRate(midBaseLocal) : "-"} {baseCode}
                <span className="muted"> / 1 {localCode}</span>
                {change != null && (
                  <span className={`ml-1.5 text-xs ${change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                    전일 대비 {change >= 0 ? "+" : "−"}{Math.abs(change).toFixed(2)}%
                  </span>
                )}
              </span>
            </div>

            {/* 3개월 그래프 */}
            {series && series.length > 1 ? (
              <Chart series={series} />
            ) : (
              <div className="chart-placeholder">
                {baseCode === localCode ? "같은 통화는 환율이 1이에요." : chartSupported && !chartError ? "그래프를 불러오고 있어요." : chartError ? "그래프를 불러오지 못했어요." : `${localCode}는 그래프를 제공하지 않아요.`}
              </div>
            )}
            {high != null && low != null && (
              <div className="rate-info-row muted">
                <span>3개월 최저 {formatRate(low)}</span>
                <span>최고 {formatRate(high)}</span>
              </div>
            )}

            {/* 하나은행 현찰 환율 (KRW 기준) */}
            {spread != null && (
              <div className="bank-rate-detail space-y-1.5">
                <div className="rate-info-row">
                  <span className="font-medium">하나은행 현찰 (우대 적용)</span>
                  <span>
                    우대 {Math.round(local.discount * 100)}%
                    <InfoTooltip label="환율 우대 설명">은행이 환율에 붙이는 수수료를 얼마나 줄여 주는지 나타내요.</InfoTooltip>
                  </span>
                </div>
                <div className="rate-info-row muted">
                  <span>살 때 {formatRate(cashSellRate(midKrwLocal, spread, local.discount))}원</span>
                  <span>팔 때 {formatRate(cashBuyRate(midKrwLocal, spread, local.discount))}원</span>
                </div>
                <p className="help-text">1 {localCode} 기준<InfoTooltip label="스프레드 설명">기준 환율과 은행에서 현찰을 사고파는 환율의 차이예요.</InfoTooltip></p>
              </div>
            )}
            {spread == null && (
              <p className="help-text">이 통화는 국내 은행에서 현찰로 바꿀 수 없어요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chart({ series }: { series: { date: string; v: number }[] }) {
  const W = 268, H = 72, P = 4;
  const vs = series.map((p) => p.v);
  const min = Math.min(...vs), max = Math.max(...vs);
  const span = max - min || 1;
  const pts = series
    .map((p, idx) => {
      const x = P + (idx / (series.length - 1)) * (W - 2 * P);
      const y = H - P - ((p.v - min) / span) * (H - 2 * P);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = vs[vs.length - 1] >= vs[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="최근 3개월 환율 추이" className="rate-chart">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#ef4444" : "#3b82f6"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
