const editableAmount = /^(?:\d*|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/;

export function formatAmountEdit(previous: string, raw: string, caret: number, inputType: string, data: string | null) {
  // Existing separators move as digits are edited. Pasted/replaced text must
  // still have valid grouping so an ambiguous value such as "1,00" stays invalid.
  const editingDigits = inputType.startsWith("delete")
    || (inputType === "insertText" && data !== null && /^[\d.]$/.test(data))
    || (inputType === "insertFromPaste" && data !== null && editableAmount.test(data));

  const text = editableAmount.test(previous) && editingDigits ? raw.replaceAll(",", "") : raw;

  if (!editableAmount.test(text)) return { value: raw, caret };
  const [integer, fraction] = text.replaceAll(",", "").split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const value = fraction === undefined ? grouped : `${grouped}.${fraction}`;
  const charactersBeforeCaret = raw.slice(0, caret).replaceAll(",", "").length;
  let nextCaret = 0;
  let characters = 0;

  while (nextCaret < value.length && characters < charactersBeforeCaret) {
    if (value[nextCaret] !== ",") characters++;
    nextCaret++;
  }

  // Virtual keyboards can delete a separator without a keydown event. Move
  // beyond the restored comma so the next forward deletion reaches a digit.
  if (inputType === "deleteContentForward" && value === previous && value[nextCaret] === ",") nextCaret++;

  return { value, caret: nextCaret };
}
