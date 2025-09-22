// src/components/WheelPicker.jsx
import React, { useEffect, useRef, useCallback } from "react";
import "./WheelPicker.css";

const ITEM_H = 36;

export default function WheelPicker({
  values = [],
  value,
  onChange,
  ariaLabel,
  onTap,           // ← новый проп: вызываем при «тапе» на колесо
  className = "",  // ← новый проп: чтобы подсвечивать активное колесо
}) {
  const viewportRef = useRef(null);
  const debounceRef = useRef(null);

  // для детекции «тапа»
  const touch = useRef({ y0: 0, moved: false, t0: 0, active: false, justTapped: false });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const idx = Math.max(0, values.findIndex((v) => v.value === value));
    el.scrollTop = idx * ITEM_H;
    touch.current.moved = false;
  }, [value, values]);

  const snapAndChange = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.min(values.length - 1, Math.max(0, idx));
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    const next = values[clamped]?.value;
    if (next !== undefined && next !== value) onChange?.(next);
  }, [values, value, onChange]);

  const onScroll = () => {
    if (touch.current.active) touch.current.moved = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(snapAndChange, 80);
  };

  const down = (y) => {
    touch.current = { y0: y, moved: false, t0: Date.now(), active: true, justTapped: false };
  };
  const up = (y) => {
    const dy = Math.abs(y - touch.current.y0);
    const dt = Date.now() - touch.current.t0;
    if (touch.current.active && !touch.current.moved && dy < 6 && dt < 300) {
      onTap?.();
      touch.current.justTapped = true;
    }
    touch.current.active = false;
  };

  return (
    <div
      className={`wheel ${className}`}
      aria-label={ariaLabel}
      onMouseDown={(e) => down(e.clientY)}
      onMouseUp={(e) => up(e.clientY)}
      onMouseMove={() => { if (touch.current.active) touch.current.moved = true; }}
      onTouchStart={(e) => down(e.touches[0].clientY)}
      onTouchEnd={(e) => up(e.changedTouches[0].clientY)}
      onTouchMove={(e) => { if (touch.current.active) touch.current.moved = true; }}
      onClick={() => {
        if (!touch.current.active && !touch.current.justTapped) onTap?.();
        touch.current.justTapped = false;
      }}
    >
      <div className="wheel-viewport" ref={viewportRef} onScroll={onScroll}>
        <div className="wheel-spacer" />
        {values.map((v) => (
          <div className="wheel-item" key={String(v.value)} style={{ height: ITEM_H }}>
            {v.label}
          </div>
        ))}
        <div className="wheel-spacer" />
      </div>
      <div className="wheel-mask" />
      <div className="wheel-focus" />
    </div>
  );
}