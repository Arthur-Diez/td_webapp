// src/components/AddTaskSheet.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./AddTaskSheet.css";
import WheelPicker from "./WheelPicker";
import { createTask } from "../utils/api";

const mm2 = (n) => String(n).padStart(2, "0");
const hours = Array.from({ length: 24 }, (_, h) => ({ label: mm2(h), value: h }));

// минуты для инлайн-панели (шаг 15м) и для детальной (00–59)
const MINS15 = [0, 15, 30, 45].map((m) => ({ label: mm2(m), value: m }));
const MINS60 = Array.from({ length: 60 }, (_, m) => ({ label: mm2(m), value: m }));
// округление к ближайшей четверти (0/15/30/45) для отображения на инлайн-колёсах
const nearestQuarter = (m) => (Math.round(m / 15) * 15) % 60;

const DUR_PRESETS = [
  { label: "15m", m: 15 },
  { label: "30m", m: 30 },
  { label: "45m", m: 45 },
  { label: "1h", m: 60 },
  { label: "1h 30m", m: 90 },
];
const COLORS = ["#F06292", "#FFB74D", "#FFD54F", "#AED581", "#64B5F6", "#81C784", "#BA68C8"];

export default function AddTaskSheet({ open, onClose, telegramId, selectedDate }) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);

  const now = new Date();
  const baseDateProp = selectedDate || now; // из родителя
  const [localDate, setLocalDate] = useState(baseDateProp); // локальная дата внутри формы

  const roundToQuarter = (d) => {
    const ms = 15 * 60 * 1000;
    return new Date(Math.ceil(d.getTime() / ms) * ms);
  };

  // старт по умолчанию: ближайшая «четверть» сегодня, иначе 10:00
  const defStart = useMemo(() => {
    const d = new Date(baseDateProp);
    if (new Date().toDateString() === d.toDateString()) return roundToQuarter(new Date());
    d.setHours(10, 0, 0, 0);
    return d;
    // eslint-disable-next-line
  }, [open]);

  const [sh, setSh] = useState(defStart.getHours()); // start hour
  const [sm, setSm] = useState(defStart.getMinutes() - (defStart.getMinutes() % 15)); // start minutes (кратно 15)
  const [duration, setDuration] = useState(15); // в минутах

  const [color, setColor] = useState(COLORS[0]);
  const [repeat, setRepeat] = useState("once"); // once|daily|weekly|monthly
  const [notes, setNotes] = useState("");
  const [subtasks, setSubtasks] = useState([]);

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isDurPickerOpen, setIsDurPickerOpen] = useState(false);

  // дата/время старта и конца (из локальной даты + ш/м)
  const startDate = useMemo(() => {
    const d = new Date(localDate);
    d.setHours(sh, sm, 0, 0);
    return d;
  }, [localDate, sh, sm]);

  const endDate = useMemo(() => {
    if (allDay) return null;
    const d = new Date(startDate);
    d.setMinutes(d.getMinutes() + duration);
    return d;
  }, [startDate, duration, allDay]);

  const totalHuman = useMemo(() => {
    const m = duration;
    const h = Math.floor(m / 60),
      mm = m % 60;
    if (h && mm) return `${h}ч ${mm}м`;
    if (h) return `${h}ч`;
    return `${mm}м`;
  }, [duration]);

  // что показывать на ИНЛАЙН-колёсах (квартальные значения)
const smInline = useMemo(() => nearestQuarter(sm), [sm]);
const endInlineMin = useMemo(() => {
  const end = new Date(startDate.getTime() + duration * 60000);
  return nearestQuarter(end.getMinutes());
}, [startDate, duration]);

  // сброс при закрытии
  useEffect(() => {
    if (!open) {
      setTitle("");
      setAllDay(false);
      setSm(defStart.getMinutes() - (defStart.getMinutes() % 15));
      setSh(defStart.getHours());
      setDuration(15);
      setNotes("");
      setSubtasks([]);
      setRepeat("once");
      setColor(COLORS[0]);
      setIsTimePickerOpen(false);
      setIsDurPickerOpen(false);
      setLocalDate(baseDateProp);
    }
    // eslint-disable-next-line
  }, [open]);

  const addSubtask = () => {
    const t = prompt("Подзадача:");
    if (t) setSubtasks((s) => [...s, { id: Date.now(), text: t }]);
  };
  const removeSubtask = (id) => setSubtasks((s) => s.filter((x) => x.id !== id));

  const handleSubmit = async () => {
    if (!telegramId) return;
    if (!title.trim()) {
      alert("Введите название задачи");
      return;
    }
    const dateISO = (d) => (d ? new Date(d).toISOString() : null);

    const payload = {
      telegram_id: telegramId,
      title: title.trim(),
      description: notes || null,
      start_dt: allDay
        ? new Date(new Date(localDate).setHours(0, 0, 0, 0)).toISOString()
        : dateISO(startDate),
      end_dt: allDay ? null : dateISO(endDate),
      all_day: allDay,
      for_user: null,
    };

    try {
      await createTask(payload);
      onClose();
    } catch (e) {
      alert(`Ошибка сохранения: ${e.message}`);
    }
  };

  return (
    <div className={`sheet ${open ? "sheet--open" : ""}`}>
      <div className="sheet-backdrop" onClick={onClose} />

      <div className="sheet-panel" role="dialog" aria-modal>
        <div className="sheet-grabber" />

        {/* Заголовок */}
        <div className="sheet-title">Новая задача</div>

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

        {/* Когда? — инлайн 4 колёсика + дата + «Подробнее…» */}
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
            <>
              <div className="time-inline">
                {/* ЧАС начала */}
                <WheelPicker ariaLabel="час начала" values={hours} value={sh} onChange={setSh} />
                {/* МИН начала: показываем ближайшую четверть, а при прокрутке — прыгаем на неё */}
                <WheelPicker
                    ariaLabel="минуты начала"
                    values={MINS15}
                    value={smInline}
                    onChange={(m) => setSm(m)}   // пользователь выбрал четверть — делаем минуту ровно ей
                />
                {/* ЧАС конца — меняем duration */}
                <WheelPicker
                  ariaLabel="час конца"
                  values={hours}
                  value={new Date(startDate.getTime() + duration * 60000).getHours()}
                  onChange={(h) => {
                    const curEnd = new Date(startDate.getTime() + duration * 60000);
                    const end = new Date(startDate);
                    end.setHours(h, curEnd.getMinutes(), 0, 0);
                    const m = Math.max(1, Math.round((end - startDate) / 60000));
                    setDuration(m);
                  }}
                />
                {/* МИН конца: показываем ближайшую четверть, при прокрутке пересчитываем duration */}
                <WheelPicker
                    ariaLabel="минуты конца"
                    values={MINS15}
                    value={endInlineMin}
                    onChange={(m) => {
                        const curEnd = new Date(startDate.getTime() + duration * 60000);
                        const end = new Date(startDate);
                        end.setHours(curEnd.getHours(), m, 0, 0);
                        const minsDiff = Math.max(1, Math.round((end - startDate) / 60000));
                        setDuration(minsDiff);
                    }}
                />
              </div>

              <div className="addpanel-row" style={{ marginTop: 8 }}>
                <div className="addpanel-hint">
                  {mm2(startDate.getHours())}:{mm2(startDate.getMinutes())} —{" "}
                  {mm2(endDate.getHours())}:{mm2(endDate.getMinutes())} ({totalHuman})
                </div>
                <button className="link" type="button" onClick={() => setIsTimePickerOpen(true)}>
                  Подробнее…
                </button>
              </div>
            </>
          ) : (
            <div className="all-day-hint">🗓 Весь день</div>
          )}
        </div>

        {/* Как долго (пресеты + подробности) */}
        {!allDay && (
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

        {/* Какой цвет */}
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

        {/* Как часто */}
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
          <div className="section-title">Нужны подробности?</div>
          <button className="subtask-add" onClick={addSubtask} type="button">
            + Добавить подзадачу
          </button>
          {subtasks.length > 0 && (
            <ul className="subtasks">
              {subtasks.map((s) => (
                <li key={s.id}>
                  {s.text}
                  <button onClick={() => removeSubtask(s.id)} type="button">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <textarea
            className="notes"
            placeholder="Заметки, ссылки, телефоны…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Кнопка «Добавить» — скрываем если открыт внутренний шит */}
        {!isTimePickerOpen && !isDurPickerOpen && (
          <button className="submit-btn" onClick={handleSubmit}>
            Добавить задачу
          </button>
        )}
      </div>

      {/* Внутренний шит: выбор времени интервала (поминутно) */}
      <div className={`inner-sheet ${isTimePickerOpen ? "inner-sheet--open" : ""}`}>
        <div
          className="inner-grabber"
          onTouchStart={(e) => {
            e.currentTarget._y0 = e.touches[0].clientY;
          }}
          onTouchMove={(e) => {
            const y = e.touches[0].clientY;
            const y0 = e.currentTarget._y0 ?? y;
            const dy = Math.max(0, y - y0);
            const panel = e.currentTarget.closest(".inner-sheet");
            if (panel) panel.style.transform = `translateY(${dy}px)`;
          }}
          onTouchEnd={(e) => {
            const panel = e.currentTarget.closest(".inner-sheet");
            if (!panel) return;
            const m = panel.style.transform.match(/translateY\((\d+)px\)/);
            const dy = m ? parseInt(m[1], 10) : 0;
            panel.style.transform = "";
            if (dy > 60) setIsTimePickerOpen(false);
          }}
        />
        <div className="inner-title">Выбор времени</div>
        <div className="inner-sub">Данная задача займёт {totalHuman}</div>

        <div className="wheels">
          <WheelPicker ariaLabel="час начала" values={hours} value={sh} onChange={setSh} />
          <WheelPicker ariaLabel="минуты начала" values={MINS60} value={sm} onChange={setSm} />
          <div className="arrow">→</div>
          <WheelPicker
            ariaLabel="час конца"
            values={hours}
            value={new Date(startDate.getTime() + duration * 60000).getHours()}
            onChange={(h) => {
              const curEnd = new Date(startDate.getTime() + duration * 60000);
              const end = new Date(startDate);
              end.setHours(h, curEnd.getMinutes(), 0, 0);
              const m = Math.max(1, Math.round((end - startDate) / 60000));
              setDuration(m);
            }}
          />
          <WheelPicker
            ariaLabel="минуты конца"
            values={MINS60}
            value={new Date(startDate.getTime() + duration * 60000).getMinutes()}
            onChange={(m) => {
              const curEnd = new Date(startDate.getTime() + duration * 60000);
              const end = new Date(startDate);
              end.setHours(curEnd.getHours(), m, 0, 0);
              const minsDiff = Math.max(1, Math.round((end - startDate) / 60000));
              setDuration(minsDiff);
            }}
          />
        </div>

        <button className="inner-close" onClick={() => setIsTimePickerOpen(false)}>
          Готово
        </button>
      </div>

      {/* Внутренний шит: выбор длительности */}
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
            <button key={p.m} className="chip" onClick={() => setDuration(p.m)}>
              {p.label}
            </button>
          ))}
        </div>

        <button className="inner-close" onClick={() => setIsDurPickerOpen(false)}>
          Готово
        </button>
      </div>
    </div>
  );
}