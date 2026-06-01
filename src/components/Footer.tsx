"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import {
  defaultSiteSettings,
  SITE_SETTINGS_STORAGE_KEY,
  SiteSettings,
} from "@/lib/site-settings-storage";
import { useAuthStore } from "@/store/auth-store";

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAdmin = hydrated && user?.role === "admin";
  const isCustomer = hydrated && user?.role === "customer";

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

  const whatsappLink = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    settings.whatsappMessage
  )}`;
  const facebookUrl =
    settings.facebookUrl || `https://facebook.com/${settings.facebookHandle.replace("@", "")}`;
  const instagramUrl =
    settings.instagramUrl || `https://instagram.com/${settings.instagramHandle.replace("@", "")}`;
  const xUrl = settings.xUrl || `https://x.com/${settings.xHandle.replace("@", "")}`;

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10">

        <div className="grid gap-8 md:grid-cols-3">

          {/* BRAND */}
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ecobus
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {settings.footerDescription}
            </p>
          </div>

          {/* LINKS */}
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Quick Links</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li>
                <a href="/search" className="hover:text-ecobus-red">
                  Book a trip
                </a>
              </li>
              {isCustomer && (
                <li>
                  <a href="/dashboard" className="hover:text-ecobus-purple">
                    Dashboard
                  </a>
                </li>
              )}
              {isAdmin && (
                <li>
                  <a href="/admin" className="hover:text-ecobus-purple">
                    Admin dashboard
                  </a>
                </li>
              )}
              {hydrated && !user && (
                <li>
                  <a href="/login" className="hover:text-ecobus-red">
                    Login
                  </a>
                </li>
              )}
              <li>
                <a href="/lookup" className="hover:text-ecobus-red">
                  Find booking
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-ecobus-red">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-ecobus-red">
                  Terms
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="hover:text-ecobus-red">
                  Refund policy
                </a>
              </li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Support</p>

            <p className="mt-3 text-slate-500">
              {settings.supportText}
            </p>

            {/* WHATSAPP CTA */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-white font-medium hover:bg-green-600 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>

            <p className="mt-3 text-xs text-slate-400">
              {settings.responseTimeText}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${settings.email}`}
                aria-label="Email Ecobus"
                title="Email"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-ecobus-red hover:text-ecobus-red"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ecobus on Facebook"
                title="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-ecobus-red hover:text-ecobus-red"
              >
                <FacebookIcon />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ecobus on Instagram"
                title="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-ecobus-red hover:text-ecobus-red"
              >
                <InstagramIcon />
              </a>
              <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ecobus on X"
                title="X"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-ecobus-red hover:text-ecobus-red"
              >
                <XIcon />
              </a>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-10 border-t pt-6 text-xs text-slate-500 flex flex-col gap-2 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Ecobus. All rights reserved.</p>
          <p>{settings.bottomNote}</p>
        </div>

      </div>
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M14 8h3V4h-3c-3.31 0-5 1.79-5 5v2H6v4h3v5h4v-5h3.25l.75-4h-4V9c0-.72.28-1 1-1Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="16.8" cy="7.2" r=".7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.3"
    >
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}
