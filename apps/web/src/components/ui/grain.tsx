/**
 * Film-grain overlay — a single fixed tile of desaturated fractal noise mounted
 * once site-wide (see the root layout). It sits BEHIND content (`z-index:-1` via
 * the `.grain` utility) so it enriches the void and the ambient glows without ever
 * degrading text contrast, and it's dropped from print. Purely decorative and
 * static (no motion), so reduced-motion users lose nothing.
 *
 * Server component — no client JS. The visual lives entirely in the `.grain`
 * utility (globals.css); this just places the element.
 */
export function GrainOverlay() {
  return <div aria-hidden="true" className="grain no-print" />;
}
