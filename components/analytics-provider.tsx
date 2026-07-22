"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PostHogProvider } from "posthog-js/react";

import {
  captureAnalyticsEvent,
  posthog,
} from "@/lib/analytics";

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    captureAnalyticsEvent("$pageview", { route: pathname });
  }, [pathname]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
