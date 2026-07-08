/**
 * Inline, render-blocking script that sets the theme class before first paint to
 * avoid a flash of the wrong theme. Reads the saved choice (or OS preference) and
 * toggles `.dark` on <html>. Kept tiny and dependency-free; injected verbatim in
 * the root layout. Mirror the storage key with ThemeProvider.
 */
export const THEME_STORAGE_KEY = "theme";

// Light-first identity: with no saved choice the app opens in the bright "Verdant
// Glass" theme (unset → light) — a first-time visitor lands on luminous minted white,
// never a dark stage. An explicit `system` choice still follows the OS; `light`/`dark`
// are honored verbatim (dark is the deep "Verdant Dusk" pine, never black). Mirror
// this default in ThemeProvider so the client never flips the theme after hydration.
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
