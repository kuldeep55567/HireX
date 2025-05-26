// app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { UsersIcon } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // After component mounts, we can show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, return a simple loading state or nothing
  // This prevents hydration errors by not rendering anything with theme-dependent content
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: "chart-bar" },
    { name: "Job Listings", path: "/admin/jobs", icon: "briefcase" },
    { name: "Create Job", path: "/admin/jobs/create", icon: "plus-circle" },
    { name: "Applicants", path: "/admin/users", icon: "users" },
    { name: "Mail", path: "/admin/mail", icon: "mail" },
  ];

  return (
    <div className="flex h-screen bg-gray-100  dark:bg-background shadow-[0_10px_60px_rgba(0,0,0,0.15)] border border-gray-200 dark:border-gray-800">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-72" : "w-20"
          } transition-all duration-300 ease-in-out bg-white dark:bg-background border-r border-gray-200/30 dark:border-gray-800/20 flex flex-col shadow-md`}
      >
        <div className="flex items-center justify-between h-16 p-6 border-b border-gray-200 dark:border-gray-800">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500 tracking-tight">
              Admin Panel
            </h1>
          ) : (
            <span className="text-xl font-bold text-blue-600 dark:text-blue-500">
              AP
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              )}
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-1.5 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${pathname === item.path
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                } group flex items-center px-3 py-3 rounded-lg transition-all font-medium`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${pathname === item.path
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
                  } mr-3 flex-shrink-0`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {item.icon === "chart-bar" && (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                )}
                {item.icon === "briefcase" && (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                )}
                {item.icon === "plus-circle" && (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
                {item.icon === "clock" && (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
                {item.icon === "users" && (
                  <UsersIcon />
                )}
                {item.icon === "mail" && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </svg>
              {isSidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {navItems.find((item) => item.path === pathname)?.name || "Admin"}
          </h1>
          <div className="flex items-center">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white cursor-pointer transition-colors shadow-sm">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}