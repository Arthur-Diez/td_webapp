import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import "./ColorPickerSheet.css";

const PRESET_COLORS = ["#6C5CE7", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#A855F7", "#EC4899", "#14B8A6"];
const FALLBACK_COLOR = PRESET_COLORS[0];

type ColorPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (color: string) => void;
};

type PointerPosition = { x: number; y: number } | null;

const normalizeHex = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  let value = trimmed.replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(value)) return null;
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (value.length !== 6) return null;
  return `#${value.toUpperCase()}`;
};

const drawColorField = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const hueGradient = ctx.createLinearGradient(0, 0, width, 0);
  hueGradient.addColorStop(0, "#FF0000");
  hueGradient.addColorStop(0.16, "#FF7F00");
  hueGradient.addColorStop(0.33, "#FFFF00");
  hueGradient.addColorStop(0.5, "#00FF00");
  hueGradient.addColorStop(0.66, "#0000FF");
  hueGradient.addColorStop(0.83, "#4B0082");
  hueGradient.addColorStop(1, "#FF00FF");
  ctx.fillStyle = hueGradient;
  ctx.fillRect(0, 0, width, height);

  const whiteGradient = ctx.createLinearGradient(0, 0, width, 0);
  whiteGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  whiteGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = whiteGradient;
  ctx.fillRect(0, 0, width, height);

  const blackGradient = ctx.createLinearGradient(0, 0, 0, height);
  blackGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  blackGradient.addColorStop(1, "rgba(0, 0, 0, 1)");
  ctx.fillStyle = blackGradient;
  ctx.fillRect(0, 0, width, height);
};

const ColorPickerSheet: React.FC<ColorPickerSheetProps> = ({ open, onClose, value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draftColor, setDraftColor] = useState<string>(normalizeHex(value) || FALLBACK_COLOR);
  const [inputValue, setInputValue] = useState<string>(normalizeHex(value) || FALLBACK_COLOR);
  const [inputValid, setInputValid] = useState(true);
  const [pointerPosition, setPointerPosition] = useState<PointerPosition>(null);
  const draggingRef = useRef(false);

  const safeColor = useMemo(() => normalizeHex(draftColor) || FALLBACK_COLOR, [draftColor]);

  const resizeAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    const baseWidth = rect?.width ?? 320;
    const targetWidth = Math.max(Math.min(baseWidth, 420), 180);
    const targetHeight = Math.max(160, Math.round(targetWidth * 0.55));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(targetWidth * dpr);
    canvas.height = Math.floor(targetHeight * dpr);
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawColorField(ctx, targetWidth, targetHeight);
  }, []);

  useEffect(() => {
    if (!open) return;
    resizeAndDraw();
    const listener = () => resizeAndDraw();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [open, resizeAndDraw]);

  useEffect(() => {
    if (!open) return;
    const normalized = normalizeHex(value);
    const nextColor = normalized || FALLBACK_COLOR;
    setDraftColor(nextColor);
    setInputValue(nextColor);
    setInputValid(true);
    setPointerPosition(null);
    requestAnimationFrame(() => resizeAndDraw());
  }, [open, value, resizeAndDraw]);

  const pickColorAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const clampedX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const clampedY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const image = ctx.getImageData(Math.floor(clampedX * dpr), Math.floor(clampedY * dpr), 1, 1).data;
    const [r, g, b] = image;
    const hex = `#${[r, g, b]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`;
    setDraftColor(hex);
    setInputValue(hex);
    setInputValid(true);
    setPointerPosition({ x: clampedX / rect.width, y: clampedY / rect.height });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      draggingRef.current = true;
      pickColorAt(event.clientX, event.clientY);
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      pickColorAt(event.clientX, event.clientY);
    };

    const stopDragging = (event: PointerEvent) => {
      draggingRef.current = false;
      canvas.releasePointerCapture(event.pointerId);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", stopDragging);
      canvas.removeEventListener("pointercancel", stopDragging);
    };
  }, [open, pickColorAt]);

  const handlePresetClick = (color: string) => {
    setDraftColor(color);
    setInputValue(color);
    setInputValid(true);
    setPointerPosition(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setInputValue(next);
    const normalized = normalizeHex(next);
    if (normalized) {
      setDraftColor(normalized);
      setInputValid(true);
    } else {
      setInputValid(false);
    }
  };

  const handleDone = () => {
    const normalized = normalizeHex(draftColor);
    if (!normalized) return;
    onChange(normalized);
    onClose();
  };

  const previewTextColor = useMemo(() => {
    const normalized = normalizeHex(draftColor) || FALLBACK_COLOR;
    const raw = normalized.replace("#", "");
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.55 ? "#1f2933" : "#ffffff";
  }, [draftColor]);

  const renderCursor = () => {
    if (!pointerPosition) return null;
    return (
      <span
        className="color-sheet__cursor"
        style={{ left: `${pointerPosition.x * 100}%`, top: `${pointerPosition.y * 100}%` }}
      />
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Выберите цвет">
      <div className="color-sheet">
        <div className="color-sheet__presets" role="list">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-sheet__preset ${safeColor === color ? "color-sheet__preset--active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => handlePresetClick(color)}
              aria-label={`Цвет ${color}`}
            />
          ))}
        </div>

        <div className="color-sheet__canvas-wrapper">
          <canvas ref={canvasRef} className="color-sheet__canvas" aria-label="Палитра цветов" />
          {renderCursor()}
        </div>

        <div className="color-sheet__preview">
          <div
            className="color-sheet__preview-swatch"
            style={{ backgroundColor: safeColor, color: previewTextColor }}
          >
            <span>{safeColor}</span>
          </div>
          <div className="color-sheet__field">
            <label className="color-sheet__label" htmlFor="color-picker-hex">
              HEX
            </label>
            <input
              id="color-picker-hex"
              className={`color-sheet__input ${inputValid ? "" : "color-sheet__input--error"}`}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        <button
          type="button"
          className="color-sheet__save"
          onClick={handleDone}
          disabled={!inputValid}
        >
          Готово
        </button>
      </div>
    </BottomSheet>
  );
};

export default ColorPickerSheet;
