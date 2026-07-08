export const THEME_STORAGE_KEY = "verdant-theme";
export const LOCALE_STORAGE_KEY = "verdant-locale";

/**
 * Inlined in <head> and run before paint so the correct theme + text direction are
 * on <html> on the first frame — no flash of the wrong theme, no RTL flip. Kept
 * dependency-free and defensive (wrapped in try/catch) because it runs raw.
 */
export const themeScript = `(function(){try{
  var t = localStorage.getItem('${THEME_STORAGE_KEY}') || 'system';
  var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var el = document.documentElement;
  el.classList.toggle('dark', dark);
  el.style.colorScheme = dark ? 'dark' : 'light';
  var l = localStorage.getItem('${LOCALE_STORAGE_KEY}');
  if (l) { el.lang = l; el.dir = (l === 'ar' ? 'rtl' : 'ltr'); }
}catch(e){}})();`;
