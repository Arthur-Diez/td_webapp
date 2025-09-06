// src/components/FloatingButtons.js
import React from "react";

export default function FloatingButtons({ onPlus }) {
  return (
    <button
      className="fab-button"
      type="button"
      aria-label="Добавить задачу"
      onClick={onPlus}
    >
      +
    </button>
  );
}