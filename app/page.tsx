"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CURRENCIES,
  BASE_CURRENCIES,
  currencyByCode,
  formatAmount,
} from "@/lib/config";
import { compareRoutes, RouteResult } from "@/lib/calc";
import { CITIES, CASH_LEVEL_LABEL, cityById } from "@/data/cities";
import RatePairInput from "@/components/RatePairInput";
import FloatingInfo from "@/components/FloatingInfo";

type Rates = Record<string, { mid: number; source: string }>;

const ROUTE_META: Record<
  string,
  { title: string; desc: (fx: string, local: string) => string }
> = {
  bank: { title: "① 하나은행에서 미리 환전", desc: (_f, l) => `출국 전 국내에서 원화 → ${l} 현찰 환전` },
  localKrw: { title: "② 현지 환전소 (원화)", desc: (_f, l) => `원화 현찰을 들고 가서 현지에서 ${l}로 환전` },
  heldFx: { title: "③ 현지 환전소 (보유 외화)", desc: (f, l) => `이미 갖고 있던 ${f}를 현지에서 ${l}로 환전` },
  double: { title: "④ 이중 환전", desc: (f, l) => `국내에서 원화 → ${f} 환전 후, 현지에서 ${l}로 재환전` },
  card: { title: "💳 100% 우대 카드/ATM (참고)", desc: () => `트래블월렛 등 100% 우대 = 매매기준율 그대로` },
};

export default function Home() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [rateDate, setRateDate] = useState("");
  const [rateError, setRateError] = useState(false);

  const [base, setBase] = useState<string>("KRW");
  const [cityId, setCityId] = useState("");
  const [localCode, setLocalCode] = useState("");
  const [amountStr, setAmountStr] = useState("1,000,000");
  const [fxCode, setFxCode] = useState<"USD" | "EUR">("USD");
  const [r2, setR2] = useState<number | null>(null);
  const [rFx, setRFx] = useState<number | null>(null); // ③④ 공용 (동일 환전소 환율)

  // 현지 화폐가 바뀌면 이전 통화 기준으로 입력한 환전소 환율은 무효
  useEffect(() => {
    setR2(null);
    setRFx(null);
  }, [localCode]);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => {
        if (d.rates) {
          setRates(d.rates);
          setRateDate(d.date);
        } else setRateError(true);
      })
      .catch(() => setRateError(true));
  }, []);

  const city = cityById(cityId);
  const mid = (code: string) => (code === "KRW" ? 1 : rates?.[code]?.mid ?? null);
  // 현지 화폐가 경유 외화와 같으면(괌·하와이 USD 등) 다른 쪽으로 자동 전환
  const effFx: "USD" | "EUR" =
    localCode === fxCode ? (fxCode === "USD" ? "EUR" : "USD") : fxCode;
  const midLocal = localCode ? mid(localCode) : null;
  const midFx = mid(effFx);
  const midBase = mid(base);

  const amount = parseFloat(amountStr.replace(/,/g, "")) || 0;
  const budgetKrw = midBase ? amount * midBase : 0;

  const local = currencyByCode(localCode);
  const fx = currencyByCode(effFx)!;

  const results = useMemo<RouteResult[] | null>(() => {
    if (!local || !midLocal || !midFx || budgetKrw <= 0) return null;
    return compareRoutes({
      budgetKrw,
      midLocal,
      local: { spreadPct: local.spreadPct, discount: local.discount },
      midFx,
      fx: { spreadPct: fx.spreadPct, discount: fx.discount },
      fxCode: effFx,
      r2,
      r3: rFx,
      r4: rFx,
    });
  }, [local, midLocal, midFx, budgetKrw, effFx, fx, r2, rFx]);

  const ranked = useMemo(() => {
    if (!results) return null;
    const main = results.filter((r) => r.key !== "card");
    const card = results.find((r) => r.key === "card")!;
    const valid = main.filter((r) => r.local != null).sort((a, b) => b.local! - a.local!);
    const best = valid[0]?.local ?? null;
    return { main: [...valid, ...main.filter((r) => r.local == null)], card, best };
  }, [results]);

  const selectCity = (id: string) => {
    setCityId(id);
    const c = cityById(id);
    if (c) setLocalCode(c.currency);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-32">
      {/* 헤더 */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold">환전, 어디서 하는 게 이득일까?</h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          국내 은행 환전 · 현지 환전소 · 이중 환전을 실시간 환율로 한 번에 비교합니다.
        </p>
        {rateError && (
          <p className="mt-2 text-xs text-red-500">
            환율 데이터를 불러오지 못했습니다. 잠시 후 새로고침 해주세요.
          </p>
        )}
        {rateDate && (
          <p className="mt-2 text-xs text-gray-400">고시환율 기준일: {rateDate}</p>
        )}
      </header>

      <div className="space-y-6">
        {/* Step 1: 기준 화폐 */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            1. 예산 화폐 (내가 갖고 있는 돈)
          </h2>
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 gap-1">
            {BASE_CURRENCIES.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBase(b);
                  setAmountStr(b === "KRW" ? "1,000,000" : "1,000");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  base === b
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {b === "KRW" ? "🇰🇷 원화" : b === "USD" ? "🇺🇸 달러" : "🇪🇺 유로"}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: 여행지/현지 화폐 */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            2. 여행지 선택
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">도시 (팁 제공)</label>
              <select
                value={cityId}
                onChange={(e) => selectCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="">직접 통화만 선택</option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameKo} ({c.country})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">현지 화폐</label>
              <select
                value={localCode}
                onChange={(e) => {
                  setLocalCode(e.target.value);
                  if (city && city.currency !== e.target.value) setCityId("");
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="">선택하세요</option>
                {CURRENCIES.filter((c) => c.code !== base).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} · {c.nameKo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Step 3: 금액 */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            3. 환전할 금액 ({base})
          </h2>
          <input
            type="text"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => {
              const n = parseFloat(e.target.value.replace(/,/g, ""));
              setAmountStr(isNaN(n) ? "" : n.toLocaleString("ko-KR"));
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-lg font-mono"
          />
          {base !== "KRW" && budgetKrw > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              ≈ {formatAmount(budgetKrw, "KRW")}원 (매매기준율 환산)
            </p>
          )}
        </section>

        {/* Step 4: 현지 환전소 환율 입력 */}
        {local && (
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                4. 현지 환전소 환율 입력{" "}
                <span className="font-normal text-gray-400">(아는 것만 입력해도 비교됩니다)</span>
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                환전소 전광판의 <b>Buying(We Buy)</b>은 환전소가 내 돈을 사는 줄입니다. 내가
                원화·달러를 내는 경우 <b>Buying KRW / Buying {effFx}</b> 줄을 보세요.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                ② 원화 → {localCode} 환전소 환율
              </h3>
              <RatePairInput key={`krw-${localCode}`} from="KRW" to={localCode} mid={midLocal} onChange={setR2} />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  ③④ {effFx} → {localCode} 환전소 환율
                </h3>
                <div className="flex rounded-md border border-gray-200 dark:border-gray-700 p-0.5 gap-0.5">
                  {(["USD", "EUR"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFxCode(f)}
                      disabled={f === localCode}
                      className={`rounded px-2 py-0.5 text-xs disabled:opacity-30 ${
                        effFx === f ? "bg-blue-600 text-white" : "text-gray-500"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <RatePairInput
                key={`${effFx}-${localCode}`}
                from={effFx}
                to={localCode}
                mid={midFx && midLocal ? midLocal / midFx : null}
                onChange={setRFx}
              />
            </div>
          </section>
        )}

        {/* 결과 */}
        {ranked && local && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              비교 결과 — 최종 수령 {localCode} 기준
            </h2>
            <div className="space-y-2.5">
              {ranked.main.map((r, i) => {
                const meta = ROUTE_META[r.key];
                const isBest = r.local != null && r.local === ranked.best;
                const lossPct =
                  r.local != null && ranked.best ? (1 - r.local / ranked.best) * 100 : null;
                const lossKrw = lossPct != null ? (budgetKrw * lossPct) / 100 : null;
                return (
                  <div
                    key={r.key}
                    className={`rounded-xl border p-4 ${
                      isBest
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : r.local == null
                        ? "border-gray-200 dark:border-gray-800 opacity-60"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {r.local != null && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                isBest
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {i + 1}위
                            </span>
                          )}
                          <span className="text-sm font-semibold">{meta.title}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {meta.desc(effFx, localCode)}
                        </p>
                        {r.note && <p className="mt-1 text-xs text-gray-400">{r.note}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {r.local != null ? (
                          <>
                            <div className="font-mono text-lg font-bold">
                              {formatAmount(r.local, localCode)}
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                {localCode}
                              </span>
                            </div>
                            {lossPct != null && lossPct > 0.005 && (
                              <div className="text-xs text-red-500">
                                1위보다 −{lossPct.toFixed(2)}% (≈{formatAmount(lossKrw!, "KRW")}원
                                손해)
                              </div>
                            )}
                            {isBest && (
                              <div className="text-xs font-medium text-blue-600">가장 유리 ✓</div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 카드 벤치마크 */}
              {ranked.card.local != null && (
                <div className="rounded-xl border border-dashed border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-sm font-semibold">{ROUTE_META.card.title}</span>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {ROUTE_META.card.desc(effFx, localCode)} — 단, ATM 출금 수수료·현금 필요
                        여부는 아래 팁 참고
                      </p>
                    </div>
                    <div className="font-mono text-lg font-bold shrink-0">
                      {formatAmount(ranked.card.local, localCode)}
                      <span className="ml-1 text-xs font-normal text-gray-400">{localCode}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 도시 팁 */}
        {city && (
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold">{city.nameKo} 환전 팁</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  city.cashNeedLevel === "high"
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : city.cashNeedLevel === "medium"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {CASH_LEVEL_LABEL[city.cashNeedLevel].label}
              </span>
              {city.krwAccepted != null && (
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                  KRW 현찰 환전 {city.krwAccepted ? "일반적" : "제한적"}
                </span>
              )}
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {city.tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            {city.knownBooths && city.knownBooths.length > 0 && (
              <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                <h3 className="mb-1.5 text-xs font-semibold text-gray-500">알려진 환전소</h3>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {city.knownBooths.map((b, i) => (
                    <li key={i}>
                      <b>{b.name}</b> — {b.area}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-gray-400">
                  유명 환전소가 항상 최고 환율은 아닙니다. KRW 취급 여부·당일 환율은 방문 직전
                  확인하세요.
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="mt-10 border-t border-gray-100 dark:border-gray-800 pt-4 text-[11px] leading-relaxed text-gray-400">
        데이터 출처: 한국수출입은행 · Frankfurter(ECB) · Open ER API. 스프레드·우대율은 하나은행 고시
        기준이며 실제 환율·수수료는 지점과 시점에 따라 다를 수 있습니다. 본 서비스는 투자·금융 조언이
        아닌 참고용 정보입니다.
      </footer>

      {localCode && (
        <FloatingInfo
          baseCode={base}
          localCode={localCode}
          midKrwLocal={midLocal}
          midKrwBase={midBase}
        />
      )}
    </main>
  );
}
