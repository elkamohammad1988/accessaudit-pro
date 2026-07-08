import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

/** A styled native select — accessible by default, with a custom chevron. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, className, ...props },
  ref,
) {
  return (
    <div className="relative inline-flex w-full">
      <select
        ref={ref}
        className={cn(
          "field h-11 w-full cursor-pointer appearance-none py-0 pl-4 pr-10 text-sm font-medium",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
});
