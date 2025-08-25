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

const GAP_MIN = 15; // порог «свободного окна»

export default function DayTimeline({ dateISO, tasks }) {
  // только задачи со временем
  const timed = tasks
    .filter((t) => !t.all_day && t.start_dt)
    .map((t) => ({ ...t, start: new Date(t.start_dt), end: t.end_dt ? new Date(t.end_dt) : null }))
    .sort((a, b) => a.start - b.start);

  const allDay = tasks.filter((t) => t.all_day);

  // строим список строк: task + (вставляем gap после task, если разрыв >= GAP_MIN)
  const rows = [];
  for (let i = 0; i < timed.length; i++) {
    const cur = timed[i];
    const prev = timed[i - 1];
    const next = timed[i + 1];

    const prevEnd = prev ? (prev.end || prev.start) : null;
    const nextStart = next ? next.start : null;

    const prevConn =
      !prev ? "none" : minsBetween(prevEnd, cur.start) < GAP_MIN ? "solid" : "dashed";

    const nextConn =
      !next ? "none" : minsBetween(cur.end || cur.start, nextStart) < GAP_MIN ? "solid" : "dashed";

    rows.push({ kind: "task", t: cur, prevConn, nextConn });

    // вставляем визуальный gap-ряд (карточку «свободно») только если разрыв заметный
    if (next && nextConn === "dashed") {
      rows.push({
        kind: "gap",
        minutes: minsBetween(cur.end || cur.start, next.start),
        afterId: cur.id,
      });
    }
  }

  const hasTimed = rows.some((r) => r.kind === "task");

  return (
    <div className="tl">
      <div className="tl-wrap">
        <ul className="tl-list">
          {!hasTimed && <li className="tl-empty">Нет задач с указанным временем.</li>}

          {rows.map((r, idx) =>
            r.kind === "task" ? (
              <li
                key={`t-${r.t.id}`}
                className="tl-row"
                data-prev-conn={r.prevConn}
                data-next-conn={r.nextConn}
              >
                <div className={`tl-time ${r.t.end ? 'tl-time--range' : 'tl-time--single'}`}>
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
                      ? `${fmtHM(r.t.start)} – ${fmtHM(r.t.end)} (${humanDur(
                          minsBetween(r.t.start, r.t.end)
                        )})`
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
                <div className="tl-pin" aria-hidden />
                <div className="tl-gap-label">{humanDur(r.minutes)}</div>
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