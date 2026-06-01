"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BusFront,
  Calendar,
  BadgePercent,
  LayoutDashboard,
  MapPin,
  Send,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, user, router]);

  const isActive = (path: string) => pathname === path;

  if (!hydrated || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r">

        <div className="p-5 border-b flex items-center gap-2">
        <div className="flex items-center gap-2">
  <Image
    src="/ecobus-logo.jpg"
    alt="Ecobus Logo"
    width={32}
    height={32}
    className="h-8 w-auto object-contain"
  />

</div>

          <div>
            <p className="font-bold">Admin Panel</p>
            <p className="text-xs text-slate-500">Ecobus Control</p>
          </div>
        </div>

        <div className="border-b px-3 py-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        <nav className="p-3 space-y-2 text-sm">

          <Link
            href="/admin"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin")
                ? "bg-red-50 text-red-600"
                : "hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>

          <Link
            href="/admin/bookings"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin/bookings")
                ? "bg-red-50 text-red-600"
                : "hover:bg-slate-100"
            }`}
          >
            <Ticket className="h-4 w-4" />
            Bookings
          </Link>

          <Link
            href="/admin/ticket-delivery"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin/ticket-delivery")
                ? "bg-red-50 text-red-600"
                : "hover:bg-slate-100"
            }`}
          >
            <Send className="h-4 w-4" />
            Ticket delivery
          </Link>

          <Link
            href="/admin/trips"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin/trips")
                ? "bg-purple-50 text-purple-600"
                : "hover:bg-slate-100"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Trips
          </Link>

          <Link
            href="/admin/bus-layouts"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin/bus-layouts")
                ? "bg-purple-50 text-purple-600"
                : "hover:bg-slate-100"
            }`}
          >
            <BusFront className="h-4 w-4" />
            Bus layouts
          </Link>

          <Link
            href="/admin/promo-codes"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin/promo-codes")
                ? "bg-purple-50 text-purple-600"
                : "hover:bg-slate-100"
            }`}
          >
            <BadgePercent className="h-4 w-4" />
            Promo codes
          </Link>

          <Link
            href="/admin/terminals"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin/terminals")
                ? "bg-purple-50 text-purple-600"
                : "hover:bg-slate-100"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Terminals
          </Link>

          <Link
            href="/admin/validate"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              isActive("/admin/validate")
                ? "bg-emerald-50 text-emerald-600"
                : "hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Validate
          </Link>

        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 w-full">

        {/* MOBILE NAV (NOW CORRECTLY INSIDE RETURN) */}
        <div className="md:hidden bg-white border-b px-4 py-3 flex gap-4 text-sm overflow-x-auto">
          <ThemeToggle className="h-9 w-9 shrink-0" />
          
          <Link
            href="/admin"
            className={`whitespace-nowrap ${
              isActive("/admin") ? "text-red-600 font-semibold" : ""
            }`}
          >
            Overview
          </Link>

          <Link
            href="/admin/bookings"
            className={`whitespace-nowrap ${
              isActive("/admin/bookings") ? "text-red-600 font-semibold" : ""
            }`}
          >
            Bookings
          </Link>

          <Link
            href="/admin/ticket-delivery"
            className={`whitespace-nowrap ${
              isActive("/admin/ticket-delivery") ? "text-red-600 font-semibold" : ""
            }`}
          >
            Ticket delivery
          </Link>

          <Link
            href="/admin/trips"
            className={`whitespace-nowrap ${
              isActive("/admin/trips") ? "text-purple-600 font-semibold" : ""
            }`}
          >
            Trips
          </Link>

          <Link
            href="/admin/bus-layouts"
            className={`whitespace-nowrap ${
              isActive("/admin/bus-layouts") ? "text-purple-600 font-semibold" : ""
            }`}
          >
            Bus layouts
          </Link>

          <Link
            href="/admin/promo-codes"
            className={`whitespace-nowrap ${
              isActive("/admin/promo-codes") ? "text-purple-600 font-semibold" : ""
            }`}
          >
            Promo codes
          </Link>

          <Link
            href="/admin/terminals"
            className={`whitespace-nowrap ${
              isActive("/admin/terminals") ? "text-purple-600 font-semibold" : ""
            }`}
          >
            Terminals
          </Link>

          <Link
            href="/admin/validate"
            className={`whitespace-nowrap ${
              isActive("/admin/validate") ? "text-emerald-600 font-semibold" : ""
            }`}
          >
            Validate
          </Link>

        </div>

        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

    </div>
  );
}
