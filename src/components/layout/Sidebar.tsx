"use client";

import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Billing", href: "/billing", icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <div className="flex h-14 items-center px-4 border-b border-border">
        <span className="text-base font-semibold text-text-primary tracking-tight">
          Velo
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100",
                  isActive(href)
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-border/50 hover:text-text-primary"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-border/50 hover:text-text-primary transition-colors duration-100"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
