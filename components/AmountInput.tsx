"use client";

import { useRef } from "react";
import { formatAmountEdit } from "@/lib/amount";
import { parsePositiveDecimal, type HoldingCurrency } from "@/lib/input";

export default function AmountInput({ value, currency, invalid, onChange, onBlur }: {
  value: string;
  currency: HoldingCurrency;
  invalid: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const pasted = useRef<string | null>(null);

  const update = (input: HTMLInputElement, inputType: string, data: string | null) => {
    const edit = formatAmountEdit(value, input.value, input.selectionStart ?? input.value.length, inputType, data);

    // Update the native value before React commits the same controlled value,
    // preserving the caret even when formatting restores an unchanged value.
    input.value = edit.value;
    input.setSelectionRange(edit.caret, edit.caret);
    onChange(edit.value);
  };

  return <input id="amount" type="text" inputMode="decimal" autoComplete="off" className="text-input amount-input"
    placeholder={currency === "KRW" ? "예시 1,000,000" : "예시 100.50"}
    aria-invalid={invalid} aria-describedby={invalid ? "amount-error" : undefined}
    value={value} onBlur={onBlur}
    onPaste={(event) => { pasted.current = event.clipboardData.getData("text"); }}
    onChange={(event) => {
      const native = event.nativeEvent;
      const inputType = native instanceof InputEvent ? native.inputType : "";
      const data = inputType === "insertFromPaste" ? pasted.current : native instanceof InputEvent ? native.data : null;
      pasted.current = null;

      if (native instanceof InputEvent && native.isComposing) {
        onChange(event.currentTarget.value);

        return;
      }

      update(event.currentTarget, inputType, data);
    }}
    onCompositionEnd={(event) => update(event.currentTarget, "insertFromComposition", null)}
    onKeyDown={(event) => {
      const input = event.currentTarget;
      const caret = input.selectionStart ?? 0;

      if (input.selectionStart !== input.selectionEnd || event.ctrlKey || event.metaKey || event.altKey
        || parsePositiveDecimal(value) === null) return;

      if (event.key === "Backspace" && value[caret - 1] === ",") input.setSelectionRange(caret - 1, caret - 1);

      if (event.key === "Delete" && value[caret] === ",") input.setSelectionRange(caret + 1, caret + 1);
    }} />;
}
