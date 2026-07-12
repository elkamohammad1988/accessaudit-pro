/**
 * Inline, render-blocking script that sets the theme class before first paint to
 * avoid a flash of the wrong theme. Reads the saved choice (or OS preference) and
 * toggles `.dark` on <html>. Kept tiny and dependency-free; injected verbatim in
 * the root layout. Mirror the storage key with ThemeProvider.
 */
export const THEME_STORAGE_KEY = "theme";

// Light-first default: with no saved choice the app opens in the warm-ivory day theme,
// matching the airy Material feel (unset → light). Dark is the signature "Gilded Charcoal"
// stage kept as a premium opt-in. An explicit `system` choice follows the OS; `light`/`dark`
// are honored verbatim. Mirror this default in ThemeProvider so the client never flips the
// theme after hydration.
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
