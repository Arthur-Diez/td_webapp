import type { FC, SVGProps } from "react";

export const GROUP_ORDER = ["work", "home", "sport", "study", "other"] as const;
export type IconGroupId = (typeof GROUP_ORDER)[number];

export type IconMeta = {
  key: string;
  group: IconGroupId;
  name: string;
  Component: FC<SVGProps<SVGSVGElement>>;
};

type IconModule = {
  readonly ReactComponent?: FC<SVGProps<SVGSVGElement>>;
};

type ModuleMap = Record<string, IconModule>;

type RequireContext = {
  keys(): string[];
  <T>(id: string): T;
};

type MaybeWebpackRequire = {
  context?: (path: string, deep?: boolean, filter?: RegExp) => RequireContext;
};

const NULL_ICON: FC<SVGProps<SVGSVGElement>> = () => null;

const getWebpackRequire = (): MaybeWebpackRequire | null => {
  if (typeof globalThis === "undefined") {
    return null;
  }
  const candidate = (globalThis as Record<string, unknown>).require;
  if (!candidate || typeof candidate !== "function") {
    return null;
  }
  return candidate as MaybeWebpackRequire;
};

const getImportMetaGlob = () => {
  try {
    // eslint-disable-next-line no-new-func
    return Function(
      "return typeof import.meta !== 'undefined' && import.meta && typeof import.meta.glob === 'function' ? import.meta.glob : null;"
    )();
  } catch (error) {
    return null;
  }
};

const loadViaImportGlob = (): ModuleMap | null => {
  const glob = getImportMetaGlob() as
    | ((pattern: string, options: { eager: boolean }) => Record<string, unknown>)
    | null;
  if (typeof glob !== "function") {
    return null;
  }
  try {
    return glob("../assets/icons/**/*.svg", { eager: true }) as ModuleMap;
  } catch (error) {
    console.error("Icon registry: failed to load icons via import.meta.glob", error);
    return null;
  }
};

const loadViaRequireContext = (): ModuleMap | null => {
  try {
    const maybeRequire = getWebpackRequire();
    if (!maybeRequire || typeof maybeRequire.context !== "function") {
      return null;
    }
    const context = maybeRequire.context("../assets/icons", true, /\.svg$/);
    const keys = context.keys();
    return keys.reduce<ModuleMap>((acc, key) => {
      acc[key] = context(key) as IconModule;
      return acc;
    }, {});
  } catch (error) {
    console.error("Icon registry: failed to load icons via require.context", error);
    return null;
  }
};

const modules: ModuleMap =
  loadViaImportGlob() ??
  loadViaRequireContext() ??
  {};

const normalizePath = (rawPath: string): string => {
  const withoutLeadingDots = rawPath.replace(/^(\.\/)+/, "");
  const withoutAssetsPrefix = withoutLeadingDots.replace(/^((\.\.\/)*)assets\/icons\//, "");
  return withoutAssetsPrefix;
};

const entries: IconMeta[] = Object.entries(modules)
  .map(([path, mod]) => {
    const normalized = normalizePath(path);
    const match = normalized.match(/^([^/]+)\/([^/]+)\.svg$/);
    if (!match) {
      return null;
    }
    const [, rawGroup, rawName] = match;
    const group = GROUP_ORDER.includes(rawGroup as IconGroupId)
      ? (rawGroup as IconGroupId)
      : "other";
    const Component = (mod.ReactComponent ?? NULL_ICON) as FC<SVGProps<SVGSVGElement>>;
    const key = `${group}/${rawName}`;

    return {
      key,
      group,
      name: rawName,
      Component,
    } satisfies IconMeta;
  })
  .filter((meta): meta is IconMeta => Boolean(meta))
  .sort((a, b) => {
    if (a.group !== b.group) {
      return GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
    }
    return a.name.localeCompare(b.name);
  });

export const ICONS: IconMeta[] = entries;
export const ICONS_BY_KEY: Map<string, IconMeta> = new Map();
export const ICONS_BY_GROUP_ORDERED: Record<IconGroupId, IconMeta[]> = {
  work: [],
  home: [],
  sport: [],
  study: [],
  other: [],
};

for (const meta of ICONS) {
  ICONS_BY_KEY.set(meta.key, meta);
  ICONS_BY_GROUP_ORDERED[meta.group].push(meta);
}

for (const groupId of GROUP_ORDER) {
  ICONS_BY_GROUP_ORDERED[groupId].sort((a, b) => a.name.localeCompare(b.name));
}

export const GROUP_LABELS: Record<IconGroupId, string> = {
  work: "Работа",
  home: "Дом/Быт",
  sport: "Спорт",
  study: "Учёба",
  other: "Другое",
};

export function getIconsForGroup(group: IconGroupId): IconMeta[] {
  return ICONS_BY_GROUP_ORDERED[group] ?? [];
}

export function getIconMeta(key?: string | null): IconMeta | null {
  if (!key) {
    return null;
  }
  return ICONS_BY_KEY.get(key) ?? null;
}

export function iconExists(key?: string | null): boolean {
  if (!key) {
    return false;
  }
  return ICONS_BY_KEY.has(key);
}