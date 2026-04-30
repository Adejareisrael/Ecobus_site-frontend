"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BusFront, LayoutDashboard, Calendar, Ticket } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const isActive = (path: string) => pathname === path;

  if (!user || user.role !== "admin") {
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
    width={120}
    height={40}
    className="h-8 w-auto object-contain"
  />

  <div>
    <p className="font-bold">Admin Panel</p>
    <p className="text-xs text-slate-500">Ecobus Control</p>
  </div>
</div>

          <div>
            <p className="font-bold">Admin Panel</p>
            <p className="text-xs text-slate-500">Ecobus Control</p>
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

        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 w-full">

        {/* MOBILE NAV (NOW CORRECTLY INSIDE RETURN) */}
        <div className="md:hidden bg-white border-b px-4 py-3 flex gap-4 text-sm overflow-x-auto">
          
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
            href="/admin/trips"
            className={`whitespace-nowrap ${
              isActive("/admin/trips") ? "text-purple-600 font-semibold" : ""
            }`}
          >
            Trips
          </Link>

        </div>

        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

    </div>
  );
}