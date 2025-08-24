// src/components/DayTimeline.jsx
import React from "react";
import "./DayTimeline.css";

const fmtHM = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const minsBetween = (a, b) => Math.max(0, Math.round((b - a) / 60000));
const humanDur = (m) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`);

export default function DayTimeline({ dateISO, tasks }) {
  const timed = tasks
    .filter((t) => !t.all_day && t.start_dt)
    .map((t) => ({ ...t, start: new Date(t.start_dt), end: t.end_dt ? new Date(t.end_dt) : null }))
    .sort((a, b) => a.start - b.start);

  const allDay = tasks.filter((t) => t.all_day);

  const rows = [];
  for (let i = 0; i < timed.length; i++) {
    const cur = timed[i];
    rows.push({ kind: "task", t: cur });

    const curEnd = cur.end || cur.start;
    const next = timed[i + 1];
    if (next) {
      const gap = minsBetween(curEnd, next.start);
      if (gap >= 15) rows.push({ kind: "gap", minutes: gap, afterId: cur.id });
    }
  }

  const hasTimed = rows.some((r) => r.kind === "task");

  return (
    <div className="tl">
      <div className="tl-wrap">
        {/* Сплошная линия только для timed-задач.
            Пунктир в местах gap дорисует CSS на .tl-gap-row */}
        {hasTimed && <div className="tl-line" />}

        <ul className="tl-list">
          {!hasTimed && <li className="tl-empty">Нет задач с указанным временем.</li>}

          {rows.map((r) =>
            r.kind === "task" ? (
              <li key={`t-${r.t.id}`} className="tl-row">
                <div className="tl-time">
                  <div>{fmtHM(r.t.start)}</div>
                  {r.t.end && r.t.end.getTime() !== r.t.start.getTime() && (
                    <div className="tl-time-bottom">{fmtHM(r.t.end)}</div>
                  )}
                </div>

                <div className="tl-pin">
                  <div className="tl-pin-circle">{r.t.icon || "@"}</div>
                </div>

                <div className="tl-card">
                  <div className="tl-meta">
                    {r.t.end
                      ? `${fmtHM(r.t.start)} – ${fmtHM(r.t.end)} (${humanDur(minsBetween(r.t.start, r.t.end))})`
                      : fmtHM(r.t.start)}
                  </div>
                  <div className="tl-title">{r.t.title}</div>
                  {r.t.from_name && <div className="tl-from">от {r.t.from_name}</div>}
                </div>

                <div className="tl-check" aria-hidden />
              </li>
            ) : (
              <li key={`g-${r.afterId}`} className="tl-gap-row">
                <div className="tl-time" />
                <div className="tl-pin tl-gap-dot" />
                <div className="tl-card tl-gap">{humanDur(r.minutes)}</div>
                <div className="tl-check tl-check-hidden" />
              </li>
            )
          )}
        </ul>
      </div>

      {allDay.length > 0 && (
        <>
          <div className="tl-divider" />
          <div className="tl-all-day-title">Задачи на весь день</div>

          <ul className="tl-allday-list">
            {allDay.map((t) => (
              <li key={`ad-${t.id}`} className="tl-allday-row">
                <div className="tl-ad-time">весь день</div>
                <div className="tl-ad-pin">
                  <div className="tl-ad-circle">{t.icon || "@"}</div>
                </div>
                <div className="tl-ad-card">
                  <div className="tl-title">{t.title}</div>
                  {t.from_name && <div className="tl-from">от {t.from_name}</div>}
                </div>
                <div className="tl-check" />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}