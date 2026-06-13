import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-lg font-bold tracking-tight">
            AccessAudit<span className="text-brand"> Pro</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
