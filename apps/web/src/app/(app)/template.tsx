/**
 * Per-navigation transition wrapper. Unlike `layout.tsx`, a `template.tsx`
 * re-mounts on every route change, so this gives the authed app a smooth, quiet
 * transition between pages without any client JS or animation library. Content
 * rises and un-blurs into place (transform/opacity/filter only — no layout
 * shift), collapsed to an instant swap for `prefers-reduced-motion` users by the
 * global rule in globals.css.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-enter-blur">{children}</div>;
}
