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
      tabIndex={isActive ? 0 : -1}
    >
      <span className="icon-wrap">{children}</span>
      <span className="label">{label}</span>
      <span className="tab-indicator" aria-hidden="true" />
    </button>
  );
};

export default function BottomTabBar({ active = "tasks", onChange = () => {} }) {
  return (
    <nav className="bottom-tabbar" role="tablist" aria-label="Главная навигация">
      <Tab id="tasks" label="Мои задачи" active={active === "tasks"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      </Tab>

      <Tab id="groups" label="Группы" active={active === "groups"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path d="M16 11a3.5 3.5 0 1 0-3-3.5A3.5 3.5 0 0 0 16 11ZM8 11a3.5 3.5 0 1 0-3-3.5A3.5 3.5 0 0 0 8 11ZM1 20v-2c0-2.7 5.3-4 8-4s8 1.3 8 4v2M9.6 13.3A12.4 12.4 0 0 1 16 12c2.7 0 8 1.3 8 4v2" />
        </svg>
      </Tab>

      <Tab id="friends" label="Друзья" active={active === "friends"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" />
        </svg>
      </Tab>

      <Tab id="focus" label="Фокус" active={active === "focus"} onChange={onChange}>
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path d="M12 4v2M12 18v2M20 12h-2M6 12H4M16.1 6.1l-1.4 1.4M7.9 16.6l-1.4 1.4M16.6 16.6l-1.4-1.4M8.4 7.5 7 6.1" />
        </svg>
      </Tab>
    </nav>
  );
}
