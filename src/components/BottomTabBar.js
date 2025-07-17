// src/components/BottomTabBar.js
import React from "react";
import "./BottomTabBar.css";

export default function BottomTabBar({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-tab-bar">
      <button
        className={activeTab === "tasks" ? "active" : ""}
        onClick={() => onTabChange("tasks")}
      >
        📋
      </button>
      <button
        className={activeTab === "calendar" ? "active" : ""}
        onClick={() => onTabChange("calendar")}
      >
        🗓
      </button>
      <button
        className={activeTab === "profile" ? "active" : ""}
        onClick={() => onTabChange("profile")}
      >
        👤
      </button>
    </nav>
  );
}