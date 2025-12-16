// components/layout/user-menu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, ChevronDown, Settings, User } from "lucide-react";

export function UserMenu() {
  const { data: session, status } = useSession();
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

  // Loading state
  if (status === "loading") {
    return <div className="w-8 h-8 rounded-lg bg-white/[0.05] animate-pulse" />;
  }

  // Not authenticated
  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="
          px-4 py-2 rounded-lg
          bg-blue-600 hover:bg-blue-500
          text-sm font-medium text-white
          transition-colors
        "
      >
        Sign In
      </Link>
    );
  }

  // Get initials for avatar
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
          bg-white/[0.05] border border-white/[0.08]
          hover:bg-white/[0.08] hover:border-white/[0.12]
          transition-all duration-200
        "
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>

        {/* Name & Role - Hidden on mobile */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white leading-tight">
            {session.user.name || "User"}
          </p>
          <p className="text-xs text-zinc-500 leading-tight capitalize">
            {session.user.role?.toLowerCase() || "User"}
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
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 z-50 w-64">
            <div
              className="
                rounded-xl overflow-hidden
                bg-zinc-900/95 backdrop-blur-xl
                border border-white/[0.08]
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              "
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsOpen(false)}
                  className="
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-zinc-300 hover:text-white
                    hover:bg-white/[0.05]
                    transition-colors
                  "
                >
                  <User size={16} />
                  <span className="text-sm">Profile</span>
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsOpen(false)}
                  className="
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-zinc-300 hover:text-white
                    hover:bg-white/[0.05]
                    transition-colors
                  "
                >
                  <Settings size={16} />
                  <span className="text-sm">Settings</span>
                </Link>

                <div className="my-2 border-t border-white/[0.06]" />

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
        </>
      )}
    </div>
  );
}
