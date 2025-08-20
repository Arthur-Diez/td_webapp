// src/components/DayTimeline.jsx
import React from "react";
import "./DayTimeline.css";

function fmtHM(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function minsBetween(a, b) {
  return Math.max(0, Math.round((b - a) / 60000));
}
function humanDur(m) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h${mm ? ` ${mm}m` : ""}`;
}

/** Task shape ожидается:
 * {
 *   id, title, start_dt?: ISO, end_dt?: ISO, all_day?: boolean,
 *   status?, icon?, from_name?
 * }
 */

export default function DayTimeline({ dateISO, tasks }) {
  // 1) разделим задачи
  const timed = tasks
    .filter(t => !t.all_day && t.start_dt)
    .map(t => ({
      ...t,
      start: new Date(t.start_dt),
      end: t.end_dt ? new Date(t.end_dt) : null,
    }))
    .sort((a, b) => a.start - b.start);

  const allDay = tasks.filter(t => t.all_day);

  // 2) соберём ряды: задачи + «свободные окна»
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

  return (
    <div className="tl">
      <h2 className="tl-date">
        {new Date(dateISO).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </h2>

      <div className="tl-wrap">
        <div className="tl-line" />
        <ul className="tl-list">
          {rows.length === 0 && (
            <li className="tl-empty">Нет задач с указанным временем.</li>
          )}

          {rows.map((r) =>
            r.kind === "task" ? (
              <li key={`t-${r.t.id}`} className="tl-row">
                <div className="tl-time">
                  <div>{fmtHM(r.t.start)}</div>
                  <div className="tl-time-bottom">
                    {fmtHM(r.t.end || r.t.start)}
                  </div>
                </div>

                <div className="tl-pin">
                  <div className="tl-pin-circle">{r.t.icon || "@"}</div>
                </div>

                <div className="tl-card">
                  <div className="tl-meta">
                    {r.t.end
                      ? `${fmtHM(r.t.start)} – ${fmtHM(r.t.end)} (${humanDur(
                          minsBetween(r.t.start, r.t.end)
                        )})`
                      : fmtHM(r.t.start)}
                  </div>
                  <div className="tl-title">{r.t.title}</div>
                  {r.t.from_name ? (
                    <div className="tl-from">от {r.t.from_name}</div>
                  ) : null}
                </div>

                <div className="tl-check" title="Отметить выполненной" />
              </li>
            ) : (
              <li key={`g-${r.afterId}`} className="tl-gap-row">
                <div className="tl-time" />
                <div className="tl-pin tl-gap-dot" />
                <div className="tl-gap">{humanDur(r.minutes)}</div>
                <div className="tl-check" />
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
                  {t.from_name ? (
                    <div className="tl-from">от {t.from_name}</div>
                  ) : null}
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