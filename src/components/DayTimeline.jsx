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
  if (overdue) return "#FF5F5F";
  return "#7A5CFA";
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
    <div className="tl">
      <div className="tl-wrap">
        <ul className="tl-list">
          {!hasTimed && <li className="tl-empty">Нет задач с указанным временем.</li>}

          {rows.map((r) =>
            r.kind === "task" ? (
              <li
                key={`t-${r.t.id}`}
                className="tl-row"
                data-prev-conn={r.prevConn}
                data-next-conn={r.nextConn}
                style={{ "--task-accent": resolveAccent(r.t, isOverdue(r.t)) }}
              >
                <div className={`tl-time ${r.t.end ? 'tl-time--range' : 'tl-time--single'}`}>
                  <div>{fmtHM(r.t.start)}</div>
                  {r.t.end && r.t.end.getTime() !== r.t.start.getTime() && (
                    <div className="tl-time-bottom">{fmtHM(r.t.end)}</div>
                  )}
                </div>

                <div className="tl-pin">
                  <div className="tl-pin-circle">{r.t.icon || "•"}</div>
                </div>

                <div className="tl-card">
                  <div className="tl-card-header">
                    <div className="tl-meta">
                      {r.t.end
                        ? `${fmtHM(r.t.start)} – ${fmtHM(r.t.end)} (${humanDur(
                            minsBetween(r.t.start, r.t.end)
                          )})`
                        : fmtHM(r.t.start)}
                    </div>
                    <div className="tl-pills">
                      {r.t.all_day && <span className="tl-pill">Весь день</span>}
                      {isOverdue(r.t) && <span className="tl-pill tl-pill--danger">Просрочено</span>}
                    </div>
                  </div>

                  <div className="tl-card-body">
                    <span className="tl-color-dot" aria-hidden />
                    <div className="tl-card-copy">
                      <div className="tl-title">{r.t.title}</div>
                      {r.t.description && <p className="tl-desc">{r.t.description}</p>}
                      {r.t.from_name && <div className="tl-from">от {r.t.from_name}</div>}
                    </div>
                  </div>
                </div>

                <div className="tl-check" aria-hidden />
              </li>
            ) : (
              <li key={`g-${r.afterId}`} className="tl-gap-row">
                <div className="tl-time" />
                <div className="tl-pin" aria-hidden />
                <div className="tl-gap-label">{humanDur(r.minutes)} свободно</div>
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
                  <div
                    className="tl-ad-circle"
                    style={{ "--task-accent": resolveAccent(t, false) }}
                  >
                    {t.icon || "•"}
                  </div>
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
