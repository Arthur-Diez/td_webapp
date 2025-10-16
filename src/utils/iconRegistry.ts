import type { IconGroupId } from '../generated/iconRegistry';

export type { IconGroupId, IconMeta } from '../generated/iconRegistry';
export {
  GROUP_ORDER,
  ICONS,
  ICONS_BY_GROUP_ORDERED,
  ICONS_BY_KEY,
  getIconMeta,
  getIconsForGroup,
  iconExists,
} from '../generated/iconRegistry';

export const GROUP_LABELS: Record<IconGroupId, string> = {
  work: 'Работа',
  home: 'Дом/Быт',
  sport: 'Спорт',
  study: 'Учёба',
  other: 'Другое',
};