"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { Card } from "@/components/ui/Card";
import { Terminal } from "@/lib/types";
import {
  SITE_SETTINGS_STORAGE_KEY,
  SiteSettings,
} from "@/lib/site-settings-storage";

type Props = {
  terminals: Terminal[];
  initialSettings: SiteSettings;
};

export function HomeContent({ terminals, initialSettings }: Props) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-14">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              {settings.heroTitlePrefix}{" "}
              <span className="text-ecobus-red">{settings.heroBrand}</span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-7">
              {settings.heroDescription}
            </p>
          </div>

          <SearchForm terminals={terminals} />
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="h-full rounded-2xl bg-gradient-to-br from-ecobus-red to-ecobus-purple p-8 text-white min-h-[280px] flex flex-col justify-center">
            <p className="text-xs uppercase tracking-widest text-ecobus-light">
              {settings.heroEyebrow}
            </p>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-snug">
              {settings.heroCardTitle}
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ecobus-light max-w-md">
              {settings.heroCardDescription}
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Popular routes</h2>

          <Link href="/search" className="text-sm font-medium text-ecobus-red">
            View all
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {settings.popularRoutes.map((route, index) => {
            const routeImage =
              settings.popularRouteImages[index] ||
              initialSettings.popularRouteImages[index] ||
              "/route-lagos-benin.jpg";

            return (
              <Link key={`${route}-${index}`} href="/search" className="group">
                <article className="relative min-h-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Admins can configure local or external route images. */}
                  <img
                    src={routeImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  <div className="relative flex h-full min-h-[220px] flex-col justify-end p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                      Popular route
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug">
                      {route}
                    </h3>
                    <span className="mt-4 text-sm font-medium text-sky-100">
                      View trips
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Terminals</h2>
          <Link href="/search" className="text-sm font-medium text-ecobus-red">
            Find trips
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {terminals.slice(0, 6).map((terminal) => (
            <Link key={terminal.id} href={`/terminals/${terminal.id}`}>
              <Card className="h-full p-5 transition hover:shadow-md">
                <p className="text-xs text-slate-500">{terminal.city}, {terminal.state}</p>
                <h3 className="mt-2 text-lg font-semibold">{terminal.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {terminal.address || "View terminal details and departures."}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
