// src/components/WheelPicker.jsx
import React, { useEffect, useRef } from "react";
import "./WheelPicker.css";

/**
 * Простое «колесо» с прокруткой и snap. Высота строки 36px.
 * props:
 *  - values: [{label, value}]
 *  - value: текущее value
 *  - onChange: (value) => void
 */
export default function WheelPicker({ values, value, onChange, ariaLabel }) {
  const ref = useRef(null);
  const ITEM_H = 36;

  // прокрутить к текущему значению
  useEffect(() => {
    const idx = Math.max(0, values.findIndex(v => v.value === value));
    if (ref.current) ref.current.scrollTo({ top: idx * ITEM_H, behavior: "auto" });
    // eslint-disable-next-line
  }, []);

  // подщёлкивать к ближайшему элементу
  const handleScroll = () => {
    if (!ref.current) return;
    const st = ref.current.scrollTop;Ы
    const idx = Math.round(st / ITEM_H);
    const clamped = Math.min(values.length - 1, Math.max(0, idx));
    const val = values[clamped]?.value;
    if (val !== undefined) onChange(val);
  };

  return (
    <div className="wheel" aria-label={ariaLabel}>
      <div className="wheel-viewport" ref={ref} onScroll={() => {
        // debounce 120ms
        if (ref.current._t) clearTimeout(ref.current._t);
        ref.current._t = setTimeout(handleScroll, 120);
      }}>
        {values.map((v) => (
          <div className="wheel-item" key={String(v.value)}>
            {v.label}
          </div>
        ))}
      </div>
      <div className="wheel-mask" />
      <div className="wheel-focus" />
    </div>
  );
}