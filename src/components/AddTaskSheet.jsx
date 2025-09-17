// src/components/AddTaskSheet.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./AddTaskSheet.css";
import WheelPicker from "./WheelPicker";
import { createTask } from "../utils/api";

const mm2 = (n) => String(n).padStart(2, "0");
const hours = Array.from({ length: 24 }, (_, h) => ({ label: mm2(h), value: h }));

// минуты: и в инлайне, и в подробном окне показываем 0..59
const MINS60 = Array.from({ length: 60 }, (_, m) => ({ label: mm2(m), value: m }));

const DUR_PRESETS = [
  { label: "15m", m: 15 },
  { label: "30m", m: 30 },
  { label: "45m", m: 45 },
  { label: "1h", m: 60 },
  { label: "1h 30m", m: 90 },
];
const COLORS = ["#F06292", "#FFB74D", "#FFD54F", "#AED581", "#64B5F6", "#81C784", "#BA68C8"];

// helpers для шагов по четвертям и направления
const nextQ = (m) => Math.floor(m / 15) * 15 + 15;           // 43 -> 60
const prevQ = (m) => Math.floor(m / 15) * 15;                 // 43 -> 30
const dirFromTo = (prev, cur) => {
  const diff = (cur - prev + 60) % 60;                        // 0..59
  if (diff === 0) return 0;
  return diff <= 30 ? +1 : -1;                                // ближнее направление
};

export default function AddTaskSheet({ open, onClose, telegramId, selectedDate }) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);

  const now = new Date();
  const baseDateProp = selectedDate || now;
  const [localDate, setLocalDate] = useState(baseDateProp);

  const roundToQuarter = (d) => {
    const ms = 15 * 60 * 1000;
    return new Date(Math.ceil(d.getTime() / ms) * ms);
  };

  const defStart = useMemo(() => {
    const d = new Date(baseDateProp);
    if (new Date().toDateString() === d.toDateString()) return roundToQuarter(new Date());
    d.setHours(10, 0, 0, 0);
    return d;
    // eslint-disable-next-line
  }, [open]);

  const [sh, setSh] = useState(defStart.getHours());                  // час начала
  const [sm, setSm] = useState(defStart.getMinutes());                // минуты начала (могут быть не кратно 15)
  const [duration, setDuration] = useState(15);                       // мин

  const [color, setColor] = useState(COLORS[0]);
  const [repeat, setRepeat] = useState("once");
  const [notes, setNotes] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isDurPickerOpen, setIsDurPickerOpen] = useState(false);
  // «без временного интервала» (есть только время начала)
  const [noEnd, setNoEnd] = useState(false);
  // какое колесо пользователь «тапнул»: 'sh' | 'sm' | 'eh' | 'em' | null
  const [pickedWheel, setPickedWheel] = useState(null);
  const openTimeSheet = (key) => { setPickedWheel(key); setIsTimePickerOpen(true); };

  const startDate = useMemo(() => {
    const d = new Date(localDate);
    d.setHours(sh, sm, 0, 0);
    return d;
  }, [localDate, sh, sm]);

  const endDate = useMemo(() => {
    if (allDay || noEnd) return null;
    const d = new Date(startDate);
    d.setMinutes(d.getMinutes() + duration);
    return d;
  }, [startDate, duration, allDay, noEnd]);

  const totalHuman = useMemo(() => {
    const m = duration, h = Math.floor(m / 60), mm = m % 60;
    if (h && mm) return `${h}ч ${mm}м`;
    if (h) return `${h}ч`;
    return `${mm}м`;
  }, [duration]);

  // вычислить duration по конечному времени, учитывая переход на следующий день
  const durationFromEnd = (endCandidate) => {
    const end = new Date(endCandidate);
    if (end <= startDate) end.setDate(end.getDate() + 1); // следующий день
    return Math.max(1, Math.round((end - startDate) / 60000));
  };

  // сброс при закрытии
  useEffect(() => {
    if (!open) {
      setTitle("");
      setAllDay(false);
      setSm(defStart.getMinutes());
      setSh(defStart.getHours());
      setDuration(15);
      setNotes("");
      setSubtasks([]);
      setRepeat("once");
      setColor(COLORS[0]);
      setIsTimePickerOpen(false);
      setIsDurPickerOpen(false);
      setLocalDate(baseDateProp);
      setPickedWheel(null);
      setNoEnd(false);
    }
    // eslint-disable-next-line
  }, [open]);
  useEffect(() => { if (allDay) setNoEnd(false); }, [allDay]);

  const addSubtask = () => {
    const t = subtaskInput.trim();
    if (!t) return;
    if (subtasks.length >= 30) { alert("Максимум 30 подзадач"); return; }
    setSubtasks((s) => [{ id: Date.now(), text: t }, ...s]); // сверху
    setSubtaskInput("");
  };
  const removeSubtask = (id) => setSubtasks((s) => s.filter((x) => x.id !== id));

  const handleSubmit = async () => {
    if (!telegramId) return;
    if (!title.trim()) { alert("Введите название задачи"); return; }
    const dateISO = (d) => (d ? new Date(d).toISOString() : null);

    const payload = {
      telegram_id: telegramId,
      title: title.trim(),
      description: notes || null,
      start_dt: allDay
        ? new Date(new Date(localDate).setHours(0, 0, 0, 0)).toISOString()
        : dateISO(startDate),
      end_dt: (allDay || noEnd) ? null : dateISO(endDate),
      all_day: allDay,
      for_user: null,
    };

    try { await createTask(payload); onClose(); }
    catch (e) { alert(`Ошибка сохранения: ${e.message}`); }
  };

  // ==== обработчики инлайн-колёс ====

  // Минуты начала: показываем точные (0..59),
  // но при прокрутке прыгаем по четвертям в сторону жеста, с переносом часа.
  const onInlineStartMinutes = (mNew) => {
    setSm((prev) => {
      const dir = dirFromTo(prev, mNew);
      if (dir > 0) {
        const nq = nextQ(prev);                // 43 -> 60
        if (nq >= 60) { setSh((h) => (h + 1) % 24); return 0; }
        return nq;
      }
      if (dir < 0) return prevQ(prev);        // 43 -> 30
      return prev;
    });
  };

  // Час конца: меняем длительность, учитывая «следующий день»
  const onInlineEndHour = (hNew) => {
    const curEnd = new Date(startDate.getTime() + duration * 60000);
    const end = new Date(startDate);
    end.setHours(hNew, curEnd.getMinutes(), 0, 0);
    setDuration(durationFromEnd(end));
  };

  // Минуты конца: та же логика, что и для начала, + корректный перенос часа/дня
  const onInlineEndMinutes = (mNew) => {
    const curEnd = new Date(startDate.getTime() + duration * 60000);
    const prev = curEnd.getMinutes();
    const dir = dirFromTo(prev, mNew);

    let h = curEnd.getHours();
    let m = prev;

    if (dir > 0) {
      const nq = nextQ(prev);                 // 43 -> 60
      if (nq >= 60) { h = (h + 1) % 24; m = 0; } else m = nq;
    } else if (dir < 0) {
      m = prevQ(prev);                        // 43 -> 30
    } else return;

    const end = new Date(startDate);
    end.setHours(h, m, 0, 0);
    setDuration(durationFromEnd(end));
  };

  return (
    <div className={`sheet ${open ? "sheet--open" : ""}`}>
      <div className="sheet-backdrop" onClick={onClose} />

      <div className="sheet-panel" role="dialog" aria-modal>
        <div className="sheet-grabber" />
        <div className="sheet-title">Новая задача</div>

        <div className="sheet-content">
          {/* Название + иконка слева */}
          <div className="title-row">
            <div className="title-icon">@</div>
            <input
              className="title-input"
              placeholder="Ответить на почту"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Весь день */}
            <button className="row toggler" onClick={() => setAllDay((v) => !v)} type="button">
              <div className={`check ${allDay ? "check--on" : ""}`} />
              <div className="row-title">Задача на весь день</div>
            </button>

          {/* Без временного интервала */}
          <button
            className="row toggler"
            onClick={() => setNoEnd((v) => !v)}
            type="button"
            disabled={allDay}
            title={allDay ? "Недоступно при режиме 'весь день'" : ""}
          >
            <div className={`check ${noEnd ? "check--on" : ""}`} />
            <div className="row-title">Задача без временного интервала</div>
          </button>

          {/* Когда? — инлайн 4 колеса + выбор даты */}
          <div className="section">
            <div className="section-head">
              <div className="section-title">Когда?</div>
              <input
                className="date-btn"
                type="date"
                value={new Date(localDate).toISOString().slice(0, 10)}
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  const nd = new Date(localDate);
                  nd.setFullYear(y, m - 1, d);
                  setLocalDate(nd);
                }}
              />
            </div>

          {!allDay ? (
              <div className={`time-inline ${noEnd ? "time-inline--two" : ""}`}>

                {/* ЧАС начала */}
                <WheelPicker
                  ariaLabel="час начала"
                  values={hours}
                  value={sh}
                  onChange={setSh}
                  onTap={() => openTimeSheet("sh")}
                  className={pickedWheel === "sh" ? "wheel--picked" : ""}
                />

                {/* МИН начала — показываем точные, двигаем по 15м */}
                <WheelPicker
                  ariaLabel="минуты начала"
                  values={MINS60}
                  value={sm}
                  onChange={onInlineStartMinutes}
                  onTap={() => openTimeSheet("sm")}
                  className={pickedWheel === "sm" ? "wheel--picked" : ""}
                />

                {/* Конец интервала — видим только если есть конечное время */}
                {!noEnd && (
                  <>
                    <WheelPicker
                      ariaLabel="час конца"
                      values={hours}
                      value={new Date(startDate.getTime() + duration * 60000).getHours()}
                      onChange={onInlineEndHour}
                      onTap={() => openTimeSheet("eh")}
                      className={pickedWheel === "eh" ? "wheel--picked" : ""}
                    />
                    <WheelPicker
                      ariaLabel="минуты конца"
                      values={MINS60}
                      value={new Date(startDate.getTime() + duration * 60000).getMinutes()}
                      onChange={onInlineEndMinutes}
                      onTap={() => openTimeSheet("em")}
                      className={pickedWheel === "em" ? "wheel--picked" : ""}
                    />
                  </>
                )}
                </div>
            ) : (
              <div className="all-day-hint">🗓 Весь день</div>
            )}
          </div>

          {/* Как долго (пресеты + подробно) */}
          {!allDay && !noEnd && (
            <div className="section">
              <div className="section-head">
                <div className="section-title">Как долго?</div>
                <button className="link" type="button" onClick={() => setIsDurPickerOpen(true)}>
                  Подробнее…
                </button>
              </div>
              <div className="chips">
                {DUR_PRESETS.map((p) => (
                  <button
                    key={p.m}
                    className={`chip ${duration === p.m ? "chip--active" : ""}`}
                    onClick={() => setDuration(p.m)}
                    type="button"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        {/* Цвет */}
          <div className="section">
            <div className="section-title">Какой цвет?</div>
            <div className="colors">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`color ${color === c ? "color--active" : ""}`}
                  style={{ "--c": c }}
                  onClick={() => setColor(c)}
                  type="button"
                  aria-label="цвет"
                />
              ))}
            </div>
          </div>

          {/* Повтор */}
          <div className="section">
            <div className="section-title">Как часто?</div>
            <div className="chips">
              {[
                { k: "once", label: "Один раз" },
                { k: "daily", label: "Ежедневно" },
                { k: "weekly", label: "Еженедельно" },
                { k: "monthly", label: "Ежемесячно" },
              ].map((o) => (
                <button
                  key={o.k}
                  className={`chip ${repeat === o.k ? "chip--active" : ""}`}
                  onClick={() => setRepeat(o.k)}
                  type="button"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {/* Оповещения — заглушка */}
          <div className="section">
            <div className="section-head">
              <div className="section-title">Нужны оповещения?</div>
              <span className="hint">Позже подключим</span>
            </div>
            <div className="muted">🔔 В момент начала</div>
            <div className="muted">🔕 За 15м до начала</div>
          </div>
          {/* Подробности/подзадачи */}
          <div className="section">
            <div className="section-head">
              <div className="section-title">Нужны подробности?</div>
              {subtasks.length > 0 && <span className="section-badge">{subtasks.length}</span>}
            </div>
            {subtasks.length > 0 && (
              <ul className="subtasks">
                {subtasks.map((s) => (
                  <li key={s.id}>
                    <span className="subtask-text">{s.text}</span>
                    <button
                        className="subtask-trash"
                      onClick={() => removeSubtask(s.id)}
                      type="button"
                      aria-label="Удалить подзадачу"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="subtask-row">
              <input
                className="subtask-input"
                placeholder="Подзадача…"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSubtask();
                }}
              />
              <button
                className="subtask-add"
                onClick={addSubtask}
                type="button"
                disabled={!subtaskInput.trim() || subtasks.length >= 30}
              >
                + Добавить подзадачу
              </button>
            </div>
          <textarea
              className="notes"
              placeholder="Заметки, ссылки, телефоны…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {!isTimePickerOpen && !isDurPickerOpen && (
          <div className="sheet-footer">
            <button className="submit-btn" onClick={handleSubmit}>
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      {/* Подробный выбор времени (живое обновление) */}
      <div className={`inner-sheet ${isTimePickerOpen ? "inner-sheet--open" : ""}`}>
        <div
          className="inner-grabber"
          onTouchStart={(e) => { e.currentTarget._y0 = e.touches[0].clientY; }}
          onTouchMove={(e) => {
            const y = e.touches[0].clientY, y0 = e.currentTarget._y0 ?? y;
            const dy = Math.max(0, y - y0);
            const panel = e.currentTarget.closest(".inner-sheet");
            if (panel) panel.style.transform = `translateY(${dy}px)`;
          }}
          onTouchEnd={(e) => {
            const panel = e.currentTarget.closest(".inner-sheet");
            if (!panel) return;
            const m = panel.style.transform.match(/translateY\((\d+)px\)/);
            const dy = m ? parseInt(m[1], 10) : 0;

            panel.style.transform = "";           // ← сброс временного translate
            if (dy > 60) {                        // ← закрываем по «свайпу вниз»
                setIsTimePickerOpen(false);
                setPickedWheel(null);               // ← ДОБАВЛЕНО: убираем подсветку выбранного колеса
            }
            }}
        />
        <div className="inner-title">Выбор времени</div>
        <div className="inner-sub">Данная задача займёт {totalHuman}</div>

        <div className="wheels">
            <WheelPicker ariaLabel="час начала" values={hours} value={sh} onChange={setSh} />
            <WheelPicker ariaLabel="минуты начала" values={MINS60} value={sm} onChange={setSm} />

            {!noEnd && (
                <>
                <div className="arrow">→</div>
                <WheelPicker
                    ariaLabel="час конца"
                    values={hours}
                    value={(new Date(startDate.getTime() + duration * 60000)).getHours()}
                    onChange={(h) => {
                    const curEnd = new Date(startDate.getTime() + duration * 60000);
                    const end = new Date(startDate); end.setHours(h, curEnd.getMinutes(), 0, 0);
                    setDuration(durationFromEnd(end));
                    }}
                />
                <WheelPicker
                    ariaLabel="минуты конца"
                    values={MINS60}
                    value={(new Date(startDate.getTime() + duration * 60000)).getMinutes()}
                    onChange={(m) => {
                    const curEnd = new Date(startDate.getTime() + duration * 60000);
                    const end = new Date(startDate); end.setHours(curEnd.getHours(), m, 0, 0);
                    setDuration(durationFromEnd(end));
                    }}
                />
                </>
            )}
        </div>

        <button
            className="inner-close"
            onClick={() => { setIsTimePickerOpen(false); setPickedWheel(null); }}
        >
            Готово
        </button>
      </div>

      {/* Подробный выбор длительности */}
      <div className={`inner-sheet ${isDurPickerOpen ? "inner-sheet--open" : ""}`}>
        <div className="inner-grabber" />
        <div className="inner-title">Длительность</div>

        <div className="wheels">
          <WheelPicker
            ariaLabel="часы"
            values={Array.from({ length: 12 }, (_, i) => ({ label: String(i), value: i }))}
            value={Math.floor(duration / 60)}
            onChange={(h) => setDuration(h * 60 + (duration % 60))}
          />
          <WheelPicker
            ariaLabel="минуты"
            values={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
              label: mm2(m),
              value: m,
            }))}
            value={duration % 60}
            onChange={(m) => setDuration(Math.floor(duration / 60) * 60 + m)}
          />
        </div>

        <div className="dur-presets">
          {DUR_PRESETS.map((p) => (
            <button key={p.m} className="chip" onClick={() => setDuration(p.m)}>{p.label}</button>
          ))}
        </div>

        <button className="inner-close" onClick={() => setIsDurPickerOpen(false)}>Готово</button>
      </div>
    </div>
  );
}