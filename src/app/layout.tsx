import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ecobus | Intercity Booking",
  description: "Book scheduled intercity bus trips with seat selection.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ecobus-light text-ecobus-dark flex flex-col">

        <Navbar />

        {/* GLOBAL CONTAINER SYSTEM */}
        <main className="flex-1 w-full overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>

        <Footer />

      </body>
    </html>
  );
}