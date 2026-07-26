"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { PwaRegister } from "@/components/PwaRegister";
import { NativeBackButton } from "@/components/NativeBackButton";
import { PullToRefresh } from "@/components/PullToRefresh";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      <PullToRefresh />

      <div id="pull-to-refresh-content" className="flex w-full flex-1 flex-col">
        {!isAdmin && <Navbar />}

        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>

        {!isAdmin && <Footer />}
      </div>

      <Suspense fallback={null}>
        <PageTransition />
      </Suspense>
      <PwaRegister />
      <NativeBackButton />
    </>
  );
}
