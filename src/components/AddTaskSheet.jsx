// src/components/AddTaskSheet.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./AddTaskSheet.css";
import WheelPicker from "./WheelPicker";
import RecurrenceModal from "./RecurrenceModal";
import RepeatTemplateManager from "./RepeatTemplateManager";
import {
  createTask,
  getTimezone,
  getRepeatTemplates,
  createRepeatTemplate,
  updateRepeatTemplate,
  deleteRepeatTemplate,
  useRepeatTemplate,
} from "../utils/api";
import {
  DEFAULT_RECURRENCE,
  WEEKDAYS,
  buildRRuleString,
  detectSimpleChip,
  formatWithOffset,
  generateOccurrences,
  sanitizeRule,
  summarizeRecurrence,
  payloadFromRule,
  ruleFromPayload,
  toUtcDate,
} from "../utils/recurrence";

const mm2 = (n) => String(n).padStart(2, "0");
const hours = Array.from({ length: 24 }, (_, h) => ({ label: mm2(h), value: h }));

// минуты: и в инлайне, и в подробном окне показываем 0..59
const MINS60 = Array.from({ length: 60 }, (_, m) => ({ label: mm2(m), value: m }));

const DUR_PRESETS = [
  { label: "15м", m: 15 },
  { label: "30м", m: 30 },
  { label: "45м", m: 45 },
  { label: "1ч", m: 60 },
  { label: "1ч 30м", m: 90 },
];
const COLORS = ["#F06292", "#FFB74D", "#FFD54F", "#AED581", "#64B5F6", "#81C784", "#BA68C8"];
const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
  label: mm2(m),
  value: m,
}));

const MINUTES_IN_DAY = 24 * 60;
const QUARTER = 15;
const QUARTER_ITEMS = MINUTES_IN_DAY / QUARTER; // 96 позиций
const QUARTER_CENTER = Math.floor(QUARTER_ITEMS / 2);

const formatTime = (totalMinutes) => {
  const minutes = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${mm2(h)}:${mm2(m)}`;
};

const formatIntervalLabel = (startMinutes, duration, skipEnd) => {
  if (skipEnd) return formatTime(startMinutes);
  const endTotal = startMinutes + duration;
  const nextDaySuffix = endTotal >= MINUTES_IN_DAY ? " (+1 день)" : "";
  return `${formatTime(startMinutes)} – ${formatTime(endTotal)}${nextDaySuffix}`;
};

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
  const [recurrenceRule, setRecurrenceRule] = useState(null);
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
  const [timezoneOffset, setTimezoneOffset] = useState(-new Date().getTimezoneOffset());
  const [notes, setNotes] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isDurPickerOpen, setIsDurPickerOpen] = useState(false);
  const [isNotifyPickerOpen, setIsNotifyPickerOpen] = useState(false);
  // «без временного интервала» (есть только время начала)
  const [noEnd, setNoEnd] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [repeatTemplateId, setRepeatTemplateId] = useState(null);
  const [repeatTemplates, setRepeatTemplates] = useState([]);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  // какое колесо пользователь «тапнул»: 'sh' | 'sm' | 'interval' | null
  const [pickedWheel, setPickedWheel] = useState(null);
  const openTimeSheet = (key) => { setPickedWheel(key); setIsTimePickerOpen(true); };

  const [notifications, setNotifications] = useState({
    start: true,
    end: false,
    beforeEnd15: false,
  });
  const [customNotify, setCustomNotify] = useState({ hours: 0, minutes: 15 });

  useEffect(() => {
    if (!open || !telegramId) return undefined;
    const controller = new AbortController();
    getTimezone(telegramId, controller.signal)
      .then((data) => {
        if (typeof data?.offset_min === "number") {
          setTimezoneOffset(data.offset_min);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open, telegramId]);

  const loadTemplates = useCallback(
    (signal) => {
      if (!telegramId) return;
      setTemplateLoading(true);
      getRepeatTemplates(telegramId, signal)
        .then((data) => {
          if (Array.isArray(data)) {
            setRepeatTemplates(data);
            setTemplateError(null);
          }
        })
        .catch((err) => {
          if (signal && err.name === "AbortError") return;
          setTemplateError("Не удалось загрузить шаблоны");
        })
        .finally(() => setTemplateLoading(false));
    },
    [telegramId]
  );

  useEffect(() => {
    if (!open || !telegramId) return undefined;
    const controller = new AbortController();
    loadTemplates(controller.signal);
    return () => controller.abort();
  }, [open, telegramId, loadTemplates]);

  const startDate = useMemo(() => {
    const d = new Date(localDate);
    if (allDay) d.setHours(0, 0, 0, 0);
    else d.setHours(sh, sm, 0, 0);
    return d;
  }, [localDate, sh, sm, allDay]);

  const startMinutes = useMemo(
    () => ((sh * 60 + sm) % MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY,
    [sh, sm]
  );

  const endDate = useMemo(() => {
    if (allDay || noEnd) return null;
    const d = new Date(startDate);
    d.setMinutes(d.getMinutes() + duration);
    return d;
  }, [startDate, duration, allDay, noEnd]);

  const intervalValues = useMemo(
    () =>
      Array.from({ length: QUARTER_ITEMS }, (_, idx) => {
        const offset = idx - QUARTER_CENTER;
        const start = (startMinutes + offset * QUARTER + MINUTES_IN_DAY) % MINUTES_IN_DAY;
        return {
          value: start,
          label: formatTime(start),
        };
      }),
    [startMinutes]
  );

  useEffect(() => {
    if (noEnd || allDay) return;
    const aligned = Math.round(startMinutes / QUARTER) * QUARTER;
    const normalized = ((aligned % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    if (normalized !== startMinutes) {
      const h = Math.floor(normalized / 60);
      const m = normalized % 60;
      setSh(h);
      setSm(m);
    }
  }, [allDay, noEnd, startMinutes]);

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
      setRecurrenceRule(null);
      setColor(COLORS[0]);
      setIsTimePickerOpen(false);
      setIsDurPickerOpen(false);
      setIsNotifyPickerOpen(false);
      setLocalDate(baseDateProp);
      setPickedWheel(null);
      setNoEnd(false);
      setNotifications({ start: true, end: false, beforeEnd15: false });
      setCustomNotify({ hours: 0, minutes: 15 });
      setIsRecurrenceModalOpen(false);
      setSaveAsTemplate(false);
      setRepeatTemplateId(null);
      setTemplateSearch("");
      setTemplateError(null);
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

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCustomNotify = () => {
    const { hours, minutes } = customNotify;
    if (!hours && !minutes) return null;
    const parts = [];
    if (hours) parts.push(`${hours}ч`);
    if (minutes) parts.push(`${minutes}м`);
    return `за ${parts.join(" ")} до начала`;
  };

  const notificationSummary = () => {
    const active = [];
    if (notifications.start) active.push("в момент начала");
    if (notifications.end) active.push("в момент окончания");
    if (notifications.beforeEnd15) active.push("за 15 мин до окончания");
    const custom = formatCustomNotify();
    if (custom) active.push(custom);
    if (active.length === 0) return "напоминания отключены";
    return active.join(" · ");
  };

  const sanitizedRecurrence = useMemo(
    () => (recurrenceRule ? sanitizeRule(recurrenceRule) : null),
    [recurrenceRule]
  );

  const repeatUiPayload = useMemo(
    () =>
      sanitizedRecurrence
        ? payloadFromRule({ rule: sanitizedRecurrence, startDate, allDay })
        : null,
    [sanitizedRecurrence, startDate, allDay]
  );

  const decoratedTemplates = useMemo(() => {
    return repeatTemplates
      .filter(Boolean)
      .map((tpl) => {
        const payload = tpl.payload || null;
        if (!payload) return { ...tpl, summary: "" };
        const base = new Date(startDate);
        const hasTime = typeof payload.time === "string" && payload.time.length > 0;
        const isAllDayFromPayload = !hasTime;
        if (hasTime) {
          const [h, m] = payload.time.split(":").map(Number);
          if (!Number.isNaN(h) && !Number.isNaN(m)) {
            base.setHours(h, m, 0, 0);
          }
        } else {
          base.setHours(0, 0, 0, 0);
        }
        const rule = ruleFromPayload({ payload, startDate: base });
        const summaryText = summarizeRecurrence({
          rule,
          startDate: base,
          allDay: isAllDayFromPayload,
          offsetMin: timezoneOffset,
        });
        return {
          ...tpl,
          payload,
          rule,
          allDay: isAllDayFromPayload,
          summary: summaryText.replace(/^Повторяется\s*/i, "").trim(),
        };
      });
  }, [repeatTemplates, startDate, timezoneOffset]);

  const topTemplateChips = useMemo(() => decoratedTemplates.slice(0, 5), [decoratedTemplates]);

  const activeTemplate = useMemo(
    () => decoratedTemplates.find((tpl) => tpl.id === repeatTemplateId) || null,
    [decoratedTemplates, repeatTemplateId]
  );

  useEffect(() => {
    if (repeatTemplateId && !decoratedTemplates.some((tpl) => tpl.id === repeatTemplateId)) {
      setRepeatTemplateId(null);
    }
  }, [decoratedTemplates, repeatTemplateId]);

  const cloneRecurrence = (rule) => {
    if (!rule) return null;
    return {
      ...rule,
      byDay: [...rule.byDay],
      byMonthDay: [...rule.byMonthDay],
      exdates: [...rule.exdates],
      rdates: rule.rdates.map((d) => (d instanceof Date ? new Date(d) : new Date(d))),
    };
  };

  const applyRecurrencePreset = (updates) => {
    setRepeatTemplateId(null);
    setRecurrenceRule((prev) => {
      const base = cloneRecurrence(sanitizeRule(prev || DEFAULT_RECURRENCE));
      if (!base) return sanitizeRule({ ...DEFAULT_RECURRENCE, ...updates });
      const next = { ...base, ...updates };
      if (!("byDay" in updates)) next.byDay = base.byDay;
      if (!("byMonthDay" in updates)) next.byMonthDay = base.byMonthDay;
      if (!("exdates" in updates)) next.exdates = base.exdates;
      if (!("rdates" in updates)) next.rdates = base.rdates;
      if (!("bySetPos" in updates)) next.bySetPos = base.bySetPos;
      if (!("until" in updates)) next.until = base.until;
      if (!("count" in updates)) next.count = base.count;
      if (!("skipPolicy" in updates)) next.skipPolicy = base.skipPolicy;
      if (!("shiftN" in updates)) next.shiftN = base.shiftN;
      return next;
    });
  };

  const handleRepeatChip = (key) => {
    setRepeatTemplateId(null);
    if (key === "once") {
      setRecurrenceRule(null);
      return;
    }
    if (key === "daily") {
      applyRecurrencePreset({
        freq: "DAILY",
        interval: 1,
        byDay: [],
        byMonthDay: [],
        bySetPos: null,
      });
    }
    if (key === "weekly") {
      const startWeekday = WEEKDAYS[(startDate.getDay() + 6) % 7]?.value || "MO";
      applyRecurrencePreset({
        freq: "WEEKLY",
        interval: 1,
        byDay: [startWeekday],
        byMonthDay: [],
        bySetPos: null,
      });
    }
    if (key === "monthly") {
      applyRecurrencePreset({
        freq: "MONTHLY",
        interval: 1,
        byDay: [],
        byMonthDay: [startDate.getDate()],
        bySetPos: null,
      });
    }
  };

  const serializeRule = (rule) => {
    if (!rule) return null;
    return JSON.stringify({
      freq: rule.freq,
      interval: Number(rule.interval || 1),
      byDay: [...rule.byDay].sort(),
      byMonthDay: [...rule.byMonthDay].sort(),
      bySetPos: typeof rule.bySetPos === "number" ? rule.bySetPos : null,
      until: rule.until ? rule.until.getTime() : null,
      count: rule.count || null,
      exdates: [...rule.exdates].sort(),
      rdates: rule.rdates
        .map((d) => (d instanceof Date ? d.getTime() : new Date(d).getTime()))
        .sort(),
      skipPolicy: rule.skipPolicy || "skip",
      shiftN: rule.skipPolicy === "shift_n" ? Number(rule.shiftN || 0) : null,
    });
  };

  const applyTemplate = (template) => {
    if (!template || !template.payload) return;
    const payload = template.payload;
    const hasTime = typeof payload.time === "string" && payload.time.length > 0;
    if (hasTime) {
      const [h, m] = payload.time.split(":").map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        setAllDay(false);
        setNoEnd(false);
        setSh(h);
        setSm(m);
      }
    } else {
      setAllDay(true);
      setNoEnd(false);
    }
    const base = new Date(localDate);
    base.setSeconds(0, 0);
    if (hasTime) {
      const [h, m] = payload.time.split(":").map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        base.setHours(h, m, 0, 0);
      }
    } else {
      base.setHours(0, 0, 0, 0);
    }
    const nextRule = ruleFromPayload({ payload, startDate: base });
    setRecurrenceRule(nextRule);
    setRepeatTemplateId(template.id);
    if (telegramId && template.id) {
      useRepeatTemplate(template.id, telegramId).catch(() => {});
    }
  };

  const handleCreateTemplateFromCurrent = async () => {
    if (!telegramId) return;
    if (!repeatUiPayload || !rruleString) {
      alert("Сначала настройте повтор");
      return;
    }
    const defaultName = recurrenceSummary
      ? recurrenceSummary.replace(/^Повторяется\s*/i, "").split(".")[0]
      : "Повтор";
    const name = window.prompt("Название шаблона", defaultName || "Повтор");
    if (!name || !name.trim()) return;
    const body = {
      uid: telegramId,
      name: name.trim(),
      payload: {
        ...repeatUiPayload,
        time: allDay ? null : `${mm2(startDate.getHours())}:${mm2(startDate.getMinutes())}`,
      },
      rrule: rruleString.startsWith("RRULE:") ? rruleString : `RRULE:${rruleString}`,
    };
    try {
      await createRepeatTemplate(body);
      loadTemplates();
    } catch (e) {
      alert("Не удалось сохранить шаблон");
    }
  };

  const handleRenameTemplate = async (template, name) => {
    if (!template?.id || !name.trim()) return;
    try {
      await updateRepeatTemplate(template.id, { name: name.trim() });
      loadTemplates();
    } catch (e) {
      alert("Не удалось переименовать шаблон");
    }
  };

  const handleTogglePinTemplate = async (template) => {
    if (!template?.id) return;
    const isPinned = template.pin_order !== null && template.pin_order !== undefined;
    const nextPin = isPinned ? null : Date.now();
    try {
      await updateRepeatTemplate(template.id, { pin_order: nextPin });
      loadTemplates();
    } catch (e) {
      alert("Не удалось обновить закрепление");
    }
  };

  const handleSetDefaultTemplate = async (template) => {
    if (!template?.id) return;
    try {
      await updateRepeatTemplate(template.id, { is_default: true });
      loadTemplates();
    } catch (e) {
      alert("Не удалось установить шаблон по умолчанию");
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!template?.id) return;
    if (!window.confirm(`Удалить шаблон «${template.name}»?`)) return;
    try {
      await deleteRepeatTemplate(template.id);
      if (repeatTemplateId === template.id) setRepeatTemplateId(null);
      loadTemplates();
    } catch (e) {
      alert("Не удалось удалить шаблон");
    }
  };

  const repeatKey = useMemo(
    () => (sanitizedRecurrence ? detectSimpleChip(sanitizedRecurrence, startDate) : "once"),
    [sanitizedRecurrence, startDate]
  );

  useEffect(() => {
    if (!sanitizedRecurrence) return;
    const key = detectSimpleChip(sanitizedRecurrence, startDate);
    if (key === "weekly") {
      const expectedDay = WEEKDAYS[(startDate.getDay() + 6) % 7]?.value || "MO";
      if (
        sanitizedRecurrence.byDay.length !== 1 ||
        sanitizedRecurrence.byDay[0] !== expectedDay
      ) {
        setRecurrenceRule((prev) => {
          if (!prev) return prev;
          const base = cloneRecurrence(sanitizeRule(prev));
          return { ...base, byDay: [expectedDay], byMonthDay: [], bySetPos: null };
        });
      }
    }
    if (key === "monthly") {
      const expectedDate = startDate.getDate();
      if (
        sanitizedRecurrence.byMonthDay.length !== 1 ||
        sanitizedRecurrence.byMonthDay[0] !== expectedDate
      ) {
        setRecurrenceRule((prev) => {
          if (!prev) return prev;
          const base = cloneRecurrence(sanitizeRule(prev));
          return { ...base, byMonthDay: [expectedDate], byDay: [], bySetPos: null };
        });
      }
    }
  }, [sanitizedRecurrence, startDate]);

  const sanitizedWithTime = useMemo(() => {
    if (!sanitizedRecurrence) return null;
    const next = { ...sanitizedRecurrence };
    if (allDay) next.time = null;
    else next.time = `${mm2(startDate.getHours())}:${mm2(startDate.getMinutes())}`;
    return next;
  }, [sanitizedRecurrence, startDate, allDay]);

  const recurrenceSummary = useMemo(
    () =>
      sanitizedWithTime
        ? summarizeRecurrence({
            rule: sanitizedWithTime,
            startDate,
            allDay,
            offsetMin: timezoneOffset,
          })
        : null,
    [sanitizedWithTime, startDate, allDay, timezoneOffset]
  );

  const recurrencePreviewDates = useMemo(
    () =>
      sanitizedWithTime
        ? generateOccurrences({
            rule: sanitizedWithTime,
            startDate,
            offsetMin: timezoneOffset,
            count: 6,
          })
        : [],
    [sanitizedWithTime, startDate, timezoneOffset]
  );

  const rruleString = useMemo(
    () => (sanitizedWithTime ? buildRRuleString(sanitizedWithTime, timezoneOffset) : null),
    [sanitizedWithTime, timezoneOffset]
  );

  const formatOccurrence = (date) => {
    const opts = {
      day: "2-digit",
      month: "short",
    };
    if (!allDay) {
      opts.hour = "2-digit";
      opts.minute = "2-digit";
    }
    return date.toLocaleString("ru-RU", opts);
  };

  const handleSubmit = async () => {
    if (!telegramId) return;
    if (!title.trim()) { alert("Введите название задачи"); return; }
    const startString = formatWithOffset(startDate, timezoneOffset);
    if (!startString) {
      alert("Не удалось определить дату начала");
      return;
    }
    const endString = !allDay && !noEnd && endDate ? formatWithOffset(endDate, timezoneOffset) : null;

    const payload = {
      telegram_id: telegramId,
      title: title.trim(),
      description: notes || null,
      start_dt: startString,
      end_dt: endString,
      all_day: allDay,
    };

    let templatePayload = null;

    if (sanitizedWithTime) {
      if (!rruleString) {
        alert("Не удалось сформировать правило повторения");
        return;
      }
      const rruleFull = rruleString.startsWith("RRULE:") ? rruleString : `RRULE:${rruleString}`;
      payload.recur_rule = rruleFull;
      payload.skip_policy = sanitizedWithTime.skipPolicy || "skip";
      payload.recur_until = sanitizedWithTime.until
        ? toUtcDate(sanitizedWithTime.until, timezoneOffset)?.toISOString()
        : null;
      payload.exdates = sanitizedWithTime.exdates?.length ? sanitizedWithTime.exdates : [];
      payload.rdates = sanitizedWithTime.rdates?.length
        ? sanitizedWithTime.rdates
            .map((d) => {
              const dt = d instanceof Date ? d : new Date(d);
              if (Number.isNaN(dt.getTime())) return null;
              const utc = toUtcDate(dt, timezoneOffset);
              return utc ? utc.toISOString() : null;
            })
            .filter(Boolean)
        : [];
      if (sanitizedWithTime.skipPolicy === "shift_n" && sanitizedWithTime.shiftN) {
        payload.shift_n = sanitizedWithTime.shiftN;
      } else {
        payload.shift_n = null;
      }
      if (repeatTemplateId) {
        payload.repeat_template_id = repeatTemplateId;
      }
      } else {
      payload.recur_rule = null;
      payload.recur_until = null;
      payload.exdates = [];
      payload.rdates = [];
      payload.skip_policy = undefined;
      payload.shift_n = null;
      delete payload.repeat_template_id;
    }

    if (saveAsTemplate && sanitizedWithTime && repeatUiPayload && rruleString) {
      const defaultName = recurrenceSummary
        ? recurrenceSummary.replace(/^Повторяется\s*/i, "").split(".")[0]
        : "Повтор";
      const name = window.prompt("Название шаблона", defaultName || "Повтор");
      if (name && name.trim()) {
        const makeDefault = window.confirm("Сделать шаблон по умолчанию?");
        templatePayload = {
          uid: telegramId,
          name: name.trim(),
          payload: {
            ...repeatUiPayload,
            time: allDay ? null : `${mm2(startDate.getHours())}:${mm2(startDate.getMinutes())}`,
          },
          rrule: rruleString.startsWith("RRULE:") ? rruleString : `RRULE:${rruleString}`,
          is_default: makeDefault || undefined,
        };
      }
    }

    try { await createTask(payload); onClose(); }
    catch (e) { alert(`Ошибка сохранения: ${e.message}`); }

    if (templatePayload) {
      try {
        await createRepeatTemplate(templatePayload);
        loadTemplates();
        setSaveAsTemplate(false);
      } catch (e) {
        alert("Задача создана, но шаблон сохранить не удалось");
      }
    }
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

  const onInlineIntervalChange = (start) => {
    setSh(Math.floor(start / 60));
    setSm(start % 60);
  };

  return (
    <div className={`sheet ${open ? "sheet--open" : ""}`}>
      <div className="sheet-backdrop" onClick={onClose} />

      <div className="sheet-panel" role="dialog" aria-modal>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div className="sheet-title">Новая задача</div>
          <button
            type="button"
            className="sheet-close"
            aria-label="Закрыть и вернуться"
            onClick={onClose}
          >
            ×
          </button>
        </div>

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

          {/* Когда? — инлайн колесо интервалов + выбор даты */}
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
            <div className={`time-inline ${noEnd ? "time-inline--two" : "time-inline--interval"}`}>
              {noEnd ? (
                <>
                  <WheelPicker
                    ariaLabel="час начала"
                    values={hours}
                    value={sh}
                    onChange={setSh}
                    onTap={() => openTimeSheet("sh")}
                    className={pickedWheel === "sh" ? "wheel--picked" : ""}
                  />
                  <WheelPicker
                    ariaLabel="минуты начала"
                    values={MINS60}
                    value={sm}
                    onChange={onInlineStartMinutes}
                    onTap={() => openTimeSheet("sm")}
                    className={pickedWheel === "sm" ? "wheel--picked" : ""}
                  />
                </>
              ) : (
                <div className="interval-wheel">
                  <WheelPicker
                    ariaLabel="временной интервал"
                    values={intervalValues}
                    value={startMinutes}
                    onChange={onInlineIntervalChange}
                    onTap={() => openTimeSheet("interval")}
                    className={`wheel--interval ${pickedWheel === "interval" ? "wheel--picked" : ""}`}
                  />
                  <div className="interval-current" aria-hidden>
                    {formatIntervalLabel(startMinutes, duration, noEnd)}
                  </div>
                </div>
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
            <div className="section-head">
              <div className="section-title">Как часто?</div>
              <button className="link" type="button" onClick={() => setIsRecurrenceModalOpen(true)}>
                Подробнее…
              </button>
            </div>
            <div className="chips">
              {[
                { k: "once", label: "Один раз" },
                { k: "daily", label: "Ежедневно" },
                { k: "weekly", label: "Еженедельно" },
                { k: "monthly", label: "Ежемесячно" },
              ].map((o) => (
                <button
                  key={o.k}
                  className={`chip ${repeatKey === o.k ? "chip--active" : ""}`}
                  onClick={() => handleRepeatChip(o.k)}
                  type="button"
                >
                  {o.label}
                </button>
              ))}
            </div>
            {templateLoading && <div className="template-hint">Загружаем шаблоны…</div>}
            {templateError && <div className="template-error">{templateError}</div>}
            {topTemplateChips.length > 0 && (
              <div className="template-chip-list">
                {topTemplateChips.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.id}
                    className={`template-chip ${repeatTemplateId === tpl.id ? "template-chip--active" : ""}`}
                    onClick={() => applyTemplate(tpl)}
                  >
                    <span className="template-chip__name">{tpl.name}</span>
                    {tpl.summary && (
                      <span className="template-chip__summary">{tpl.summary}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="link link--templates"
              onClick={() => setIsTemplateManagerOpen(true)}
            >
              Мои шаблоны
            </button>
            {recurrenceSummary && (
              <div className="recurrence-preview">
                <div className="recurrence-preview__summary">{recurrenceSummary}</div>
                {recurrencePreviewDates.length > 0 && (
                  <div className="recurrence-preview__upcoming">
                    <div className="recurrence-preview__label">Ближайшие повторения:</div>
                    <div className="recurrence-preview__list">
                      {recurrencePreviewDates.map((date, idx) => (
                        <span key={`${date.getTime()}-${idx}`} className="recurrence-preview__item">
                          {formatOccurrence(date)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            className="row toggler"
            onClick={() => setSaveAsTemplate((v) => !v)}
            type="button"
          >
            <div className={`check ${saveAsTemplate ? "check--on" : ""}`} />
            <div className="row-title">Сохранить как шаблон / по умолчанию</div>
          </button>
          {/* Оповещения */}
          <div className="section">
            <div className="section-head">
              <div className="section-title">Нужны оповещения?</div>
              <button
                className="link"
                type="button"
                onClick={() => setIsNotifyPickerOpen(true)}
              >
                Подробнее…
              </button>
            </div>
            <div className="notify-grid">
              <button
                type="button"
                className={`chip chip--toggle ${notifications.start ? "chip--active" : ""}`}
                onClick={() => toggleNotification("start")}
              >
                В момент начала
              </button>
              <button
                type="button"
                className={`chip chip--toggle ${notifications.end ? "chip--active" : ""}`}
                onClick={() => toggleNotification("end")}
              >
                В момент окончания
              </button>
              <button
                type="button"
                className={`chip chip--toggle ${notifications.beforeEnd15 ? "chip--active" : ""}`}
                onClick={() => toggleNotification("beforeEnd15")}
              >
                За 15 мин до окончания
              </button>
            </div>
            <div className="notify-summary">🔔 {notificationSummary()}</div>
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

        {!isTimePickerOpen && !isDurPickerOpen && !isNotifyPickerOpen && (
          <div className="sheet-footer">
            <button className="submit-btn" onClick={handleSubmit}>
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      {/* Подробный выбор времени (живое обновление) */}
      <div className={`inner-sheet ${isTimePickerOpen ? "inner-sheet--open" : ""}`}>
        <button
          className="inner-dismiss"
          type="button"
          aria-label="Закрыть выбор времени"
          onClick={() => { setIsTimePickerOpen(false); setPickedWheel(null); }}
        >
          <span aria-hidden>⌄</span>
        </button>
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
                value={new Date(startDate.getTime() + duration * 60000).getHours()}
                onChange={(h) => {
                  const curEnd = new Date(startDate.getTime() + duration * 60000);
                  const end = new Date(startDate);
                  end.setHours(h, curEnd.getMinutes(), 0, 0);
                  setDuration(durationFromEnd(end));
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
                  setDuration(durationFromEnd(end));
                }}
              />
            </>
          )}
        </div>

        <button
          className="inner-close"
          type="button"
          onClick={() => { setIsTimePickerOpen(false); setPickedWheel(null); }}
        >
          Готово
        </button>
      </div>

      {/* Подробный выбор длительности */}
      <div className={`inner-sheet ${isDurPickerOpen ? "inner-sheet--open" : ""}`}>
        <button
          className="inner-dismiss"
          type="button"
          aria-label="Закрыть выбор длительности"
          onClick={() => setIsDurPickerOpen(false)}
        >
          <span aria-hidden>⌄</span>
        </button>
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
            values={MINUTE_STEPS}
            value={duration % 60}
            onChange={(m) => setDuration(Math.floor(duration / 60) * 60 + m)}
          />
        </div>

        <div className="dur-presets">
          {DUR_PRESETS.map((p) => (
            <button key={p.m} className="chip" onClick={() => setDuration(p.m)}>{p.label}</button>
          ))}
        </div>

        <button className="inner-close" type="button" onClick={() => setIsDurPickerOpen(false)}>Готово</button>
      </div>

      <div className={`inner-sheet ${isNotifyPickerOpen ? "inner-sheet--open" : ""}`}>
        <button
          className="inner-dismiss"
          type="button"
          aria-label="Закрыть настройки оповещений"
          onClick={() => setIsNotifyPickerOpen(false)}
        >
          <span aria-hidden>⌄</span>
        </button>
        <div className="inner-title">Настроить оповещение</div>
        <div className="inner-sub">Укажите, за сколько предупредить о задаче</div>
        <div className="wheels">
          <WheelPicker
            ariaLabel="часы до начала"
            values={Array.from({ length: 13 }, (_, i) => ({ label: `${i}ч`, value: i }))}
            value={customNotify.hours}
            onChange={(hours) => setCustomNotify((prev) => ({ ...prev, hours }))}
          />
          <WheelPicker
            ariaLabel="минуты до начала"
            values={MINUTE_STEPS}
            value={customNotify.minutes}
            onChange={(minutes) => setCustomNotify((prev) => ({ ...prev, minutes }))}
          />
        </div>
        <button className="inner-close" type="button" onClick={() => setIsNotifyPickerOpen(false)}>Готово</button>
      </div>

      <RecurrenceModal
        open={isRecurrenceModalOpen}
        onClose={() => setIsRecurrenceModalOpen(false)}
        onApply={({ rule }) => {
          const nextRule = cloneRecurrence(rule);
          const matchesTemplate =
            repeatTemplateId && activeTemplate
              ? serializeRule(nextRule) === serializeRule(activeTemplate.rule)
              : false;
          if (!matchesTemplate) {
            setRepeatTemplateId(null);
          }
          setRecurrenceRule(nextRule);
        }}
        startDate={startDate}
        initialRule={cloneRecurrence(
          sanitizedWithTime || sanitizeRule({ ...DEFAULT_RECURRENCE })
        )}
        allDay={allDay}
        timezoneOffset={timezoneOffset}
        templates={topTemplateChips}
        onApplyTemplate={applyTemplate}
        onManageTemplates={() => setIsTemplateManagerOpen(true)}
        activeTemplateId={repeatTemplateId}
      />
      <RepeatTemplateManager
        open={isTemplateManagerOpen}
        templates={decoratedTemplates}
        onClose={() => setIsTemplateManagerOpen(false)}
        onApply={applyTemplate}
        onCreateFromCurrent={handleCreateTemplateFromCurrent}
        onRename={handleRenameTemplate}
        onTogglePin={handleTogglePinTemplate}
        onSetDefault={handleSetDefaultTemplate}
        onDelete={handleDeleteTemplate}
        searchValue={templateSearch}
        onSearchChange={setTemplateSearch}
        loading={templateLoading}
        error={templateError}
      />
    </div>
  );
}