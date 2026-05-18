"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BusFront,
  LayoutDashboard,
  Calendar,
  Ticket,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);

  // 🔐 PROTECTION
  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/login");
    }
  }, [user, router]);

  // close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  const navItem = (
    href: string,
    icon: React.ReactNode,
    label: string,
    activeColor = "text-ecobus-red"
  ) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-2 p-3 rounded-xl transition ${
        isActive(href)
          ? `bg-ecobus-light ${activeColor}`
          : "hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static z-50 md:z-auto
          h-full w-72 bg-white border-r
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* LOGO */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-ecobus-red text-white flex items-center justify-center">
              <BusFront className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">Admin Panel</p>
              <p className="text-xs text-slate-500">Ecobus Control</p>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>

        <nav className="p-3 space-y-2 text-sm">
          {navItem("/admin", <LayoutDashboard className="h-4 w-4" />, "Overview")}

          {navItem("/admin/bookings", <Ticket className="h-4 w-4" />, "Bookings")}

          {navItem(
            "/admin/trips",
            <Calendar className="h-4 w-4" />,
            "Trips",
            "text-ecobus-purple"
          )}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between md:justify-end">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>

          <div className="text-sm text-slate-500 hidden md:block">
            Ecobus Admin
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}