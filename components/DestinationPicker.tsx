"use client";

import { useEffect, useId, useState } from "react";
import { CITIES, cityById } from "@/data/cities";

const RECENT_KEY = "exchange-recent-cities-v1";
const QUICK_IDS = ["tokyo", "osaka", "bangkok", "danang", "taipei", "cebu"];

export default function DestinationPicker({ cityId, onSelect, onDirect }: {
  cityId: string; onSelect: (id: string) => void; onDirect: () => void;
}) {
  const id = useId();
  const city = cityById(cityId);
  const selectedLabel = city ? `${city.nameKo} · ${city.country}` : "";
  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => { setQuery(selectedLabel); }, [selectedLabel]);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) setRecent([...new Set(stored.filter((x): x is string =>
        typeof x === "string" && Boolean(cityById(x))))].slice(0, 5));
    } catch { /* Storage is optional; search works without it. */ }
  }, []);
  const search = (query === selectedLabel ? "" : query).trim().toLocaleLowerCase();
  const matches = CITIES.filter((c) => `${c.nameKo} ${c.country}`.toLocaleLowerCase().includes(search));
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);
  const choose = (value: string) => {
    const next = [value, ...recent.filter((old) => old !== value)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* optional */ }
    onSelect(value);
    setQuery(`${cityById(value)!.nameKo} · ${cityById(value)!.country}`);
    setOpen(false);
    setActive(-1);
  };
  const chips = (ids: string[], label: string) => <div className="destination-shortcuts">
    <p className="small-label">{label}</p>
    <div className="chip-list">{ids.map((value) => {
      const item = cityById(value)!;
      return <button type="button" key={value} className="city-chip" aria-pressed={cityId === value}
        aria-label={`${item.nameKo} · ${item.country}`} onClick={() => choose(value)}>{item.nameKo}</button>;
    })}</div>
  </div>;
  return <div>
    <div className="city-search" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); }
    }}>
      <label htmlFor={id} className="field-label">여행 도시</label>
      <input id={id} className="text-input" role="combobox" type="search" autoComplete="off"
        placeholder="도시명 또는 국가명 검색" value={query} aria-autocomplete="list"
        aria-expanded={open} aria-controls={`${id}-results`}
        aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
        onFocus={() => { setOpen(true); setActive(-1); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setOpen(true);
            setActive((old) => matches.length ? event.key === "ArrowDown"
              ? (old + 1) % matches.length : (old <= 0 ? matches.length - 1 : old - 1) : -1);
          } else if (event.key === "Enter" && open && active >= 0 && matches[active]) {
            event.preventDefault(); choose(matches[active].id);
          } else if (event.key === "Escape") { setOpen(false); setActive(-1); }
        }} />
      {open && <div className="search-popup">
        <ul id={`${id}-results`} role="listbox" aria-label="여행 도시 검색 결과">
          {matches.map((item, index) => <li id={`${id}-option-${index}`} key={item.id} role="option"
            aria-selected={active === index} className={active === index ? "active" : ""}
            onPointerDown={(event) => event.preventDefault()} onClick={() => choose(item.id)}>
            <span>{item.nameKo}</span><span className="muted">{item.country}</span>
          </li>)}
        </ul>
        {matches.length === 0 && <p className="help-text empty-search">찾는 도시가 없나요? 통화를 직접 선택해 주세요.</p>}
      </div>}
    </div>
    <span className="sr-only" role="status">{open ? `검색 결과 ${matches.length}개` : ""}</span>
    {recent.length > 0 && chips(recent, "최근 선택")}
    {chips(QUICK_IDS, "빠른 선택")}
    <button type="button" className="text-button" onClick={() => {
      setOpen(false); setQuery(""); onDirect();
    }}>통화로 직접 선택 <span aria-hidden="true">→</span></button>
  </div>;
}
