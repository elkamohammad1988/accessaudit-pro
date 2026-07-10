/**
 * Inline, render-blocking script that sets the theme class before first paint to
 * avoid a flash of the wrong theme. Reads the saved choice (or OS preference) and
 * toggles `.dark` on <html>. Kept tiny and dependency-free; injected verbatim in
 * the root layout. Mirror the storage key with ThemeProvider.
 */
export const THEME_STORAGE_KEY = "theme";

// Dark-first identity: with no saved choice the app opens in the signature "Gilded
// Charcoal" theme (unset → dark) — a first-time visitor lands on warm graphite lit by
// gold, the premium enterprise stage. An explicit `system` choice still follows the OS;
// `light`/`dark` are honored verbatim (light is the warm-ivory day theme). Mirror this
// default in ThemeProvider so the client never flips the theme after hydration.
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||t==null||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
