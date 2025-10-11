// src/utils/recurrence.js
import { RRule, RRuleSet, rrulestr } from "rrule";

const MM = (n) => String(n).padStart(2, "0");

export const WEEKDAYS = [
  { value: "MO", short: "Пн", long: "Понедельник" },
  { value: "TU", short: "Вт", long: "Вторник" },
  { value: "WE", short: "Ср", long: "Среда" },
  { value: "TH", short: "Чт", long: "Четверг" },
  { value: "FR", short: "Пт", long: "Пятница" },
  { value: "SA", short: "Сб", long: "Суббота" },
  { value: "SU", short: "Вс", long: "Воскресенье" },
];

export const WEEKDAY_TO_INDEX = WEEKDAYS.reduce((acc, day, idx) => {
  acc[day.value] = idx;
  return acc;
}, {});

export const FREQ_TITLES = {
  DAILY: "день",
  WEEKLY: "неделю",
  MONTHLY: "месяц",
};

export const FREQ_FULL = {
  DAILY: "ежедневно",
  WEEKLY: "еженедельно",
  MONTHLY: "ежемесячно",
};

export const DEFAULT_RECURRENCE = {
  freq: "DAILY",
  interval: 1,
  byDay: [],
  byMonthDay: [],
  bySetPos: null,
  weekDay: "MO",
  time: null,
  until: null,
  count: null,
  exdates: [],
  rdates: [],
  skipPolicy: "skip",
  shiftN: null,
};

export const WEEKDAY_TO_RRULE = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

export const ensureArray = (value) => (Array.isArray(value) ? value : []);

export function toUtcDate(localDate, offsetMin) {
  if (!localDate) return null;
  const utc = Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    localDate.getHours(),
    localDate.getMinutes(),
    localDate.getSeconds(),
    localDate.getMilliseconds()
  );
  return new Date(utc - offsetMin * 60000);
}

export function fromUtcDate(utcDate, offsetMin) {
  if (!utcDate) return null;
  return new Date(utcDate.getTime() + offsetMin * 60000);
}

export function formatWithOffset(localDate, offsetMin) {
  if (!localDate) return null;
  const y = localDate.getFullYear();
  const m = MM(localDate.getMonth() + 1);
  const d = MM(localDate.getDate());
  const hh = MM(localDate.getHours());
  const mm = MM(localDate.getMinutes());
  const ss = MM(localDate.getSeconds() || 0);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const offH = MM(Math.floor(abs / 60));
  const offM = MM(abs % 60);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${offH}:${offM}`;
}

export function formatDateInput(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = MM(date.getMonth() + 1);
  const d = MM(date.getDate());
  return `${y}-${m}-${d}`;
}

export function formatDateTimeInput(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = MM(date.getMonth() + 1);
  const d = MM(date.getDate());
  const hh = MM(date.getHours());
  const mm = MM(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function formatRRuleUntil(localDate, offsetMin) {
  if (!localDate) return null;
  const utc = toUtcDate(localDate, offsetMin);
  const y = utc.getUTCFullYear();
  const m = MM(utc.getUTCMonth() + 1);
  const d = MM(utc.getUTCDate());
  const hh = MM(utc.getUTCHours());
  const mm = MM(utc.getUTCMinutes());
  const ss = MM(utc.getUTCSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

export function buildRRuleString(rule, offsetMin) {
  if (!rule) return null;
  const parts = [`FREQ=${rule.freq}`];
  const interval = Number(rule.interval || 1);
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  const byDay = ensureArray(rule.byDay);
  if (byDay.length) parts.push(`BYDAY=${byDay.join(",")}`);
  const byMonthDay = ensureArray(rule.byMonthDay);
  if (byMonthDay.length) parts.push(`BYMONTHDAY=${byMonthDay.join(",")}`);
  if (typeof rule.bySetPos === "number") parts.push(`BYSETPOS=${rule.bySetPos}`);
  if (typeof rule.time === "string" && rule.time) {
    const [h, m] = rule.time.split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      parts.push(`BYHOUR=${h}`);
      parts.push(`BYMINUTE=${m}`);
    }
  }
  if (rule.count) parts.push(`COUNT=${rule.count}`);
  if (rule.until) {
    const until = formatRRuleUntil(rule.until, offsetMin);
    if (until) parts.push(`UNTIL=${until}`);
  }
  return parts.join(";");
}

export function createRRuleSet({ rule, startDate, offsetMin }) {
  if (!rule) return null;
  const rruleString = buildRRuleString(rule, offsetMin);
  if (!rruleString) return null;
  const dtstart = toUtcDate(startDate, offsetMin);
  const base = rrulestr(rruleString, { dtstart });
  const set = new RRuleSet();
  set.rrule(base);
  ensureArray(rule.exdates).forEach((ex) => {
    if (!ex) return;
    const [y, m, d] = ex.split("-").map(Number);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return;
    const local = new Date(startDate);
    local.setFullYear(y, m - 1, d);
    const utc = toUtcDate(local, offsetMin);
    set.exdate(utc);
  });
  ensureArray(rule.rdates).forEach((date) => {
    if (!date) return;
    const dt = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dt.getTime())) return;
    const utc = toUtcDate(dt, offsetMin);
    set.rdate(utc);
  });
  return set;
}

export function generateOccurrences({ rule, startDate, offsetMin, count = 6 }) {
  if (!rule) return [];
  const set = createRRuleSet({ rule, startDate, offsetMin });
  if (!set) return [];
  const dates = set.all((_, i) => i < count * 6);
  const locals = dates
    .map((dt) => fromUtcDate(dt, offsetMin))
    .filter(Boolean);

  return locals.slice(0, count);
}

const joinList = (items) => {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(", " )} и ${last}`;
};

const monthDayLabel = (value) => {
  if (value === -1) return "последний день";
  return `${value}-е число`;
};

const weekPositionMap = {
  1: "первую",
  2: "вторую",
  3: "третью",
  4: "четвёртую",
  [-1]: "последнюю",
};

export function summarizeRecurrence({ rule, startDate, allDay, offsetMin }) {
  if (!rule) return "Один раз";
  const parts = [];
  const interval = Number(rule.interval || 1);

  if (rule.freq === "DAILY") {
    if (interval === 1) parts.push("каждый день");
    else parts.push(`каждые ${interval} ${interval === 1 ? "день" : "дней"}`);
  }

  if (rule.freq === "WEEKLY") {
    const byDay = ensureArray(rule.byDay).length
      ? ensureArray(rule.byDay)
      : [WEEKDAYS[(startDate.getDay() + 6) % 7].value];
    const dayLabels = byDay.map((v) => WEEKDAYS.find((d) => d.value === v)?.short || v);
    const dayString = joinList(dayLabels);
    if (interval === 1) parts.push(`каждый ${dayString}`);
    else parts.push(`каждые ${interval} недели по ${dayString}`);
  }

  if (rule.freq === "MONTHLY") {
    const byMonthDay = ensureArray(rule.byMonthDay);
    if (byMonthDay.length) {
      const labels = byMonthDay.map(monthDayLabel);
      if (interval === 1) parts.push(`каждый месяц по ${joinList(labels)}`);
      else parts.push(`каждые ${interval} месяцев по ${joinList(labels)}`);
    } else if (typeof rule.bySetPos === "number" && ensureArray(rule.byDay).length) {
      const weekPos = weekPositionMap[rule.bySetPos] || `${rule.bySetPos}-ю`;
      const day = ensureArray(rule.byDay)
        .map((v) => WEEKDAYS.find((d) => d.value === v)?.short || v)
        .join(", ");
      if (interval === 1) parts.push(`каждый месяц в ${weekPos} ${day}`);
      else parts.push(`каждые ${interval} месяцев в ${weekPos} ${day}`);
    } else {
      if (interval === 1) parts.push("каждый месяц");
      else parts.push(`каждые ${interval} месяцев`);
    }
  }

  const timePart = allDay
    ? "весь день"
    : `в ${MM(startDate.getHours())}:${MM(startDate.getMinutes())}`;
  const summary = parts.length ? `Повторяется ${parts.join(" ")}` : "Повторяется";

  let result = `${summary} ${timePart}`.trim();

  if (rule.count) {
    const count = Number(rule.count);
    if (count) result += `. Закончится после ${count} повторений.`;
  } else if (rule.until) {
    const until = rule.until;
    const months = [
      "янв",
      "фев",
      "мар",
      "апр",
      "май",
      "июн",
      "июл",
      "авг",
      "сен",
      "окт",
      "ноя",
      "дек",
    ];
    result += `. Закончится ${until.getDate()} ${months[until.getMonth()]} ${
      until.getFullYear()
    }.`;
  }

  return result;
}

export function detectSimpleChip(rule, startDate) {
  if (!rule) return "once";
  if (rule.freq === "DAILY" && Number(rule.interval || 1) === 1) return "daily";
  if (rule.freq === "WEEKLY") {
    const byDay = ensureArray(rule.byDay);
    const startDay = WEEKDAYS[(startDate.getDay() + 6) % 7].value;
    if (Number(rule.interval || 1) === 1 && (byDay.length === 0 || (byDay.length === 1 && byDay[0] === startDay))) {
      return "weekly";
    }
  }
  if (rule.freq === "MONTHLY") {
    const byMonthDay = ensureArray(rule.byMonthDay);
    const sameDay = startDate.getDate();
    if (Number(rule.interval || 1) === 1 && (!byMonthDay.length || (byMonthDay.length === 1 && byMonthDay[0] === sameDay))) {
      return "monthly";
    }
  }
  return "custom";
}

export function sanitizeRule(rule) {
  if (!rule) return null;
  return {
    freq: rule.freq,
    interval: Number(rule.interval || 1),
    byDay: ensureArray(rule.byDay),
    byMonthDay: ensureArray(rule.byMonthDay),
    bySetPos: typeof rule.bySetPos === "number" ? rule.bySetPos : null,
    weekDay: rule.weekDay || ensureArray(rule.byDay)[0] || "MO",
    time: typeof rule.time === "string" ? rule.time : null,
    until: rule.until instanceof Date ? rule.until : null,
    count: rule.count ? Number(rule.count) : null,
    exdates: ensureArray(rule.exdates),
    rdates: ensureArray(rule.rdates).map((d) => (d instanceof Date ? d : new Date(d))),
    skipPolicy: rule.skipPolicy || "skip",
    shiftN: rule.shiftN !== undefined && rule.shiftN !== null ? Number(rule.shiftN) : null,
  };
}

export function payloadFromRule({ rule, startDate, allDay }) {
  if (!rule) return null;
  const sanitized = sanitizeRule(rule);
  if (!sanitized) return null;
  const payload = {
    freq: sanitized.freq,
    interval: sanitized.interval,
    byDay: [...sanitized.byDay],
    byMonthDay: [...sanitized.byMonthDay],
    bySetPos: sanitized.bySetPos,
    weekDay: sanitized.weekDay,
    time: allDay
      ? null
      : `${MM(startDate.getHours())}:${MM(startDate.getMinutes())}`,
    until: sanitized.until ? formatDateInput(sanitized.until) : null,
    count: sanitized.count || null,
    exdates: [...sanitized.exdates],
    rdates: sanitized.rdates.map((d) => formatDateTimeInput(d)),
    skipPolicy: sanitized.skipPolicy,
    shiftN: sanitized.skipPolicy === "shift_n" ? sanitized.shiftN || null : null,
  };
  return payload;
}

export function ruleFromPayload({ payload, startDate }) {
  if (!payload) return null;
  const base = sanitizeRule({
    ...DEFAULT_RECURRENCE,
    ...payload,
    byDay: ensureArray(payload.byDay),
    byMonthDay: ensureArray(payload.byMonthDay),
    exdates: ensureArray(payload.exdates),
    rdates: ensureArray(payload.rdates).map((d) => new Date(d)),
  });

  if (typeof payload.bySetPos === "number" && payload.weekDay) {
    base.bySetPos = payload.bySetPos;
    base.byDay = [payload.weekDay];
  }

  if (payload.until) {
    const [y, m, d] = payload.until.split("-").map(Number);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      const until = new Date(startDate);
      until.setFullYear(y, m - 1, d);
      until.setHours(23, 59, 59, 0);
      base.until = until;
      base.count = null;
    }
  }

  if (payload.count) {
    base.count = Number(payload.count) || null;
    base.until = null;
  }

  if (payload.time && typeof payload.time === "string") {
    const [h, mm] = payload.time.split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(mm)) {
      const next = new Date(startDate);
      next.setHours(h, mm, 0, 0);
      base.time = `${MM(next.getHours())}:${MM(next.getMinutes())}`;
    }
  }

  return base;
}