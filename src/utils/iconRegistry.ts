import type { FC, SVGProps } from "react";

type IconModule = {
  readonly ReactComponent?: FC<SVGProps<SVGSVGElement>>;
  readonly default?: string;
};

type ModuleMap = Record<string, IconModule>;

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

export const GROUP_ORDER = ["work", "home", "sport", "study", "other"] as const;
export type IconGroupId = (typeof GROUP_ORDER)[number];

export type IconMeta = {
  key: string;
  group: IconGroupId;               // ✅ было: string
  name: string;
  Component: FC<SVGProps<SVGSVGElement>>;
};

export const GROUP_LABELS: Record<IconGroupId, string> = {
  work: "Работа",
  home: "Дом/Быт",
  sport: "Спорт",
  study: "Учёба",
  other: "Другое",
};

const hasImportGlob =
  typeof import.meta !== "undefined" && typeof (import.meta as any).glob === "function";
const hasRequireContext =
  typeof require === "function" && typeof (require as any)?.context === "function";

let modules: ModuleMap = {};

if (hasImportGlob) {
  modules = (import.meta as any).glob("../assets/icons/**/*.svg", { eager: true }) as ModuleMap;
} else if (hasRequireContext) {
  try {
    // Явно приводим только если у require действительно есть .context
    type ReqWithContext = {
      context: (path: string, deep?: boolean, filter?: RegExp) => {
        keys(): string[];
        <T>(id: string): T;
      };
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: ReqWithContext | null =
      typeof require !== "undefined" && (require as any)?.context
        ? (require as unknown as ReqWithContext)
        : null;

    if (r) {
      const context = r.context("../assets/icons", true, /\.svg$/);
      const keys: string[] = context.keys();

      modules = keys.reduce<ModuleMap>((acc, key) => {
        acc[key] = context<IconModule>(key);
        return acc;
      }, {});
    } else {
      modules = {};
    }
  } catch (error) {
    console.error("Icon registry: failed to load via require.context", error);
    modules = {};
  }
}

const iconEntries: IconMeta[] = Object.entries(modules)
  .map(([rawPath, mod]) => {
    const normalized = rawPath.replace(/^\.\//, "").replace(/^\.\.\/assets\/icons\//, "");
    const match = normalized.match(/^([^/]+)\/([^/]+)\.svg$/);
    if (!match) return null;

    const [, rawGroup, rawName] = match;
    const group = (GROUP_ORDER.includes(rawGroup as IconGroupId)
      ? (rawGroup as IconGroupId)
      : "other") as IconGroupId;    // ✅ гарантируем IconGroupId

    const Component =
      (mod.ReactComponent || (() => null)) as FC<SVGProps<SVGSVGElement>>;
    const key = `${group}/${rawName}`;

    return { key, group, name: rawName, Component } as IconMeta;
  })
  // ✅ типовой предикат теперь согласован с IconMeta
  .filter((entry): entry is IconMeta => Boolean(entry))
  .sort((a, b) => {
    if (a.group !== b.group) {
      return GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
    }
    return a.name.localeCompare(b.name);
  });

const ICONS_BY_KEY = new Map<string, IconMeta>();
const ICONS_BY_GROUP: Record<IconGroupId, IconMeta[]> = {
  work: [],
  home: [],
  sport: [],
  study: [],
  other: [],
};

for (const meta of iconEntries) {
  ICONS_BY_KEY.set(meta.key, meta);
  ICONS_BY_GROUP[meta.group].push(meta);
}

for (const groupId of GROUP_ORDER) {
  ICONS_BY_GROUP[groupId].sort((a, b) => a.name.localeCompare(b.name));
}

export const ICONS: IconMeta[] = iconEntries;
export const ICONS_BY_GROUP_ORDERED = ICONS_BY_GROUP;

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