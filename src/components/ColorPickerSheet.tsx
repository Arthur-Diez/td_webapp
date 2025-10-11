import React, { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import "./ColorPickerSheet.css";

type ColorPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (hex: string) => void;
};

const PRESETS = ["#6C5CE7", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#A855F7"];

const normalizeHex = (input: string): string | null => {
  if (!input) return null;
  let value = input.trim();
  if (!value) return null;
  if (value.startsWith("#")) {
    value = value.slice(1);
  }
  const hexPattern = /^[0-9a-fA-F]+$/;
  if (!hexPattern.test(value)) return null;
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (value.length === 8) {
    value = value.slice(0, 6);
  }
  if (value.length !== 6) return null;
  return `#${value.toUpperCase()}`;
};

const ColorPickerSheet: React.FC<ColorPickerSheetProps> = ({ open, onClose, value, onChange }) => {
  const [draft, setDraft] = useState<string>(value);
  const [touched, setTouched] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setTouched(false);
    }
  }, [open, value]);

  const normalized = useMemo(() => normalizeHex(draft), [draft]);
  const isValid = normalized !== null;

  const handleSave = () => {
    setTouched(true);
    if (!isValid || !normalized) return;
    onChange(normalized);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Цвет задачи">
      <div className="color-sheet">
        <div className="color-sheet__presets" role="list">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`color-sheet__preset ${value === preset ? "color-sheet__preset--active" : ""}`}
              style={{ backgroundColor: preset }}
              onClick={() => {
                onChange(preset);
                onClose();
              }}
              aria-label={`Выбрать цвет ${preset}`}
            />
          ))}
        </div>
        <div className="color-sheet__field">
          <label className="color-sheet__label" htmlFor="color-sheet-hex">
            HEX
          </label>
          <input
            id="color-sheet-hex"
            className={`color-sheet__input ${touched && !isValid ? "color-sheet__input--error" : ""}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="#6C5CE7"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSave();
              }
            }}
          />
        </div>
        <div className="color-sheet__preview" aria-hidden>
          <div
            className="color-sheet__preview-swatch"
            style={{ backgroundColor: normalized ?? value }}
          />
          <span className="color-sheet__preview-text">{normalized ?? draft}</span>
        </div>
        <button
          type="button"
          className="color-sheet__save"
          onClick={handleSave}
          disabled={!isValid}
        >
          Готово
        </button>
      </div>
    </BottomSheet>
  );
};

export default ColorPickerSheet;