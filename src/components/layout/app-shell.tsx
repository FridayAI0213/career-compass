import { Link, useRouter } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  ChartNoAxesColumn,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Search,
  Settings,
  Sparkle,
  Target,
  UserRound,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/career", label: "My Career", icon: UserRound },
  { to: "/opportunities", label: "Top Matches", icon: Target },
  { to: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const PLANNED = [
  { label: "Find Opportunities", icon: Search },
  { label: "Interviews", icon: MessagesSquare },
  { label: "Career Insights", icon: ChartNoAxesColumn },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    await router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkle className="size-4" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-sidebar-foreground">JobOS</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
            >
              <item.icon className="size-4 opacity-80" />
              {item.label}
            </Link>
          ))}

          <p className="eyebrow px-2.5 pt-6 pb-2">Coming next</p>
          {PLANNED.map((item) => (
            <span
              key={item.label}
              className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/60"
            >
              <item.icon className="size-4 opacity-60" />
              {item.label}
            </span>
          ))}
        </nav>

        <div className="p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4 md:px-8">
            <div>
              <h1 className="font-display text-xl font-semibold">{title}</h1>
              {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}