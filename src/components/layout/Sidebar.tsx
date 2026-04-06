"use client";

import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  Receipt,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const topNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My Day", href: "/my-day", icon: CalendarDays },
];

const workNavItems = [
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const projects = useQuery(api.projects.listActive);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={cn(
        "flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] relative overflow-hidden",
        "fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto lg:h-full",
        "transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        }}
      />
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">
          Velo
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
          Menu
        </p>
        <ul className="flex flex-col gap-0.5">
          {topNavItems.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  isActive(href)
                    ? "text-white bg-white/[0.08] shadow-sm shadow-black/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                )}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                  isActive(href)
                    ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-400"
                )}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                {label}
                {isActive(href) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
            Work
          </p>
          <ul className="flex flex-col gap-0.5">
            {workNavItems.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                    isActive(href)
                      ? "text-white bg-white/[0.08] shadow-sm shadow-black/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  )}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                    isActive(href)
                      ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400"
                      : "text-slate-500 group-hover:text-slate-400"
                  )}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  {label}
                  {isActive(href) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Active projects */}
        {projects && projects.length > 0 && (
          <div className="mt-6">
            <div className="border-t border-white/[0.06] pt-5">
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                Projects
              </p>
              <ul className="flex flex-col gap-0.5">
                {projects.map((project) => {
                  const href = `/projects/${project._id}`;
                  const active = pathname.startsWith(href);
                  return (
                    <li key={project._id}>
                      <Link
                        href={href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-150",
                          active
                            ? "text-white bg-white/[0.08] font-medium"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0 transition-all duration-150",
                          active
                            ? "bg-indigo-400 shadow-sm shadow-indigo-400/50"
                            : "bg-slate-600 group-hover:bg-slate-500"
                        )} />
                        <span className="truncate">{project.name}</span>
                        <ChevronRight className={cn(
                          "w-3 h-3 shrink-0 ml-auto transition-all duration-150",
                          active ? "text-slate-400 opacity-100" : "opacity-0 group-hover:opacity-60 text-slate-500"
                        )} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:text-slate-300 hover:bg-white/[0.04]"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
    </>
  );
}
