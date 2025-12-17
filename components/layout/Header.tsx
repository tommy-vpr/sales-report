// components/layout/header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  GitCompare,
  BarChart3,
  Upload,
  Settings,
  Menu,
  X,
} from "lucide-react";

// ============ NAV ITEMS ============

const navItems = [
  { href: "/dashboard", label: "Monthly Summary", icon: BarChart3 },
  // { href: "/dashboard/monthly", label: "Monthly Summary", icon: BarChart3 },
  { href: "/dashboard/compare", label: "Compare", icon: GitCompare },
  { href: "/dashboard/import", label: "Import", icon: Upload },
];

// ============ USER MENU ============

function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session.user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-3 px-3 py-2 rounded-xl
          bg-white/5 border border-white/8
          hover:bg-white/8 hover:border-white/12
          transition-all duration-200
        "
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>

        {/* Name & Role */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white leading-tight">
            {session.user.name || "User"}
          </p>
          <p className="text-xs text-zinc-500 leading-tight">
            {session.user.role || "User"}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64">
          <div
            className="
              rounded-xl overflow-hidden
              bg-zinc-900/95 backdrop-blur-xl
              border border-white/8
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            "
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/6">
              <p className="text-sm font-medium text-white">
                {session.user.name || "User"}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {session.user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className="
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-zinc-300 hover:text-white
                  hover:bg-white/5
                  transition-colors
                "
              >
                <Settings size={16} />
                <span className="text-sm">Settings</span>
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-rose-400 hover:text-rose-300
                  hover:bg-rose-500/10
                  transition-colors
                "
              >
                <LogOut size={16} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ MOBILE NAV ============

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        {isOpen ? (
          <X size={24} className="text-zinc-400" />
        ) : (
          <Menu size={24} className="text-zinc-400" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile Menu */}
          <div
            className="
              fixed top-16 left-4 right-4 z-50
              rounded-xl overflow-hidden
              bg-zinc-900/95 backdrop-blur-xl
              border border-white/8
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            "
          >
            <nav className="p-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors
                      ${
                        isActive
                          ? "bg-blue-500/10 text-blue-400"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

// ============ MAIN HEADER ============

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="
        sticky top-0 z-30
        bg-zinc-950/80 backdrop-blur-xl
        border-b border-white/6
      "
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">
                LITTO Analytics
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      text-sm font-medium transition-colors
                      ${
                        isActive
                          ? "bg-white/8 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <UserMenu />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
