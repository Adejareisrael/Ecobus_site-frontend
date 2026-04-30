"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BusFront, Menu, X } from "lucide-react";

import { Button } from "./ui/Button";
import { useAuthStore } from "@/store/auth-store";

import Image from "next/image";


export function Navbar() {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
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
    () => [
      { label: "Book a trip", href: "/search" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    []
  );

  // close on route change
  useEffect(() => {
    closeMenu();
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
       
<Link href="/" className="flex items-center gap-2">
<Image
  src="/ecobus-logo.jpg"
  alt="Ecobus Logo"
  width={120}
  height={40}
  className="h-10 w-auto object-contain transition hover:scale-105"
  priority
/>
            <div>
              <div className="font-bold text-slate-900">Ecobus</div>
              <div className="hidden text-xs text-slate-500 sm:block">
                Intercity booking platform
              </div>
            </div>
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
            {user ? (
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
<aside
  className={`fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ${
    open ? "translate-x-0" : "translate-x-full"
  }`}
>
  {/* HEADER */}
  <div className="flex items-center justify-between border-b px-5 py-4">
    <div className="flex items-center gap-2">
  <Image
    src="/ecobus-logo.jpg"
    alt="Ecobus Logo"
    width={110}
    height={32}
    className="h-8 w-auto object-contain"
  />
</div>

    <button onClick={closeMenu}>
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

  {/* SINGLE PRIMARY CTA (ONLY ONE PLACE) */}
  <div className="px-5 pt-2">
    <Link href="/search" onClick={closeMenu}>
      <Button className="w-full bg-ecobus-red text-white">
        Book a trip
      </Button>
    </Link>
  </div>

  {/* ACCOUNT */}
  <div className="px-5 mt-4 border-t pt-4">
    {user ? (
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
    </>
  );
}