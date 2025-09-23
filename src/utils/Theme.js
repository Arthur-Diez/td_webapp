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
    if (tp[key]) {
      doc.style.setProperty(cssVar, tp[key]);
    }
  });

  const scheme = WebApp.colorScheme;
  const mediaDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const isDark = typeof WebApp.isDarkTheme === 'boolean'
    ? WebApp.isDarkTheme
    : scheme
      ? scheme === 'dark'
      : !!mediaDark;

  document.body.classList.toggle('dark', isDark);
}