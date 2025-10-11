import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./BottomSheet.css";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, title, children }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.classList.add("bottom-sheet--locked");
    } else {
      document.body.classList.remove("bottom-sheet--locked");
    }
    return () => {
      document.body.classList.remove("bottom-sheet--locked");
    };
  }, [open]);

  useEffect(() => {
    if (!open || !sheetRef.current) return undefined;
    const node = sheetRef.current;

    const handlePointerDown = (event: PointerEvent) => {
      startYRef.current = event.clientY;
      currentYRef.current = 0;
      node.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (startYRef.current === null) return;
      currentYRef.current = Math.max(0, event.clientY - startYRef.current);
      node.style.transform = `translateY(${currentYRef.current}px)`;
    };

    const handlePointerUp = (event: PointerEvent) => {
      node.releasePointerCapture(event.pointerId);
      if (startYRef.current === null) return;
      if (currentYRef.current > 120) {
        onClose();
      }
      node.style.transform = "";
      startYRef.current = null;
      currentYRef.current = 0;
    };

    const handlePointerCancel = (event: PointerEvent) => {
      node.releasePointerCapture(event.pointerId);
      node.style.transform = "";
      startYRef.current = null;
      currentYRef.current = 0;
    };

    node.addEventListener("pointerdown", handlePointerDown);
    node.addEventListener("pointermove", handlePointerMove);
    node.addEventListener("pointerup", handlePointerUp);
    node.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      node.removeEventListener("pointerdown", handlePointerDown);
      node.removeEventListener("pointermove", handlePointerMove);
      node.removeEventListener("pointerup", handlePointerUp);
      node.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="bottom-sheet" role="presentation">
      <div
        className="bottom-sheet__overlay"
        ref={overlayRef}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="bottom-sheet__panel" ref={sheetRef} role="dialog" aria-modal="true">
        <div className="bottom-sheet__handle" aria-hidden="true" />
        {title && <div className="bottom-sheet__title">{title}</div>}
        <div className="bottom-sheet__content">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;