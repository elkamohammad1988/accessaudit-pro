/**
 * Inline, render-blocking script that sets the theme class before first paint to
 * avoid a flash of the wrong theme. Reads the saved choice (or OS preference) and
 * toggles `.dark` on <html>. Kept tiny and dependency-free; injected verbatim in
 * the root layout. Mirror the storage key with ThemeProvider.
 */
export const THEME_STORAGE_KEY = "theme";

export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
