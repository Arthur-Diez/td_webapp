import React, { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_RECURRENCE,
  WEEKDAYS,
  formatDateInput,
  formatDateTimeInput,
  sanitizeRule,
} from "../utils/recurrence";
import "./RecurrenceModal.css";

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

const monthWeekOptions = [
  { value: 1, label: "1-я" },
  { value: 2, label: "2-я" },
  { value: 3, label: "3-я" },
  { value: 4, label: "4-я" },
  { value: -1, label: "последняя" },
];

const freqOptions = [
  { value: "DAILY", label: "дней" },
  { value: "WEEKLY", label: "недель" },
  { value: "MONTHLY", label: "месяцев" },
];

const DEFAULT_SHIFT = 30;

const cloneRule = (rule) => ({ ...DEFAULT_RECURRENCE, ...sanitizeRule(rule || {}) });

export default function RecurrenceModal({
  open,
  onClose,
  onApply,
  startDate,
  initialRule,
}) {
  const [rule, setRule] = useState(cloneRule(initialRule));
  const [showCustom, setShowCustom] = useState(false);
  const [quickEveryN, setQuickEveryN] = useState(2);
  const [quickEveryUnit, setQuickEveryUnit] = useState("DAILY");
  const [monthWeekDay, setMonthWeekDay] = useState("MO");

  useEffect(() => {
    if (open) {
      const nextRule = cloneRule(initialRule);
      setRule(nextRule);
      if (typeof nextRule.bySetPos === "number" && nextRule.byDay?.length) {
        setMonthWeekDay(nextRule.byDay[0]);
      } else {
        setMonthWeekDay("MO");
      }
    }
  }, [open, initialRule]);

  const updateRule = (updates) => {
    setRule((prev) => ({ ...prev, ...updates }));
  };

  const toggleWeekday = (day) => {
    setRule((prev) => {
      const exists = prev.byDay.includes(day);
      const next = exists ? prev.byDay.filter((d) => d !== day) : [...prev.byDay, day];
      return {
        ...prev,
        freq: next.length ? "WEEKLY" : prev.freq,
        bySetPos: next.length ? null : prev.bySetPos,
        byDay: next,
      };
    });
  };

  const toggleMonthDay = (value) => {
    setRule((prev) => {
      const exists = prev.byMonthDay.includes(value);
      const next = exists ? prev.byMonthDay.filter((d) => d !== value) : [...prev.byMonthDay, value];
      return {
        ...prev,
        freq: next.length ? "MONTHLY" : prev.freq,
        bySetPos: next.length ? null : prev.bySetPos,
        byMonthDay: next,
      };
    });
  };

  const applyMonthWeek = (pos) => {
    if (pos === null) {
      updateRule({ bySetPos: null });
      return;
    }
    setRule((prev) => ({
      ...prev,
      freq: "MONTHLY",
      bySetPos: pos,
      byMonthDay: [],
      byDay: [monthWeekDay],
    }));
  };

  const currentMonthWeek = typeof rule.bySetPos === "number" ? rule.bySetPos : null;

  const addExdate = (value) => {
    if (!value) return;
    setRule((prev) => {
      if (prev.exdates.includes(value)) return prev;
      return { ...prev, exdates: [...prev.exdates, value] };
    });
  };

  const addRdate = (value) => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    setRule((prev) => {
      const exists = prev.rdates.some((d) => formatDateTimeInput(d) === formatDateTimeInput(date));
      if (exists) return prev;
      return { ...prev, rdates: [...prev.rdates, date] };
    });
  };

  const applyQuickPreset = (base) => {
    setRule((prev) => ({
      ...prev,
      ...base,
      exdates: [...prev.exdates],
      rdates: prev.rdates.map((d) => (d instanceof Date ? new Date(d) : new Date(d))),
      skipPolicy: prev.skipPolicy,
      shiftN: prev.shiftN,
      until: prev.until,
      count: prev.count,
    }));
    setShowCustom(false);
  };

  const quickPresets = useMemo(
    () => [
      {
        id: "weekday",
        label: "Каждый будний (Пн–Пт)",
        action: () =>
          applyQuickPreset({
            freq: "WEEKLY",
            interval: 1,
            byDay: ["MO", "TU", "WE", "TH", "FR"],
            byMonthDay: [],
            bySetPos: null,
          }),
      },
      {
        id: "weekend",
        label: "По выходным (Сб, Вс)",
        action: () =>
          applyQuickPreset({
            freq: "WEEKLY",
            interval: 1,
            byDay: ["SA", "SU"],
            byMonthDay: [],
            bySetPos: null,
          }),
      },
      {
        id: "firstWeekday",
        label: "В первый будний месяца",
        action: () =>
          applyQuickPreset({
            freq: "MONTHLY",
            interval: 1,
            byDay: ["MO", "TU", "WE", "TH", "FR"],
            byMonthDay: [],
            bySetPos: 1,
          }),
      },
      {
        id: "lastMonthDay",
        label: "В последний день месяца",
        action: () =>
          applyQuickPreset({
            freq: "MONTHLY",
            interval: 1,
            byDay: [],
            byMonthDay: [-1],
            bySetPos: null,
          }),
      },
      {
        id: "monthDays",
        label: "По числам: 1, 15, 30",
        action: () =>
          applyQuickPreset({
            freq: "MONTHLY",
            interval: 1,
            byDay: [],
            byMonthDay: [1, 15, 30],
            bySetPos: null,
          }),
      },
      {
        id: "weekdays135",
        label: "По дням недели: Пн, Ср, Пт",
        action: () =>
          applyQuickPreset({
            freq: "WEEKLY",
            interval: 1,
            byDay: ["MO", "WE", "FR"],
            byMonthDay: [],
            bySetPos: null,
          }),
      },
    ],
    []
  );

  const handleSave = () => {
    const cleaned = sanitizeRule(rule);
    onApply(cleaned);
    onClose();
  };

  return (
    <div className={`rec-modal ${open ? "rec-modal--open" : ""}`}>
      <div className="rec-modal__backdrop" onClick={onClose} />
      <div className="rec-modal__panel" role="dialog" aria-modal>
        <div className="rec-modal__header">
          <div className="rec-modal__title">Расширенные повторы</div>
          <button type="button" className="rec-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="rec-modal__section">
          <div className="rec-modal__section-title">Быстрые пресеты</div>
          <div className="rec-modal__preset-grid">
            {quickPresets.map((preset) => (
              <button key={preset.id} type="button" className="rec-modal__preset" onClick={preset.action}>
                {preset.label}
              </button>
            ))}
            <div className="rec-modal__preset rec-modal__preset--inline">
              <div className="rec-modal__preset-label">Каждые</div>
              <input
                type="number"
                className="rec-modal__number"
                min={1}
                value={quickEveryN}
                onChange={(e) => setQuickEveryN(Math.max(1, Number(e.target.value) || 1))}
              />
              <select
                className="rec-modal__select"
                value={quickEveryUnit}
                onChange={(e) => setQuickEveryUnit(e.target.value)}
              >
                {freqOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rec-modal__apply"
                onClick={() =>
                  applyQuickPreset({
                    freq: quickEveryUnit,
                    interval: quickEveryN,
                    byDay: [],
                    byMonthDay: [],
                    bySetPos: null,
                  })
                }
              >
                Применить
              </button>
            </div>
          </div>
        </div>

        <div className="rec-modal__section">
          <button
            type="button"
            className="rec-modal__collapse"
            onClick={() => setShowCustom((v) => !v)}
          >
            <span>Свои настройки</span>
            <span>{showCustom ? "−" : "+"}</span>
          </button>
          {showCustom && (
            <div className="rec-modal__custom">
              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Периодичность</div>
                <div className="rec-modal__inline">
                  <span>Каждые</span>
                  <input
                    type="number"
                    min={1}
                    className="rec-modal__number"
                    value={rule.interval}
                    onChange={(e) => updateRule({ interval: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <select
                    className="rec-modal__select"
                    value={rule.freq}
                    onChange={(e) => updateRule({ freq: e.target.value })}
                  >
                    <option value="DAILY">дней</option>
                    <option value="WEEKLY">недель</option>
                    <option value="MONTHLY">месяцев</option>
                  </select>
                </div>
              </div>

              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Дни недели</div>
                <div className="rec-modal__chips">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`rec-modal__chip ${rule.byDay.includes(day.value) && !rule.bySetPos ? "rec-modal__chip--active" : ""}`}
                      onClick={() => {
                        updateRule({ bySetPos: null });
                        toggleWeekday(day.value);
                      }}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
                <p className="rec-modal__hint">Если выбраны дни недели — используется недельная периодичность.</p>
              </div>

              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Числа месяца</div>
                <div className="rec-modal__day-grid">
                  {monthDays.map((day) => (
                    <button
                      type="button"
                      key={day}
                      className={`rec-modal__chip ${rule.byMonthDay.includes(day) ? "rec-modal__chip--active" : ""}`}
                      onClick={() => {
                        updateRule({ bySetPos: null });
                        toggleMonthDay(day);
                      }}
                    >
                      {day}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`rec-modal__chip ${rule.byMonthDay.includes(-1) ? "rec-modal__chip--active" : ""}`}
                    onClick={() => {
                      updateRule({ bySetPos: null });
                      toggleMonthDay(-1);
                    }}
                  >
                    Последний
                  </button>
                </div>
                <p className="rec-modal__hint">Если выбраны числа — используется месячная периодичность. При выборе «последний день месяца» учитываем 28/29/30/31 автоматически.</p>
              </div>

              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Неделя месяца</div>
                <div className="rec-modal__inline rec-modal__inline--wrap">
                  {monthWeekOptions.map((opt) => (
                    <label key={opt.value} className="rec-modal__radio">
                      <input
                        type="radio"
                        name="monthWeek"
                        checked={currentMonthWeek === opt.value}
                        onChange={() => applyMonthWeek(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                  <button
                    type="button"
                    className="rec-modal__apply rec-modal__apply--ghost"
                    onClick={() => applyMonthWeek(null)}
                  >
                    Сбросить
                  </button>
                </div>
                <select
                  className="rec-modal__select"
                  value={monthWeekDay}
                  onChange={(e) => {
                    setMonthWeekDay(e.target.value);
                    if (currentMonthWeek !== null) {
                      updateRule({ byDay: [e.target.value] });
                    }
                  }}
                  disabled={currentMonthWeek === null}
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.long}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Окончание</div>
                <div className="rec-modal__end">
                  <label className="rec-modal__radio">
                    <input
                      type="radio"
                      checked={!rule.until && !rule.count}
                      onChange={() => updateRule({ until: null, count: null })}
                    />
                    <span>Без конца</span>
                  </label>
                  <label className="rec-modal__radio">
                    <input
                      type="radio"
                      checked={!!rule.until}
                      onChange={() => updateRule({ until: rule.until || new Date(startDate) })}
                    />
                    <span>До даты</span>
                  </label>
                  <input
                    type="date"
                    className="rec-modal__select"
                    value={formatDateInput(rule.until)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) updateRule({ until: null });
                      else {
                        const [y, m, d] = value.split("-").map(Number);
                        const next = new Date(startDate);
                        next.setFullYear(y, m - 1, d);
                        next.setHours(23, 59, 59, 0);
                        updateRule({ until: next, count: null });
                      }
                    }}
                  />
                  <label className="rec-modal__radio">
                    <input
                      type="radio"
                      checked={!!rule.count}
                      onChange={() => updateRule({ count: rule.count || 5, until: null })}
                    />
                    <span>Количество повторов</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="rec-modal__number"
                    value={rule.count || ""}
                    onChange={(e) => updateRule({ count: Math.max(1, Number(e.target.value) || 1), until: null })}
                  />
                </div>
              </div>

              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Исключения (EXDATE)</div>
                <div className="rec-modal__inline">
                  <input
                    type="date"
                    className="rec-modal__select"
                    onChange={(e) => {
                      addExdate(e.target.value);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="rec-modal__tagline">
                  {rule.exdates.length === 0 && <span className="rec-modal__hint">Нет исключений</span>}
                  {rule.exdates.map((date) => (
                    <span key={date} className="rec-modal__tag">
                      {date}
                      <button
                        type="button"
                        onClick={() =>
                          setRule((prev) => ({
                            ...prev,
                            exdates: prev.exdates.filter((d) => d !== date),
                          }))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Дополнительные даты (RDATE)</div>
                <div className="rec-modal__inline">
                  <input
                    type="datetime-local"
                    className="rec-modal__select"
                    onChange={(e) => {
                      addRdate(e.target.value);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="rec-modal__tagline">
                  {rule.rdates.length === 0 && <span className="rec-modal__hint">Нет дополнительных дат</span>}
                  {rule.rdates.map((date) => (
                    <span key={formatDateTimeInput(date)} className="rec-modal__tag">
                      {formatDateTimeInput(date)}
                      <button
                        type="button"
                        onClick={() =>
                          setRule((prev) => ({
                            ...prev,
                            rdates: prev.rdates.filter((d) => formatDateTimeInput(d) !== formatDateTimeInput(date)),
                          }))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="rec-modal__block">
                <div className="rec-modal__block-title">Политика переносов</div>
                <div className="rec-modal__inline rec-modal__inline--wrap">
                  {[
                    { value: "skip", label: "Пропустить" },
                    { value: "next_weekday", label: "Следующий будний" },
                    { value: "shift_n", label: "Сдвиг на N минут" },
                  ].map((option) => (
                    <label key={option.value} className="rec-modal__radio">
                      <input
                        type="radio"
                        checked={rule.skipPolicy === option.value}
                        onChange={() =>
                          updateRule({
                            skipPolicy: option.value,
                            shiftN: option.value === "shift_n" ? rule.shiftN || DEFAULT_SHIFT : null,
                          })
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                  {rule.skipPolicy === "shift_n" && (
                    <input
                      type="number"
                      className="rec-modal__number"
                      min={1}
                      value={rule.shiftN || DEFAULT_SHIFT}
                      onChange={(e) => updateRule({ shiftN: Math.max(1, Number(e.target.value) || DEFAULT_SHIFT) })}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rec-modal__footer">
          <button type="button" className="rec-modal__btn rec-modal__btn--ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="rec-modal__btn" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}