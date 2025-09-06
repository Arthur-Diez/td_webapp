import React from 'react';
import './FloatingButtons.css';

export default function FloatingButtons({ onAdd = () => {} }) {
  return (
    <button className="fab" onClick={onAdd} aria-label="Добавить задачу">
      <span className="fab-plus">+</span>
    </button>
  );
}