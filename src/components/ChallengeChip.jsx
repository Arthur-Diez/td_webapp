// src/components/ChallengeChip.jsx
import React from 'react';
import './ChallengeChip.css';
import { clampParticipants, initialsFromName } from '../utils/friends';

function ChallengeProgress({ challenge }) {
  if (!challenge) return null;
  const { progress } = challenge;
  if (!progress) return null;

  const target = progress.target ?? challenge.target_value ?? 0;
  const byUser = progress.byUser || {};
  const total = Object.values(byUser).reduce((acc, value) => acc + (Number(value) || 0), 0);
  const percent = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  return (
    <div className="challenge-chip__progress" aria-label={`Прогресс ${percent}%`}>
      <div className="challenge-chip__progress-bar" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function ChallengeChip({ challenge, onClick }) {
  if (!challenge) return null;

  const participants = clampParticipants(challenge.participants || [], 5);

  return (
    <button type="button" className="challenge-chip" onClick={() => onClick?.(challenge)}>
      <div className="challenge-chip__header">
        <span className="challenge-chip__emoji">🏆</span>
        <span className="challenge-chip__title">{challenge.title}</span>
      </div>
      <ChallengeProgress challenge={challenge} />
      <div className="challenge-chip__participants">
        {participants.map((participant) => (
          <div key={participant.user_id} className="challenge-chip__avatar">
            {participant.avatar_url ? (
              <img src={participant.avatar_url} alt={participant.full_name} />
            ) : (
              <span>{initialsFromName(participant.full_name)}</span>
            )}
          </div>
        ))}
      </div>
    </button>
  );
}