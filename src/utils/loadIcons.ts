import type { FC, SVGProps } from "react";

declare const require: { context: (path: string, deep: boolean, filter: RegExp) => any };

export type LoadedIcon = {
  key: string;
  group: string;
  Component: FC<SVGProps<SVGSVGElement>>;
};

type IconGroup = {
  id: string;
  label: string;
};

export const ICON_GROUPS: IconGroup[] = [
  { id: "work", label: "Работа" },
  { id: "home", label: "Дом/Быт" },
  { id: "health", label: "Здоровье" },
  { id: "study", label: "Учёба" },
  { id: "social", label: "Соц" },
  { id: "other", label: "Другое" },
];

export function groupOf(key: string): string {
  const prefix = key.split("_")[0];
  if (["work", "home", "health", "study", "social"].includes(prefix)) {
    return prefix;
  }
  return "other";
}

interface IconModule {
  ReactComponent?: FC<SVGProps<SVGSVGElement>>;
  default: string;
}

const hasRequireContext =
  typeof require === "function" && typeof (require as any).context === "function";

const iconsContext = hasRequireContext
  ? (require as any).context("../assets/icons", false, /\.svg$/)
  : null;

export function loadIcons(): LoadedIcon[] {
  if (!iconsContext) return [];
  const entries = iconsContext.keys();
  const icons: LoadedIcon[] = entries
    .map((path: string) => {
      const mod = iconsContext(path) as IconModule;
      const key = path.replace(/^\.\//, "").replace(/\.svg$/, "");
      const group = groupOf(key);
      const RawComponent = mod.ReactComponent;
      const Component = (RawComponent || (() => null)) as FC<SVGProps<SVGSVGElement>>;
      return {
        key,
        group,
        Component,
      };
    })
    .sort((a: LoadedIcon, b: LoadedIcon) => a.key.localeCompare(b.key));

  return icons;
}