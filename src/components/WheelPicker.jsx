// src/components/WheelPicker.jsx
import React, { useEffect, useRef, useCallback } from "react";
import "./WheelPicker.css";

const ITEM_H = 36; // высота строки (должна совпадать с CSS)

export default function WheelPicker({
  values = [],            // [{ label, value }]
  value,                  // текущее value
  onChange,               // (value) => void
  ariaLabel,
}) {
  const viewportRef = useRef(null);
  const debounceRef = useRef(null);

  // Прокрутить к текущему значению при монтировании и при смене value извне
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const idx = Math.max(0, values.findIndex((v) => v.value === value));
    el.scrollTop = idx * ITEM_H;
  }, [value, values]);

  // Снап к ближайшему элементу и вызов onChange
  const snapAndChange = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.min(values.length - 1, Math.max(0, idx));

    const top = clamped * ITEM_H;
    el.scrollTo({ top, behavior: "smooth" });

    const nextVal = values[clamped]?.value;
    if (nextVal !== undefined && nextVal !== value) {
      onChange?.(nextVal);
    }
  }, [values, value, onChange]);

  // Дебаунс скролла
  const onScroll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(snapAndChange, 80);
  };

  return (
    <div className="wheel" aria-label={ariaLabel}>
      <div className="wheel-viewport" ref={viewportRef} onScroll={onScroll}>
        {/* отступы сверху/снизу, чтобы центральная линия подсветки совпадала */}
        <div className="wheel-spacer" />
        {values.map((v) => (
          <div className="wheel-item" key={String(v.value)} style={{ height: ITEM_H }}>
            {v.label}
          </div>
        ))}
        <div className="wheel-spacer" />
      </div>

      {/* маски и линия выделения — как в твоём CSS */}
      <div className="wheel-mask" />
      <div className="wheel-focus" />
    </div>
  );
}