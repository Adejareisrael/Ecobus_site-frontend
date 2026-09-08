"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { NATIVE_AUTH_CALLBACK } from "@/lib/supabase-auth-client";

export function nativeAuthCallbackPath(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const expected = new URL(NATIVE_AUTH_CALLBACK);
    if (
      url.protocol !== expected.protocol ||
      url.hostname !== expected.hostname ||
      url.pathname !== expected.pathname
    ) {
      return null;
    }
    return `/auth/callback${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function SupabaseAuthDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: PluginListenerHandle | undefined;
    let disposed = false;
    let handledUrl = "";

    const handleUrl = (rawUrl: string) => {
      const callbackPath = nativeAuthCallbackPath(rawUrl);
      if (!callbackPath || handledUrl === rawUrl) return;
      handledUrl = rawUrl;
      void Browser.close().catch(() => undefined);
      router.replace(callbackPath);
    };

    void App.addListener("appUrlOpen", ({ url }) => handleUrl(url)).then((handle) => {
      if (disposed) void handle.remove();
      else listener = handle;
    });
    void App.getLaunchUrl().then((launch) => {
      if (!disposed && launch?.url) handleUrl(launch.url);
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, [router]);

  return null;
}
