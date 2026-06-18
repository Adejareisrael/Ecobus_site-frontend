"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "./ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/store/auth-store";
import { BrandWordmark } from "./BrandWordmark";
import {
  defaultSiteSettings,
  SITE_SETTINGS_STORAGE_KEY,
  SiteSettings,
} from "@/lib/site-settings-storage";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((prev) => !prev), []);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
    closeMenu();
  }, [logout, router, closeMenu]);

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
  );

  // NAV ITEMS (single source of truth)
  const navItems = useMemo(
    () => {
      const items = [
        { label: "Book a trip", href: "/search" },
        { label: "Hire a bus", href: "/hire" },
        { label: "Find booking", href: "/lookup" },
      ];

      if (hydrated && user?.role === "admin") {
        items.push({ label: "Verify ticket", href: "/ticket/verify" });
      }

      if (hydrated && user?.role === "customer") {
        items.push({ label: "Dashboard", href: "/dashboard" });
      }

      return items;
    },
    [hydrated, user?.role]
  );

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/site-settings", { cache: "no-store" });
      if (res.ok) setSettings((await res.json()) as SiteSettings);
    }

    void loadSettings();

    const handleSettingsChange = async (event: StorageEvent) => {
      if (event.key && event.key !== SITE_SETTINGS_STORAGE_KEY) return;
      await loadSettings();
    };

    window.addEventListener("storage", handleSettingsChange);
    return () => window.removeEventListener("storage", handleSettingsChange);
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      closeMenu();
    }
  }, [pathname, closeMenu]);

  // ESC close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [closeMenu]);

  // lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl dark:border-sky-900/50 dark:bg-[#081426]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">

          {/* BRAND */}
          <Link
            href="/"
            aria-label={`${settings.heroBrand} home`}
            className={`min-w-0 transition duration-200 ${
              open ? "opacity-25 blur-sm" : "opacity-100 blur-0"
            }`}
          >
            <BrandWordmark name={settings.heroBrand} className="h-11" />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center justify-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${
                  isActive(item.href)
                    ? item.href === "/dashboard"
                      ? "text-ecobus-purple"
                      : "text-ecobus-red"
                    : "text-slate-600 hover:text-ecobus-red dark:text-slate-300 dark:hover:text-sky-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center justify-end gap-3">
            <ThemeToggle />

            {!hydrated ? (
              <div className="h-9 w-20 rounded-xl bg-slate-100" />
            ) : user ? (
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
            )}

            <Link href="/search">
              <Button className="bg-ecobus-red text-white hover:opacity-90 dark:bg-sky-500 dark:hover:bg-sky-400">
                Book now
              </Button>
            </Link>
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            className="rounded-lg p-2 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* MOBILE DRAWER */}
      {open && (
        <aside className="fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-white shadow-2xl dark:border-l dark:border-sky-900/50 dark:bg-[#0b1729]">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b px-5 py-4 dark:border-sky-900/50">
            <Link
              href="/"
              onClick={closeMenu}
              aria-label={`${settings.heroBrand} home`}
            >
              <BrandWordmark name={settings.heroBrand} className="h-10" />
            </Link>

            <button
              onClick={closeMenu}
              aria-label="Close menu"
              className="rounded-lg p-2 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <X />
            </button>
          </div>

          {/* NAV */}
          <div className="px-5 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-ecobus-light text-ecobus-red dark:bg-sky-500/15 dark:text-sky-200"
                    : "hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-slate-400 dark:text-sky-400">→</span>
              </Link>
            ))}
          </div>

          {/* ACCOUNT */}
          <div className="px-5 mt-4 border-t pt-4 dark:border-sky-900/50">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-sky-900/60 dark:bg-slate-950/25">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>

            {!hydrated ? (
              <div className="h-10 w-full rounded-xl bg-slate-100" />
            ) : user ? (
              <Button onClick={handleLogout} className="w-full" variant="ghost">
                Logout
              </Button>
            ) : (
              <Link href="/login" onClick={closeMenu}>
                <Button className="w-full" variant="secondary">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
