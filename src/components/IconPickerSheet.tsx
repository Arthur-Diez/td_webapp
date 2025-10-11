import React, { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import "./IconPicker.css";
import {
  GROUP_ORDER,
  GROUP_LABELS,
  IconGroupId,
  IconMeta,
  ICONS_BY_GROUP_ORDERED,
  getIconMeta,
} from "../utils/iconRegistry";

type IconPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (key: string) => void;
};

const FALLBACK_GROUP: IconGroupId = GROUP_ORDER[0];

const IconPickerSheet: React.FC<IconPickerSheetProps> = ({ open, onClose, value, onChange }) => {
  const initialGroup = useMemo(() => {
    const meta = getIconMeta(value);
    return (meta?.group as IconGroupId) || FALLBACK_GROUP;
  }, [value]);

  const [activeGroup, setActiveGroup] = useState<IconGroupId>(initialGroup);

  useEffect(() => {
    if (!open) return;
    setActiveGroup(initialGroup);
  }, [open, initialGroup]);

  const icons: IconMeta[] = useMemo(() => {
    return ICONS_BY_GROUP_ORDERED[activeGroup] || [];
  }, [activeGroup]);

  const handleIconSelect = (key: string) => {
    onChange(key);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Выберите иконку">
      <div className="icon-picker">
        <nav className="icon-picker__groups" aria-label="Группы иконок">
          {GROUP_ORDER.map((groupId) => (
            <button
              key={groupId}
              type="button"
              className={`icon-picker__group ${activeGroup === groupId ? "icon-picker__group--active" : ""}`}
              onClick={() => setActiveGroup(groupId)}
            >
              {GROUP_LABELS[groupId]}
            </button>
          ))}
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
                  onClick={() => handleIconSelect(icon.key)}
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

export default IconPickerSheet;
