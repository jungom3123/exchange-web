"use client";
import { useEffect, useState } from "react";
import { currencyByCode, formatRate } from "@/lib/config";
import { cashSellRate, cashBuyRate } from "@/lib/calc";

// 플로팅 정보 박스: 3개월 그래프(frankfurter) + 고시환율 요약. 접기/펼치기.
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
  const [open, setOpen] = useState(true);
  const [series, setSeries] = useState<{ date: string; v: number }[] | null>(null);
  const [chartError, setChartError] = useState(false);

  const local = currencyByCode(localCode);
  const base = baseCode === "KRW" ? null : currencyByCode(baseCode);
  const chartSupported =
    (baseCode === "KRW" || base?.frankfurter) && local?.frankfurter;

  useEffect(() => {
    setSeries(null);
    setChartError(false);
    if (!chartSupported || !local) return;
    const start = new Date(Date.now() - 92 * 86400000).toISOString().slice(0, 10);
    // frankfurter: base=현지화폐 → 1 현지화폐당 기준화폐 (KRW/THB 형태)
    fetch(
      `https://api.frankfurter.dev/v1/${start}..?base=${localCode}&symbols=${baseCode}`
    )
      .then((r) => r.json())
      .then((d: { rates: Record<string, Record<string, number>> }) => {
        const pts = Object.entries(d.rates)
          .map(([date, rr]) => ({ date, v: rr[baseCode] }))
          .filter((p) => p.v > 0)
          .sort((a, b) => a.date.localeCompare(b.date));
        setSeries(pts.length ? pts : null);
        if (!pts.length) setChartError(true);
      })
      .catch(() => setChartError(true));
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
    <div className="fixed bottom-4 right-4 z-50 w-[300px] max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-xl overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        >
          <span>
            {local.flag} {baseCode}/{localCode} 환율 정보
          </span>
          <span className="text-gray-400">{open ? "▾" : "▸"}</span>
        </button>
        {open && (
          <div className="px-4 pb-4 space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-xs">매매기준율</span>
              <span className="font-mono font-semibold">
                {midBaseLocal ? formatRate(midBaseLocal) : "-"} {baseCode}
                <span className="text-xs text-gray-400"> /1{localCode}</span>
                {change != null && (
                  <span className={`ml-1.5 text-xs ${change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                    {change >= 0 ? "▲" : "▼"}{Math.abs(change).toFixed(2)}%
                  </span>
                )}
              </span>
            </div>

            {/* 3개월 그래프 */}
            {series && series.length > 1 ? (
              <Chart series={series} />
            ) : (
              <div className="h-[72px] flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-400">
                {chartSupported && !chartError ? "그래프 로딩 중…" : `${localCode} 시계열 미지원 통화`}
              </div>
            )}
            {high != null && low != null && (
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>3개월 최저 {formatRate(low)}</span>
                <span>최고 {formatRate(high)}</span>
              </div>
            )}

            {/* 하나은행 현찰 환율 (KRW 기준) */}
            {spread != null && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">하나은행 현찰 (우대 적용)</span>
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 font-semibold">
                    우대 {Math.round(local.discount * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 font-mono">
                  <span>살 때 {formatRate(cashSellRate(midKrwLocal, spread, local.discount))}원</span>
                  <span>팔 때 {formatRate(cashBuyRate(midKrwLocal, spread, local.discount))}원</span>
                </div>
              </div>
            )}
            {spread == null && (
              <p className="text-xs text-gray-400">국내 은행 현찰 미취급 통화입니다.</p>
            )}
            <p className="text-[10px] text-gray-400">
              카드/ATM(현금 아닌 모든 경우)은 전 통화 100% 우대 = 매매기준율
            </p>
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
    <svg width={W} height={H} className="w-full rounded-lg bg-gray-50 dark:bg-gray-800">
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
