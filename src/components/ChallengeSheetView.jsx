// src/components/ChallengeSheetView.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  addChallengeProgress,
  getChallengeSummary,
} from '../api/challenges';
import { clampParticipants, initialsFromName } from '../utils/friends';
import './ChallengeSheet.css';

export default function ChallengeSheetView({ open, challenge, onClose, onProgress }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    if (!open || !challenge) return;
    let mounted = true;
    setLoading(true);
    setError('');
    getChallengeSummary(challenge.id)
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Не удалось загрузить сводку');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, challenge?.id]);

  const participants = useMemo(() => clampParticipants(challenge?.participants || [], 10), [challenge]);
  const target = challenge?.progress?.target ?? challenge?.target_value ?? 0;
  const byUser = challenge?.progress?.byUser || {};

  const percent = target > 0
    ? Math.min(100, Math.round((Object.values(byUser).reduce((acc, value) => acc + (Number(value) || 0), 0) / target) * 100))
    : 0;

  const handleSubmit = async (value) => {
    if (!challenge) return;
    try {
      setSubmitting(true);
      await addChallengeProgress(challenge.id, { value });
      const fresh = await getChallengeSummary(challenge.id);
      setSummary(fresh);
      setCustomValue('');
      onProgress?.();
    } catch (err) {
      setError(err.message || 'Не удалось обновить прогресс');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !challenge) return null;

  const isDaily = challenge.type === 'daily';
  const isQuant = challenge.type === 'quant';
  const isEvent = challenge.type === 'event';

  return (
    <div className="challenge-sheet__backdrop" role="dialog" aria-modal="true">
      <div className="challenge-sheet">
        <header className="challenge-sheet__header">
          <button type="button" className="challenge-sheet__text-btn" onClick={onClose}>Закрыть</button>
          <span>{challenge.title}</span>
          <span className="challenge-sheet__header-meta">
            {challenge.start_dt ? new Date(challenge.start_dt).toLocaleDateString('ru-RU') : ''}
            {challenge.end_dt ? ` — ${new Date(challenge.end_dt).toLocaleDateString('ru-RU')}` : ''}
          </span>
        </header>

        <div className="challenge-sheet__body">
          {loading && <div>⏳ Загружаем прогресс…</div>}
          {error && <div className="challenge-sheet__error">{error}</div>}
          {!loading && summary?.description && (
            <div className="challenge-sheet__summary">{summary.description}</div>
          )}

          <section>
            <h3>Прогресс</h3>
            <div className="challenge-sheet__summary">{percent}% выполнено</div>
            {summary?.streak && (
              <div className="challenge-sheet__badge">🔥 Серия: {summary.streak} дней</div>
            )}
            {isDaily && (
              <button
                type="button"
                className="challenge-sheet__primary"
                onClick={() => handleSubmit(1)}
                disabled={submitting}
              >
                ✅ Отметить сегодня
              </button>
            )}
            {isQuant && (
              <div className="challenge-sheet__quant">
                <div className="challenge-sheet__chips">
                  <button
                    type="button"
                    className="challenge-sheet__chip"
                    onClick={() => handleSubmit(challenge.step || 1)}
                    disabled={submitting}
                  >
                    +{challenge.step || 1}
                  </button>
                  <button
                    type="button"
                    className="challenge-sheet__chip"
                    onClick={() => handleSubmit(1)}
                    disabled={submitting}
                  >
                    +1
                  </button>
                </div>
                <div className="challenge-sheet__grid">
                  <label>
                    Свой шаг
                    <input
                      type="number"
                      min={1}
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="challenge-sheet__primary"
                    onClick={() => customValue && handleSubmit(Number(customValue))}
                    disabled={submitting || !customValue}
                  >
                    Добавить
                  </button>
                </div>
              </div>
            )}
            {isEvent && (
              <button
                type="button"
                className="challenge-sheet__primary"
                onClick={() => handleSubmit(1)}
                disabled={submitting}
              >
                + Визит
              </button>
            )}
          </section>

          <section>
            <h3>Участники</h3>
            <div className="challenge-sheet__participant-list">
              {participants.map((participant) => {
                const value = byUser[participant.user_id] || 0;
                const progressPercent = target > 0 ? Math.round((Number(value) / target) * 100) : 0;
                return (
                  <div key={participant.user_id} className="challenge-sheet__participant challenge-sheet__participant--row">
                    {participant.avatar_url ? (
                      <img src={participant.avatar_url} alt={participant.full_name} />
                    ) : (
                      <span>{initialsFromName(participant.full_name)}</span>
                    )}
                    <div className="challenge-sheet__participant-info">
                      <div className="challenge-sheet__participant-name">{participant.full_name}</div>
                      <div className="challenge-sheet__participant-meta">{value} / {target} ({progressPercent}%)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3>Действия</h3>
            <div className="challenge-sheet__actions">
              <button type="button" className="challenge-sheet__chip" onClick={() => console.log('TODO: remind all')}>
                Напомнить всем
              </button>
              <button type="button" className="challenge-sheet__chip" onClick={() => console.log('TODO: change reminder')}>
                Изменить напоминание
              </button>
              <button type="button" className="challenge-sheet__chip" onClick={() => console.log('TODO: leave challenge')}>
                Покинуть челлендж
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}