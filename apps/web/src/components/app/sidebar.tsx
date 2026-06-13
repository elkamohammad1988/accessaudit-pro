import Link from "next/link";
import { LayoutDashboard, Users, FolderKanban, Settings } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ orgName, email }: { orgName: string; email: string | undefined }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-[hsl(var(--muted))]">
      <div className="px-4 py-5">
        <Link href="/dashboard" className="text-base font-bold tracking-tight">
          AccessAudit<span className="text-brand"> Pro</span>
        </Link>
        <p className="mt-1 truncate text-sm text-[hsl(var(--muted-foreground))]" title={orgName}>
          {orgName}
        </p>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <p className="mb-2 truncate text-xs text-[hsl(var(--muted-foreground))]" title={email}>
          {email}
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
