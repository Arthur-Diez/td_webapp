// src/utils/friends.test.js
import { formatRelativeDateTime, prepareFriendGroups, sortFriendGroups } from './friends';

describe('formatRelativeDateTime', () => {
  const base = new Date('2024-05-15T10:00:00Z');

  it('returns empty string for invalid value', () => {
    expect(formatRelativeDateTime(null, base)).toBe('');
  });

  it('formats today', () => {
    expect(formatRelativeDateTime('2024-05-15T12:00:00Z', base)).toContain('сегодня');
  });

  it('formats tomorrow', () => {
    expect(formatRelativeDateTime('2024-05-16T12:00:00Z', base)).toContain('завтра');
  });
});

describe('prepareFriendGroups & sortFriendGroups', () => {
  const userId = 1;
  const friends = [
    { user_id: 2, full_name: 'Иван Иванов', avatar_url: null },
    { user_id: 3, full_name: 'Мария Петрова', avatar_url: null },
  ];

  const tasks = [
    {
      id: 't1',
      title: 'Тренировка',
      start_dt: '2024-05-20T09:00:00Z',
      participants: [
        { user_id: 1, full_name: 'Автор', avatar_url: null },
        { user_id: 2, full_name: 'Иван Иванов', avatar_url: null },
      ],
    },
  ];

  const challenges = [
    {
      id: 'c1',
      title: '30 дней спорта',
      type: 'daily',
      start_dt: '2024-05-18T00:00:00Z',
      participants: [
        { user_id: 1, full_name: 'Автор', avatar_url: null },
        { user_id: 3, full_name: 'Мария Петрова', avatar_url: null },
      ],
    },
  ];

  it('creates groups with tasks and challenges', () => {
    const groups = prepareFriendGroups({ friends, sharedTasks: tasks, challenges, userId });
    expect(groups).toHaveLength(2);
    const ivan = groups.find((g) => g.memberIds.includes('2'));
    const maria = groups.find((g) => g.memberIds.includes('3'));
    expect(ivan.sharedTaskCount).toBe(1);
    expect(maria.challengeCount).toBe(1);
  });

  it('sorts groups by activity then by ближайшая дата', () => {
    const groups = prepareFriendGroups({ friends, sharedTasks: tasks, challenges, userId });
    const sorted = sortFriendGroups(groups);
    expect(sorted[0].memberIds.includes('3')).toBe(true);
    expect(sorted[1].memberIds.includes('2')).toBe(true);
  });
});