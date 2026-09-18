export type HoldingCurrency = "KRW" | "USD" | "EUR";
export type FxCurrency = "USD" | "EUR";

// Keep what the user typed. Parsing never rewrites the input or its caret.
export function parsePositiveDecimal(raw: string): number | null {
  const text = raw.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(text)) return null;
  const value = Number(text.replaceAll(",", ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export interface RatePairValue {
  pair: string;
  direction: 0 | 1;
  raw: string;
}

export function emptyRate(from: string, to: string): RatePairValue {
  return { pair: `${from}/${to}`, direction: 0, raw: "" };
}

export function normalizedRate(value: RatePairValue): number | null {
  const parsed = parsePositiveDecimal(value.raw);
  if (parsed === null) return null;
  const rate = value.direction === 0 ? 1 / parsed : parsed;
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export interface InputState {
  holding: HoldingCurrency;
  amount: string;
  localCode: string;
  cityId: string;
  fxCode: FxCurrency;
  krwRate: RatePairValue;
  fxRate: RatePairValue;
}

export const initialInput: InputState = {
  holding: "KRW", amount: "", localCode: "", cityId: "", fxCode: "USD",
  krwRate: emptyRate("KRW", ""), fxRate: emptyRate("USD", ""),
};

export function effectiveFx(state: Pick<InputState, "holding" | "fxCode" | "localCode">): FxCurrency {
  if (state.holding !== "KRW") return state.holding;
  return state.fxCode === state.localCode
    ? state.fxCode === "USD" ? "EUR" : "USD"
    : state.fxCode;
}

export type InputAction =
  | { type: "holding"; value: HoldingCurrency }
  | { type: "amount"; value: string }
  | { type: "destination"; localCode: string; cityId: string }
  | { type: "fx"; value: FxCurrency }
  | { type: "rate"; field: "krwRate" | "fxRate"; value: RatePairValue };

export function inputReducer(state: InputState, action: InputAction): InputState {
  if (action.type === "amount") return { ...state, amount: action.value };
  if (action.type === "rate") {
    // Ignore an event from an input belonging to a previous currency pair.
    return action.value.pair === state[action.field].pair
      ? { ...state, [action.field]: action.value } : state;
  }
  let next = state;
  if (action.type === "holding") {
    if (action.value === state.holding) return state;
    next = { ...state, holding: action.value, amount: "" };
  } else if (action.type === "destination") {
    next = { ...state, localCode: action.localCode, cityId: action.cityId };
  } else if (action.type === "fx") {
    if (state.holding !== "KRW" || action.value === state.localCode) return state;
    next = { ...state, fxCode: action.value };
  }
  const krw = emptyRate("KRW", next.localCode);
  const fx = emptyRate(effectiveFx(next), next.localCode);
  // Reset synchronously with the selection: no render can reuse an old rate.
  return {
    ...next,
    krwRate: state.krwRate.pair === krw.pair ? state.krwRate : krw,
    fxRate: state.fxRate.pair === fx.pair ? state.fxRate : fx,
  };
}
