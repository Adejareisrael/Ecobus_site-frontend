"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "./LoadingScreen";

export function PageTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const currentUrlRef = useRef("");

  useEffect(() => {
    currentUrlRef.current = `${pathname}?${searchParams.toString()}`;
    const timeout = window.setTimeout(() => setLoading(false), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname, searchParams]);

  useEffect(() => {
    const shouldIgnoreLink = (link: HTMLAnchorElement) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return true;
      if (link.target && link.target !== "_self") return true;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("sms:")) {
        return true;
      }

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return true;

      const nextUrl = `${url.pathname}?${url.searchParams.toString()}`;
      return nextUrl === currentUrlRef.current;
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as Element | null;
      const link = target?.closest("a");
      if (!link || shouldIgnoreLink(link)) return;

      setLoading(true);
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.method.toLowerCase() !== "get") return;
      setLoading(true);
    };

    const handlePageShow = () => setLoading(false);

    window.addEventListener("click", handleClick);
    window.addEventListener("submit", handleSubmit);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("submit", handleSubmit);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-ecobus-light/95 backdrop-blur-sm">
      <LoadingScreen label="Loading page" />
    </div>
  );
}
