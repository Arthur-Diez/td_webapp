// src/components/DayTimeline.jsx
import React from "react";
import "./DayTimeline.css";

const fmtHM = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const minsBetween = (a, b) => Math.max(0, Math.round((b - a) / 60000));
const humanDur = (m) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h && mm) return `${h} ч ${mm} м`;
  if (h) return `${h} ч`;
  return `${mm} м`;
};

const isOverdue = (task) => {
  if (task.all_day || !task.end_dt) return false;
  const end = new Date(task.end_dt);
  return end < new Date() && task.status === "pending";
};

const resolveAccent = (task, overdue) => {
  if (task.color_hex) return task.color_hex;
  if (task.icon_color) return task.icon_color;
  if (overdue) return "#FF4D4D";
  return "#00F0FF";
};

const GAP_MIN = 15; // порог «свободного окна»

export default function DayTimeline({ dateISO, tasks }) {
  const timed = tasks
    .filter((t) => !t.all_day && t.start_dt)
    .map((t) => ({ ...t, start: new Date(t.start_dt), end: t.end_dt ? new Date(t.end_dt) : null }))
    .sort((a, b) => a.start - b.start);

  const allDay = tasks.filter((t) => t.all_day);

  const rows = [];
  let suppressPrevForNext = false;

  for (let i = 0; i < timed.length; i++) {
    const cur = timed[i];
    const prev = timed[i - 1];
    const next = timed[i + 1];

    const prevEnd   = prev ? (prev.end || prev.start) : null;
    const nextStart = next ? next.start : null;

    let prevConn = "none";
    if (prev) {
      if (suppressPrevForNext) {
        prevConn = "none";
      } else {
        prevConn = minsBetween(prevEnd, cur.start) < GAP_MIN ? "solid" : "none";
      }
    }

    let nextConn = "none";
    let gapMinutes = 0;
    if (next) {
      gapMinutes = minsBetween(cur.end || cur.start, nextStart);
      if (gapMinutes < GAP_MIN) {
        nextConn = "solid";
        suppressPrevForNext = false;
      } else {
        nextConn = "none";
        suppressPrevForNext = true;
      }
    } else {
      suppressPrevForNext = false;
    }

    rows.push({ kind: "task", t: cur, prevConn, nextConn });

    if (next && gapMinutes >= GAP_MIN) {
      rows.push({ kind: "gap", minutes: gapMinutes, afterId: cur.id });
    }
  }

  const hasTimed = rows.some((r) => r.kind === "task");

  return (
    <div className="nm-tl">
      <ul className="nm-tl-list">
        {!hasTimed && <li className="nm-tl-empty">Нет задач с указанным временем.</li>}

        {rows.map((r) =>
          r.kind === "task" ? (
            <li
              key={`t-${r.t.id}`}
              className="nm-task-row"
              data-overdue={isOverdue(r.t)}
              data-status={r.t.status || "pending"}
            >
              <div className="nm-task-time">
                <span className="nm-task-time-start">{fmtHM(r.t.start)}</span>
                {r.t.end && r.t.end.getTime() !== r.t.start.getTime() && (
                  <span className="nm-task-time-end">{fmtHM(r.t.end)}</span>
                )}
              </div>

              <div className="nm-task-body">
                <div className="nm-task-headline">
                  <div className="nm-task-title">{r.t.title}</div>
                  <div className="nm-task-pills">
                    {r.t.all_day && <span className="nm-pill">Весь день</span>}
                    {isOverdue(r.t) && <span className="nm-pill nm-pill-danger">Просрочено</span>}
                  </div>
                </div>
                {r.t.description && <p className="nm-task-desc">{r.t.description}</p>}
                <div className="nm-task-subline">
                  <span>
                    {r.t.end
                      ? `${fmtHM(r.t.start)} – ${fmtHM(r.t.end)} · ${humanDur(
                          minsBetween(r.t.start, r.t.end)
                        )}`
                      : `${fmtHM(r.t.start)} · без окончания`}
                  </span>
                  {r.t.from_name && <span className="nm-task-from">от {r.t.from_name}</span>}
                </div>
              </div>

              <div className="nm-task-meta">
                <span
                  className="nm-task-avatar"
                  style={{ "--task-accent": resolveAccent(r.t, isOverdue(r.t)) }}
                >
                  {r.t.icon || "•"}
                </span>
                <span className="nm-task-check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="presentation">
                    <path d="m6 12 4 4 8-8" />
                  </svg>
                </span>
              </div>
            </li>
          ) : (
            <li key={`g-${r.afterId}`} className="nm-gap-row">
              <div className="nm-task-time nm-task-time--gap">
                <span className="nm-task-time-start">··</span>
              </div>
              <div className="nm-gap-body">{humanDur(r.minutes)} свободно</div>
              <div className="nm-task-meta" />
            </li>
          )
        )}
      </ul>

      {allDay.length > 0 && (
        <div className="nm-all-day">
          <div className="nm-all-day-heading">Задачи на весь день</div>
          <ul>
            {allDay.map((t) => (
              <li key={`ad-${t.id}`} className="nm-task-row nm-task-row--allday">
                <div className="nm-task-time">
                  <span className="nm-task-time-start">24H</span>
                </div>
                <div className="nm-task-body">
                  <div className="nm-task-headline">
                    <div className="nm-task-title">{t.title}</div>
                  </div>
                  {t.from_name && <div className="nm-task-subline">от {t.from_name}</div>}
                </div>
                <div className="nm-task-meta">
                  <span
                    className="nm-task-avatar"
                    style={{ "--task-accent": resolveAccent(t, false) }}
                  >
                    {t.icon || "•"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
