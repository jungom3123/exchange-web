import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/config";

// 매매기준율(KRW per 1단위) 취합: 수출입은행(1순위) > frankfurter(2순위) > open.er-api(3순위)
// 고시환율은 분 단위로 변하지 않으므로 30분 메모리 캐시

export interface RatesResponse {
  date: string; // 데이터 기준일
  fetchedAt: string;
  rates: Record<string, { mid: number; source: string }>;
}

let cache: { at: number; data: RatesResponse } | null = null;
const TTL = 30 * 60 * 1000;

const fmtDate = (d: Date) =>
  d.toISOString().slice(0, 10).replace(/-/g, "");

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json(cache.data);

  const rates: RatesResponse["rates"] = {};
  let date = new Date().toISOString().slice(0, 10);

  // 3순위: open.er-api.com — VND/TWD 포함 광범위 커버리지
  try {
    const er = (await fetchJson("https://open.er-api.com/v6/latest/KRW")) as {
      rates: Record<string, number>;
    };
    for (const c of CURRENCIES) {
      const v = er.rates[c.code];
      if (v) rates[c.code] = { mid: 1 / v, source: "er-api" };
    }
  } catch {}

  // 2순위: frankfurter (ECB)
  try {
    const f = (await fetchJson("https://api.frankfurter.dev/v1/latest?base=KRW")) as {
      date: string;
      rates: Record<string, number>;
    };
    date = f.date;
    for (const c of CURRENCIES) {
      const v = f.rates[c.code];
      if (v) rates[c.code] = { mid: 1 / v, source: "frankfurter" };
    }
  } catch {}

  // 1순위: 한국수출입은행 고시환율 (주말/공휴일은 빈 배열 → 최대 7일 소급)
  const key = process.env.KOREAEXIM_API_KEY;
  if (key) {
    for (let back = 0; back < 7; back++) {
      try {
        const d = new Date(Date.now() - back * 86400000);
        const items = (await fetchJson(
          `https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${key}&searchdate=${fmtDate(d)}&data=AP01`
        )) as { cur_unit: string; deal_bas_r: string; result: number }[];
        if (!Array.isArray(items) || items.length === 0) continue;
        for (const c of CURRENCIES) {
          const item = items.find((it) => it.cur_unit === c.koreaexim);
          if (item?.deal_bas_r) {
            const mid = parseFloat(item.deal_bas_r.replace(/,/g, "")) / c.unit;
            if (mid > 0) rates[c.code] = { mid, source: "koreaexim" };
          }
        }
        date = d.toISOString().slice(0, 10);
        break;
      } catch {
        break; // 네트워크/키 오류면 소급 반복 무의미
      }
    }
  }

  if (Object.keys(rates).length === 0) {
    // 전 소스 실패 — 만료된 캐시라도 반환
    if (cache) return NextResponse.json({ ...cache.data, stale: true });
    return NextResponse.json({ error: "환율 데이터를 가져올 수 없습니다" }, { status: 502 });
  }

  const data: RatesResponse = { date, fetchedAt: new Date().toISOString(), rates };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
