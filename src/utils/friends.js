// src/utils/friends.js
const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
});

function normalizeUser(user) {
  if (!user) return null;
  return {
    user_id: user.user_id,
    full_name: user.full_name || 'Без имени',
    avatar_url: user.avatar_url || null,
    tz_offset_min: user.tz_offset_min ?? 0,
  };
}

export function formatRelativeDateTime(isoString, now = new Date()) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const diffDays = daysBetween(startOfDay(now), startOfDay(date));
  let dayLabel;
  if (diffDays === 0) dayLabel = 'сегодня';
  else if (diffDays === 1) dayLabel = 'завтра';
  else if (diffDays === -1) dayLabel = 'вчера';
  else {
    dayLabel = dateFormatter.format(date);
  }

  return `${dayLabel} • ${timeFormatter.format(date)}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a, b) {
  const diff = b.getTime() - a.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function ensureGroup(map, memberIds, memberLookup) {
  const uniqueIds = Array.from(new Set(memberIds.map(String)));
  const sorted = [...uniqueIds].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  const key = sorted.length === 1 ? `friend-${sorted[0]}` : `group-${sorted.join('-')}`;

  if (!map.has(key)) {
    const members = sorted.map((id) => memberLookup.get(id) || null).filter(Boolean);
    map.set(key, {
      id: key,
      memberIds: sorted,
      members,
      sharedTasks: [],
      challenges: [],
      nextDate: null,
      sharedTaskCount: 0,
      challengeCount: 0,
      label: members.map((m) => m.full_name).join(', ') || 'Без названия',
      subtitle: 'Пока нет совместных задач',
    });
  }

  return map.get(key);
}

export function prepareFriendGroups({ friends = [], sharedTasks = [], challenges = [], userId }) {
  const memberLookup = new Map();
  friends.forEach((friend) => {
    if (!friend || friend.user_id == null) return;
    memberLookup.set(String(friend.user_id), normalizeUser(friend));
  });

  const map = new Map();

  friends.forEach((friend) => {
    if (!friend || friend.user_id == null) return;
    const normalized = normalizeUser(friend);
    memberLookup.set(String(friend.user_id), normalized);
    ensureGroup(map, [friend.user_id], memberLookup);
  });

  const addMembersFromParticipants = (participants = []) => {
    participants.forEach((participant) => {
      if (!participant || participant.user_id == null) return;
      const id = String(participant.user_id);
      if (!memberLookup.has(id)) {
        memberLookup.set(id, normalizeUser(participant));
      }
    });
  };

  sharedTasks.forEach((task) => {
    if (!task || !Array.isArray(task.participants)) return;
    addMembersFromParticipants(task.participants);
    const otherParticipants = task.participants.filter(
      (p) => String(p.user_id) !== String(userId),
    );
    if (otherParticipants.length === 0) return;
    const group = ensureGroup(
      map,
      otherParticipants.map((p) => p.user_id),
      memberLookup,
    );
    group.sharedTasks.push(task);
  });

  challenges.forEach((challenge) => {
    if (!challenge || !Array.isArray(challenge.participants)) return;
    addMembersFromParticipants(challenge.participants);
    const others = challenge.participants.filter(
      (p) => String(p.user_id) !== String(userId),
    );
    if (others.length === 0) return;
    const group = ensureGroup(
      map,
      others.map((p) => p.user_id),
      memberLookup,
    );
    group.challenges.push(challenge);
  });

  const result = Array.from(map.values()).map((group) => {
    const sharedTaskCount = group.sharedTasks.length;
    const challengeCount = group.challenges.length;
    const subtitleParts = [];
    if (sharedTaskCount) subtitleParts.push(`${sharedTaskCount} совместных задач`);
    if (challengeCount) subtitleParts.push(`${challengeCount} челлендж${challengeCount === 1 ? '' : 'ей'}`);

    const sortedTasks = [...group.sharedTasks].sort((a, b) => {
      const aDate = new Date(a.start_dt || 0).getTime();
      const bDate = new Date(b.start_dt || 0).getTime();
      return aDate - bDate;
    });

    const sortedChallenges = [...group.challenges].sort((a, b) => {
      const aDate = new Date(a.start_dt || 0).getTime();
      const bDate = new Date(b.start_dt || 0).getTime();
      return aDate - bDate;
    });

    const nextTask = sortedTasks[0] || null;
    const nextChallenge = sortedChallenges[0] || null;
    const nextDate = nextTask?.start_dt || nextChallenge?.start_dt || null;

    return {
      ...group,
      members: group.memberIds
        .map((id) => memberLookup.get(id))
        .filter(Boolean),
      sharedTasks: sortedTasks,
      challenges: sortedChallenges,
      sharedTaskCount,
      challengeCount,
      nextDate,
      hasActivity: sharedTaskCount > 0 || challengeCount > 0,
      label: group.memberIds
        .map((id) => memberLookup.get(id)?.full_name || 'Без имени')
        .join(', '),
      subtitle: subtitleParts.join(' • ') || 'Пока нет совместных задач',
    };
  });

  return sortFriendGroups(result);
}

export function sortFriendGroups(groups = []) {
  return [...groups].sort((a, b) => {
    const aPriority = a.hasActivity ? 0 : 1;
    const bPriority = b.hasActivity ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;

    const aDate = a.nextDate ? new Date(a.nextDate).getTime() : Infinity;
    const bDate = b.nextDate ? new Date(b.nextDate).getTime() : Infinity;
    if (aDate !== bDate) return aDate - bDate;

    return (a.label || '').localeCompare(b.label || '', 'ru');
  });
}

export function clampParticipants(participants = [], limit = 5) {
  return participants.slice(0, limit);
}

export function initialsFromName(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
}