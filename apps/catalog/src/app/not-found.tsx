import Link from "next/link";
import { Compass } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <LogoMark size={44} />
      <span className="mt-10 grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand-deep ring-1 ring-inset ring-brand/15">
        <Compass className="h-7 w-7" strokeWidth={1.6} aria-hidden />
      </span>
      <p className="mt-6 font-display text-6xl text-foreground">404</p>
      <h1 className="mt-2 font-display text-2xl text-foreground">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The piece you were looking for may have sold out or moved. Let&apos;s get you back to the
        catalogue.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClasses("primary", "md")}>
          Back to home
        </Link>
        <Link href="/catalog" className={buttonClasses("secondary", "md")}>
          Browse the catalogue
        </Link>
      </div>
    </div>
  );
}
