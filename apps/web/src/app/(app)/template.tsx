/**
 * Per-navigation transition wrapper. Unlike `layout.tsx`, a `template.tsx`
 * re-mounts on every route change, so this gives the authed app a smooth, quiet
 * cross-fade between pages without any client JS or animation library. The fade
 * is opacity-only (cheap, no layout shift) and is collapsed to an instant swap
 * for `prefers-reduced-motion` users by the global rule in globals.css.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
