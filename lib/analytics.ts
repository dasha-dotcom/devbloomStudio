"use client";

import posthog from "posthog-js";

const POSTHOG_PUBLIC_KEY = "phc_xAoDRktBg5YGj2Uh6Pb2s5PdowE89YirUJUwNvQj2aVe";
const POSTHOG_HOST = "https://us.i.posthog.com";

let isInitialized = false;

export const initializeAnalytics = () => {
  if (typeof window === "undefined" || isInitialized) {
    return;
  }

  posthog.init(POSTHOG_PUBLIC_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    person_profiles: "identified_only",
  });
  isInitialized = true;
};

export const captureAnalyticsEvent = (
  event: string,
  properties: Record<string, boolean | number | string> = {},
) => {
  initializeAnalytics();

  if (isInitialized) {
    posthog.capture(event, properties);
  }
};

export { posthog };
