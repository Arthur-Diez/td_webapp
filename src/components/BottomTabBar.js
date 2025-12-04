// src/components/BottomTabBar.js
import React from "react";
import "./BottomTabBar.css";

const Tab = ({ id, label, active, onChange, children }) => {
  const isActive = Boolean(active);
  return (
    <button
      className={`tab-btn ${isActive ? "active" : ""}`}
      onClick={() => onChange(id)}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-current={isActive ? "page" : undefined}
      aria-label={label}
      tabIndex={isActive ? 0 : -1}
    >
      <span className="icon-wrap">{children}</span>
      <span className="label sr-only">{label}</span>
      <span className="tab-indicator" aria-hidden="true" />
    </button>
  );
};

export default function BottomTabBar({ active = "tasks", onChange = () => {} }) {
  return (
    <nav className="bottom-tabbar" role="tablist" aria-label="Главная навигация">
      <Tab id="tasks" label="Мои задачи" active={active === "tasks"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path d="M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
          <path d="M8 9h8M8 12h5M8 15h4" />
        </svg>
      </Tab>

      <Tab id="groups" label="Группы" active={active === "groups"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path d="M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M3 19v-1c0-2.8 4.2-4 7-4" />
          <path d="M21 19v-1c0-2-2.4-3.6-5-3.9" />
        </svg>
      </Tab>

      <Tab id="friends" label="Друзья" active={active === "friends"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <circle cx="12" cy="8" r="3" />
          <path d="M6 18c0-3.2 3.6-4.5 6-4.5s6 1.3 6 4.5" />
          <path d="M7 12s2-1 5-1 5 1 5 1" />
        </svg>
      </Tab>

      <Tab id="focus" label="Фокус" active={active === "focus"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
        </svg>
      </Tab>
    </nav>
  );
}
