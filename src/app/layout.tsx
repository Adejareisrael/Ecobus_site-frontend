import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Ecobus | Intercity Booking",
  description: "Book scheduled intercity bus trips with seat selection.",
};

const themeScript = `
try {
  const stored = localStorage.getItem("ecobus-theme");
  const state = stored ? JSON.parse(stored)?.state : null;
  const preference = state?.preference || state?.theme || "system";
  const theme = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
} catch {
  document.documentElement.classList.remove("dark");
}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-ecobus-light text-ecobus-dark flex flex-col">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
