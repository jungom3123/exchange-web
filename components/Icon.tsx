import type { ReactNode } from "react";

// One stroke weight and a translucent fill keep every UI icon in the same family.
const shapes = {
  exchange: <><path d="M4 6h14v6H4zM6 12h14v6H6z" fill="currentColor" opacity=".16" stroke="none" /><path d="M4 8h15l-4-4M20 16H5l4 4" /></>,
  moon: <><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" fill="currentColor" opacity=".16" stroke="none" /><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" fill="currentColor" opacity=".2" stroke="none" /><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  info: <><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".14" stroke="none" /><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" fill="currentColor" opacity=".14" stroke="none" /><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  arrow: <><path d="m13 5 7 7-7 7Z" fill="currentColor" opacity=".2" stroke="none" /><path d="M4 12h16m-7-7 7 7-7 7" /></>,
  check: <><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".16" stroke="none" /><path d="m7 12 3 3 7-7" /></>,
  chart: <><path d="m4 17 5-6 5 3 6-9v15H4Z" fill="currentColor" opacity=".14" stroke="none" /><path d="m4 17 5-6 5 3 6-9M4 4v16h16" /></>,
  chevron: <><path d="m6 9 6 6 6-6Z" fill="currentColor" opacity=".18" stroke="none" /><path d="m6 9 6 6 6-6" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" fill="currentColor" opacity=".14" stroke="none" /><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
} satisfies Record<string, ReactNode>;

export default function Icon({ name, className = "" }: { name: keyof typeof shapes; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
    className={`ui-icon ${className}`}>{shapes[name]}</svg>;
}
