import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users2,
  Building2,
  LibraryBig,
  ClipboardList,
  FileBarChart,
  ScrollText,
  BookMarked,
  Tags,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Books", to: "/books", icon: BookOpen },
  { label: "Borrow Records", to: "/borrow-records", icon: ClipboardList },
  { label: "Authors", to: "/authors", icon: BookMarked },
  { label: "Publishers", to: "/publishers", icon: Building2 },
  { label: "Categories", to: "/categories", icon: Tags },
  { label: "Rooms", to: "/rooms", icon: Building },
  { label: "Shelves", to: "/shelves", icon: LibraryBig },
  { label: "Employees", to: "/employees", icon: Users2 },
  { label: "Reports", to: "/reports", icon: FileBarChart },
  { label: "Activity Logs", to: "/activity-logs", icon: ScrollText, ownerOnly: true },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent/20">
          <LibraryBig className="h-5 w-5 text-sidebar-accent" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Law Library</p>
          <p className="text-[11px] text-sidebar-foreground/60">Management System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.filter((item) => !item.ownerOnly || user?.role === "WEBSITE_OWNER").map(
          (item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent/15 text-sidebar-accent"
                    : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-sidebar-foreground/50">
        {user?.role === "WEBSITE_OWNER" ? "Website Owner" : "Library Admin"}
      </div>
    </aside>
  );
}
