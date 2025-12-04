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
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M8 9h8M8 12h6M8 15h4" />
        </svg>
      </Tab>

      <Tab id="groups" label="Группы" active={active === "groups"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path d="M6 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M2 20v-1c0-3.5 4-5 10-5s10 1.5 10 5v1" />
        </svg>
      </Tab>

      <Tab id="friends" label="Друзья" active={active === "friends"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3 3-5 7-5s7 2 7 5" />
          <path d="M6 12s1.5-1 6-1 6 1 6 1" />
        </svg>
      </Tab>

      <Tab id="focus" label="Фокус" active={active === "focus"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <path d="m6.2 6.2 2.1 2.1m7.4 7.4 2.1 2.1m0-11.6-2.1 2.1m-7.4 7.4-2.1 2.1" />
        </svg>
      </Tab>
    </nav>
  );
}
