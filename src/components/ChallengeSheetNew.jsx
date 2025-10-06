// src/components/ChallengeSheetNew.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { createChallenge } from '../api/challenges';
import { initialsFromName } from '../utils/friends';
import './ChallengeSheet.css';

const TYPE_OPTIONS = [
  { value: 'daily', label: 'Ежедневный чек-ин', description: 'Отмечайтесь каждый день и держите серию.' },
  { value: 'quant', label: 'Количественный', description: 'Цель с накопительным прогрессом и шагом.' },
  { value: 'event', label: 'Событийный', description: 'Несколько визитов к дедлайну.' },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 дней' },
  { value: 14, label: '14 дней' },
  { value: 30, label: '30 дней' },
  { value: 'custom', label: 'Другое' },
];

const STEP_OPTIONS = [
  { value: 1, label: '+1' },
  { value: 5, label: '+5' },
  { value: 10, label: '+10' },
  { value: 'custom', label: 'Свой' },
];

const UNIT_OPTIONS = [
  { value: 'стр', label: 'стр' },
  { value: 'км', label: 'км' },
  { value: 'мин', label: 'мин' },
  { value: 'повт', label: 'повт' },
  { value: 'custom', label: 'Свой' },
];

const PROOF_OPTIONS = [
  { value: 'none', label: 'Без' },
  { value: 'photo', label: 'Фото' },
  { value: 'geo', label: 'Гео' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateISO, days) {
  if (!dateISO) return null;
  const date = new Date(`${dateISO}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatSummary({ type, duration, participantsCount, reminder, autoTag }) {
  const parts = [];
  if (type === 'daily') parts.push('Ежедневный');
  if (type === 'quant') parts.push('Количественный');
  if (type === 'event') parts.push('Событийный');
  if (duration) parts.push(`${duration} дней`);
  parts.push(`Участники: ${participantsCount}`);
  if (reminder?.time_local) parts.push(reminder.time_local);
  if (autoTag) parts.push(`авто #${autoTag}`);
  return parts.join(' • ');
}

export default function ChallengeSheetNew({
  open,
  onClose,
  onCreated,
  initiatorId,
  defaultParticipants = [],
  friendsOptions = [],
  sharedOptions = [],
  recentParticipants = [],
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('daily');
  const [dailyStart, setDailyStart] = useState(todayISO());
  const [durationOption, setDurationOption] = useState(30);
  const [customDuration, setCustomDuration] = useState(21);
  const [allowGrace, setAllowGrace] = useState(true);

  const [quantTarget, setQuantTarget] = useState(30);
  const [quantUnit, setQuantUnit] = useState('стр');
  const [customUnit, setCustomUnit] = useState('');
  const [quantStart, setQuantStart] = useState(todayISO());
  const [quantEnd, setQuantEnd] = useState('');
  const [stepOption, setStepOption] = useState(1);
  const [customStep, setCustomStep] = useState(1);

  const [eventTarget, setEventTarget] = useState(4);
  const [eventDeadline, setEventDeadline] = useState('');
  const [allowMultiplePerDay, setAllowMultiplePerDay] = useState(false);

  const [reminderTime, setReminderTime] = useState('19:30');
  const [reminderDays, setReminderDays] = useState('daily');
  const [autoTag, setAutoTag] = useState('');
  const [proof, setProof] = useState('none');

  const [participants, setParticipants] = useState(() => {
    const ids = new Set([
      ...(defaultParticipants || []).map((p) => p.user_id),
      initiatorId,
    ].filter(Boolean));
    return Array.from(ids);
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const ids = new Set([
        ...(defaultParticipants || []).map((p) => p.user_id),
        initiatorId,
      ].filter(Boolean));
      setParticipants(Array.from(ids));
      setTitle('');
      setType('daily');
      setDailyStart(todayISO());
      setDurationOption(30);
      setCustomDuration(21);
      setAllowGrace(true);
      setQuantTarget(30);
      setQuantUnit('стр');
      setCustomUnit('');
      setQuantStart(todayISO());
      setQuantEnd('');
      setStepOption(1);
      setCustomStep(1);
      setEventTarget(4);
      setEventDeadline('');
      setAllowMultiplePerDay(false);
      setReminderTime('19:30');
      setReminderDays('daily');
      setAutoTag('');
      setProof('none');
      setError('');
      setSubmitting(false);
    }
  }, [open, defaultParticipants, initiatorId]);

  const participantObjects = useMemo(() => {
    const map = new Map();
    [...defaultParticipants, ...friendsOptions, ...recentParticipants, ...sharedOptions].forEach((p) => {
      if (!p || p.user_id == null) return;
      if (!map.has(p.user_id)) {
        map.set(p.user_id, p);
      }
    });
    return map;
  }, [defaultParticipants, friendsOptions, recentParticipants, sharedOptions]);

  const currentParticipants = participants
    .map((id) => participantObjects.get(id) || { user_id: id, full_name: `ID ${id}` })
    .slice(0, 5);

  useEffect(() => {
    if (participants.length > 5) {
      setError('Максимум 5 участников');
    } else {
      setError('');
    }
  }, [participants]);

  const toggleParticipant = (id) => {
    setParticipants((prev) => {
      const set = new Set(prev);
      if (set.has(id)) {
        set.delete(id);
      } else {
        if (set.size >= 5) {
          return Array.from(set);
        }
        set.add(id);
      }
      return Array.from(set);
    });
  };

  const unitValue = quantUnit === 'custom' ? customUnit.trim() : quantUnit;
  const stepValue = stepOption === 'custom' ? Number(customStep) || 1 : Number(stepOption) || 1;

  const isDaily = type === 'daily';
  const isQuant = type === 'quant';
  const isEvent = type === 'event';

  const dailyDuration = durationOption === 'custom' ? Number(customDuration) || 0 : Number(durationOption) || 0;

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (participants.length === 0 || participants.length > 5) return false;
    if (isDaily) {
      return Boolean(dailyStart) && dailyDuration > 0;
    }
    if (isQuant) {
      return Boolean(quantStart) && Number(quantTarget) > 0 && (!quantEnd || quantEnd >= quantStart) && unitValue;
    }
    if (isEvent) {
      return Number(eventTarget) > 0 && Boolean(eventDeadline);
    }
    return false;
  }, [title, participants.length, isDaily, dailyStart, dailyDuration, isQuant, quantStart, quantTarget, quantEnd, unitValue, isEvent, eventTarget, eventDeadline]);

  const reminder = useMemo(() => ({
    time_local: reminderTime,
    days: reminderDays,
  }), [reminderTime, reminderDays]);

  const summary = formatSummary({
    type,
    duration: isDaily ? dailyDuration : null,
    participantsCount: participants.length,
    reminder,
    autoTag: autoTag.replace(/^#/, ''),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    try {
      setSubmitting(true);
      const payload = buildPayload({
        type,
        title: title.trim(),
        dailyStart,
        dailyDuration,
        allowGrace,
        quantTarget,
        unitValue,
        quantStart,
        quantEnd,
        stepValue,
        eventTarget,
        eventDeadline,
        allowMultiplePerDay,
        reminder,
        autoTag,
        proof,
        participants,
      });
      const response = await createChallenge(payload);
      onCreated?.({ payload, response });
    } catch (err) {
      setError(err.message || 'Не удалось создать челлендж');
      return;
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="challenge-sheet__backdrop" role="dialog" aria-modal="true">
      <div className="challenge-sheet">
        <header className="challenge-sheet__header">
          <button type="button" className="challenge-sheet__text-btn" onClick={onClose}>Отмена</button>
          <span>🏆 Новый челлендж</span>
          <button
            type="button"
            className="challenge-sheet__text-btn challenge-sheet__text-btn--primary"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? 'Создаю…' : 'Создать'}
          </button>
        </header>

        <form className="challenge-sheet__body" onSubmit={handleSubmit}>
          <section>
            <h3>Основное</h3>
            <input
              type="text"
              name="title"
              placeholder="Например, 30 дней спорта"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
            <div className="challenge-sheet__tabs">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`challenge-sheet__tab ${type === option.value ? 'is-active' : ''}`}
                  onClick={() => setType(option.value)}
                >
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </section>

          {isDaily && (
            <section>
              <h3>Параметры</h3>
              <label className="challenge-sheet__label">Старт</label>
              <input type="date" value={dailyStart} onChange={(e) => setDailyStart(e.target.value)} />
              <label className="challenge-sheet__label">Длительность</label>
              <div className="challenge-sheet__chips">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`challenge-sheet__chip ${durationOption === option.value ? 'is-active' : ''}`}
                    onClick={() => setDurationOption(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {durationOption === 'custom' && (
                <input
                  type="number"
                  min={1}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="Количество дней"
                />
              )}
              <label className="challenge-sheet__switch">
                <input type="checkbox" checked={allowGrace} onChange={(e) => setAllowGrace(e.target.checked)} />
                <span>1 прощённый пропуск</span>
              </label>
            </section>
          )}

          {isQuant && (
            <section>
              <h3>Параметры</h3>
              <label className="challenge-sheet__label">Цель</label>
              <input
                type="number"
                min={1}
                value={quantTarget}
                onChange={(e) => setQuantTarget(e.target.value)}
                placeholder="Например, 300"
              />
              <label className="challenge-sheet__label">Единицы</label>
              <div className="challenge-sheet__chips">
                {UNIT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`challenge-sheet__chip ${quantUnit === option.value ? 'is-active' : ''}`}
                    onClick={() => setQuantUnit(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {quantUnit === 'custom' && (
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="Введите единицу"
                />
              )}
              <div className="challenge-sheet__grid">
                <label>
                  Старт
                  <input type="date" value={quantStart} onChange={(e) => setQuantStart(e.target.value)} />
                </label>
                <label>
                  Финиш
                  <input type="date" value={quantEnd} onChange={(e) => setQuantEnd(e.target.value)} />
                </label>
              </div>
              <label className="challenge-sheet__label">Шаг по умолчанию</label>
              <div className="challenge-sheet__chips">
                {STEP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`challenge-sheet__chip ${stepOption === option.value ? 'is-active' : ''}`}
                    onClick={() => setStepOption(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {stepOption === 'custom' && (
                <input
                  type="number"
                  min={1}
                  value={customStep}
                  onChange={(e) => setCustomStep(e.target.value)}
                  placeholder="Например, 3"
                />
              )}
            </section>
          )}

          {isEvent && (
            <section>
              <h3>Параметры</h3>
              <label className="challenge-sheet__label">Количество посещений</label>
              <input
                type="number"
                min={1}
                value={eventTarget}
                onChange={(e) => setEventTarget(e.target.value)}
                placeholder="Например, 4"
              />
              <label className="challenge-sheet__label">Дедлайн</label>
              <input type="date" value={eventDeadline} onChange={(e) => setEventDeadline(e.target.value)} />
              <label className="challenge-sheet__switch">
                <input
                  type="checkbox"
                  checked={allowMultiplePerDay}
                  onChange={(e) => setAllowMultiplePerDay(e.target.checked)}
                />
                <span>&gt;1 отметки/день</span>
              </label>
            </section>
          )}

          <section>
            <h3>
              Участники <small>{participants.length}/5</small>
            </h3>
            <div className="challenge-sheet__chips">
              {currentParticipants.map((participant) => (
                <div key={participant.user_id} className="challenge-sheet__participant">
                  {participant.avatar_url ? (
                    <img src={participant.avatar_url} alt={participant.full_name} />
                  ) : (
                    <span>{initialsFromName(participant.full_name)}</span>
                  )}
                  <span>{participant.full_name}</span>
                </div>
              ))}
            </div>
            <ParticipantSection
              title="Эта мини-группа"
              options={defaultParticipants}
              toggle={toggleParticipant}
              selected={participants}
            />
            <ParticipantSection
              title="Друзья с общими задачами"
              options={sharedOptions}
              toggle={toggleParticipant}
              selected={participants}
            />
            <ParticipantSection
              title="Недавние"
              options={recentParticipants}
              toggle={toggleParticipant}
              selected={participants}
            />
            <ParticipantSection
              title="Все друзья"
              options={friendsOptions}
              toggle={toggleParticipant}
              selected={participants}
            />
            {error && <div className="challenge-sheet__error">{error}</div>}
          </section>

          <section>
            <h3>Автоматика и напоминания</h3>
            <div className="challenge-sheet__grid">
              <label>
                Время
                <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
              </label>
              <label>
                Повтор
                <select value={reminderDays} onChange={(e) => setReminderDays(e.target.value)}>
                  <option value="daily">Ежедневно</option>
                  <option value="weekdays">Будни</option>
                </select>
              </label>
            </div>
            <label className="challenge-sheet__switch">
              <input
                type="checkbox"
                checked={Boolean(autoTag)}
                onChange={(e) => setAutoTag(e.target.checked ? 'спорт' : '')}
              />
              <span>Связать с задачами</span>
            </label>
            {Boolean(autoTag) && (
              <input
                type="text"
                value={autoTag}
                onChange={(e) => setAutoTag(e.target.value)}
                placeholder="#спорт"
              />
            )}
            <div className="challenge-sheet__chips challenge-sheet__chips--proof">
              {PROOF_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`challenge-sheet__chip ${proof === option.value ? 'is-active' : ''}`}
                  onClick={() => setProof(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>Превью</h3>
            <div className="challenge-sheet__summary">{summary}</div>
            <button
              type="submit"
              className="challenge-sheet__primary"
              disabled={!canSubmit || submitting}
            >
              {submitting ? 'Создаю…' : 'Создать'}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}

function ParticipantSection({ title, options = [], toggle, selected }) {
  if (!options.length) return null;
  return (
    <div className="challenge-sheet__participants-section">
      <h4>{title}</h4>
      <div className="challenge-sheet__participant-list">
        {options.map((participant) => {
          const active = selected.includes(participant.user_id);
          return (
            <button
              type="button"
              key={participant.user_id}
              className={`challenge-sheet__participant-btn ${active ? 'is-active' : ''}`}
              onClick={() => toggle(participant.user_id)}
            >
              {participant.avatar_url ? (
                <img src={participant.avatar_url} alt={participant.full_name} />
              ) : (
                <span>{initialsFromName(participant.full_name)}</span>
              )}
              <span>{participant.full_name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildPayload({
  type,
  title,
  dailyStart,
  dailyDuration,
  allowGrace,
  quantTarget,
  unitValue,
  quantStart,
  quantEnd,
  stepValue,
  eventTarget,
  eventDeadline,
  allowMultiplePerDay,
  reminder,
  autoTag,
  proof,
  participants,
}) {
  const payload = {
    title,
    type,
    start_dt: null,
    end_dt: null,
    target_value: 0,
    unit: 'day',
    step: 1,
    allow_grace: allowGrace,
    auto_tag: autoTag.replace(/^#/, '') || null,
    proof,
    reminder,
    participants,
  };

  if (type === 'daily') {
    payload.start_dt = new Date(`${dailyStart}T00:00:00`).toISOString();
    payload.end_dt = addDays(dailyStart, dailyDuration - 1);
    payload.target_value = dailyDuration;
    payload.unit = 'day';
    payload.step = 1;
    payload.allow_grace = allowGrace;
  }

  if (type === 'quant') {
    payload.start_dt = new Date(`${quantStart}T00:00:00`).toISOString();
    payload.end_dt = quantEnd ? new Date(`${quantEnd}T23:59:59`).toISOString() : null;
    payload.target_value = Number(quantTarget) || 0;
    payload.unit = unitValue || 'unit';
    payload.step = stepValue;
    payload.allow_grace = allowGrace;
  }

  if (type === 'event') {
    payload.start_dt = new Date().toISOString();
    payload.end_dt = new Date(`${eventDeadline}T23:59:59`).toISOString();
    payload.target_value = Number(eventTarget) || 0;
    payload.unit = 'visits';
    payload.step = 1;
    payload.allow_grace = allowMultiplePerDay;
  }

  return payload;
}