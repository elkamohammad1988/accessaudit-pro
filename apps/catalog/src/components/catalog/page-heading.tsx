import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";

interface PageHeadingProps {
  crumbs?: Crumb[];
  kicker?: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
}

/** The shared header block at the top of catalogue, category and collection pages. */
export function PageHeading({ crumbs, kicker, title, description, meta }: PageHeadingProps) {
  return (
    <div>
      {crumbs ? <Breadcrumbs items={crumbs} /> : null}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {kicker ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep">
              {kicker}
            </p>
          ) : null}
          <h1 className="font-display text-4xl text-foreground sm:text-5xl sm:leading-[1.05]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
    </div>
  );
}
