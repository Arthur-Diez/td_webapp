// src/components/ActivityFeed.jsx
import React from 'react';
import './ActivityFeed.css';

export default function ActivityFeed({ items = [], loading = false, error = null }) {
  if (loading) {
    return (
      <div className="activity-feed">
        <div className="activity-feed__header">Лента друзей</div>
        <div className="activity-feed__skeleton" />
        <div className="activity-feed__skeleton" />
        <div className="activity-feed__skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-feed">
        <div className="activity-feed__header">Лента друзей</div>
        <div className="activity-feed__empty">⚠️ {String(error)}</div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="activity-feed">
        <div className="activity-feed__header">Лента друзей</div>
        <div className="activity-feed__empty">👀 Пока тишина. Позовите друзей!</div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-feed__header">Лента друзей</div>
      <ul className="activity-feed__list">
        {items.map((item) => (
          <li key={item.id || `${item.user}-${item.timestamp}`}>
            {item.text || item.description || item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}