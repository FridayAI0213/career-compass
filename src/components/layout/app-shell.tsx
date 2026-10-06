import { Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  ChartNoAxesColumn,
  FileText,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Search,
  Settings,
  Sparkle,
  Target,
  UserRound,
  LogOut,
} from "lucide-react";
import { useAuth, signOutCompletely } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/career", label: "My Career", icon: UserRound },
  { to: "/opportunities", label: "Top Matches", icon: Target },
  { to: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

/** Hidden until these features exist, so the app never advertises unbuilt work. */
const SHOW_PLANNED = false;

const PLANNED = [
  { label: "Find Opportunities", icon: Search },
  { label: "Interviews", icon: MessagesSquare },
  { label: "Career Insights", icon: ChartNoAxesColumn },
] as const;

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            "aria-current": "page",
          }}
        >
          <item.icon className="size-4 opacity-80" aria-hidden />
          {item.label}
        </Link>
      ))}

      {SHOW_PLANNED ? (
        <>
          <p className="eyebrow px-2.5 pt-6 pb-2">Coming next</p>
          {PLANNED.map((item) => (
            <span
              key={item.label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/60"
            >
              <item.icon className="size-4 opacity-60" aria-hidden />
              {item.label}
            </span>
          ))}
        </>
      ) : null}
    </>
  );
}

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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const email = user?.email ?? "";
  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "";

  async function signOut() {
    await signOutCompletely(queryClient);
    await router.navigate({ to: "/auth", replace: true });
  }

  const account = (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2.5 px-1.5 py-2">
        <Avatar className="size-7">
          <AvatarFallback className="text-[11px]">{initials(fullName, email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{fullName || "Your account"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
        <LogOut className="size-4" aria-hidden /> Sign out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkle className="size-4" aria-hidden />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-sidebar-foreground">JobOS</span>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-0.5 px-3">
          <NavLinks />
        </nav>

        {account}
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
                    <Menu className="size-4" aria-hidden />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[264px] flex-col bg-sidebar p-0">
                  <SheetTitle className="px-5 py-5 font-display text-[15px]">JobOS</SheetTitle>
                  <nav aria-label="Main" className="flex-1 space-y-0.5 px-3">
                    <NavLinks onNavigate={() => setMobileOpen(false)} />
                  </nav>
                  {account}
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <h1 className="truncate font-display text-xl font-semibold">{title}</h1>
                {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
              </div>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </header>
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
