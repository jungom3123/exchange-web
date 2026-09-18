"use client";

import { useId } from "react";
import { formatRate } from "@/lib/config";
import { looksFlipped } from "@/lib/calc";
import { normalizedRate, parsePositiveDecimal, type RatePairValue } from "@/lib/input";
import InfoTooltip from "./InfoTooltip";

// A/B means "1 B = ? A". The parent owns both the displayed and calculated value.
export default function RatePairInput({ from, to, mid, loading, value, onChange }: {
  from: string; to: string; mid: number | null; loading: boolean;
  value: RatePairValue; onChange: (value: RatePairValue) => void;
}) {
  const id = useId();
  const parsed = parsePositiveDecimal(value.raw);
  const valid = normalizedRate(value) !== null;
  const invalid = value.raw !== "" && !valid;
  const expected = mid ? (value.direction === 0 ? mid : 1 / mid) : null;
  const flipped = valid && parsed !== null && expected !== null && looksFlipped(parsed, expected);
  const mirror = valid && parsed !== null ? formatRate(1 / parsed) : "";

  return <div className="rate-pair">
    <div className="rate-fields">
      {([0, 1] as const).map((direction) => {
        const label = direction === 0 ? `${from}/${to}` : `${to}/${from}`;
        const relation = direction === 0 ? `1 ${to} = ? ${from}` : `1 ${from} = ? ${to}`;
        return <div className="rate-field" key={direction}>
          <label htmlFor={`${id}-${direction}`} className="field-label rate-label">{label}</label>
          <span id={`${id}-unit-${direction}`} className="rate-unit">{relation}</span>
          <input id={`${id}-${direction}`} type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
            value={direction === value.direction ? value.raw : mirror}
            aria-invalid={invalid && direction === value.direction}
            aria-describedby={`${id}-unit-${direction} ${id}-hint${invalid ? ` ${id}-error` : ""}${flipped ? ` ${id}-warning` : ""}`}
            placeholder={mid ? `예시 ${formatRate(direction === 0 ? mid : 1 / mid)}` : loading ? "환율을 불러오고 있어요." : "환율 입력"}
            onChange={(event) => onChange({ ...value, direction, raw: event.target.value })}
            className="text-input rate-input" />
        </div>;
      })}
    </div>
    <p id={`${id}-hint`} className="help-text">환전소와 같은 표기의 칸에 숫자를 입력하세요.
      <InfoTooltip label="반대편 환율 자동 표시 설명">한쪽 칸에 입력하면, 같은 환율을 반대 방향으로 계산해 다른 칸에 표시해요.</InfoTooltip>
    </p>
    {invalid && <p id={`${id}-error`} className="error-text">0보다 큰 환율을 입력해 주세요. 소수점은 한 번만 사용할 수 있어요.</p>}
    {flipped && <div id={`${id}-warning`} className="rate-warning">
      <p>환율 방향을 확인해 주세요. 반대로 입력했을 수 있어요.</p>
      <button type="button" className="secondary-button" onClick={() => onChange({
        ...value, direction: value.direction === 0 ? 1 : 0,
      })}>반대 방향으로 바꾸기</button>
    </div>}
  </div>;
}
