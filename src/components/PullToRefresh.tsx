"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

const PULL_THRESHOLD = 70;
const MAX_PULL = 100;

export function PullToRefresh() {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const refreshing = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const content = document.getElementById("pull-to-refresh-content");

    const setPull = (distance: number) => {
      if (content) {
        content.style.transform = distance ? `translateY(${distance}px)` : "";
      }
      if (indicatorRef.current) {
        indicatorRef.current.style.height = `${distance}px`;
        indicatorRef.current.style.opacity = distance ? "1" : "0";
      }
      if (iconRef.current) {
        const progress = Math.min(distance / PULL_THRESHOLD, 1);
        iconRef.current.style.transform = `rotate(${progress * 360}deg)`;
        iconRef.current.style.opacity = `${progress}`;
      }
    };

    const setTransition = (enabled: boolean) => {
      const transition = enabled ? "transform 200ms ease-out" : "none";
      if (content) content.style.transition = transition;
      if (indicatorRef.current) indicatorRef.current.style.transition = `height 200ms ease-out, opacity 200ms ease-out`;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshing.current) return;
      setTransition(false);
      startY.current = event.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pulling.current || startY.current === null) return;
      const delta = event.touches[0].clientY - startY.current;

      if (delta <= 0 || window.scrollY > 0) {
        pulling.current = false;
        setPull(0);
        return;
      }

      event.preventDefault();
      setPull(Math.min(delta * 0.5, MAX_PULL));
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      setTransition(true);

      const indicatorHeight = indicatorRef.current
        ? parseFloat(indicatorRef.current.style.height || "0")
        : 0;

      if (indicatorHeight >= PULL_THRESHOLD) {
        refreshing.current = true;
        if (iconRef.current) iconRef.current.classList.add("animate-spin");
        setPull(56);
        window.location.reload();
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      setPull(0);
    };
  }, []);

  if (!Capacitor.isNativePlatform()) return null;

  return (
    <div
      ref={indicatorRef}
      className="pointer-events-none fixed left-0 right-0 top-0 z-[95] flex items-end justify-center overflow-hidden opacity-0 transition-opacity"
      style={{ height: 0 }}
    >
      <div
        ref={iconRef}
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white opacity-0 shadow-md dark:bg-slate-900"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-ecobus-red" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
          <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
