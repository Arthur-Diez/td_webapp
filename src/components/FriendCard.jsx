// src/components/FriendCard.jsx
import React, { useState } from 'react';
import ChallengeChip from './ChallengeChip';
import { clampParticipants, formatRelativeDateTime, initialsFromName } from '../utils/friends';
import './FriendCard.css';

export default function FriendCard({
  group,
  onCreateChallenge,
  onOpenChallenge,
}) {
  const [expanded, setExpanded] = useState(Boolean(group?.hasActivity));
  const [openTaskId, setOpenTaskId] = useState(null);

  if (!group) return null;

  const members = clampParticipants(group.members || [], 5);
  const title = group.label;
  const subtitle = group.subtitle;

  return (
    <article className={`friend-card ${expanded ? 'friend-card--expanded' : ''}`}>
      <button
        type="button"
        className="friend-card__header"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="friend-card__avatars">
          {members.map((member) => (
            <div key={member.user_id} className="friend-card__avatar">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name} />
              ) : (
                <span>{initialsFromName(member.full_name)}</span>
              )}
            </div>
          ))}
        </div>
        <div className="friend-card__info">
          <div className="friend-card__title">{title}</div>
          <div className="friend-card__subtitle">{subtitle}</div>
        </div>
        <div className="friend-card__chevron" aria-hidden>
          {expanded ? '▲' : '▼'}
        </div>
      </button>

      {expanded && (
        <div className="friend-card__content">
          <section className="friend-card__section">
            <header className="friend-card__section-header">
              <span>Совместные задачи</span>
            </header>
            {group.sharedTasks?.length ? (
              <ul className="friend-card__list">
                {group.sharedTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => setOpenTaskId((prev) => (prev === task.id ? null : task.id))}
                      className={`friend-card__task ${openTaskId === task.id ? 'is-active' : ''}`}
                    >
                      <span className="friend-card__task-emoji">📌</span>
                      <span className="friend-card__task-body">
                        <span className="friend-card__task-title">{task.title}</span>
                        <span className="friend-card__task-meta">
                          {formatRelativeDateTime(task.start_dt)}
                        </span>
                      </span>
                      <span className="friend-card__task-participants">
                        {(task.participants || []).slice(0, 5).map((participant) => (
                          <span key={participant.user_id} className="friend-card__participant">
                            {participant.avatar_url ? (
                              <img src={participant.avatar_url} alt={participant.full_name} />
                            ) : (
                              <span>{initialsFromName(participant.full_name)}</span>
                            )}
                          </span>
                        ))}
                      </span>
                    </button>
                    {openTaskId === task.id && (
                      <div className="friend-card__task-details">
                        <div className="friend-card__task-details-title">Участники</div>
                        <ul>
                          {(task.participants || []).map((participant) => (
                            <li key={participant.user_id}>{participant.full_name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="friend-card__empty">Пока нет совместных задач</div>
            )}
          </section>

          <section className="friend-card__section">
            <header className="friend-card__section-header">
              <span>Челленджи</span>
            </header>
            {group.challenges?.length ? (
              <div className="friend-card__challenges">
                {group.challenges.map((challenge) => (
                  <ChallengeChip
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => onOpenChallenge?.(challenge)}
                  />
                ))}
              </div>
            ) : (
              <div className="friend-card__empty">Создайте челлендж вместе</div>
            )}
          </section>

          <div className="friend-card__actions">
            <button
              type="button"
              className="friend-card__challenge-btn"
              onClick={() => onCreateChallenge?.(group)}
            >
              🏆 Челлендж
            </button>
          </div>
        </div>
      )}
    </article>
  );
}