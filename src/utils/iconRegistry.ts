import type { FC, SVGProps } from "react";

export type IconMeta = {
  key: string;
  group: string;
  name: string;
  Component: FC<SVGProps<SVGSVGElement>>;
};

type IconModule = {
  readonly ReactComponent?: FC<SVGProps<SVGSVGElement>>;
  readonly default: string;
};

type RequireContext<T> = {
  keys(): string[];
  (key: string): T;
};

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): RequireContext<IconModule>;
};

export const GROUP_ORDER = ["work", "home", "sport", "study", "other"] as const;
export type IconGroupId = (typeof GROUP_ORDER)[number];

export const GROUP_LABELS: Record<IconGroupId, string> = {
  work: "Работа",
  home: "Дом/Быт",
  sport: "Спорт",
  study: "Учёба",
  other: "Другое",
};

const ICONS_CONTEXT =
  typeof require === "function" && typeof (require as any).context === "function"
    ? (require as any).context("../assets/icons", true, /\.svg$/)
    : null;

const iconEntries: IconMeta[] = ICONS_CONTEXT
  ? ICONS_CONTEXT.keys()
      .map((request: string) => {
        const match = request.match(/^\.\/(.+)\/(.+)\.svg$/);
        if (!match) return null;
        const [, rawGroup, rawName] = match;
        const group = GROUP_ORDER.includes(rawGroup as IconGroupId)
          ? (rawGroup as IconGroupId)
          : "other";
        const name = rawName;
        const module = ICONS_CONTEXT(request) as IconModule;
        const Component = (module.ReactComponent || (() => null)) as FC<SVGProps<SVGSVGElement>>;
        const key = `${group}/${name}`;
        return { key, group, name, Component };
      })
      .filter((entry): entry is IconMeta => entry !== null)
      .sort((a, b) => {
        if (a.group !== b.group) {
          return GROUP_ORDER.indexOf(a.group as IconGroupId) - GROUP_ORDER.indexOf(b.group as IconGroupId);
        }
        return a.name.localeCompare(b.name);
      })
  : [];

const ICONS_BY_KEY = new Map<string, IconMeta>();
const ICONS_BY_GROUP: Record<string, IconMeta[]> = {};

for (const meta of iconEntries) {
  ICONS_BY_KEY.set(meta.key, meta);
  if (!ICONS_BY_GROUP[meta.group]) {
    ICONS_BY_GROUP[meta.group] = [];
  }
  ICONS_BY_GROUP[meta.group].push(meta);
}

for (const groupId of GROUP_ORDER) {
  if (ICONS_BY_GROUP[groupId]) {
    ICONS_BY_GROUP[groupId].sort((a, b) => a.name.localeCompare(b.name));
  } else {
    ICONS_BY_GROUP[groupId] = [];
  }
}

export const ICONS: IconMeta[] = iconEntries;
export const ICONS_BY_GROUP_ORDERED: Record<IconGroupId, IconMeta[]> = ICONS_BY_GROUP as Record<
  IconGroupId,
  IconMeta[]
>;

export function getIconMeta(key: string | null | undefined): IconMeta | null {
  if (!key) return null;
  return ICONS_BY_KEY.get(key) ?? null;
}

export function iconExists(key: string | null | undefined): boolean {
  if (!key) return false;
  return ICONS_BY_KEY.has(key);
}

export function getIconsForGroup(group: IconGroupId): IconMeta[] {
  return ICONS_BY_GROUP[group] || [];
}
