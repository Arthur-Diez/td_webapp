// src/components/FriendsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import FriendCard from './FriendCard';
import ChallengeSheetNew from './ChallengeSheetNew';
import ChallengeSheetView from './ChallengeSheetView';
import ActivityFeed from './ActivityFeed';
import { getFriends, getFriendsActivity, getFriendsWithShared } from '../api/friends';
import { getSharedTasks } from '../api/tasks';
import { getChallenges } from '../api/challenges';
import { prepareFriendGroups } from '../utils/friends';
import './FriendsPage.css';

export default function FriendsPage({ telegramId }) {
  const [friends, setFriends] = useState([]);
  const [friendsWithShared, setFriendsWithShared] = useState([]);
  const [sharedTasks, setSharedTasks] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [viewChallenge, setViewChallenge] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!telegramId) return;
    fetchAll();
    fetchActivity();
  }, [telegramId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [friendsRes, sharedRes, challengesRes, sharedFriendsRes] = await Promise.all([
        getFriends(telegramId),
        getSharedTasks(telegramId),
        getChallenges(telegramId),
        getFriendsWithShared(telegramId).catch(() => []),
      ]);
      setFriends(friendsRes || []);
      setSharedTasks(sharedRes || []);
      setChallenges(challengesRes || []);
      setFriendsWithShared(sharedFriendsRes || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить друзей');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    if (!telegramId) return;
    try {
      setActivityLoading(true);
      const res = await getFriendsActivity(telegramId, { limit: 20 }).catch(() => []);
      setActivity(Array.isArray(res) ? res.slice(0, 20) : []);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const groups = useMemo(() => (
    telegramId
      ? prepareFriendGroups({ friends, sharedTasks, challenges, userId: telegramId })
      : []
  ), [friends, sharedTasks, challenges, telegramId]);

  const recentParticipants = useMemo(() => {
    const map = new Map();
    challenges.forEach((challenge) => {
      (challenge.participants || []).forEach((participant) => {
        if (String(participant.user_id) === String(telegramId)) return;
        if (!map.has(participant.user_id)) {
          map.set(participant.user_id, participant);
        }
      });
    });
    return Array.from(map.values()).slice(0, 10);
  }, [challenges, telegramId]);

  const handleOpenChallenge = (challenge) => {
    setViewChallenge(challenge);
  };

  const handleCreateChallenge = (group) => {
    setSelectedGroup(group);
    setNewChallengeOpen(true);
  };

  const handleChallengeCreated = async () => {
    setNewChallengeOpen(false);
    setToast('Приглашения отправлены');
    await fetchAll();
  };

  const refreshChallenges = async () => {
    const res = await getChallenges(telegramId);
    setChallenges(res || []);
  };

  if (!telegramId) {
    return <div className="friends-page__empty">🔒 Не удалось определить пользователя</div>;
  }

  return (
    <div className="friends-page">
      <header className="friends-page__header">
        <h1>👫 Друзья</h1>
        <button type="button" className="friends-page__add" onClick={() => setToast('Скоро!')}>
          ➕
        </button>
      </header>

      {error && <div className="friends-page__error">⚠️ {error}</div>}

      {loading ? (
        <div className="friends-page__skeletons">
          {[1, 2, 3].map((i) => (
            <div key={i} className="friends-page__skeleton" />
          ))}
        </div>
      ) : groups.length ? (
        <div className="friends-page__list">
          {groups.map((group) => (
            <FriendCard
              key={group.id}
              group={group}
              onCreateChallenge={handleCreateChallenge}
              onOpenChallenge={handleOpenChallenge}
            />
          ))}
        </div>
      ) : (
        <div className="friends-page__empty">Пока нет друзей. Добавьте кого-нибудь!</div>
      )}

      <ActivityFeed items={activity} loading={activityLoading} />

      {newChallengeOpen && (
        <ChallengeSheetNew
          open={newChallengeOpen}
          onClose={() => setNewChallengeOpen(false)}
          onCreated={handleChallengeCreated}
          initiatorId={telegramId}
          defaultParticipants={selectedGroup?.members || []}
          friendsOptions={friends}
          sharedOptions={friendsWithShared}
          recentParticipants={recentParticipants}
        />
      )}

      {viewChallenge && (
        <ChallengeSheetView
          open={Boolean(viewChallenge)}
          challenge={viewChallenge}
          onClose={() => setViewChallenge(null)}
          onProgress={async () => {
            await refreshChallenges();
            fetchActivity();
          }}
        />
      )}

      {toast && <div className="friends-page__toast">{toast}</div>}
    </div>
  );
}