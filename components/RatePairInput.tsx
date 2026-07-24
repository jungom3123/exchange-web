"use client";
import { useState } from "react";
import { formatRate, currencyByCode } from "@/lib/config";
import { looksFlipped } from "@/lib/calc";

// 환전소 환율 입력 — "A/B" 표기는 "1 B = ? A" (예: KRW/THB 39.2 = 1밧에 39.2원)
// from: 내는 화폐, to: 받는 화폐. onChange로 정규화 값(1 from당 받는 to) 전달.
export default function RatePairInput({
  from,
  to,
  mid, // 매매기준율: 1 to = ? from (예: from=KRW, to=THB → 39원)
  onChange,
}: {
  from: string;
  to: string;
  mid: number | null;
  onChange: (toPerFrom: number | null) => void;
}) {
  const [raw, setRaw] = useState("");
  const [active, setActive] = useState<0 | 1>(0); // 0: from/to (1 to = ? from), 1: to/from
  const parsed = parseFloat(raw.replace(/,/g, ""));
  const valid = !isNaN(parsed) && parsed > 0;

  // 정규화: field0 값 v → to per from = 1/v, field1 → v
  const normalized = valid ? (active === 0 ? 1 / parsed : parsed) : null;
  const mirror = valid ? formatRate(1 / parsed) : "";

  const expected = mid ? (active === 0 ? mid : 1 / mid) : null;
  const flipped = valid && expected != null && looksFlipped(parsed, expected);

  const set = (field: 0 | 1, v: string) => {
    setActive(field);
    setRaw(v);
    const p = parseFloat(v.replace(/,/g, ""));
    onChange(!isNaN(p) && p > 0 ? (field === 0 ? 1 / p : p) : null);
  };

  const flip = () => {
    const next = active === 0 ? 1 : 0;
    setActive(next);
    // 값은 그대로 두고 방향만 뒤집음 (사용자가 본 숫자가 반대 방향이었던 것)
    const p = parseFloat(raw.replace(/,/g, ""));
    if (!isNaN(p) && p > 0) onChange(next === 0 ? 1 / p : p);
  };

  const nameOf = (c: string) => currencyByCode(c)?.nameKo ?? c;

  const field = (idx: 0 | 1) => {
    const label = idx === 0 ? `${from}/${to}` : `${to}/${from}`;
    const desc = idx === 0 ? `1 ${to} = ? ${from}` : `1 ${from} = ? ${to}`;
    const ph = mid
      ? `예) ${formatRate(idx === 0 ? mid : 1 / mid)}`
      : "고시환율 로딩 중";
    const isActive = active === idx;
    return (
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-sm font-semibold">{label}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">{desc}</span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={isActive ? raw : mirror}
          placeholder={ph}
          onChange={(e) => set(idx, e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none transition-colors
            ${isActive && valid
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"}
            placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:border-blue-500`}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="flex gap-3 items-end">
        {field(0)}
        <span className="pb-2 text-gray-400 text-sm">=</span>
        {field(1)}
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        환전소 전광판에서 {nameOf(from)}({from})를 내고 {nameOf(to)}({to})를 받는 줄의
        숫자를 <b>둘 중 맞는 방향 칸</b>에 입력하세요. 반대쪽 칸에 역수가 자동 표시됩니다.
      </p>
      {flipped && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <span>⚠️ 고시환율과 크게 달라요 — 방향이 반대로 입력된 것 같습니다.</span>
          <button
            onClick={flip}
            className="shrink-0 rounded-md bg-amber-200 dark:bg-amber-800 px-2 py-1 font-medium hover:bg-amber-300 dark:hover:bg-amber-700"
          >
            방향 뒤집기
          </button>
        </div>
      )}
    </div>
  );
}
