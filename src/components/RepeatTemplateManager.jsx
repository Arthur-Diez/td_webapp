import React, { useEffect, useMemo, useState } from "react";
import "./RepeatTemplateManager.css";

export default function RepeatTemplateManager({
  open,
  templates,
  onClose,
  onApply,
  onCreateFromCurrent,
  onRename,
  onTogglePin,
  onSetDefault,
  onDelete,
  searchValue,
  onSearchChange,
  loading,
  error,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");

  const filtered = useMemo(() => {
    const query = (searchValue || "").toLowerCase();
    if (!query) return templates;
    return templates.filter((tpl) => tpl.name.toLowerCase().includes(query));
  }, [templates, searchValue]);

  const startRename = (template) => {
    setEditingId(template.id);
    setDraftName(template.name);
  };

  const submitRename = (template) => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === template.name) {
      setEditingId(null);
      return;
    }
    onRename(template, trimmed);
    setEditingId(null);
  };

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setDraftName("");
    }
  }, [open]);

  return (
    <div className={`rtm ${open ? "rtm--open" : ""}`}>
      <div className="rtm__backdrop" onClick={onClose} />
      <div className="rtm__panel" role="dialog" aria-modal>
        <div className="rtm__header">
          <div className="rtm__title">Мои шаблоны</div>
          <button type="button" className="rtm__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="rtm__toolbar">
          <input
            type="search"
            className="rtm__search"
            placeholder="Поиск по названию"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button type="button" className="rtm__action" onClick={onCreateFromCurrent}>
            Создать из текущих настроек
          </button>
        </div>

        {loading && <div className="rtm__hint">Загружаем…</div>}
        {error && <div className="rtm__error">{error}</div>}

        <div className="rtm__list">
          {filtered.length === 0 && !loading && !error && (
            <div className="rtm__hint">Шаблоны не найдены</div>
          )}
          {filtered.map((template) => {
            const isEditing = editingId === template.id;
            return (
              <div key={template.id} className="rtm__item">
                <div className="rtm__item-info">
                  {isEditing ? (
                    <div className="rtm__edit-row">
                      <input
                        className="rtm__edit"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRename(template);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="rtm__action rtm__action--small"
                        onClick={() => submitRename(template)}
                      >
                        Сохранить
                      </button>
                    </div>
                  ) : (
                    <div className="rtm__item-name">
                      <span>{template.name}</span>
                      {template.is_default && <span className="rtm__badge">по умолчанию</span>}
                      {template.pin_order !== null && template.pin_order !== undefined && (
                        <span className="rtm__badge">закреплён</span>
                      )}
                    </div>
                  )}
                  {template.summary && <div className="rtm__item-summary">{template.summary}</div>}
                </div>
                <div className="rtm__item-actions">
                  <button
                    type="button"
                    className="rtm__action rtm__action--primary"
                    onClick={() => {
                      onApply(template);
                      onClose();
                    }}
                  >
                    Применить
                  </button>
                  {!isEditing && (
                    <button
                      type="button"
                      className="rtm__action rtm__action--ghost"
                      onClick={() => startRename(template)}
                    >
                      Переименовать
                    </button>
                  )}
                  <button
                    type="button"
                    className="rtm__action rtm__action--ghost"
                    onClick={() => onTogglePin(template)}
                  >
                    {template.pin_order !== null && template.pin_order !== undefined
                      ? "Открепить"
                      : "Закрепить"}
                  </button>
                  <button
                    type="button"
                    className="rtm__action rtm__action--ghost"
                    onClick={() => onSetDefault(template)}
                    disabled={template.is_default}
                  >
                    {template.is_default ? "По умолчанию" : "Сделать по умолчанию"}
                  </button>
                  <button
                    type="button"
                    className="rtm__action rtm__action--danger"
                    onClick={() => onDelete(template)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}