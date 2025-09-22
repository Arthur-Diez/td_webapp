// src/components/FloatingButtons.js
import React from "react";
import "./FloatingButtons.css";

export default function FloatingButtons({ onPlus }) {
  return (
    <button className="fab" type="button" aria-label="Добавить задачу" onClick={onPlus}>
      <span className="fab-plus">+</span>
    </button>
  );
}