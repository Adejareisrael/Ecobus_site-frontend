"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

      <PopularRoutesSlider
        routes={settings.popularRoutes}
        routeImages={settings.popularRouteImages}
        fallbackImages={initialSettings.popularRouteImages}
      />

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

type SliderProps = {
  routes: string[];
  routeImages: string[];
  fallbackImages: string[];
};

function useVisibleCount() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setCount(3);
      else if (window.innerWidth >= 640) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

function PopularRoutesSlider({ routes, routeImages, fallbackImages }: SliderProps) {
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = routes.length;
  const visibleCount = useVisibleCount();

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 4000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    resetTimer();
  };

  const visibleRoutes = Array.from({ length: visibleCount }, (_, i) => {
    const idx = (current + i) % total;
    return { idx, route: routes[idx], image: routeImages[idx] || fallbackImages[idx] || "/route-lagos-benin.jpg" };
  });

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Popular routes</h2>
          <Link href="/search" className="text-sm font-medium text-ecobus-red">
            View all
          </Link>
        </div>

        <div className="relative overflow-hidden">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visibleRoutes.map(({ idx, route, image }, position) => (
                <motion.div
                  key={`${idx}-${route}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
                  onClick={() => setExpanded(idx)}
                  className="cursor-pointer group"
                >
                  <article className="relative min-h-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                    <div className="relative flex h-full min-h-[220px] flex-col justify-end p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Popular route</p>
                      <h3 className="mt-2 text-lg font-semibold leading-snug">{route}</h3>
                      <span className="mt-4 text-sm font-medium text-sky-100">View trips</span>
                    </div>
                  </article>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Dot navigation */}
          <div className="mt-5 flex justify-center gap-2">
            {routes.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to route ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-ecobus-red" : "w-2 bg-slate-300 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pop-out modal */}
      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setExpanded(null)}
          >
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={routeImages[expanded] || fallbackImages[expanded] || "/route-lagos-benin.jpg"}
                alt=""
                className="h-64 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-200">Popular route</p>
                <h3 className="mt-2 text-2xl font-bold">{routes[expanded]}</h3>
                <Link
                  href="/search"
                  onClick={() => setExpanded(null)}
                  className="mt-4 inline-block rounded-lg bg-ecobus-red px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Book this route
                </Link>
              </div>
              <button
                onClick={() => setExpanded(null)}
                className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
