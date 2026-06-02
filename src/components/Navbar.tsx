"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "./ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/store/auth-store";

import Image from "next/image";


export function Navbar() {
  const [open, setOpen] = useState(false);

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
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          {/* LOGO */}
          <Link
            href="/"
            className={`flex items-center transition duration-200 ${
              open ? "opacity-25 blur-sm" : "opacity-100 blur-0"
            }`}
          >
            <Image
              src="/ecobus-logo.jpg"
              alt="Ecobus Logo"
              width={40}
              height={40}
              className="h-10 w-auto object-contain transition hover:scale-105"
              priority
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${
                  isActive(item.href)
                    ? item.href === "/dashboard"
                      ? "text-ecobus-purple"
                      : "text-ecobus-red"
                    : "text-slate-600 hover:text-ecobus-red"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center gap-3">
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
              <Button className="bg-ecobus-red text-white hover:opacity-90">
                Book now
              </Button>
            </Link>
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
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
        <aside className="fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-white shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <Image
                src="/ecobus-logo.jpg"
                alt="Ecobus Logo"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>

            <button
              onClick={closeMenu}
              aria-label="Close menu"
              className="rounded-lg p-2 transition hover:bg-slate-100"
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
                    ? "bg-ecobus-light text-ecobus-red"
                    : "hover:bg-slate-50"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-slate-400">→</span>
              </Link>
            ))}
          </div>

          {/* ACCOUNT */}
          <div className="px-5 mt-4 border-t pt-4">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
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
