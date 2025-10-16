import React, { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import "./IconPicker.css";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  IconGroupId,
  IconMeta,
  getIconMeta,
  getIconsForGroup,
} from "../utils/iconRegistry";

type IconPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  value?: string | null;
  onChange: (iconKey: string) => void;
};

const FALLBACK_GROUP: IconGroupId = GROUP_ORDER[0];

const IconPicker: React.FC<IconPickerProps> = ({ isOpen, onClose, value, onChange }) => {
  const initialGroup = useMemo<IconGroupId>(() => {
    const meta = getIconMeta(value);
    return meta?.group ?? FALLBACK_GROUP;
  }, [value]);

  const [activeGroup, setActiveGroup] = useState<IconGroupId>(initialGroup);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setActiveGroup(initialGroup);
  }, [isOpen, initialGroup]);

  const icons = useMemo<IconMeta[]>(() => getIconsForGroup(activeGroup), [activeGroup]);

  const handleSelect = (iconKey: string) => {
    onChange(iconKey);
    onClose();
  };

  return (
    <BottomSheet open={isOpen} onClose={onClose} title="Выберите иконку">
      <div className="icon-picker">
        <nav className="icon-picker__groups" aria-label="Группы иконок">
          {GROUP_ORDER.map((groupId) => {
            const isActive = activeGroup === groupId;
            return (
              <button
                key={groupId}
                type="button"
                className={`icon-picker__group ${isActive ? "icon-picker__group--active" : ""}`}
                onClick={() => setActiveGroup(groupId)}
              >
                {GROUP_LABELS[groupId]}
              </button>
            );
          })}
        </nav>
        <div className="icon-picker__grid" role="list">
          {icons.length === 0 ? (
            <div className="icon-picker__empty">Нет иконок в этой категории</div>
          ) : (
            icons.map((icon) => {
              const IconComponent = icon.Component;
              const selected = value === icon.key;
              return (
                <button
                  key={icon.key}
                  type="button"
                  className={`icon-picker__item ${selected ? "icon-picker__item--active" : ""}`}
                  onClick={() => handleSelect(icon.key)}
                  aria-pressed={selected}
                  aria-label={icon.name}
                >
                  <IconComponent className="icon-picker__svg" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default IconPicker;
