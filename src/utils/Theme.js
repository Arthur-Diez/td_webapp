// src/utils/Theme.js
import WebApp from '@twa-dev/sdk';

export function applyTelegramTheme() {
  const tp = WebApp.themeParams ?? {};
  const doc = document.documentElement;

  const map = {
    bg_color:          '--tg-bg',
    text_color:        '--tg-fg',
    hint_color:        '--tg-accent',
    button_color:      '--tg-btn-bg',
    button_text_color: '--tg-btn-fg',
  };

  Object.entries(map).forEach(([key, cssVar]) => {
    if (tp[key]) doc.style.setProperty(cssVar, tp[key]);
  });

  document.body.classList.toggle('dark', WebApp.isDarkTheme);
}