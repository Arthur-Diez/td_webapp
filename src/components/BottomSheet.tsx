import React, { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import "./BottomSheet.css";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  className = "",
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const animationFrame = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragDeltaRef = useRef<number>(0);

  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.body;
  }, []);

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
    if (!portalTarget) return;
    if (open) {
      portalTarget.classList.add("bottom-sheet--locked");
    } else {
      portalTarget.classList.remove("bottom-sheet--locked");
    }
    return () => portalTarget.classList.remove("bottom-sheet--locked");
  }, [open, portalTarget]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const node = panelRef.current;
    node.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handle = handleRef.current;
    const panel = panelRef.current;
    if (!handle || !panel) return undefined;

    const onPointerMove = (event: PointerEvent) => {
      if (dragStartYRef.current === null) return;
      const delta = Math.max(0, event.clientY - dragStartYRef.current);
      dragDeltaRef.current = delta;
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(() => {
        panel.style.transform = `translateY(${delta}px)`;
        panel.style.opacity = delta > 10 ? String(Math.max(0.2, 1 - delta / 400)) : "1";
      });
    };

    const resetTransform = () => {
      panel.style.transform = "";
      panel.style.opacity = "";
    };

    const onPointerUp = () => {
      if (dragStartYRef.current === null) return;
      const delta = dragDeltaRef.current;
      dragStartYRef.current = null;
      dragDeltaRef.current = 0;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      if (delta > 140) {
        onClose();
      } else {
        resetTransform();
      }
    };

    const onPointerCancel = () => {
      dragStartYRef.current = null;
      dragDeltaRef.current = 0;
      resetTransform();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragStartYRef.current = event.clientY;
      dragDeltaRef.current = 0;
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    };

    handle.addEventListener("pointerdown", onPointerDown);

    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  if (!open || !portalTarget) return null;

  return ReactDOM.createPortal(
    <div className="bottom-sheet" role="presentation">
      <div
        className="bottom-sheet__overlay"
        ref={overlayRef}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`bottom-sheet__panel ${className}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <button
          ref={handleRef}
          type="button"
          className="bottom-sheet__handle"
          aria-label="Потяните, чтобы закрыть"
        >
          <span aria-hidden="true" />
        </button>
        <button
          type="button"
          className="bottom-sheet__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <span aria-hidden="true">⌄</span>
        </button>
        {title && <div className="bottom-sheet__title">{title}</div>}
        <div className="bottom-sheet__body">{children}</div>
        {footer && <div className="bottom-sheet__footer">{footer}</div>}
      </div>
    </div>,
    portalTarget
  );
};

export default BottomSheet;
