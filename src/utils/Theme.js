import WebApp from '@twa-dev/sdk';

/**
 * Берём цвета из WebApp.themeParams и кладём в CSS-переменные.
 * Вызывайте один раз при старте и при событии 'themeChanged'.
 */
export function applyTelegramTheme() {
  const tp = WebApp.themeParams ?? {};               // объект c цветами
  const doc = document.documentElement;

  const map = {
    bg_color: '--tg-bg',
    text_color: '--tg-fg',
    hint_color: '--tg-hint',
    button_color: '--tg-btn-bg',
    button_text_color: '--tg-btn-fg',
    accent_text_color: '--tg-accent'
    };

  Object.entries(map).forEach(([tgKey, cssVar])=>{
    if(tp[tgKey]) doc.style.setProperty(cssVar, `#${tp[tgKey]}`);
  });

  // Переключаем класс dark для всего body
  document.body.classList.toggle('dark', WebApp.isDarkTheme);
}

console.log('ThemeParams:', WebApp.themeParams);
console.log('isDarkTheme:', WebApp.isDarkTheme);