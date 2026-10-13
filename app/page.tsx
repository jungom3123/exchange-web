"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { CURRENCIES, currencyByCode, formatAmount } from "@/lib/config";
import { compareRoutes, rankRoutes } from "@/lib/calc";
import { effectiveFx, initialInput, inputReducer, normalizedRate, parsePositiveDecimal } from "@/lib/input";
import { CASH_LEVEL_LABEL, cityById } from "@/data/cities";
import RatePairInput from "@/components/RatePairInput";
import FloatingInfo from "@/components/FloatingInfo";
import InfoTooltip from "@/components/InfoTooltip";
import DestinationPicker from "@/components/DestinationPicker";
import ComparisonResults from "@/components/ComparisonResults";
import Icon from "@/components/Icon";
import { ratesResponseSchema, type ExchangeRates } from "@/lib/rates";

const HOLDINGS = [
  { code: "KRW", label: "원화" },
  { code: "USD", label: "이미 가진 달러" },
  { code: "EUR", label: "이미 가진 유로" },
] as const;

export default function Home() {
  const [state, dispatch] = useReducer(inputReducer, initialInput);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [rateDate, setRateDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [rateError, setRateError] = useState(false);
  const [dark, setDark] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const currencySelect = useRef<HTMLSelectElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/rates", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("rates unavailable");

        return response.json();
      })
      .then((payload) => {
        const data = ratesResponseSchema.parse(payload);
        setRates(data.rates);
        setRateDate(data.date);
      })
      .catch(() => { if (!controller.signal.aborted) setRateError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, []);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);

    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* Theme still works. */ }

    setDark(next);
  };

  const mid = (code: string): number | null => code === "KRW" ? 1 : rates?.[code]?.mid ?? null;

  const city = cityById(state.cityId);
  const local = currencyByCode(state.localCode);
  const fxCode = effectiveFx(state);
  const fx = currencyByCode(fxCode)!;
  const midBase = mid(state.holding);
  const midLocal = mid(state.localCode);
  const midFx = mid(fxCode);
  const amount = parsePositiveDecimal(state.amount);
  const budgetKrw = amount !== null && midBase !== null ? amount * midBase : null;

  const results = local && amount !== null ? compareRoutes({
    budgetKrw, holdingCurrency: state.holding, heldAmount: amount, localCode: state.localCode,
    midLocal, local, midFx, fx, fxCode,
    r2: normalizedRate(state.krwRate), r3: normalizedRate(state.fxRate), r4: normalizedRate(state.fxRate),
  }) : [];

  const readyCount = rankRoutes(results).count;

  const pending = !local ? "여행 도시나 여행지에서 쓸 통화를 선택해 주세요."
    : amount === null ? "환전할 금액을 0보다 큰 숫자로 입력해 주세요."
      : loading ? "환율을 불러오고 있어요. 알고 있는 환전소 환율을 입력할 수 있어요."
        : "아래 방법의 안내를 확인하고, 알고 있는 환율을 입력해 주세요.";

  const amountError = amount === null && (state.amount !== "" || amountTouched);

  const selectCity = (cityId: string) => {
    const selected = cityById(cityId);

    if (selected) dispatch({ type: "destination", cityId, localCode: selected.currency });
  };

  return <main className="app-shell">
    <header className="brand-bar">
      <div className="brand"><Icon name="exchange" /><span>환전 어디서?</span><span className="brand-caption">여행 환전 계산기</span></div>
      <button type="button" className="theme-button" onClick={toggleTheme} aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}>
        <Icon name={dark ? "sun" : "moon"} /><span aria-hidden="true">{dark ? "라이트 모드" : "다크 모드"}</span>
      </button>
    </header>
    <div className="app-header">
      <div>
        <p className="eyebrow">여행 준비, 환전부터 가볍게</p>
        <h1>같은 돈, <span>더 많이 받는 환전.</span></h1>
        <p className="header-description">은행부터 현지 환전소까지, 받을 금액으로 비교하세요.</p>
      </div>
      <ol className="flow-overview" aria-label="환전 비교 순서">
        <li><span>01</span> 조건 선택</li><li><span>02</span> 환율 입력</li><li><span>03</span> 수령액 비교</li>
      </ol>
    </div>
    <div className="rate-status-bar">
      {loading ? <p role="status">환율을 불러오고 있어요.</p>
        : rateError ? <p className="error-text" role="status">환율을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>
          : <p>환율 기준일: {rateDate || "확인할 수 없음"}</p>}
      <span className="source-info">환율 출처 <InfoTooltip label="환율 출처와 계산 기준 설명">한국수출입은행·Frankfurter·Open ER API의 기준 환율을 사용해요. 은행 환전에는 하나은행의 설정된 우대율을 적용해요. 실제 환율은 지점과 시점에 따라 달라질 수 있어요.</InfoTooltip></span>
    </div>

    <div className="comparison-layout">
      <div className="input-panel">
        <div className="panel-heading"><span className="step-number">01</span><h2>내 환전 조건</h2></div>
        <fieldset className="input-section">
          <legend className="section-title">어떤 돈을 환전하나요?</legend>
          <div className="holding-options">
            {HOLDINGS.map((item) => <label className="currency-option" key={item.code}>
              <input type="radio" name="holding" value={item.code} checked={state.holding === item.code}
                onChange={() => { dispatch({ type: "holding", value: item.code }); setAmountTouched(false); }} />
              <span><strong>{item.label}</strong><small>{item.code}</small></span>
            </label>)}
          </div>
        </fieldset>

        <section className="input-section" aria-labelledby="destination-title">
          <h2 id="destination-title" className="section-title">어디로 여행하나요?</h2>
          <DestinationPicker cityId={state.cityId} onSelect={selectCity} onDirect={() => {
            dispatch({ type: "destination", cityId: "", localCode: state.localCode });
            currencySelect.current?.focus();
          }} />
          <label htmlFor="local-currency" className="field-label">여행지에서 쓸 돈</label>
          <select id="local-currency" ref={currencySelect} className="text-input" value={state.localCode}
            onChange={(event) => dispatch({ type: "destination", localCode: event.target.value,
              cityId: city?.currency === event.target.value ? state.cityId : "" })}>
            <option value="">통화를 선택해 주세요</option>
            {CURRENCIES.map((item) => <option key={item.code} value={item.code}>{item.nameKo} ({item.code})</option>)}
          </select>
          {local && <p className="destination-confirmation"><Icon name="check" />{city ? `${city.nameKo}에서 쓸 돈` : "여행지에서 쓸 돈"}: {local.nameKo}({local.code})</p>}
        </section>

        <section className="input-section" aria-labelledby="amount-title">
          <h2 id="amount-title" className="section-title"><label htmlFor="amount">얼마를 환전하나요? <span className="unit-label">({state.holding})</span></label></h2>
          <div className="amount-field">
            <input id="amount" type="text" inputMode="decimal" autoComplete="off" className="text-input amount-input"
              placeholder={state.holding === "KRW" ? "예시 1,000,000" : "예시 100.50"}
              aria-invalid={amountError} aria-describedby={amountError ? "amount-error" : undefined}
              value={state.amount} onChange={(event) => dispatch({ type: "amount", value: event.target.value })}
              onBlur={() => setAmountTouched(true)} />
            <span aria-hidden="true" className="amount-unit">{state.holding}</span>
          </div>
          {amountError && <p id="amount-error" className="error-text">0보다 큰 금액을 입력해 주세요. 소수점은 한 번만 사용할 수 있어요.</p>}
          {state.holding !== "KRW" && budgetKrw !== null && Number.isFinite(budgetKrw) && <p className="help-text">현재 기준 환율로 약 {formatAmount(budgetKrw, "KRW")}원이에요.</p>}
        </section>

        {local && <section className="input-section rate-section" aria-labelledby="rates-title">
          <div className="panel-heading"><span className="step-number">02</span><h2 id="rates-title">환전소 환율 입력</h2><span className="optional-label">선택</span></div>
          <p className="help-text">알고 있는 환율을 넣으면 바로 비교해요.</p>
          <p className="buying-guide">내가 내는 돈의 <strong>Buying / We Buy</strong> 환율을 확인하세요.
            <InfoTooltip label="Buying과 Selling 설명">달러를 내고 바트를 받는다면 Buying USD를 확인하세요. Selling은 환전소가 그 통화를 파는 환율이에요.</InfoTooltip>
          </p>
          <div className="rate-group">
            <h3>원화 → {local.code}</h3>
            <RatePairInput from="KRW" to={local.code} mid={midLocal} loading={loading} value={state.krwRate}
              onChange={(value) => dispatch({ type: "rate", field: "krwRate", value })} />
          </div>
          {fxCode !== local.code && <div className="rate-group">
            {state.holding === "KRW" ? <fieldset>
              <legend className="field-label">이중환전</legend>
              <div className="fx-options">{(["USD", "EUR"] as const).map((code) => <label className="fx-option" key={code}>
                <input type="radio" name="intermediate" value={code} checked={fxCode === code} disabled={code === local.code}
                  onChange={() => dispatch({ type: "fx", value: code })} /><span>{code}</span>
              </label>)}</div>
            </fieldset> : <p className="help-text">이미 가진 {fxCode === "USD" ? "달러" : "유로"}에 맞춰 {fxCode}로 비교해요.</p>}
            <h3>{fxCode} → {local.code}</h3>
            <RatePairInput from={fxCode} to={local.code} mid={midFx && midLocal ? midLocal / midFx : null}
              loading={loading} value={state.fxRate} onChange={(value) => dispatch({ type: "rate", field: "fxRate", value })} />
          </div>}
        </section>}

        <div className="results-action">
          <button type="button" className="primary-button" disabled={readyCount === 0} onClick={() => {
            resultsHeading.current?.focus({ preventScroll: true });
            resultsHeading.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
          }}>비교 결과 보기 <Icon name="arrow" /></button>
          {readyCount === 0 && <p className="help-text">{pending}</p>}
          {readyCount > 0 && <p className="action-note">입력한 조건으로 자동 계산됩니다.</p>}
        </div>
      </div>

      <div className="results-column">
        <ComparisonResults results={results} localCode={state.localCode} fxCode={fxCode} midLocal={midLocal}
          holding={state.holding} amount={amount} pending={pending} headingRef={resultsHeading} />
        {local && <FloatingInfo baseCode={state.holding} localCode={local.code} midKrwLocal={midLocal} midKrwBase={midBase} />}
      </div>
    </div>

    {city && <section className="travel-tips" aria-labelledby="tips-title">
      <div className="tips-heading"><Icon name="pin" /><h2 id="tips-title">{city.nameKo} 환전 팁</h2><span className="tip-badge">{CASH_LEVEL_LABEL[city.cashNeedLevel].label}</span>
        {city.krwAccepted !== null && <span className="tip-badge">KRW 현찰 환전 {city.krwAccepted ? "일반적" : "제한적"}</span>}</div>
      <ul>{city.tips.map((tip, index) => <li key={index}>{tip}</li>)}</ul>
      {city.knownBooths && <div className="known-booths"><h3>알려진 환전소</h3>
        <ul>{city.knownBooths.map((booth) => <li key={booth.name}><strong>{booth.name}</strong> — {booth.area}</li>)}</ul>
        <p className="help-text">KRW 취급 여부와 당일 환율은 방문 전에 확인해 주세요.</p>
      </div>}
    </section>}
    <footer className="app-footer">입력한 조건으로 계산한 예상 금액이에요. 실제 수령액은 환전소와 거래 조건에 따라 달라질 수 있어요.</footer>
  </main>;
}
