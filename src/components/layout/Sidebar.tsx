"use client";

import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  BarChart3,
  FolderKanban,
  Receipt,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
  Repeat,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const planningNavItems = [
  { label: "My Day", href: "/my-day", icon: CalendarDays },
  { label: "Woche", href: "/week", icon: CalendarRange },
  { label: "Monat", href: "/month", icon: BarChart3 },
];

const billingNavItems = [
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "Invoices", href: "/invoices", icon: FileText },
];

const settingsNavItems = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.active(),
    queryFn: () => api.projects.listActive(),
  });

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
        {/* Dashboard — standalone, no section label */}
        <ul className="flex flex-col gap-0.5 mb-5">
          <li>
            <Link
              href="/"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                isActive("/")
                  ? "text-white bg-white/[0.08] shadow-sm shadow-black/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}
              aria-current={isActive("/") ? "page" : undefined}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                isActive("/")
                  ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400"
                  : "text-slate-500 group-hover:text-slate-400"
              )}>
                <LayoutDashboard className="w-[18px] h-[18px]" />
              </div>
              Dashboard
              {isActive("/") && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          </li>
        </ul>

        {/* PLANUNG */}
        <div className="border-t border-white/[0.06] pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
            Planung
          </p>
          <ul className="flex flex-col gap-0.5">
            {planningNavItems.map(({ label, href, icon: Icon }) => (
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

        {/* PROJEKTE */}
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
            Projekte
          </p>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link
                href="/projects"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  isActive("/projects")
                    ? "text-white bg-white/[0.08] shadow-sm shadow-black/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                )}
                aria-current={isActive("/projects") ? "page" : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                  isActive("/projects")
                    ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-400"
                )}>
                  <FolderKanban className="w-[18px] h-[18px]" />
                </div>
                Projects
                {isActive("/projects") && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            </li>
          </ul>
          {projects && projects.length > 0 && (
            <ul className="flex flex-col gap-0.5 mt-0.5">
              {projects.map((project) => {
                const href = `/projects/${project.id}`;
                const active = pathname.startsWith(href);
                return (
                  <li key={project.id}>
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
          )}
        </div>

        {/* GEWOHNHEITEN */}
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
            Gewohnheiten
          </p>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link
                href="/habits"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  isActive("/habits")
                    ? "text-white bg-white/[0.08] shadow-sm shadow-black/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                )}
                aria-current={isActive("/habits") ? "page" : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                  isActive("/habits")
                    ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-400"
                )}>
                  <Repeat className="w-[18px] h-[18px]" />
                </div>
                Gewohnheiten
                {isActive("/habits") && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            </li>
          </ul>
        </div>

        {/* WISSEN */}
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
            Wissen
          </p>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link
                href="/wiki"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  isActive("/wiki")
                    ? "text-white bg-white/[0.08] shadow-sm shadow-black/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                )}
                aria-current={isActive("/wiki") ? "page" : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                  isActive("/wiki")
                    ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-400"
                )}>
                  <BookOpen className="w-[18px] h-[18px]" />
                </div>
                Wiki
                {isActive("/wiki") && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            </li>
          </ul>
        </div>

        {/* ABRECHNUNG */}
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
            Abrechnung
          </p>
          <ul className="flex flex-col gap-0.5">
            {billingNavItems.map(({ label, href, icon: Icon }) => (
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

        {/* EINSTELLUNGEN */}
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
            Einstellungen
          </p>
          <ul className="flex flex-col gap-0.5">
            {settingsNavItems.map(({ label, href, icon: Icon }) => (
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
      </nav>

      {/* Logout */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={() => void signOut({ callbackUrl: "/login" })}
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
