"use client";

import { useEffect } from "react";

import { captureAnalyticsEvent } from "@/lib/analytics";

type AnalyticsEventProps = {
  event: string;
};

export function AnalyticsEvent({ event }: AnalyticsEventProps) {
  useEffect(() => {
    captureAnalyticsEvent(event);
  }, [event]);

  return null;
}
