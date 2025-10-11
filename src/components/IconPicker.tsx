import React, { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import { ICON_GROUPS, groupOf, loadIcons } from "../utils/loadIcons";
import "./IconPicker.css";

type IconPickerProps = {
  open: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (key: string) => void;
};

const IconPicker: React.FC<IconPickerProps> = ({ open, onClose, value, onChange }) => {
  const icons = useMemo(() => loadIcons(), []);
  const [activeGroup, setActiveGroup] = useState<string>(() => {
    if (value) return groupOf(value);
    return ICON_GROUPS[0]?.id ?? "other";
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (value) {
      setActiveGroup(groupOf(value));
    }
  }, [open, value]);

  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      if (icon.group !== activeGroup) return false;
      if (!query) return true;
      return icon.key.toLowerCase().includes(query.toLowerCase());
    });
  }, [icons, activeGroup, query]);

  const handleSelect = (key: string) => {
    onChange(key);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Выберите иконку">
      <div className="icon-picker">
        <nav className="icon-picker__groups" aria-label="Группы иконок">
          {ICON_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              className={`icon-picker__group ${activeGroup === group.id ? "icon-picker__group--active" : ""}`}
              onClick={() => setActiveGroup(group.id)}
            >
              {group.label}
            </button>
          ))}
        </nav>
        <div className="icon-picker__gallery">
          <div className="icon-picker__toolbar">
            <input
              type="search"
              className="icon-picker__search"
              placeholder="Поиск"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="icon-picker__grid" role="list">
            {filteredIcons.length === 0 && (
              <div className="icon-picker__empty">Нет иконок</div>
            )}
            {filteredIcons.map((icon) => {
              const IconComponent = icon.Component;
              const isActive = value === icon.key;
              return (
                <button
                  key={icon.key}
                  type="button"
                  className={`icon-picker__item ${isActive ? "icon-picker__item--active" : ""}`}
                  onClick={() => handleSelect(icon.key)}
                  title={icon.key.replace(/^.*?_/, "")}
                >
                  <IconComponent className="icon-picker__svg" />
                  {isActive && <span className="icon-picker__check" aria-hidden="true">✓</span>}
                  <span className="icon-picker__label">{icon.key}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default IconPicker;