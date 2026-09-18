"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function InfoTooltip({ label, children }: { label: string; children: string }) {
  const id = useId();
  const trigger = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12, ready: false });
  const cancelClose = () => { if (timer.current) clearTimeout(timer.current); };
  const closeSoon = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), 120);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useLayoutEffect(() => {
    if (!open || !trigger.current || !tip.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const box = tip.current.getBoundingClientRect();
    const left = Math.max(12, Math.min(anchor.left, window.innerWidth - box.width - 12));
    const top = anchor.bottom + box.height + 12 <= window.innerHeight
      ? anchor.bottom : Math.max(12, anchor.top - box.height);
    setPosition({ left, top, ready: true });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", escape);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("keydown", escape);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);
  return <>
    <span ref={trigger} className="info-icon" role="img" aria-label={label}
      aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        cancelClose();
        if (!open) setPosition((p) => ({ ...p, ready: false }));
        setOpen(true);
      }}
      onPointerLeave={closeSoon}>ⓘ</span>
    {open && createPortal(
      <div ref={tip} id={id} role="tooltip" className="info-tooltip" style={{
        left: position.left, top: position.top, visibility: position.ready ? "visible" : "hidden",
      }} onPointerEnter={cancelClose} onPointerLeave={closeSoon}>
        <div className="info-tooltip-content">{children}</div>
      </div>, document.body)}
  </>;
}
