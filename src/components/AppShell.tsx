"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}

      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>

      {!isAdmin && <Footer />}

      <Suspense fallback={null}>
        <PageTransition />
      </Suspense>
    </>
  );
}
